// screens/QueueScreen.tsx — Aurora Design v5
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  ActivityIndicator, TouchableOpacity, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { useQueue } from '../hooks/useQueue';
import { Colors, Shadow, Radius } from '../types/theme';
import type { Service, ApiResponse, Ticket } from '../types';

interface ServiceCardProps {
  service: Service;
}

function ServiceCard({ service }: ServiceCardProps) {
  const { waiting, called, loading } = useQueue(service.id);
  const current = called[0];

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.svcInfo}>
          <Text style={s.svcBadge}>{service.prefix}</Text>
          <Text style={s.cardTitle}>{service.name}</Text>
        </View>
        <View style={s.waitCounter}>
          <Text style={s.waitCountNum}>{waiting.length}</Text>
          <Text style={s.waitCountLabel}>en attente</Text>
        </View>
      </View>

      {current ? (
        <View style={s.nowBox}>
          <View style={s.nowHeader}>
            <Text style={s.nowLabel}>TICKET APPELÉ</Text>
            <View style={s.nowCounterBadge}>
              <Text style={s.nowCounterText}>GUICHET {current.counter}</Text>
            </View>
          </View>
          <Text style={s.nowNumber}>{current.number}</Text>
          <Text style={s.nowName}>{current.user_name}</Text>
        </View>
      ) : (
        <View style={s.emptyBox}>
          <Text style={s.emptyText}>Aucun ticket en service actuellement</Text>
        </View>
      )}

      {waiting.length > 0 && (
        <View style={s.nextSection}>
          <Text style={s.nextTitle}>PROCHAINS NUMÉROS</Text>
          <View style={s.chips}>
            {waiting.slice(0, 5).map((t: Ticket) => (
              <View key={t.id} style={s.chip}>
                <Text style={s.chipText}>{t.number}</Text>
              </View>
            ))}
            {waiting.length > 5 && (
              <View style={s.chipMore}>
                <Text style={s.chipMoreText}>+{waiting.length - 5}</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

export default function QueueScreen() {
  const [services,   setServices]   = useState<Service[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadServices = useCallback(async () => {
    try {
      const { data } = await api.get<ApiResponse<Service[]>>('/services');
      setServices(data.data);
    } catch {
    }
  }, []);

  useEffect(() => {
    loadServices().finally(() => setLoading(false));
    const interval = setInterval(loadServices, 20000);
    return () => clearInterval(interval);
  }, [loadServices]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadServices();
    setRefreshing(false);
  };

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />
      <FlatList
        data={services}
        keyExtractor={(item: Service) => String(item.id)}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListHeaderComponent={
          <View style={s.header}>
            <Text style={s.headerBadge}>LIVE MONITOR</Text>
            <Text style={s.headerTitle}>État des Files</Text>
            <Text style={s.headerSub}>Mise à jour automatique toutes les 20s</Text>
          </View>
        }
        renderItem={({ item }: { item: Service }) => <ServiceCard service={item} />}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>🔍</Text>
            <Text style={s.emptyText}>Aucun service actif pour le moment.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 24, paddingBottom: 40 },
  header: { marginBottom: 24 },
  headerBadge: { fontSize: 10, fontWeight: '900', color: Colors.primary, letterSpacing: 2, marginBottom: 8 },
  headerTitle: { fontSize: 32, fontWeight: '900', color: Colors.navy },
  headerSub: { fontSize: 13, color: Colors.subtle, marginTop: 4, fontWeight: '500' },
  
  card: { 
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: 24, marginBottom: 16,
    ...Shadow.sm, borderWidth: 1, borderColor: Colors.border 
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  svcInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  svcBadge: { 
    backgroundColor: 'rgba(16, 185, 129, 0.15)', color: Colors.primary, fontSize: 14, 
    fontWeight: '900', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: Colors.navy },
  waitCounter: { alignItems: 'flex-end' },
  waitCountNum: { fontSize: 24, fontWeight: '900', color: Colors.navy },
  waitCountLabel: { fontSize: 10, color: Colors.subtle, fontWeight: '800', textTransform: 'uppercase' },
  
  nowBox: { backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: 20, alignItems: 'center' },
  nowHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  nowLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  nowCounterBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  nowCounterText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  nowNumber: { fontSize: 60, fontWeight: '900', color: '#fff', letterSpacing: -2 },
  nowName: { color: 'rgba(255,255,255,0.9)', marginTop: 4, fontSize: 15, fontWeight: '600' },
  
  emptyBox: { 
    backgroundColor: Colors.surface2, borderRadius: Radius.lg, padding: 24, 
    alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: Colors.border 
  },
  emptyText: { color: Colors.subtle, fontSize: 14, fontWeight: '600' },
  
  nextSection: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: Colors.border },
  nextTitle: { fontSize: 10, fontWeight: '900', color: Colors.subtle, letterSpacing: 1, marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: Colors.surface2, paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.sm },
  chipText: { fontWeight: '800', fontSize: 14, color: Colors.navy },
  chipMore: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 10, paddingVertical: 8, borderRadius: Radius.sm },
  chipMoreText: { fontSize: 12, fontWeight: '700', color: Colors.subtle },
  
  emptyState: { alignItems: 'center', padding: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
});
