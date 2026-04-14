// screens/UsagerDashboardScreen.tsx — Client personal space (matching web)
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
import { Colors, Shadow } from '../types/theme';
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
  done:      { bg: '#ede9fe', text: '#6d28d9' },
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
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={s.header}>
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
                  <View style={[s.activeBadge, { backgroundColor: activeTicket.status === 'called' ? '#f59e0b' : '#10b981' }]}>
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
                <Text style={[s.miniValue, { color: '#10b981' }]}>{doneToday}</Text>
                <Text style={s.miniLabel}>Terminés</Text>
              </View>
              <View style={s.miniStat}>
                <Text style={s.miniIcon}>⏱️</Text>
                <Text style={[s.miniValue, { color: '#8b5cf6' }]}>{stats?.global?.avg_wait_min || 0}m</Text>
                <Text style={s.miniLabel}>Moy. attente</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <Text style={s.sectionTitle}>RACCOURCIS</Text>
          <View style={s.grid}>
            {[
              { icon: '🎫', title: 'Nouveau Ticket', tab: 'Ticket', color: '#4f46e5' },
              { icon: '📱', title: 'File en Direct', tab: 'File', color: '#8b5cf6' },
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
                <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[t.status]?.bg || '#f1f5f9' }]}>
                  <Text style={{ color: STATUS_COLORS[t.status]?.text || '#64748b', fontSize: 10, fontWeight: '800' }}>
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
  safe: { flex: 1, backgroundColor: '#4f46e5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flexGrow: 1, backgroundColor: '#f8fafc' },

  header: { backgroundColor: '#4f46e5', padding: 24, paddingBottom: 60, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcomeText: { color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: '600' },
  userName: { color: '#fff', fontSize: 28, fontWeight: '900' },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12 },
  logoutText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  content: { padding: 20, marginTop: -40 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1.5, marginBottom: 12, marginLeft: 4 },

  // Active ticket
  activeCard: { backgroundColor: '#fff', borderRadius: 28, padding: 24, ...Shadow.md, borderTopWidth: 6, borderTopColor: '#4f46e5' },
  activeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  activeSvc: { fontSize: 13, fontWeight: '800', color: '#64748b' },
  activeBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
  activeBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  activeNumber: { fontSize: 56, fontWeight: '900', color: '#1e293b', textAlign: 'center', marginVertical: 8 },
  calledAlert: { backgroundColor: '#fff7ed', padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#ffedd5' },
  calledText: { color: '#c2410c', fontWeight: '900', fontSize: 16 },
  calledSub: { color: '#ea580c', fontSize: 12, fontWeight: '600', marginTop: 2 },
  waitInfo: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 12 },
  waitLabel: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  waitValue: { color: '#4f46e5', fontSize: 15, fontWeight: '800' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12 },
  miniStat: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 20, alignItems: 'center', ...Shadow.sm },
  miniIcon: { fontSize: 20, marginBottom: 4 },
  miniValue: { fontSize: 22, fontWeight: '900', color: '#1e293b' },
  miniLabel: { fontSize: 10, color: '#94a3b8', marginTop: 2, fontWeight: '700', textTransform: 'uppercase' },

  // Grid
  grid: { flexDirection: 'row', gap: 12 },
  gridItem: { flex: 1, backgroundColor: '#fff', borderRadius: 24, padding: 20, alignItems: 'center', ...Shadow.sm },
  gridIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  gridTitle: { fontSize: 13, fontWeight: '700', color: '#1e293b' },

  // Tickets
  ticketRow: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...Shadow.sm },
  ticketInfo: { flex: 1 },
  ticketNum: { fontSize: 18, fontWeight: '900', color: '#4f46e5' },
  ticketSvc: { fontSize: 13, fontWeight: '700', color: '#1e293b', marginTop: 2 },
  ticketTime: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  statusBadge: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 10 },

  // Empty
  emptyCard: { backgroundColor: '#fff', borderRadius: 28, padding: 32, alignItems: 'center', ...Shadow.sm },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  emptySub: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
});
