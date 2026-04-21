// screens/UsagerDashboardScreen.tsx — Aurora Design v5
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, StatusBar, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList, Ticket, ApiResponse } from '../types';
import { useAuth } from '../context/AuthContext';
import { Colors, Shadow, Radius } from '../types/theme';
import api from '../services/api';

type Nav = BottomTabNavigationProp<MainTabParamList>;
const { width } = Dimensions.get('window');

const STATUS_LABEL: Record<string, string> = {
  waiting: 'En attente', called: 'Appelé', serving: 'En service',
  done: 'Terminé', absent: 'Absent', cancelled: 'Annulé'
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  waiting:   { bg: '#fef3c7', text: '#b45309' },
  called:    { bg: '#d1fae5', text: '#047857' },
  serving:   { bg: '#dbeafe', text: '#1d4ed8' },
  done:      { bg: '#f3e8ff', text: '#7c3aed' },
  absent:    { bg: '#fce7f3', text: '#be185d' },
  cancelled: { bg: '#fee2e2', text: '#b91c1c' },
};

export default function UsagerDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { user, logout } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [tRes, sRes] = await Promise.all([
        api.get<ApiResponse<Ticket[]>>('/tickets/my'),
        api.get('/stats'),
      ]);
      setTickets(tRes.data.data || []);
      setStats(sRes.data.data);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 15000);
    return () => clearInterval(id);
  }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const activeTicket = tickets.find(t => ['waiting', 'called', 'serving'].includes(t.status));
  const doneToday = tickets.filter(t => t.status === 'done').length;

  if (loading) return (
    <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerDecor1} />
          <View style={s.headerDecor2} />
          <View style={s.headerTop}>
            <View>
              <Text style={s.welcomeText}>Mon Espace ✨</Text>
              <Text style={s.userName}>{user?.name || 'Visiteur'}</Text>
            </View>
            <TouchableOpacity style={s.logoutBtn} onPress={logout}>
              <Text style={s.logoutText}>Sortir</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.content}>
          {/* Active Ticket */}
          {activeTicket && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>MON TICKET ACTIF</Text>
              <View style={s.activeCard}>
                <View style={s.activeHeader}>
                  <Text style={s.activeSvc}>{activeTicket.service_name}</Text>
                  <View style={[s.activeBadge, { backgroundColor: activeTicket.status === 'called' ? Colors.warning : Colors.success }]}>
                    <Text style={s.activeBadgeText}>{STATUS_LABEL[activeTicket.status]}</Text>
                  </View>
                </View>
                <Text style={s.activeNumber}>{activeTicket.number}</Text>
                {activeTicket.status === 'called' && (
                  <View style={s.calledAlert}>
                    <Text style={s.calledText}>🔊 C'EST VOTRE TOUR !</Text>
                    <Text style={s.calledSub}>Guichet {activeTicket.counter || '—'}</Text>
                  </View>
                )}
                {activeTicket.status === 'waiting' && activeTicket.estimated_wait !== undefined && (
                  <View style={s.waitInfo}>
                    <Text style={s.waitLabel}>Attente estimée :</Text>
                    <Text style={s.waitValue}>~{activeTicket.estimated_wait} min</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Stats */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>MES STATISTIQUES</Text>
            <View style={s.statsRow}>
              <View style={s.miniStat}>
                <Text style={s.miniIcon}>🎫</Text>
                <Text style={s.miniValue}>{tickets.length}</Text>
                <Text style={s.miniLabel}>Tickets</Text>
              </View>
              <View style={s.miniStat}>
                <Text style={s.miniIcon}>✅</Text>
                <Text style={[s.miniValue, { color: Colors.success }]}>{doneToday}</Text>
                <Text style={s.miniLabel}>Terminés</Text>
              </View>
              <View style={s.miniStat}>
                <Text style={s.miniIcon}>⏱️</Text>
                <Text style={[s.miniValue, { color: Colors.primaryMid }]}>{stats?.global?.avg_wait_min || 0}m</Text>
                <Text style={s.miniLabel}>Moy. attente</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <Text style={s.sectionTitle}>RACCOURCIS</Text>
          <View style={s.grid}>
            {[
              { icon: '🎫', title: 'Nouveau Ticket', tab: 'Ticket', color: Colors.primary },
              { icon: '📱', title: 'File en Direct', tab: 'File', color: Colors.primaryMid },
            ].map((item, i) => (
              <TouchableOpacity key={i} style={s.gridItem} onPress={() => navigation.navigate(item.tab as any)}>
                <View style={[s.gridIcon, { backgroundColor: item.color + '15' }]}>
                  <Text style={{ fontSize: 24 }}>{item.icon}</Text>
                </View>
                <Text style={s.gridTitle}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Ticket History */}
          <View style={[s.section, { marginTop: 24 }]}>
            <Text style={s.sectionTitle}>MES TICKETS DU JOUR</Text>
            {tickets.length > 0 ? tickets.map(t => (
              <View key={t.id} style={s.ticketRow}>
                <View style={s.ticketInfo}>
                  <Text style={s.ticketNum}>{t.number}</Text>
                  <Text style={s.ticketSvc}>{t.service_name}</Text>
                  <Text style={s.ticketTime}>
                    {new Date(t.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[t.status]?.bg || Colors.surface2 }]}>
                  <Text style={{ color: STATUS_COLORS[t.status]?.text || Colors.muted, fontSize: 10, fontWeight: '800' }}>
                    {STATUS_LABEL[t.status]}
                  </Text>
                </View>
              </View>
            )) : (
              <TouchableOpacity style={s.emptyCard} onPress={() => navigation.navigate('Ticket')}>
                <Text style={s.emptyIcon}>📭</Text>
                <Text style={s.emptyTitle}>Aucun ticket</Text>
                <Text style={s.emptySub}>Prenez votre premier ticket du jour</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flexGrow: 1, backgroundColor: Colors.bg },

  header: { backgroundColor: Colors.primary, padding: 24, paddingBottom: 60, borderBottomLeftRadius: 44, borderBottomRightRadius: 44, position: 'relative', overflow: 'hidden' },
  headerDecor1: { position: 'absolute', right: -30, top: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(6,182,212,.12)' },
  headerDecor2: { position: 'absolute', left: -20, bottom: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(167,139,250,.1)' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 },
  welcomeText: { color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: '600' },
  userName: { color: '#fff', fontSize: 28, fontWeight: '900' },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: Radius.sm },
  logoutText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  content: { padding: 20, marginTop: -40 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: Colors.subtle, letterSpacing: 1.5, marginBottom: 12, marginLeft: 4 },

  activeCard: { backgroundColor: '#fff', borderRadius: Radius.xl, padding: 24, ...Shadow.md, borderTopWidth: 6, borderTopColor: Colors.primary, borderWidth: 1, borderColor: Colors.border },
  activeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  activeSvc: { fontSize: 13, fontWeight: '800', color: Colors.muted },
  activeBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
  activeBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  activeNumber: { fontSize: 56, fontWeight: '900', color: Colors.text, textAlign: 'center', marginVertical: 8 },
  calledAlert: { backgroundColor: '#fff7ed', padding: 16, borderRadius: Radius.md, alignItems: 'center', borderWidth: 1, borderColor: '#ffedd5' },
  calledText: { color: '#c2410c', fontWeight: '900', fontSize: 16 },
  calledSub: { color: '#ea580c', fontSize: 12, fontWeight: '600', marginTop: 2 },
  waitInfo: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 12 },
  waitLabel: { color: Colors.subtle, fontSize: 13, fontWeight: '600' },
  waitValue: { color: Colors.primary, fontSize: 15, fontWeight: '800' },

  statsRow: { flexDirection: 'row', gap: 12 },
  miniStat: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: Radius.lg, alignItems: 'center', ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  miniIcon: { fontSize: 20, marginBottom: 4 },
  miniValue: { fontSize: 22, fontWeight: '900', color: Colors.text },
  miniLabel: { fontSize: 10, color: Colors.subtle, marginTop: 2, fontWeight: '700', textTransform: 'uppercase' },

  grid: { flexDirection: 'row', gap: 12 },
  gridItem: { flex: 1, backgroundColor: '#fff', borderRadius: Radius.lg, padding: 20, alignItems: 'center', ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  gridIcon: { width: 48, height: 48, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  gridTitle: { fontSize: 13, fontWeight: '700', color: Colors.text },

  ticketRow: { backgroundColor: '#fff', borderRadius: Radius.md, padding: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  ticketInfo: { flex: 1 },
  ticketNum: { fontSize: 18, fontWeight: '900', color: Colors.primary },
  ticketSvc: { fontSize: 13, fontWeight: '700', color: Colors.text, marginTop: 2 },
  ticketTime: { fontSize: 11, color: Colors.subtle, marginTop: 2 },
  statusBadge: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 10 },

  emptyCard: { backgroundColor: '#fff', borderRadius: Radius.xl, padding: 32, alignItems: 'center', ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  emptySub: { fontSize: 12, color: Colors.subtle, marginTop: 4 },
});
