// screens/AgentScreen.tsx — Aurora Midnight
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import type { Ticket, TicketStatus, ApiResponse } from '../types';
import { Colors, Radius, Spacing, Type } from '../types/theme';

const STATUS_LABEL: Record<TicketStatus, string> = {
  waiting: 'En attente',
  called: 'Appelé',
  serving: 'En service',
  done: 'Terminé',
  absent: 'Absent',
  cancelled: 'Annulé',
};

export default function AgentScreen() {
  const { user, logout } = useAuth();
  const { addToast } = useNotification();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [counter, setCounter] = useState(1);

  useEffect(() => {
    const loadCounter = async () => {
      try {
        const saved = await AsyncStorage.getItem(`agent_counter_${user?.id}`);
        if (saved) setCounter(parseInt(saved, 10));
      } catch {
        // Fall back to the default counter.
      }
    };
    loadCounter();
  }, [user?.id]);

  const handleSetCounter = async (value: number) => {
    setCounter(value);
    try {
      await AsyncStorage.setItem(`agent_counter_${user?.id}`, value.toString());
    } catch {
      // Persistence is best effort.
    }
  };

  const fetchTickets = useCallback(async () => {
    try {
      const { data } = await api.get<ApiResponse<Ticket[]>>('/tickets');
      setTickets(data.data);
    } catch {
      addToast('Connexion au serveur impossible.', 'error');
    }
  }, [addToast]);

  const { socket } = useNotification();

  useEffect(() => {
    fetchTickets().finally(() => setLoading(false));

    if (socket) {
      socket.on('ticket:created', fetchTickets);
      socket.on('ticket:called', fetchTickets);
      socket.on('ticket:absent', fetchTickets);
      socket.on('ticket:done', fetchTickets);
      socket.on('ticket:recall', fetchTickets);
      socket.on('stats:refresh', fetchTickets);
    }

    const interval = setInterval(fetchTickets, 30000);

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off('ticket:created', fetchTickets);
        socket.off('ticket:called', fetchTickets);
        socket.off('ticket:absent', fetchTickets);
        socket.off('ticket:done', fetchTickets);
        socket.off('ticket:recall', fetchTickets);
        socket.off('stats:refresh', fetchTickets);
      }
    };
  }, [fetchTickets, socket]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTickets().catch(() => {});
    setRefreshing(false);
  };

  const callTicket = async (id: number) => {
    try {
      const { data } = await api.patch<ApiResponse<Ticket>>(`/tickets/${id}/call`, { counter });
      setTickets((previous) =>
        previous.map((ticket) => (ticket.id === id ? data.data : ticket))
      );
      addToast('Ticket appelé.', 'success');
    } catch {
      addToast("L'appel a échoué.", 'error');
    }
  };

  const completeTicket = async (id: number) => {
    Alert.alert('Confirmer', 'Marquer ce ticket comme terminé ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Terminer',
        onPress: async () => {
          try {
            const { data } = await api.patch<ApiResponse<Ticket>>(`/tickets/${id}/complete`);
            setTickets((previous) =>
              previous.map((ticket) => (ticket.id === id ? data.data : ticket))
            );
            addToast('Ticket terminé.', 'info');
          } catch {
            addToast('Action impossible.', 'error');
          }
        },
      },
    ]);
  };

  const absentTicket = async (id: number) => {
    try {
      const { data } = await api.patch<ApiResponse<Ticket>>(`/tickets/${id}/absent`);
      setTickets((previous) =>
        previous.map((ticket) => (ticket.id === id ? data.data : ticket))
      );
      addToast('Client marqué absent.', 'warning');
    } catch {
      addToast('Action impossible.', 'error');
    }
  };

  const recallTicket = async (id: number) => {
    try {
      const { data } = await api.patch<ApiResponse<Ticket>>(`/tickets/${id}/recall`);
      setTickets((previous) =>
        previous.map((ticket) => (ticket.id === id ? data.data : ticket))
      );
      addToast('Ticket remis en file.', 'success');
    } catch {
      addToast('Le rappel a échoué.', 'error');
    }
  };

  const active = tickets.filter((ticket) =>
    ['waiting', 'called', 'serving'].includes(ticket.status)
  );
  const current = tickets.find(
    (ticket) => ticket.status === 'called' || ticket.status === 'serving'
  );
  const waiting = active.filter((ticket) => ticket.status === 'waiting');
  const absents = tickets.filter((ticket) => ticket.status === 'absent');

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <View style={s.topPanel}>
        <View style={s.topBar}>
          <View style={s.topRow}>
            <View style={s.topText}>
              <Text style={s.topLabel}>Console agent</Text>
              <Text style={s.headerTitle}>{user?.name?.split(' ')[0] || 'Guichet'}</Text>
            </View>
            <TouchableOpacity
              style={s.logoutBtn}
              onPress={logout}
              accessibilityRole="button"
              accessibilityLabel="Se déconnecter"
            >
              <Text style={s.logoutText}>Sortir</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.counterLabel}>Guichet</Text>
          <View style={s.counterTabs}>
            {[1, 2, 3, 4, 5].map((value) => (
              <TouchableOpacity
                key={value}
                style={[s.counterTab, counter === value && s.counterTabActive]}
                onPress={() => handleSetCounter(value)}
                accessibilityRole="button"
                accessibilityState={{ selected: counter === value }}
              >
                <Text
                  style={[s.counterTabText, counter === value && s.counterTabTextActive]}
                >
                  {value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={s.section}>
          <Text style={s.sectionLabel}>En cours au guichet {counter}</Text>
          {current ? (
            <View style={s.currentCard}>
              <View style={s.statusBadge}>
                <Text style={s.statusBadgeText}>{STATUS_LABEL[current.status]}</Text>
              </View>
              <Text style={s.currentNumber}>{current.number}</Text>
              <Text style={s.currentName}>{current.user_name}</Text>
              <View style={s.buttonGroup}>
                <TouchableOpacity
                  style={s.primaryBtn}
                  onPress={() => completeTicket(current.id)}
                  accessibilityRole="button"
                >
                  <Text style={s.primaryBtnText}>Terminer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.ghostBtn}
                  onPress={() => absentTicket(current.id)}
                  accessibilityRole="button"
                >
                  <Text style={s.ghostBtnText}>Absent</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={s.idleCard}>
              <Text style={s.idleText}>Aucun ticket en cours au guichet {counter}.</Text>
            </View>
          )}
        </View>

        <View style={s.section}>
          <View style={s.listHeader}>
            <Text style={s.sectionLabel}>File d’attente ({waiting.length})</Text>
            <TouchableOpacity
              onPress={onRefresh}
              accessibilityRole="button"
              accessibilityLabel="Actualiser la file"
            >
              <Text style={s.refreshLink}>Actualiser</Text>
            </TouchableOpacity>
          </View>

          {waiting.map((ticket) => {
            const wait = ticket.created_at
              ? Math.round((Date.now() - new Date(ticket.created_at).getTime()) / 60000)
              : 0;
            return (
              <View key={ticket.id} style={s.ticketRow}>
                <View style={s.ticketInfo}>
                  <Text style={s.ticketNumber}>{ticket.number}</Text>
                  <Text style={s.ticketClient}>{ticket.user_name}</Text>
                  <Text style={[s.ticketWait, wait > 15 && s.ticketWaitLate]}>
                    {wait} min d’attente
                  </Text>
                </View>
                <TouchableOpacity
                  style={s.callAction}
                  onPress={() => callTicket(ticket.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Appeler le ticket ${ticket.number}`}
                >
                  <Text style={s.callActionText}>Appeler</Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {waiting.length === 0 && !current && (
            <View style={s.emptyState}>
              <View style={s.emptyMark} />
              <Text style={s.emptyText}>La file est vide.</Text>
            </View>
          )}
        </View>

        {absents.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Clients absents ({absents.length})</Text>
            {absents.map((ticket) => (
              <View key={ticket.id} style={s.ticketRow}>
                <View style={s.ticketInfo}>
                  <Text style={[s.ticketNumber, s.ticketNumberMuted]}>{ticket.number}</Text>
                  <Text style={s.ticketClient}>{ticket.user_name}</Text>
                  <Text style={s.ticketWait}>Marqué absent</Text>
                </View>
                <TouchableOpacity
                  style={s.ghostAction}
                  onPress={() => recallTicket(ticket.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Rappeler le ticket ${ticket.number}`}
                >
                  <Text style={s.ghostActionText}>Rappeler</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg,
  },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },

  topPanel: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  topBar: { padding: Spacing.lg },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  topText: { flex: 1 },
  topLabel: { color: Colors.muted, fontSize: Type.sm, fontWeight: '500' },
  headerTitle: { fontSize: Type.xxl, fontWeight: '600', color: Colors.text, marginTop: 2 },
  logoutBtn: {
    backgroundColor: Colors.surface2,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logoutText: { color: Colors.text, fontSize: Type.xs, fontWeight: '600' },

  counterLabel: { fontSize: Type.xs, color: Colors.muted, marginBottom: Spacing.xs },
  counterTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface2,
    padding: Spacing.xs,
    borderRadius: Radius.sm,
    gap: Spacing.xs,
  },
  counterTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.xs,
    alignItems: 'center',
  },
  counterTabActive: { backgroundColor: Colors.primary },
  counterTabText: { color: Colors.muted, fontWeight: '600', fontSize: Type.sm },
  counterTabTextActive: { color: Colors.onPrimary },

  section: { marginBottom: Spacing.xl },
  sectionLabel: {
    fontSize: Type.sm,
    fontWeight: '600',
    color: Colors.muted,
    marginBottom: Spacing.sm,
  },

  currentCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopWidth: 3,
    borderTopColor: Colors.primary,
  },
  statusBadge: {
    backgroundColor: Colors.primaryLt,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
  },
  statusBadgeText: { fontSize: Type.xs, fontWeight: '600', color: Colors.primary },
  currentNumber: {
    fontSize: 60,
    fontWeight: '600',
    color: Colors.primary,
    marginVertical: Spacing.sm,
    letterSpacing: -2,
  },
  currentName: { fontSize: Type.md, fontWeight: '500', color: Colors.text, marginBottom: Spacing.lg },
  buttonGroup: { flexDirection: 'row', gap: Spacing.md, width: '100%' },
  primaryBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  primaryBtnText: { color: Colors.onPrimary, fontWeight: '600', fontSize: Type.sm },
  ghostBtn: {
    flex: 1,
    backgroundColor: Colors.surface2,
    padding: Spacing.lg,
    borderRadius: Radius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ghostBtnText: { color: Colors.muted, fontWeight: '600', fontSize: Type.sm },

  idleCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: Radius.md,
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  idleText: { color: Colors.muted, fontSize: Type.sm, textAlign: 'center' },

  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  refreshLink: { fontSize: Type.xs, fontWeight: '600', color: Colors.primary },

  ticketRow: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ticketInfo: { flex: 1 },
  ticketNumber: { fontSize: Type.lg, fontWeight: '600', color: Colors.primary },
  ticketNumberMuted: { color: Colors.muted },
  ticketClient: { fontSize: Type.sm, fontWeight: '500', color: Colors.text, marginTop: 2 },
  ticketWait: { fontSize: Type.xs, color: Colors.subtle, marginTop: Spacing.xs },
  ticketWaitLate: { color: Colors.danger },

  callAction: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.xs,
  },
  callActionText: { color: Colors.onPrimary, fontWeight: '600', fontSize: Type.xs },
  ghostAction: {
    backgroundColor: Colors.surface2,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ghostActionText: { color: Colors.text, fontWeight: '600', fontSize: Type.xs },

  emptyState: { paddingVertical: Spacing.xxl, alignItems: 'center' },
  emptyMark: {
    width: 32,
    height: 3,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
    marginBottom: Spacing.md,
  },
  emptyText: { color: Colors.muted, fontWeight: '500', fontSize: Type.sm },
});
