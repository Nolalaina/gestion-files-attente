// screens/AgentScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { useAuth }  from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { Ticket, TicketStatus, ApiResponse } from '../types';

const STATUS_LABEL: Record<TicketStatus, string> = {
  waiting:'En attente', called:'Appelé', serving:'En service',
  done:'Terminé', absent:'Absent', cancelled:'Annulé'
};
const STATUS_COLOR: Record<TicketStatus, { bg:string; text:string }> = {
  waiting:  { bg:'#fef3c7', text:'#92400e' },
  called:   { bg:'#d1fae5', text:'#065f46' },
  serving:  { bg:'#dbeafe', text:'#1e40af' },
  done:     { bg:'#e0e7ff', text:'#3730a3' },
  absent:   { bg:'#fce7f3', text:'#9d174d' },
  cancelled:{ bg:'#fee2e2', text:'#991b1b' },
};

export default function AgentScreen() {
  const { user }     = useAuth();
  const { addToast } = useToast();
  const [tickets,    setTickets]    = useState<Ticket[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [counter,    setCounter]    = useState(1);

  const fetchTickets = useCallback(async () => {
    const { data } = await api.get<ApiResponse<Ticket[]>>('/tickets');
    setTickets(data.data);
  }, []);

  useEffect(() => {
    fetchTickets().finally(() => setLoading(false));
    const id = setInterval(fetchTickets, 10000);
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
      setTickets(p => p.map(t => t.id===id ? data.data : t));
      addToast('📢 Ticket appelé !', 'success');
    } catch { addToast('Erreur lors de l\'appel', 'error'); }
  };

  const completeTicket = async (id: number) => {
    Alert.alert('Confirmer', 'Marquer ce ticket comme terminé ?', [
      { text:'Annuler', style:'cancel' },
      { text:'Terminer', onPress: async () => {
        try {
          const { data } = await api.patch<ApiResponse<Ticket>>(`/tickets/${id}/complete`);
          setTickets(p => p.map(t => t.id===id ? data.data : t));
          addToast('✅ Ticket terminé', 'info');
        } catch { addToast('Erreur', 'error'); }
      }}
    ]);
  };

  const absentTicket = async (id: number) => {
    try {
      const { data } = await api.patch<ApiResponse<Ticket>>(`/tickets/${id}/absent`);
      setTickets(p => p.map(t => t.id===id ? data.data : t));
      addToast('⚠️ Marqué absent', 'warning');
    } catch { addToast('Erreur', 'error'); }
  };

  const active    = tickets.filter(t => ['waiting','called','serving'].includes(t.status));
  const current   = tickets.find(t => t.status==='called' || t.status==='serving');

  if (loading) return (
    <View style={s.center}><ActivityIndicator size="large" color="#2563eb" /></View>
  );

  return (
    <SafeAreaView style={s.safe}>
      {/* En-tête */}
      <View style={s.topBar}>
        <Text style={s.topTitle}>Guichet {counter} · {user?.name}</Text>
        <View style={s.counterRow}>
          {[1,2,3,4,5].map(n => (
            <TouchableOpacity key={n}
              style={[s.counterBtn, counter===n && s.counterBtnActive]}
              onPress={() => setCounter(n)}>
              <Text style={[s.counterBtnText, counter===n && s.counterBtnTextActive]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Ticket en cours */}
      {current && (
        <View style={s.currentCard}>
          <Text style={s.currentLabel}>{current.status==='serving' ? 'EN SERVICE' : 'APPELÉ'}</Text>
          <Text style={s.currentNumber}>{current.number}</Text>
          <Text style={s.currentName}>{current.user_name}</Text>
          <View style={s.currentActions}>
            <TouchableOpacity style={s.doneBtn} onPress={() => completeTicket(current.id)}>
              <Text style={s.doneBtnText}>✅ Terminer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.absentBtn} onPress={() => absentTicket(current.id)}>
              <Text style={s.absentBtnText}>⚠️ Absent</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Liste */}
      <FlatList
        data={active.filter(t => t.status==='waiting')}
        keyExtractor={t => String(t.id)}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
        ListHeaderComponent={
          <Text style={s.listHeader}>En attente ({active.filter(t=>t.status==='waiting').length})</Text>
        }
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Text style={s.emptyText}>🎉 Aucun ticket en attente</Text>
          </View>
        }
        renderItem={({ item: t }) => {
          const sc = STATUS_COLOR[t.status];
          const wait = t.created_at ? Math.round((Date.now() - new Date(t.created_at).getTime()) / 60000) : 0;
          return (
            <View style={s.ticketRow}>
              <View style={s.ticketLeft}>
                <Text style={s.ticketNum}>{t.number}</Text>
                <Text style={s.ticketName}>{t.user_name}</Text>
                {t.phone && <Text style={s.ticketPhone}>📞 {t.phone}</Text>}
                <Text style={[s.ticketWait, wait > 15 && s.ticketWaitLong]}>{wait} min</Text>
              </View>
              <View style={s.ticketRight}>
                <View style={[s.badge, { backgroundColor:sc.bg }]}>
                  <Text style={[s.badgeText, { color:sc.text }]}>{STATUS_LABEL[t.status]}</Text>
                </View>
                {t.status==='waiting' && (
                  <TouchableOpacity style={s.callBtn} onPress={() => callTicket(t.id)} activeOpacity={0.85}>
                    <Text style={s.callBtnText}>📢 Appeler</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const BLUE = '#2563eb';
const s = StyleSheet.create({
  safe:       { flex:1, backgroundColor:'#f8fafc' },
  center:     { flex:1, justifyContent:'center', alignItems:'center' },
  topBar:     { backgroundColor:BLUE, paddingHorizontal:16, paddingVertical:12 },
  topTitle:   { fontSize:16, fontWeight:'700', color:'#fff', marginBottom:10 },
  counterRow: { flexDirection:'row', gap:8 },
  counterBtn: { width:34, height:34, borderRadius:8, borderWidth:2, borderColor:'rgba(255,255,255,.4)',
                justifyContent:'center', alignItems:'center' },
  counterBtnActive:     { backgroundColor:'#fff', borderColor:'#fff' },
  counterBtnText:       { fontSize:14, fontWeight:'700', color:'rgba(255,255,255,.8)' },
  counterBtnTextActive: { color:BLUE },
  currentCard:    { margin:14, borderRadius:16, backgroundColor:BLUE, padding:18, alignItems:'center' },
  currentLabel:   { color:'rgba(255,255,255,.75)', fontSize:12, fontWeight:'700', letterSpacing:1 },
  currentNumber:  { fontSize:64, fontWeight:'900', color:'#fff', lineHeight:68 },
  currentName:    { color:'rgba(255,255,255,.85)', fontSize:15, marginTop:4 },
  currentActions: { flexDirection:'row', gap:10, marginTop:14 },
  doneBtn:   { backgroundColor:'#10b981', borderRadius:10, paddingHorizontal:20, paddingVertical:10 },
  doneBtnText: { color:'#fff', fontWeight:'700', fontSize:14 },
  absentBtn:   { backgroundColor:'rgba(255,255,255,.2)', borderRadius:10, paddingHorizontal:16, paddingVertical:10 },
  absentBtnText: { color:'#fff', fontWeight:'600', fontSize:14 },
  list:       { paddingHorizontal:14, paddingBottom:32 },
  listHeader: { fontSize:14, fontWeight:'700', color:'#64748b', marginBottom:10, marginTop:4 },
  emptyState: { alignItems:'center', paddingVertical:40 },
  emptyText:  { color:'#94a3b8', fontSize:15 },
  ticketRow:  { backgroundColor:'#fff', borderRadius:14, padding:14, marginBottom:10,
                flexDirection:'row', justifyContent:'space-between',
                shadowColor:'#000', shadowOpacity:.05, shadowRadius:6, elevation:2 },
  ticketLeft: { flex:1 },
  ticketNum:  { fontSize:22, fontWeight:'900', color:BLUE },
  ticketName: { fontSize:14, fontWeight:'600', color:'#1e293b', marginTop:2 },
  ticketPhone:{ fontSize:12, color:'#94a3b8', marginTop:2 },
  ticketWait: { fontSize:11, color:'#94a3b8', marginTop:4 },
  ticketWaitLong: { color:'#ef4444', fontWeight:'600' },
  ticketRight:{ alignItems:'flex-end', gap:8 },
  badge:      { borderRadius:99, paddingHorizontal:10, paddingVertical:3 },
  badgeText:  { fontSize:11, fontWeight:'700' },
  callBtn:    { backgroundColor:BLUE, borderRadius:8, paddingHorizontal:14, paddingVertical:8 },
  callBtnText:{ color:'#fff', fontWeight:'700', fontSize:13 },
});
