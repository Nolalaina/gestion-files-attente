// screens/HomeScreen.tsx — Aurora Design v5
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList, Ticket, ApiResponse } from '../types';
import { useAuth } from '../context/AuthContext';
import { Colors, Shadow, Radius } from '../types/theme';
import api from '../services/api';

type Nav = BottomTabNavigationProp<MainTabParamList>;
const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [myTicket, setMyTicket] = useState<Ticket | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data: sData } = await api.get('/stats');
      setStats(sData.data);
      
      if (user?.role === 'usager') {
        const { data: tData } = await api.get<ApiResponse<Ticket[]>>('/tickets');
        const active = tData.data.find((t: Ticket) => ['waiting', 'called', 'serving'].includes(t.status));
        setMyTicket(active || null);
      }
    } catch (e) {}
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <ScrollView 
        contentContainerStyle={s.scroll} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        
        {/* Header Section */}
        <View style={s.header}>
          <View style={s.headerDecor1} />
          <View style={s.headerDecor2} />
          <View style={s.headerTop}>
            <View>
              <Text style={s.welcomeText}>Bonjour ✨</Text>
              <Text style={s.userName}>{user?.name || 'Visiteur'}</Text>
            </View>
            <TouchableOpacity style={s.logoutBtn} onPress={logout}>
              <Text style={s.logoutText}>Sortir</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.content}>
          
          {/* Active Ticket Status */}
          {user?.role === 'usager' && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>MA POSITION ACTUELLE</Text>
              {myTicket ? (
                <View style={s.activeTicketCard}>
                  <View style={s.ticketHeader}>
                    <Text style={s.ticketService}>{myTicket.service_name}</Text>
                    <View style={[s.statusBadge, { backgroundColor: myTicket.status === 'called' ? Colors.warning : Colors.success }]}>
                      <Text style={s.statusText}>{myTicket.status.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={s.ticketNumber}>{myTicket.number}</Text>
                  
                  {myTicket.status === 'waiting' && myTicket.estimated_wait !== undefined && (
                    <View style={s.waitInfo}>
                      <Text style={s.waitLabel}>Attente estimée :</Text>
                      <Text style={s.waitValue}>~{myTicket.estimated_wait} min</Text>
                    </View>
                  )}
                  
                  {myTicket.status === 'called' && (
                    <View style={s.calledAlert}>
                      <Text style={s.calledText}>C'EST VOTRE TOUR !</Text>
                      <Text style={s.calledSubtext}>Veuillez vous diriger vers le guichet.</Text>
                    </View>
                  )}

                  <TouchableOpacity style={s.ticketDetailsBtn} onPress={() => navigation.navigate('Ticket')}>
                    <Text style={s.ticketDetailsText}>Voir le ticket complet</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={s.emptyCard} onPress={() => navigation.navigate('Ticket')}>
                  <View style={s.emptyIconBg}>
                    <Text style={s.emptyIcon}>➕</Text>
                  </View>
                  <Text style={s.emptyTitle}>Prendre un ticket</Text>
                  <Text style={s.emptySub}>Évitez la file d'attente physique</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Quick Stats Summary */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>ÉTAT DE L'AGENCE</Text>
            <View style={s.statsRow}>
              <View style={s.miniStat}>
                <Text style={s.miniValue}>{stats?.global?.waiting || 0}</Text>
                <Text style={s.miniLabel}>En attente</Text>
              </View>
              <View style={s.miniStat}>
                <Text style={s.miniValue}>{stats?.global?.avg_wait_min || 0}m</Text>
                <Text style={s.miniLabel}>Attente moy.</Text>
              </View>
            </View>
          </View>

          {/* Navigation Grid */}
          <Text style={s.sectionTitle}>RACCOURCIS</Text>
          <View style={s.grid}>
            {[
              { icon: '📱', title: 'File Live', tab: 'File', color: Colors.primary },
              { icon: '🎟️', title: 'Mes Tickets', tab: 'Ticket', color: Colors.success },
              { icon: '📍', title: 'Agences', tab: 'Accueil', color: Colors.warning },
              { icon: '⚙️', title: 'Compte', tab: 'Accueil', color: Colors.muted },
            ].map((item, i) => (
              <TouchableOpacity key={i} style={s.gridItem} onPress={() => navigation.navigate(item.tab as any)}>
                <View style={[s.gridIcon, { backgroundColor: item.color + '12' }]}>
                  <Text style={{ fontSize: 24 }}>{item.icon}</Text>
                </View>
                <Text style={s.gridTitle}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primary },
  scroll: { flexGrow: 1, backgroundColor: Colors.bg },
  header: { 
    backgroundColor: Colors.primary, padding: 24, paddingBottom: 60,
    borderBottomLeftRadius: 44, borderBottomRightRadius: 44,
    position: 'relative', overflow: 'hidden',
  },
  headerDecor1: {
    position: 'absolute', right: -30, top: -30, width: 160, height: 160,
    borderRadius: 80, backgroundColor: 'rgba(6,182,212,.12)',
  },
  headerDecor2: {
    position: 'absolute', left: -20, bottom: -20, width: 100, height: 100,
    borderRadius: 50, backgroundColor: 'rgba(167,139,250,.1)',
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 },
  welcomeText: { color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: '600' },
  userName: { color: '#fff', fontSize: 28, fontWeight: '900' },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: Radius.sm },
  logoutText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  
  content: { padding: 20, marginTop: -40 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: Colors.subtle, letterSpacing: 1.5, marginBottom: 12, marginLeft: 4 },
  
  activeTicketCard: { 
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: 24, ...Shadow.md,
    borderTopWidth: 6, borderTopColor: Colors.primary
  },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  ticketService: { fontSize: 14, fontWeight: '800', color: Colors.muted },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  ticketNumber: { fontSize: 60, fontWeight: '900', color: Colors.text, textAlign: 'center', marginVertical: 10 },
  
  waitInfo: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 20 },
  waitLabel: { color: Colors.subtle, fontSize: 14, fontWeight: '600' },
  waitValue: { color: Colors.primary, fontSize: 16, fontWeight: '800' },
  
  calledAlert: { backgroundColor: Colors.warning + '20', padding: 16, borderRadius: Radius.md, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: Colors.warning + '40' },
  calledText: { color: Colors.warning, fontWeight: '900', fontSize: 18 },
  calledSubtext: { color: Colors.warning, fontSize: 12, fontWeight: '600', marginTop: 2 },

  ticketDetailsBtn: { backgroundColor: Colors.surface2, padding: 16, borderRadius: Radius.md, alignItems: 'center' },
  ticketDetailsText: { color: Colors.muted, fontWeight: '800' },

  emptyCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: 32, alignItems: 'center', ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  emptyIconBg: { width: 64, height: 64, borderRadius: Radius.lg, backgroundColor: Colors.surface2, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyIcon: { fontSize: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  emptySub: { fontSize: 13, color: Colors.subtle, marginTop: 4, fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: 12 },
  miniStat: { flex: 1, backgroundColor: Colors.surface, padding: 16, borderRadius: Radius.lg, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  miniValue: { fontSize: 20, fontWeight: '900', color: Colors.text },
  miniLabel: { fontSize: 11, color: Colors.subtle, marginTop: 2, fontWeight: '700' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: (width - 40 - 12) / 2, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 20, alignItems: 'center', ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  gridIcon: { width: 48, height: 48, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  gridTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
});
