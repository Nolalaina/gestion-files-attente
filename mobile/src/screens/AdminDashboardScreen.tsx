// screens/AdminDashboardScreen.tsx — Full Admin Dashboard (6 tabs like web)
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, ScrollView, StyleSheet, ActivityIndicator,
  RefreshControl, Text, TouchableOpacity, FlatList, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import StatCard from '../components/StatCard';
import { Colors, Shadow } from '../types/theme';
import { useNotification } from '../context/NotificationContext';
import type { Ticket, Service, User, ActivityLog, ApiResponse } from '../types';

const STATUS_LABEL: Record<string, string> = {
  waiting:'En attente', called:'Appelé', serving:'En service',
  done:'Terminé', absent:'Absent', cancelled:'Annulé'
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  waiting:   { bg: '#fef3c7', text: '#b45309' },
  called:    { bg: '#d1fae5', text: '#047857' },
  serving:   { bg: '#dbeafe', text: '#1d4ed8' },
  done:      { bg: '#ede9fe', text: '#6d28d9' },
  absent:    { bg: '#fce7f3', text: '#be185d' },
  cancelled: { bg: '#fee2e2', text: '#b91c1c' },
};

type TabId = 'overview' | 'queue' | 'services' | 'users' | 'logs';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: '📈 Aperçu' },
  { id: 'queue',    label: '🎫 File' },
  { id: 'services', label: '⚙️ Services' },
  { id: 'users',    label: '👥 Agents' },
  { id: 'logs',     label: '🔍 Logs' },
];

