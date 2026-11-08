// screens/AdminDashboardScreen.tsx — Aurora Midnight
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import { Colors, Radius, Spacing, Type } from '../types/theme';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import type { Ticket, Service, ActivityLog } from '../types';

type TabId = 'overview' | 'queue' | 'services' | 'users' | 'logs';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Aperçu' },
  { id: 'queue', label: 'File' },
  { id: 'services', label: 'Services' },
  { id: 'users', label: 'Agents' },
  { id: 'logs', label: 'Journal' },
];

const AdminDashboardScreen: React.FC = () => {
  const { addToast, socket } = useNotification();
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
      const [statsResponse, usersResponse, servicesResponse, ticketsResponse, logsResponse] =
        await Promise.all([
          api.get('/stats'),
          api.get('/users'),
          api.get('/services'),
          api.get('/tickets?limit=100'),
          api.get('/stats/logs?limit=50'),
        ]);
      setStats(statsResponse.data.data);
      setUsers(usersResponse.data.data || []);
      setServices(servicesResponse.data.data || []);
      setAllTickets(ticketsResponse.data.data || []);
      setLogs(logsResponse.data.data || []);
    } catch {
      addToast('Chargement des données impossible.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [addToast]);

  useEffect(() => {
    reload();

    if (socket) {
      socket.emit('join_admin');
      socket.on('stats:refresh', reload);
      socket.on('ticket:created', reload);
      socket.on('ticket:called', reload);
      socket.on('ticket:absent', reload);
      socket.on('ticket:done', reload);
    }

    const interval = setInterval(reload, 60000);
    return () => {
      clearInterval(interval);
      if (socket) {
        socket.emit('leave_admin');
        socket.off('stats:refresh', reload);
        socket.off('ticket:created', reload);
        socket.off('ticket:called', reload);
        socket.off('ticket:absent', reload);
        socket.off('ticket:done', reload);
      }
    };
  }, [reload, socket]);

  const toggleUser = async (user: any) => {
    try {
      await api.patch(`/users/${user.id}/toggle`);
      addToast(`Agent ${user.active ? 'désactivé' : 'activé'}.`, 'success');
      reload();
    } catch {
      addToast('Modification impossible.', 'error');
    }
  };

  const simulateClient = async () => {
    if (services.length === 0) return;
    try {
      await api.post('/tickets', {
        service_id: services[0].id,
        user_name: 'Client simulé',
      });
      addToast('Client simulé ajouté.', 'success');
      reload();
    } catch {
      addToast('Simulation impossible.', 'error');
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const globalStats = stats?.global;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        style={s.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              reload();
            }}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={s.header}>
          <View style={s.headerRow}>
            <View style={s.headerText}>
              <Text style={s.title}>Tableau de bord</Text>
              <Text style={s.subtitle}>
                {new Date().toLocaleDateString('fr-FR', { dateStyle: 'full' })}
              </Text>
            </View>
          </View>
          <View style={s.headerActions}>
            <TouchableOpacity
              style={s.actionBtn}
              onPress={simulateClient}
              accessibilityRole="button"
            >
              <Text style={s.actionBtnText}>Simuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.secondaryAction}
              onPress={reload}
              accessibilityRole="button"
              accessibilityLabel="Actualiser"
            >
              <Text style={s.secondaryActionText}>Actualiser</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.logoutBtn}
              onPress={logout}
              accessibilityRole="button"
            >
              <Text style={s.logoutText}>Sortir</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.statsGrid}>
          <StatCard label="Tickets" value={globalStats?.total || 0} color={Colors.text} />
          <StatCard label="En attente" value={globalStats?.waiting || 0} color={Colors.warning} />
          <StatCard label="Traités" value={globalStats?.done || 0} color={Colors.success} />
          <StatCard
            label="Attente moyenne"
            value={`${globalStats?.avg_wait_min || 0} min`}
            color={Colors.primary}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll}>
          <View style={s.tabBar}>
            {TABS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[s.tabItem, tab === item.id && s.tabItemActive]}
                onPress={() => setTab(item.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: tab === item.id }}
              >
                <Text style={[s.tabText, tab === item.id && s.tabTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {tab === 'overview' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>État par service</Text>
            {stats?.by_service?.map((service: any) => (
              <View key={service.id} style={s.serviceRow}>
                <View style={s.serviceLeft}>
                  <View style={s.serviceBadge}>
                    <Text style={s.serviceBadgeText}>{service.name?.charAt(0)}</Text>
                  </View>
                  <View style={s.serviceText}>
                    <Text style={s.serviceName}>{service.name}</Text>
                    <Text style={s.serviceSub}>
                      {service.total || 0} tickets, {service.avg_wait_min || 0} min en moyenne
                    </Text>
                  </View>
                </View>
                <View style={s.serviceRight}>
                  <Text style={s.serviceWaiting}>{service.waiting || 0}</Text>
                  <Text style={s.serviceWaitLabel}>en attente</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {tab === 'queue' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>File globale ({allTickets.length} tickets)</Text>
            {allTickets.map((ticket) => (
              <View key={ticket.id} style={s.ticketRow}>
                <View style={s.ticketLeft}>
                  <Text style={s.ticketNumber}>{ticket.number}</Text>
                  <Text style={s.ticketClient}>{ticket.user_name}</Text>
                  <Text style={s.ticketService}>{ticket.service_name}</Text>
                </View>
                <Badge status={ticket.status} />
              </View>
            ))}
            {allTickets.length === 0 && (
              <View style={s.emptyBox}>
                <Text style={s.emptyText}>Aucun ticket aujourd’hui.</Text>
              </View>
            )}
          </View>
        )}

        {tab === 'services' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Services actifs</Text>
            {services.map((service) => (
              <View key={service.id} style={s.serviceRow}>
                <View style={s.serviceLeft}>
                  <View style={[s.serviceBadge, s.serviceBadgePrimary]}>
                    <Text style={[s.serviceBadgeText, s.serviceBadgeTextPrimary]}>
                      {service.prefix}
                    </Text>
                  </View>
                  <View style={s.serviceText}>
                    <Text style={s.serviceName}>{service.name}</Text>
                    <Text style={s.serviceSub}>
                      {service.max_counters} guichets, environ {service.avg_duration} min
                    </Text>
                  </View>
                </View>
                <View style={[s.stateBadge, service.active ? s.stateBadgeOn : s.stateBadgeOff]}>
                  <Text
                    style={[
                      s.stateBadgeText,
                      service.active ? s.stateBadgeTextOn : s.stateBadgeTextOff,
                    ]}
                  >
                    {service.active ? 'Ouvert' : 'Fermé'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {tab === 'users' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Gestion des agents</Text>
            {users.map((user) => (
              <View key={user.id} style={s.agentRow}>
                <View style={s.agentLeft}>
                  <View
                    style={[s.avatar, user.active ? s.avatarActive : s.avatarInactive]}
                  >
                    <Text style={s.avatarText}>{user.name?.[0] || '?'}</Text>
                  </View>
                  <View style={s.agentInfo}>
                    <Text style={s.agentName}>{user.name}</Text>
                    <Text style={s.agentEmail}>{user.email}</Text>
                    <View style={s.agentMeta}>
                      <View
                        style={[
                          s.roleBadge,
                          user.role === 'admin' ? s.roleBadgeAdmin : s.roleBadgeAgent,
                        ]}
                      >
                        <Text
                          style={[
                            s.roleText,
                            user.role === 'admin' ? s.roleTextAdmin : s.roleTextAgent,
                          ]}
                        >
                          {user.role === 'admin' ? 'Admin' : 'Agent'}
                        </Text>
                      </View>
                      <Text style={s.ticketCount}>{user.ticket_count || 0} tickets</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    s.toggleBtn,
                    user.active ? s.stateBadgeOn : s.stateBadgeOff,
                  ]}
                  onPress={() => toggleUser(user)}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      s.stateBadgeText,
                      user.active ? s.stateBadgeTextOn : s.stateBadgeTextOff,
                    ]}
                  >
                    {user.active ? 'Actif' : 'Inactif'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {tab === 'logs' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Journal d’activité</Text>
            {logs.map((log) => (
              <View key={log.id} style={s.logRow}>
                <View style={s.logMain}>
                  <View style={s.logTop}>
                    <View style={s.logActionBadge}>
                      <Text style={s.logActionText}>{log.action}</Text>
                    </View>
                    <Text style={s.logUser}>{log.user_name || 'Système'}</Text>
                  </View>
                  <Text style={s.logDescription} numberOfLines={2}>
                    {log.description}
                  </Text>
                </View>
                <Text style={s.logDate}>
                  {new Date(log.created_at).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            ))}
            {logs.length === 0 && (
              <View style={s.emptyBox}>
                <Text style={s.emptyText}>Aucun événement récent.</Text>
              </View>
            )}
          </View>
        )}

        <View style={s.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg,
  },
  container: { flex: 1 },

  header: { padding: Spacing.lg, paddingBottom: 0 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerText: { flex: 1 },
  title: { fontSize: Type.xxl, fontWeight: '600', color: Colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: Type.xs, color: Colors.muted, marginTop: Spacing.xs },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    flexWrap: 'wrap',
  },
  actionBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.xs,
  },
  actionBtnText: { color: Colors.onPrimary, fontSize: Type.xs, fontWeight: '600' },
  secondaryAction: {
    backgroundColor: Colors.surface2,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryActionText: { color: Colors.text, fontSize: Type.xs, fontWeight: '600' },
  logoutBtn: {
    backgroundColor: Colors.surface2,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logoutText: { color: Colors.muted, fontSize: Type.xs, fontWeight: '600' },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },

  tabScroll: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm, flexGrow: 0 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface2,
    borderRadius: Radius.sm,
    padding: Spacing.xs,
    gap: Spacing.xs,
  },
  tabItem: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.xs,
  },
  tabItemActive: { backgroundColor: Colors.surface },
  tabText: { fontSize: Type.sm, fontWeight: '500', color: Colors.muted },
  tabTextActive: { color: Colors.text, fontWeight: '600' },

  section: { padding: Spacing.lg, paddingTop: Spacing.md },
  sectionTitle: {
    fontSize: Type.sm,
    fontWeight: '600',
    color: Colors.muted,
    marginBottom: Spacing.md,
  },

  serviceRow: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Radius.sm,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  serviceLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  serviceText: { flex: 1 },
  serviceBadge: {
    width: 40,
    height: 40,
    borderRadius: Radius.xs,
    backgroundColor: Colors.surface2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceBadgePrimary: { backgroundColor: Colors.primaryLt },
  serviceBadgeText: { fontSize: Type.md, fontWeight: '600', color: Colors.muted },
  serviceBadgeTextPrimary: { color: Colors.primary },
  serviceName: { fontSize: Type.md, fontWeight: '600', color: Colors.text },
  serviceSub: { fontSize: Type.xs, color: Colors.muted, marginTop: 2 },
  serviceRight: { alignItems: 'flex-end' },
  serviceWaiting: { fontSize: Type.lg, fontWeight: '600', color: Colors.warning },
  serviceWaitLabel: { fontSize: Type.xs, color: Colors.muted },

  ticketRow: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Radius.sm,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ticketLeft: { flex: 1 },
  ticketNumber: { fontSize: Type.md, fontWeight: '600', color: Colors.primary },
  ticketClient: { fontSize: Type.sm, fontWeight: '500', color: Colors.text, marginTop: 2 },
  ticketService: { fontSize: Type.xs, color: Colors.muted, marginTop: 2 },

  stateBadge: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm, borderRadius: Radius.xs },
  stateBadgeOn: { backgroundColor: Colors.successSoft },
  stateBadgeOff: { backgroundColor: Colors.dangerSoft },
  stateBadgeText: { fontSize: Type.xs, fontWeight: '600' },
  stateBadgeTextOn: { color: Colors.success },
  stateBadgeTextOff: { color: Colors.danger },

  agentRow: {
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
  agentLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: Spacing.md },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarActive: { backgroundColor: Colors.primaryLt },
  avatarInactive: { backgroundColor: Colors.surface2 },
  avatarText: { fontSize: Type.md, fontWeight: '600', color: Colors.primary },
  agentInfo: { flex: 1 },
  agentName: { fontSize: Type.md, fontWeight: '600', color: Colors.text },
  agentEmail: { fontSize: Type.xs, color: Colors.muted, marginTop: 2 },
  agentMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs },
  roleBadge: { paddingVertical: 2, paddingHorizontal: Spacing.sm, borderRadius: Radius.xs },
  roleBadgeAdmin: { backgroundColor: Colors.infoSoft },
  roleBadgeAgent: { backgroundColor: Colors.warningSoft },
  roleText: { fontSize: 11, fontWeight: '600' },
  roleTextAdmin: { color: Colors.info },
  roleTextAgent: { color: Colors.warning },
  ticketCount: { fontSize: Type.xs, color: Colors.muted },
  toggleBtn: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md, borderRadius: Radius.xs },

  logRow: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.xs,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logMain: { flex: 1 },
  logTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
    flexWrap: 'wrap',
  },
  logActionBadge: {
    backgroundColor: Colors.primaryLt,
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.xs,
  },
  logActionText: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  logUser: { fontSize: Type.xs, fontWeight: '500', color: Colors.text },
  logDescription: { fontSize: Type.xs, color: Colors.muted, lineHeight: 18 },
  logDate: { fontSize: 11, color: Colors.subtle },

  emptyBox: {
    backgroundColor: Colors.surface2,
    padding: Spacing.xl,
    borderRadius: Radius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.border,
  },
  emptyText: { color: Colors.muted, fontSize: Type.sm },

  bottomSpacer: { height: Spacing.xxl },
});

export default AdminDashboardScreen;
