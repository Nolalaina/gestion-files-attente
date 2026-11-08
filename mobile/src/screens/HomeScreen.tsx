// screens/HomeScreen.tsx — Aurora Midnight
import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Dimensions,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList, Ticket, ApiResponse } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { Colors, Radius, Spacing, Type } from '../types/theme';
import Badge from '../components/Badge';
import api from '../services/api';

type Nav = BottomTabNavigationProp<MainTabParamList>;
const { width } = Dimensions.get('window');

const SHORTCUTS = [
  { label: 'Vue en direct', tab: 'File', note: 'File et prochains numéros' },
  { label: 'Mes tickets', tab: 'Ticket', note: 'Réserver et suivre' },
  { label: 'Mon profil', tab: 'MonCompte', note: 'Compte et historique' },
];

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user, logout } = useAuth();
  const { socket } = useNotification();
  const { t } = useLanguage();
  const [stats, setStats] = useState<any>(null);
  const [myTicket, setMyTicket] = useState<Ticket | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data: statsData } = await api.get('/stats');
      setStats(statsData.data);

      if (user?.role === 'usager') {
        const { data: ticketData } = await api.get<ApiResponse<Ticket[]>>('/tickets/my');
        const active = ticketData.data.find((ticket: Ticket) =>
          ['waiting', 'called', 'serving'].includes(ticket.status)
        );
        setMyTicket(active || null);
      }
    } catch {
      // Keep the last known state when the network is unavailable.
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  useEffect(() => {
    fetchData();
    if (socket) {
      socket.on('stats:refresh', fetchData);
      socket.on('ticket:done', fetchData);
    }
    return () => {
      if (socket) {
        socket.off('stats:refresh', fetchData);
        socket.off('ticket:done', fetchData);
      }
    };
  }, [fetchData, socket]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <View style={s.header}>
          <View style={s.headerTop}>
            <View style={s.headerText}>
              <Text style={s.welcomeText}>{t('welcome') || 'Bienvenue'}</Text>
              <Text style={s.userName}>{user?.name?.split(' ')[0] || 'Visiteur'}</Text>
            </View>
            <TouchableOpacity
              style={s.logoutBtn}
              onPress={logout}
              accessibilityRole="button"
              accessibilityLabel={t('logout') || 'Se déconnecter'}
            >
              <Text style={s.logoutText}>{t('logout') || 'Sortir'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.content}>
          {user?.role === 'usager' ? (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Ma position</Text>
              {myTicket ? (
                <View style={s.ticketCard}>
                  <View style={s.ticketHeader}>
                    <Text style={s.ticketService}>{myTicket.service_name}</Text>
                    <Badge status={myTicket.status} />
                  </View>
                  <Text style={s.ticketNumber}>{myTicket.number}</Text>

                  {myTicket.status === 'waiting' && myTicket.estimated_wait !== undefined ? (
                    <View style={s.waitRow}>
                      <Text style={s.waitLabel}>Attente estimée</Text>
                      <Text style={s.waitValue}>environ {myTicket.estimated_wait} min</Text>
                    </View>
                  ) : null}

                  {myTicket.status === 'called' ? (
                    <View style={s.calledBox}>
                      <Text style={s.calledTitle}>Votre tour est appelé</Text>
                      <Text style={s.calledText}>Présentez-vous au guichet.</Text>
                    </View>
                  ) : null}

                  <TouchableOpacity style={s.secondaryBtn} onPress={() => navigation.navigate('Ticket')}>
                    <Text style={s.secondaryBtnText}>Voir le ticket complet</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={s.emptyCard}
                  onPress={() => navigation.navigate('Ticket')}
                  accessibilityRole="button"
                >
                  <View style={s.emptyMark} />
                  <Text style={s.emptyTitle}>{t('home_btn_ticket') || 'Prendre un ticket'}</Text>
                  <Text style={s.emptySub}>
                    {t('feat_ticket_desc') || 'Réservez votre place sans attendre sur place.'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          <View style={s.section}>
            <Text style={s.sectionTitle}>État de l’agence</Text>
            <View style={s.statsRow}>
              <View style={s.miniStat}>
                <Text style={s.miniValue}>{stats?.global?.waiting || 0}</Text>
                <Text style={s.miniLabel}>En attente</Text>
              </View>
              <View style={s.miniStat}>
                <Text style={s.miniValue}>{stats?.global?.avg_wait_min || 0} min</Text>
                <Text style={s.miniLabel}>Attente moyenne</Text>
              </View>
            </View>
          </View>

          <Text style={s.sectionTitle}>Raccourcis</Text>
          <View style={s.grid}>
            {SHORTCUTS.map((item, index) => (
              <TouchableOpacity
                key={item.tab}
                style={s.gridItem}
                onPress={() => navigation.navigate(item.tab as any)}
                accessibilityRole="button"
              >
                <Text style={s.gridIndex}>{String(index + 1).padStart(2, '0')}</Text>
                <Text style={s.gridTitle}>{item.label}</Text>
                <Text style={s.gridNote}>{item.note}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flexGrow: 1, backgroundColor: Colors.bg },
  header: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: Platform.OS === 'web' ? Spacing.lg : 0,
  },
  headerText: { flex: 1 },
  welcomeText: { color: Colors.muted, fontSize: Type.sm, fontWeight: '500' },
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

  content: { padding: Spacing.lg, marginTop: -Spacing.xl },
  section: { marginBottom: Spacing.xl },
  sectionTitle: {
    fontSize: Type.sm,
    fontWeight: '600',
    color: Colors.muted,
    marginBottom: Spacing.sm,
  },

  ticketCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopWidth: 3,
    borderTopColor: Colors.primary,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  ticketService: { flex: 1, fontSize: Type.sm, fontWeight: '600', color: Colors.muted },
  ticketNumber: {
    fontSize: 64,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
    marginVertical: Spacing.sm,
    letterSpacing: -2,
  },
  waitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  waitLabel: { color: Colors.muted, fontSize: Type.sm },
  waitValue: { color: Colors.primary, fontSize: Type.md, fontWeight: '600' },

  calledBox: {
    backgroundColor: Colors.infoSoft,
    padding: Spacing.md,
    borderRadius: Radius.sm,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.info,
  },
  calledTitle: { color: Colors.info, fontWeight: '600', fontSize: Type.md },
  calledText: { color: Colors.info, fontSize: Type.sm, marginTop: 2 },

  secondaryBtn: {
    backgroundColor: Colors.surface2,
    padding: Spacing.md,
    borderRadius: Radius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryBtnText: { color: Colors.text, fontWeight: '600', fontSize: Type.sm },

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
  miniLabel: { fontSize: Type.xs, color: Colors.muted, marginTop: 2 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  gridItem: {
    width: (width - Spacing.lg * 2 - Spacing.md) / 2,
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
  gridNote: { fontSize: Type.xs, color: Colors.muted, marginTop: 2 },
});
