import React, { useState, useEffect } from 'react';
import {
  View, ScrollView, StyleSheet, ActivityIndicator,
  RefreshControl, Text, TouchableOpacity,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import api from '../services/api';
import StatCard from '../components/StatCard';
import { Colors, Shadow } from '../types/theme';

const AdminDashboardScreen: React.FC = () => {
  const { colors } = useTheme();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await api.get('/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const g = stats?.global;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Statistiques Live</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard label="Tickets total" value={g?.total || 0} icon="🎫" color="#4f46e5" />
        <StatCard label="En attente" value={g?.waiting || 0} icon="⏳" color="#f59e0b" />
        <StatCard label="Traités" value={g?.done || 0} icon="✅" color="#10b981" />
        <StatCard label="Attente Moy." value={`${g?.avg_wait_min || 0}m`} icon="⏱️" color="#8b5cf6" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>État par service</Text>
        {stats?.by_service.map((svc: any) => (
          <View key={svc.id} style={s.serviceRow}>
            <Text style={s.serviceName}>{svc.name}</Text>
            <Text style={s.serviceValue}>{svc.waiting} en attente</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  serviceRow: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', ...Shadow.sm },
  serviceName: { fontWeight: '700', color: '#1e293b' },
  serviceValue: { color: '#64748b' },
});

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '900' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', marginBottom: 24 },
  section: { marginTop: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 12 },
});

export default AdminDashboardScreen;
