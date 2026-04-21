// screens/AdminDashboardScreen.tsx — Aurora Design v5
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, ScrollView, StyleSheet, ActivityIndicator,
  RefreshControl, Text, TouchableOpacity, FlatList, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import StatCard from '../components/StatCard';
import { Colors, Shadow, Radius } from '../types/theme';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import type { Ticket, Service, User, ActivityLog, ApiResponse } from '../types';

const STATUS_LABEL: Record<string, string> = {
  waiting:'En attente', called:'Appelé', serving:'En service',
  done:'Terminé', absent:'Absent', cancelled:'Annulé'
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  waiting:   { bg: '#fef3c7', text: '#b45309' },
  called:    { bg: '#d1fae5', text: '#047857' },
  serving:   { bg: '#dbeafe', text: '#1d4ed8' },
  done:      { bg: '#f3e8ff', text: '#7c3aed' },
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
  const { logout } = useAuth();
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
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: Colors.danger }]} onPress={logout}>
                <Text style={s.actionBtnText}>Sortir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* KPIs */}
        <View style={s.statsGrid}>
          <StatCard label="Tickets total" value={g?.total || 0} icon="🎫" color={Colors.primary} />
          <StatCard label="En attente" value={g?.waiting || 0} icon="⏳" color={Colors.warning} />
          <StatCard label="Traités" value={g?.done || 0} icon="✅" color={Colors.success} />
          <StatCard label="Attente Moy." value={`${g?.avg_wait_min || 0}m`} icon="⏱️" color={Colors.primaryMid} />
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
                <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[tk.status]?.bg || Colors.surface2 }]}>
                  <Text style={[s.statusText, { color: STATUS_COLORS[tk.status]?.text || Colors.muted }]}>
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
                  <View style={[s.svcBadge, { backgroundColor: Colors.primaryLt }]}>
                    <Text style={[s.svcBadgeText, { color: Colors.primary }]}>{sv.prefix}</Text>
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
                  <View style={[s.avatar, { backgroundColor: u.active ? Colors.primaryLt : Colors.surface2 }]}>
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
  safe: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  
  header: { padding: 20, paddingBottom: 0 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 26, fontWeight: '900', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.subtle, marginTop: 4, fontWeight: '500' },
  headerActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { backgroundColor: Colors.primary, paddingVertical: 8, paddingHorizontal: 14, borderRadius: Radius.sm },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  refreshBtn: { backgroundColor: Colors.surface2, paddingVertical: 8, paddingHorizontal: 12, borderRadius: Radius.sm },
  refreshBtnText: { fontSize: 16 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', padding: 20 },

  tabScroll: { paddingHorizontal: 20, marginBottom: 8 },
  tabBar: { flexDirection: 'row', backgroundColor: Colors.surface2, borderRadius: Radius.sm, padding: 4 },
  tabItem: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  tabItemActive: { backgroundColor: '#fff', ...Shadow.sm },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.subtle },
  tabTextActive: { color: Colors.primary, fontWeight: '800' },

  section: { padding: 20, paddingTop: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: Colors.subtle, letterSpacing: 1.5, marginBottom: 16 },

  serviceRow: { backgroundColor: '#fff', padding: 16, borderRadius: Radius.md, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  svcLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  svcBadge: { width: 40, height: 40, borderRadius: Radius.sm, backgroundColor: Colors.surface2, justifyContent: 'center', alignItems: 'center' },
  svcBadgeText: { fontSize: 16, fontWeight: '900', color: Colors.muted },
  svcName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  svcSub: { fontSize: 11, color: Colors.subtle, marginTop: 2 },
  svcRight: { alignItems: 'flex-end' },
  svcWaiting: { fontSize: 20, fontWeight: '900', color: Colors.warning },
  svcWaitLabel: { fontSize: 9, fontWeight: '700', color: Colors.subtle, textTransform: 'uppercase' },

  ticketRow: { backgroundColor: '#fff', padding: 16, borderRadius: Radius.md, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  ticketLeft: { flex: 1 },
  ticketNum: { fontSize: 18, fontWeight: '900', color: Colors.primary },
  ticketClient: { fontSize: 14, fontWeight: '700', color: Colors.text, marginTop: 2 },
  ticketSvc: { fontSize: 11, color: Colors.subtle, marginTop: 2 },
  statusBadge: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '800' },

  agentRow: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  agentLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 14 },
  avatar: { width: 48, height: 48, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  agentName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  agentEmail: { fontSize: 11, color: Colors.muted, marginTop: 2 },
  roleBadge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6 },
  ticketCount: { fontSize: 11, color: Colors.subtle, fontWeight: '600' },
  toggleBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 },

  logRow: { backgroundColor: '#fff', padding: 14, borderRadius: Radius.sm, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  logActionBadge: { backgroundColor: Colors.primaryLt, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6 },
  logActionText: { fontSize: 9, fontWeight: '800', color: Colors.primary },
  logUser: { fontSize: 12, fontWeight: '700', color: Colors.text },
  logDesc: { fontSize: 12, color: Colors.muted, lineHeight: 18 },
  logDate: { fontSize: 10, color: Colors.subtle, fontWeight: '600' },

  emptyBox: { backgroundColor: Colors.surface2, padding: 32, borderRadius: Radius.md, alignItems: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.border },
  emptyText: { color: Colors.subtle, fontSize: 14, fontWeight: '600' },
});

export default AdminDashboardScreen;