const AdminDashboardScreen: React.FC = () => {
  const { addToast } = useNotification();
  const [tab, setTab] = useState<TabId>('overview');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const reload = useCallback(async () => {
    try {
      const [sRes, uRes, svRes, tRes, lRes] = await Promise.all([
        api.get('/stats'),
        api.get('/users'),
        api.get('/services'),
        api.get('/tickets?limit=100'),
        api.get('/stats/logs?limit=50'),
      ]);
      setStats(sRes.data.data);
      setUsers(uRes.data.data || []);
      setServices(svRes.data.data || []);
      setAllTickets(tRes.data.data || []);
      setLogs(lRes.data.data || []);
    } catch {
      addToast('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [addToast]);

  useEffect(() => {
    reload();
    const id = setInterval(reload, 30000);
    return () => clearInterval(id);
  }, [reload]);

  const toggleUser = async (user: any) => {
    try {
      await api.patch(`/users/${user.id}/toggle`);
      addToast(`Agent ${user.active ? 'désactivé' : 'activé'}`, 'success');
      reload();
    } catch { addToast('Erreur', 'error'); }
  };

  const simulateClient = async () => {
    if (services.length === 0) return;
    try {
      await api.post('/tickets', { service_id: services[0].id, user_name: 'Client Simulé' });
      addToast('Client simulé ajouté', 'success');
      reload();
    } catch { addToast('Erreur simulation', 'error'); }
  };

  if (loading) return (
    <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
  );

  const g = stats?.global;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        style={s.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); reload(); }} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerRow}>
            <View>
              <Text style={s.title}>Dashboard Admin</Text>
              <Text style={s.subtitle}>
                {new Date().toLocaleDateString('fr-FR', { dateStyle: 'full' })}
              </Text>
            </View>
            <View style={s.headerActions}>
              <TouchableOpacity style={s.actionBtn} onPress={simulateClient}>
                <Text style={s.actionBtnText}>➕ Simuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.refreshBtn} onPress={reload}>
                <Text style={s.refreshBtnText}>🔄</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* KPIs */}
        <View style={s.statsGrid}>
          <StatCard label="Tickets total" value={g?.total || 0} icon="🎫" color="#4f46e5" />
          <StatCard label="En attente" value={g?.waiting || 0} icon="⏳" color="#f59e0b" />
          <StatCard label="Traités" value={g?.done || 0} icon="✅" color="#10b981" />
          <StatCard label="Attente Moy." value={`${g?.avg_wait_min || 0}m`} icon="⏱️" color="#8b5cf6" />
        </View>

        {/* Tab Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll}>
          <View style={s.tabBar}>
            {TABS.map(t => (
              <TouchableOpacity
                key={t.id}
                style={[s.tabItem, tab === t.id && s.tabItemActive]}
                onPress={() => setTab(t.id)}
              >
                <Text style={[s.tabText, tab === t.id && s.tabTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* === OVERVIEW === */}
        {tab === 'overview' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>ÉTAT PAR SERVICE</Text>
            {stats?.by_service?.map((svc: any) => (
              <View key={svc.id} style={s.serviceRow}>
                <View style={s.svcLeft}>
                  <View style={s.svcBadge}><Text style={s.svcBadgeText}>{svc.name?.charAt(0)}</Text></View>
                  <View>
                    <Text style={s.svcName}>{svc.name}</Text>
                    <Text style={s.svcSub}>{svc.total || 0} tickets · {svc.avg_wait_min || 0}min moy.</Text>
                  </View>
                </View>
                <View style={s.svcRight}>
                  <Text style={s.svcWaiting}>{svc.waiting || 0}</Text>
                  <Text style={s.svcWaitLabel}>en att.</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* === FILE GLOBALE === */}
        {tab === 'queue' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>FILE GLOBALE ({allTickets.length} TICKETS)</Text>
            {allTickets.map(tk => (
              <View key={tk.id} style={s.ticketRow}>
                <View style={s.ticketLeft}>
                  <Text style={s.ticketNum}>{tk.number}</Text>
                  <Text style={s.ticketClient}>{tk.user_name}</Text>
                  <Text style={s.ticketSvc}>{tk.service_name}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[tk.status]?.bg || '#f1f5f9' }]}>
                  <Text style={[s.statusText, { color: STATUS_COLORS[tk.status]?.text || '#64748b' }]}>
                    {STATUS_LABEL[tk.status] || tk.status}
                  </Text>
                </View>
              </View>
            ))}
            {allTickets.length === 0 && (
              <View style={s.emptyBox}><Text style={s.emptyText}>Aucun ticket aujourd'hui</Text></View>
            )}
          </View>
        )}

        {/* === SERVICES === */}
        {tab === 'services' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>SERVICES ACTIFS</Text>
            {services.map(sv => (
              <View key={sv.id} style={s.serviceRow}>
                <View style={s.svcLeft}>
                  <View style={[s.svcBadge, { backgroundColor: '#eef2ff' }]}>
                    <Text style={[s.svcBadgeText, { color: '#4f46e5' }]}>{sv.prefix}</Text>
                  </View>
                  <View>
                    <Text style={s.svcName}>{sv.name}</Text>
                    <Text style={s.svcSub}>{sv.max_counters} guichets · ~{sv.avg_duration}min</Text>
                  </View>
                </View>
                <View style={[s.statusBadge, { backgroundColor: sv.active ? '#dcfce7' : '#fee2e2' }]}>
                  <Text style={{ color: sv.active ? '#166534' : '#991b1b', fontSize: 11, fontWeight: '800' }}>
                    {sv.active ? 'Ouvert' : 'Fermé'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* === AGENTS === */}
        {tab === 'users' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>GESTION DES AGENTS</Text>
            {users.map(u => (
              <View key={u.id} style={s.agentRow}>
                <View style={s.agentLeft}>
                  <View style={[s.avatar, { backgroundColor: u.active ? '#e0e7ff' : '#f1f5f9' }]}>
                    <Text style={s.avatarText}>{u.name?.[0] || '?'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.agentName}>{u.name}</Text>
                    <Text style={s.agentEmail}>{u.email}</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                      <View style={[s.roleBadge, { backgroundColor: u.role === 'admin' ? '#dbeafe' : '#fef3c7' }]}>
                        <Text style={{ fontSize: 9, fontWeight: '800', color: u.role === 'admin' ? '#1d4ed8' : '#b45309' }}>
                          {u.role?.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={s.ticketCount}>{u.ticket_count || 0} tickets</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={[s.toggleBtn, { backgroundColor: u.active ? '#dcfce7' : '#fee2e2' }]}
                  onPress={() => toggleUser(u)}
                >
                  <Text style={{ color: u.active ? '#166534' : '#991b1b', fontSize: 11, fontWeight: '800' }}>
                    {u.active ? 'Actif' : 'Inactif'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* === LOGS === */}
        {tab === 'logs' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>LOGS D'ACTIVITÉ</Text>
            {logs.map(l => (
              <View key={l.id} style={s.logRow}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <View style={s.logActionBadge}>
                      <Text style={s.logActionText}>{l.action}</Text>
                    </View>
                    <Text style={s.logUser}>{l.user_name || 'Système'}</Text>
                  </View>
                  <Text style={s.logDesc} numberOfLines={2}>{l.description}</Text>
                </View>
                <Text style={s.logDate}>
                  {new Date(l.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ))}
            {logs.length === 0 && (
              <View style={s.emptyBox}><Text style={s.emptyText}>Aucun log récent</Text></View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  
  header: { padding: 20, paddingBottom: 0 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 26, fontWeight: '900', color: '#1e293b' },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4, fontWeight: '500' },
  headerActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { backgroundColor: '#4f46e5', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12 },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  refreshBtn: { backgroundColor: '#f1f5f9', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 },
  refreshBtnText: { fontSize: 16 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', padding: 20 },

  tabScroll: { paddingHorizontal: 20, marginBottom: 8 },
  tabBar: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4 },
  tabItem: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  tabItemActive: { backgroundColor: '#fff', ...Shadow.sm },
  tabText: { fontSize: 13, fontWeight: '600', color: '#94a3b8' },
  tabTextActive: { color: '#4f46e5', fontWeight: '800' },

  section: { padding: 20, paddingTop: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1.5, marginBottom: 16 },

  // Service rows
  serviceRow: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...Shadow.sm },
  svcLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  svcBadge: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  svcBadgeText: { fontSize: 16, fontWeight: '900', color: '#64748b' },
  svcName: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  svcSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  svcRight: { alignItems: 'flex-end' },
  svcWaiting: { fontSize: 20, fontWeight: '900', color: '#f59e0b' },
  svcWaitLabel: { fontSize: 9, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' },

  // Ticket rows
  ticketRow: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...Shadow.sm },
  ticketLeft: { flex: 1 },
  ticketNum: { fontSize: 18, fontWeight: '900', color: '#4f46e5' },
  ticketClient: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginTop: 2 },
  ticketSvc: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  statusBadge: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '800' },

  // Agent rows
  agentRow: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...Shadow.sm },
  agentLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 14 },
  avatar: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#4f46e5' },
  agentName: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  agentEmail: { fontSize: 11, color: '#64748b', marginTop: 2 },
  roleBadge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6 },
  ticketCount: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  toggleBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 },

  // Log rows
  logRow: { backgroundColor: '#fff', padding: 14, borderRadius: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', ...Shadow.sm },
  logActionBadge: { backgroundColor: '#eef2ff', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6 },
  logActionText: { fontSize: 9, fontWeight: '800', color: '#4f46e5' },
  logUser: { fontSize: 12, fontWeight: '700', color: '#1e293b' },
  logDesc: { fontSize: 12, color: '#64748b', lineHeight: 18 },
  logDate: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },

  emptyBox: { backgroundColor: '#f8fafc', padding: 32, borderRadius: 16, alignItems: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: '#e2e8f0' },
  emptyText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
});

export default AdminDashboardScreen;
