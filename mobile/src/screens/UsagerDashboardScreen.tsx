// screens/UsagerDashboardScreen.tsx — Aurora Midnight
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList, Ticket, ApiResponse } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Colors, Radius, Spacing, Type } from '../types/theme';
import Badge from '../components/Badge';
import api from '../services/api';

type Nav = BottomTabNavigationProp<MainTabParamList>;

export default function UsagerDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { user, logout } = useAuth();
  const { addToast, socket } = useNotification();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [ticketsResponse, statsResponse] = await Promise.all([
        api.get<ApiResponse<Ticket[]>>('/tickets/my'),
        api.get('/stats'),
      ]);
      setTickets(ticketsResponse.data.data || []);
      setStats(statsResponse.data.data);
    } catch (err: any) {
      if (!err.response) {
        addToast('Serveur injoignable. Vérifiez votre connexion.', 'error');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [addToast]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  useEffect(() => {
    fetchData();

    if (socket) {
      socket.on('ticket:called', fetchData);
      socket.on('ticket:done', fetchData);
      socket.on('ticket:created', fetchData);
      socket.on('stats:refresh', fetchData);
    }

    const interval = setInterval(fetchData, 60000);
    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off('ticket:called', fetchData);
        socket.off('ticket:done', fetchData);
        socket.off('ticket:created', fetchData);
        socket.off('stats:refresh', fetchData);
      }
    };
  }, [fetchData, socket]);

  const activeTicket = tickets.find((ticket) =>
    ['waiting', 'called', 'serving'].includes(ticket.status)
  );
  const doneToday = tickets.filter((ticket) => ticket.status === 'done').length;

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
        <View style={s.header}>
          <View style={s.headerTop}>
            <View style={s.headerText}>
              <Text style={s.welcome}>Mon espace</Text>
              <Text style={s.userName}>{user?.name || 'Visiteur'}</Text>
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
        </View>

        <View style={s.content}>
          {activeTicket && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Mon ticket actif</Text>
              <View style={s.activeCard}>
                <View style={s.activeHeader}>
                  <Text style={s.activeService}>{activeTicket.service_name}</Text>
                  <Badge status={activeTicket.status} />
                </View>
                <Text style={s.activeNumber}>{activeTicket.number}</Text>

                <View style={s.qrWrapper}>
                  <Image
                    source={{
                      uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${activeTicket.number}&bgcolor=ffffff&color=052e22`,
                    }}
                    style={s.qrCode}
                    accessibilityLabel={`Code QR du ticket ${activeTicket.number}`}
                  />
                </View>

                {activeTicket.status === 'called' && (
                  <View style={s.calledAlert}>
                    <Text style={s.calledTitle}>C’est votre tour.</Text>
                    <Text style={s.calledText}>
                      Présentez-vous au guichet {activeTicket.counter || 'indiqué'}.
                    </Text>
                  </View>
                )}

                {activeTicket.status === 'waiting' &&
                  activeTicket.estimated_wait !== undefined && (
                    <View style={s.waitInfo}>
                      <Text style={s.waitLabel}>Attente estimée</Text>
                      <Text style={s.waitValue}>environ {activeTicket.estimated_wait} min</Text>
                    </View>
                  )}
              </View>
            </View>
          )}

          <View style={s.section}>
            <Text style={s.sectionTitle}>Mes statistiques</Text>
            <View style={s.statsRow}>
              <View style={s.miniStat}>
                <Text style={s.miniValue}>{tickets.length}</Text>
                <Text style={s.miniLabel}>Tickets</Text>
              </View>
              <View style={s.miniStat}>
                <Text style={[s.miniValue, s.miniValueSuccess]}>{doneToday}</Text>
                <Text style={s.miniLabel}>Terminés</Text>
              </View>
              <View style={s.miniStat}>
                <Text style={[s.miniValue, s.miniValuePrimary]}>
                  {stats?.global?.avg_wait_min || 0} min
                </Text>
                <Text style={s.miniLabel}>Attente moyenne</Text>
              </View>
            </View>
          </View>

          <Text style={s.sectionTitle}>Raccourcis</Text>
          <View style={s.grid}>
            {[
              { index: '01', title: 'Nouveau ticket', tab: 'Ticket' },
              { index: '02', title: 'File en direct', tab: 'File' },
            ].map((item) => (
              <TouchableOpacity
                key={item.tab}
                style={s.gridItem}
                onPress={() => navigation.navigate(item.tab as any)}
                accessibilityRole="button"
              >
                <Text style={s.gridIndex}>{item.index}</Text>
                <Text style={s.gridTitle}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.historySection}>
            <Text style={s.sectionTitle}>Mes tickets du jour</Text>
            {tickets.length > 0 ? (
              tickets.map((ticket) => (
                <View key={ticket.id} style={s.ticketRow}>
                  <View style={s.ticketInfo}>
                    <Text style={s.ticketNumber}>{ticket.number}</Text>
                    <Text style={s.ticketService}>{ticket.service_name}</Text>
                    <Text style={s.ticketTime}>
                      {new Date(ticket.created_at).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <Badge status={ticket.status} />
                </View>
              ))
            ) : (
              <TouchableOpacity
                style={s.emptyCard}
                onPress={() => navigation.navigate('Ticket')}
                accessibilityRole="button"
              >
                <View style={s.emptyMark} />
                <Text style={s.emptyTitle}>Aucun ticket aujourd’hui</Text>
                <Text style={s.emptySub}>Prenez votre premier ticket du jour.</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
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
  scroll: { flexGrow: 1, backgroundColor: Colors.bg },

  header: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    paddingBottom: Spacing.xl,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerText: { flex: 1 },
  welcome: { color: Colors.muted, fontSize: Type.sm, fontWeight: '500' },
  userName: { color: Colors.text, fontSize: Type.display, fontWeight: '600', marginTop: 2 },
  logoutBtn: {
    backgroundColor: Colors.surface2,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logoutText: { color: Colors.text, fontSize: Type.xs, fontWeight: '600' },

  content: { padding: Spacing.lg },
  section: { marginBottom: Spacing.xl },
  sectionTitle: {
    fontSize: Type.sm,
    fontWeight: '600',
    color: Colors.muted,
    marginBottom: Spacing.sm,
  },

  activeCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopWidth: 3,
    borderTopColor: Colors.primary,
    alignItems: 'center',
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
    width: '100%',
  },
  activeService: { flex: 1, fontSize: Type.sm, fontWeight: '600', color: Colors.muted },
  activeNumber: {
    fontSize: 60,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -2,
    marginVertical: Spacing.sm,
  },
  qrWrapper: {
    backgroundColor: '#ffffff',
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qrCode: { width: 120, height: 120 },

  calledAlert: {
    backgroundColor: Colors.warningSoft,
    padding: Spacing.md,
    borderRadius: Radius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.warning,
    width: '100%',
  },
  calledTitle: { color: Colors.warning, fontWeight: '600', fontSize: Type.md },
  calledText: { color: Colors.warning, fontSize: Type.sm, marginTop: 2, textAlign: 'center' },

  waitInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    width: '100%',
  },
  waitLabel: { color: Colors.muted, fontSize: Type.sm },
  waitValue: { color: Colors.primary, fontSize: Type.sm, fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: Spacing.md },
  miniStat: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  miniValue: { fontSize: Type.xl, fontWeight: '600', color: Colors.text },
  miniValueSuccess: { color: Colors.success },
  miniValuePrimary: { color: Colors.primary },
  miniLabel: { fontSize: Type.xs, color: Colors.muted, marginTop: 2 },

  grid: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  gridItem: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gridIndex: {
    fontSize: Type.xs,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  gridTitle: { fontSize: Type.md, fontWeight: '600', color: Colors.text },

  historySection: { marginBottom: Spacing.xl },
  ticketRow: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ticketInfo: { flex: 1 },
  ticketNumber: { fontSize: Type.md, fontWeight: '600', color: Colors.primary },
  ticketService: { fontSize: Type.sm, fontWeight: '500', color: Colors.text, marginTop: 2 },
  ticketTime: { fontSize: Type.xs, color: Colors.subtle, marginTop: 2 },

  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  emptyMark: {
    width: 32,
    height: 3,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
    marginBottom: Spacing.md,
  },
  emptyTitle: { fontSize: Type.lg, fontWeight: '600', color: Colors.text },
  emptySub: { fontSize: Type.sm, color: Colors.muted, marginTop: Spacing.xs },
});
