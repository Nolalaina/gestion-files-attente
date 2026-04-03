// screens/QueueScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  ActivityIndicator, TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { useQueue } from '../hooks/useQueue';
import type { Service, ApiResponse } from '../types';

function ServiceCard({ service }: { service: Service }) {
  const { waiting, called, loading, refresh } = useQueue(service.id);
  const current = called[0];

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.cardTitle}>{service.name}</Text>
        <View style={s.waitBadge}>
          <Text style={s.waitBadgeText}>{waiting.length} en attente</Text>
        </View>
      </View>

      {current ? (
        <View style={s.nowBox}>
          <Text style={s.nowLabel}>🔔 APPELÉ — Guichet {current.counter}</Text>
          <Text style={s.nowNumber}>{current.number}</Text>
          <Text style={s.nowName}>{current.user_name}</Text>
        </View>
      ) : (
        <View style={s.emptyBox}>
          <Text style={s.emptyText}>Aucun ticket en cours</Text>
        </View>
      )}

      {waiting.length > 0 && (
        <View>
          <Text style={s.nextLabel}>Prochains</Text>
          <View style={s.chips}>
            {waiting.slice(0, 8).map(t => (
              <View key={t.id} style={s.chip}>
                <Text style={s.chipText}>{t.number}</Text>
              </View>
            ))}
            {waiting.length > 8 && (
              <View style={[s.chip, { backgroundColor:'#e2e8f0' }]}>
                <Text style={[s.chipText, { color:'#64748b' }]}>+{waiting.length-8}</Text>
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
    const { data } = await api.get<ApiResponse<Service[]>>('/services');
    setServices(data.data);
  }, []);

  useEffect(() => {
    loadServices().finally(() => setLoading(false));
  }, [loadServices]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadServices().catch(() => {});
    setRefreshing(false);
  };

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <FlatList
        data={services}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
        }
        ListHeaderComponent={
          <View style={s.header}>
            <Text style={s.headerTitle}>📺 Affichage en temps réel</Text>
            <Text style={s.headerSub}>Actualisé automatiquement · Tirer pour rafraîchir</Text>
          </View>
        }
        renderItem={({ item }) => <ServiceCard service={item} />}
        ListEmptyComponent={
          <View style={s.center}>
            <Text style={{ color:'#94a3b8' }}>Aucun service disponible</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const BLUE = '#2563eb';
const s = StyleSheet.create({
  safe:          { flex:1, backgroundColor:'#f8fafc' },
  center:        { flex:1, justifyContent:'center', alignItems:'center', padding:40 },
  list:          { padding:14, paddingBottom:32 },
  header:        { marginBottom:14 },
  headerTitle:   { fontSize:20, fontWeight:'900', color:BLUE },
  headerSub:     { fontSize:12, color:'#94a3b8', marginTop:2 },
  card:          { backgroundColor:'#fff', borderRadius:16, padding:16, marginBottom:12,
                   shadowColor:'#000', shadowOpacity:.06, shadowRadius:10, elevation:3 },
  cardHeader:    { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  cardTitle:     { fontSize:16, fontWeight:'700', color:'#1e293b', flex:1 },
  waitBadge:     { backgroundColor:'#eff6ff', borderRadius:99, paddingHorizontal:10, paddingVertical:3 },
  waitBadgeText: { fontSize:11, fontWeight:'700', color:BLUE },
  nowBox:        { backgroundColor:BLUE, borderRadius:12, padding:16, alignItems:'center', marginBottom:12 },
  nowLabel:      { color:'rgba(255,255,255,.8)', fontSize:12, fontWeight:'600' },
  nowNumber:     { fontSize:56, fontWeight:'900', color:'#fff', lineHeight:60 },
  nowName:       { color:'rgba(255,255,255,.85)', marginTop:4, fontSize:14 },
  emptyBox:      { backgroundColor:'#f8fafc', borderRadius:10, padding:12,
                   alignItems:'center', marginBottom:12 },
  emptyText:     { color:'#94a3b8', fontSize:13 },
  nextLabel:     { fontSize:12, fontWeight:'700', color:'#64748b', marginBottom:8 },
  chips:         { flexDirection:'row', flexWrap:'wrap', gap:8 },
  chip:          { borderWidth:2, borderColor:'#e2e8f0', borderRadius:99,
                   paddingHorizontal:12, paddingVertical:4 },
  chipText:      { fontWeight:'700', fontSize:13, color:'#1e293b' },
});
