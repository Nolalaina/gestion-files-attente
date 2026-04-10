// screens/AgentScreen.tsx — Premium Interface
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl, StatusBar, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { useAuth }  from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import type { Ticket, TicketStatus, ApiResponse } from '../types';
import { Colors, Shadow } from '../types/theme';

const STATUS_LABEL: Record<TicketStatus, string> = {
  waiting:'En attente', called:'Appelé', serving:'En service',
  done:'Terminé', absent:'Absent', cancelled:'Annulé'
};

export default function AgentScreen() {
  const { user }     = useAuth();
  const { addToast } = useNotification();
  const [tickets,    setTickets]    = useState<Ticket[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [counter,    setCounter]    = useState(1);

  const fetchTickets = useCallback(async () => {
    try {
      const { data } = await api.get<ApiResponse<Ticket[]>>('/tickets');
      setTickets(data.data);
    } catch {
      addToast('Erreur de connexion au serveur', 'error');
    }
  }, [addToast]);

  useEffect(() => {
    fetchTickets().finally(() => setLoading(false));
    const id = setInterval(fetchTickets, 15000);
    return () => clearInterval(id);
  }, [fetchTickets]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTickets().catch(() => {});
    setRefreshing(false);
  };

  const callTicket = async (id: number) => {
    try {
      const { data } = await api.patch<ApiResponse<Ticket>>(`/tickets/${id}/call`, { counter });
      setTickets((p: Ticket[]) => p.map((t: Ticket) => t.id===id ? data.data : t));
      addToast('📢 Ticket appelé !', 'success');
    } catch { addToast('Erreur lors de l\'appel', 'error'); }
  };

  const completeTicket = async (id: number) => {
    Alert.alert('Confirmer', 'Marquer ce ticket comme terminé ?', [
      { text:'Annuler', style:'cancel' },
      { text:'Terminer', onPress: async () => {
        try {
          const { data } = await api.patch<ApiResponse<Ticket>>(`/tickets/${id}/complete`);
          setTickets((p: Ticket[]) => p.map((t: Ticket) => t.id===id ? data.data : t));
          addToast('✅ Ticket terminé', 'info');
        } catch { addToast('Erreur', 'error'); }
      }}
    ]);
  };

  const absentTicket = async (id: number) => {
    try {
      const { data } = await api.patch<ApiResponse<Ticket>>(`/tickets/${id}/absent`);
      setTickets((p: Ticket[]) => p.map((t: Ticket) => t.id===id ? data.data : t));
      addToast('⚠️ Marqué absent', 'warning');
    } catch { addToast('Erreur', 'error'); }
  };

  const active    = tickets.filter((t: Ticket) => ['waiting','called','serving'].includes(t.status));
  const current   = tickets.find((t: Ticket) => t.status==='called' || t.status==='serving');
  const waiting   = active.filter((t: Ticket) => t.status==='waiting');

  if (loading) return (
    <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />
      
      {/* Guichet Selector */}
      <View style={s.topPanel}>
        <View style={s.topBar}>
          <Text style={s.topTitle}>Ma Console Agent</Text>
          <View style={s.counterTabs}>
            {[1,2,3,4,5].map(n => (
              <TouchableOpacity key={n}
                style={[s.counterTab, counter===n && s.counterTabActive]}
                onPress={() => setCounter(n)}>
                <Text style={[s.counterTabText, counter===n && s.counterTabTextActive]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView 
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Active Ticket Card */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>EN COURS AU GUICHET {counter}</Text>
          {current ? (
            <View style={s.currentCard}>
              <View style={s.badgeBox}>
                <Text style={s.badgeLabel}>{current.status.toUpperCase()}</Text>
              </View>
              <Text style={s.currentNumber}>{current.number}</Text>
              <Text style={s.currentName}>{current.user_name}</Text>
              <View style={s.btnGroup}>
                <TouchableOpacity style={s.btnSuccess} onPress={() => completeTicket(current.id)}>
                  <Text style={s.btnText}>Terminer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.btnGhost} onPress={() => absentTicket(current.id)}>
                  <Text style={s.btnTextGhost}>Absent</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={s.idleCard}>
              <Text style={s.idleText}>Aucun ticket en cours au guichet {counter}</Text>
            </View>
          )}
        </View>

        {/* Waiting List */}
        <View style={s.section}>
          <View style={s.listHeader}>
            <Text style={s.sectionLabel}>FILE D'ATTENTE ({waiting.length})</Text>
            <TouchableOpacity onPress={onRefresh}><Text style={s.refreshLink}>Actualiser</Text></TouchableOpacity>
          </View>
          
          {waiting.map((t: Ticket) => {
            const wait = t.created_at ? Math.round((Date.now() - new Date(t.created_at).getTime()) / 60000) : 0;
            return (
              <View key={t.id} style={s.ticketRow}>
                <View style={s.ticketInfo}>
                  <Text style={s.ticketNum}>{t.number}</Text>
                  <Text style={s.ticketClient}>{t.user_name}</Text>
                  <Text style={[s.ticketWait, wait > 15 && { color: '#ef4444' }]}>{wait} min d'attente</Text>
                </View>
                <TouchableOpacity style={s.callAction} onPress={() => callTicket(t.id)}>
                  <Text style={s.callActionText}>APPELER</Text>
                </TouchableOpacity>
              </View>
            );
          })}
          
          {waiting.length === 0 && !current && (
            <View style={s.emptyState}>
              <Text style={s.emptyIcon}>🎉</Text>
              <Text style={s.emptyText}>Bravo ! La file est vide.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20 },
  topPanel: { backgroundColor: '#4f46e5', borderBottomLeftRadius: 32, borderBottomRightRadius: 32, paddingBottom: 16 },
  topBar: { padding: 24, alignItems: 'center' },
  topTitle: { fontSize: 18, fontWeight: '900', color: '#fff', marginBottom: 16 },
  counterTabs: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', padding: 4, borderRadius: 16 },
  counterTab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12 },
  counterTabActive: { backgroundColor: '#fff' },
  counterTabText: { color: 'rgba(255,255,255,0.7)', fontWeight: '800' },
  counterTabTextActive: { color: '#4f46e5' },
  
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1.5, marginBottom: 12 },
  
  currentCard: { 
    backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center',
    ...Shadow.sm, borderTopWidth: 4, borderTopColor: '#10b981'
  },
  badgeBox: { backgroundColor: '#f1f5f9', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 99 },
  badgeLabel: { fontSize: 10, fontWeight: '900', color: '#64748b' },
  currentNumber: { fontSize: 64, fontWeight: '900', color: '#0f172a', marginVertical: 8 },
  currentName: { fontSize: 16, fontWeight: '700', color: '#64748b', marginBottom: 24 },
  btnGroup: { flexDirection: 'row', gap: 12, width: '100%' },
  btnSuccess: { flex: 1, backgroundColor: '#10b981', padding: 16, borderRadius: 16, alignItems: 'center' },
  btnGhost: { flex: 1, backgroundColor: '#f1f5f9', padding: 16, borderRadius: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800' },
  btnTextGhost: { color: '#64748b', fontWeight: '800' },
  
  idleCard: { backgroundColor: '#fff', padding: 32, borderRadius: 24, alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#e2e8f0' },
  idleText: { color: '#94a3b8', fontSize: 14, fontWeight: '600', textAlign:'center' },
  
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  refreshLink: { fontSize: 12, fontWeight: '700', color: '#4f46e5' },
  
  ticketRow: { 
    backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    ...Shadow.sm
  },
  ticketInfo: { flex: 1 },
  ticketNum: { fontSize: 20, fontWeight: '900', color: '#4f46e5' },
  ticketClient: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginTop: 2 },
  ticketWait: { fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: '600' },
  callAction: { backgroundColor: '#f59e0b', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
  callActionText: { color: '#fff', fontWeight: '900', fontSize: 11 },
  
  emptyState: { padding: 40, alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#94a3b8', fontWeight: '600' },
});
