// screens/QueueScreen.tsx — Aurora Midnight
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { useQueue } from '../hooks/useQueue';
import { Colors, Radius, Spacing, Type } from '../types/theme';
import type { Service, ApiResponse, Ticket } from '../types';

interface ServiceCardProps {
  service: Service;
}

function ServiceCard({ service }: ServiceCardProps) {
  const { waiting, called } = useQueue(service.id);
  const current = called[0];

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.serviceInfo}>
          <View style={s.prefixBadge}>
            <Text style={s.prefixText}>{service.prefix}</Text>
          </View>
          <Text style={s.cardTitle}>{service.name}</Text>
        </View>
        <View style={s.waitCounter}>
          <Text style={s.waitCountNumber}>{waiting.length}</Text>
          <Text style={s.waitCountLabel}>en attente</Text>
        </View>
      </View>

      {current ? (
        <View style={s.nowBox}>
          <View style={s.nowHeader}>
            <Text style={s.nowLabel}>Ticket appelé</Text>
            <View style={s.counterBadge}>
              <Text style={s.counterBadgeText}>Guichet {current.counter}</Text>
            </View>
          </View>
          <Text style={s.nowNumber}>{current.number}</Text>
          <Text style={s.nowName}>{current.user_name}</Text>
        </View>
      ) : (
        <View style={s.emptyBox}>
          <Text style={s.emptyText}>Aucun ticket en service pour le moment.</Text>
        </View>
      )}

      {waiting.length > 0 && (
        <View style={s.nextSection}>
          <Text style={s.nextTitle}>Prochains numéros</Text>
          <View style={s.chips}>
            {waiting.slice(0, 5).map((ticket: Ticket) => (
              <View key={ticket.id} style={s.chip}>
                <Text style={s.chipText}>{ticket.number}</Text>
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
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadServices = useCallback(async () => {
    try {
      const { data } = await api.get<ApiResponse<Service[]>>('/services');
      setServices(data.data);
    } catch {
      // Keep the previous list when a refresh fails.
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

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <FlatList
        data={services}
        keyExtractor={(item: Service) => String(item.id)}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={s.header}>
            <View style={s.mark} />
            <Text style={s.headerTitle}>File en direct</Text>
            <Text style={s.headerSub}>Mise à jour automatique toutes les 20 secondes.</Text>
          </View>
        }
        renderItem={({ item }: { item: Service }) => <ServiceCard service={item} />}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <View style={s.emptyMark} />
            <Text style={s.emptyText}>Aucun service actif pour le moment.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg,
  },
  list: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },

  header: { marginBottom: Spacing.xl },
  mark: {
    width: 28,
    height: 3,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
    marginBottom: Spacing.md,
  },
  headerTitle: { fontSize: Type.xxl, fontWeight: '600', color: Colors.text, letterSpacing: -0.5 },
  headerSub: { fontSize: Type.sm, color: Colors.muted, marginTop: Spacing.xs },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  serviceInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  prefixBadge: {
    backgroundColor: Colors.primaryLt,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.xs,
  },
  prefixText: { color: Colors.primary, fontSize: Type.sm, fontWeight: '600' },
  cardTitle: { flex: 1, fontSize: Type.lg, fontWeight: '600', color: Colors.text },
  waitCounter: { alignItems: 'flex-end' },
  waitCountNumber: { fontSize: Type.xl, fontWeight: '600', color: Colors.text },
  waitCountLabel: { fontSize: Type.xs, color: Colors.muted },

  nowBox: {
    backgroundColor: Colors.primaryLt,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  nowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  nowLabel: { color: Colors.muted, fontSize: Type.xs, fontWeight: '500' },
  counterBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  counterBadgeText: { color: Colors.onPrimary, fontSize: Type.xs, fontWeight: '600' },
  nowNumber: {
    fontSize: 62,
    fontWeight: '600',
    color: Colors.primary,
    letterSpacing: -2,
  },
  nowName: { color: Colors.muted, marginTop: Spacing.xs, fontSize: Type.sm },

  emptyBox: {
    backgroundColor: Colors.surface2,
    borderRadius: Radius.md,
    padding: Spacing.xl,
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: { color: Colors.muted, fontSize: Type.sm },

  nextSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  nextTitle: {
    fontSize: Type.xs,
    fontWeight: '500',
    color: Colors.muted,
    marginBottom: Spacing.sm,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    backgroundColor: Colors.surface2,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.xs,
  },
  chipText: { fontWeight: '600', fontSize: Type.sm, color: Colors.text },
  chipMore: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.xs,
  },
  chipMoreText: { fontSize: Type.xs, fontWeight: '600', color: Colors.muted },

  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  emptyMark: {
    width: 32,
    height: 3,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
    marginBottom: Spacing.md,
  },
});
