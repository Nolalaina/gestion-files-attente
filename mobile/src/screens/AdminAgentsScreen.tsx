import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { Colors, Shadow } from '../types/theme';
import { useNotification } from '../context/NotificationContext';
import type { User, ApiResponse } from '../types';

export default function AdminAgentsScreen() {
  const { addToast } = useNotification();
  const [agents, setAgents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAgents = async () => {
    try {
      const { data } = await api.get<ApiResponse<User[]>>('/users?role=agent');
      setAgents(data.data);
    } catch {
      addToast('Erreur chargement agents', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const toggleStatus = async (agent: any) => {
    try {
      await api.patch(`/users/${agent.id}/toggle`);
      addToast(`Agent ${agent.active ? 'désactivé' : 'activé'}`, 'success');
      fetchAgents();
    } catch {
      addToast('Erreur modification statut', 'error');
    }
  };

  const renderAgent = ({ item }: { item: User & { active: number } }) => (
    <View style={s.card}>
      <View style={s.cardLeft}>
        <View style={[s.avatar, { backgroundColor: item.active ? '#e0e7ff' : '#f1f5f9' }]}>
          <Text style={s.avatarText}>{item.name[0]}</Text>
        </View>
        <View style={s.info}>
          <Text style={s.name}>{item.name}</Text>
          <Text style={s.email}>{item.email}</Text>
        </View>
      </View>
      <View style={s.cardRight}>
        <TouchableOpacity 
          style={[s.statusBadge, { backgroundColor: item.active ? '#dcfce7' : '#fee2e2' }]}
          onPress={() => toggleStatus(item)}
        >
          <Text style={[s.statusText, { color: item.active ? '#166534' : '#991b1b' }]}>
            {item.active ? 'Actif' : 'Inactif'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>Gestion des Agents</Text>
      </View>
      <FlatList
        data={agents as any}
        keyExtractor={item => item.id.toString()}
        renderItem={renderAgent}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAgents(); }} tintColor={Colors.primary} />}
        ListEmptyComponent={!loading ? <Text style={s.empty}>Aucun agent trouvé</Text> : null}
      />
      {loading && <ActivityIndicator style={s.loader} color={Colors.primary} />}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20 },
  title: { fontSize: 24, fontWeight: '900', color: '#1e293b' },
  list: { padding: 20, paddingTop: 0 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...Shadow.sm },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#4f46e5' },
  info: { marginLeft: 16, flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  email: { fontSize: 12, color: '#64748b', marginTop: 2 },
  cardRight: { marginLeft: 12 },
  statusBadge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '800' },
  empty: { textAlign: 'center', marginTop: 40, color: '#94a3b8' },
  loader: { marginTop: 20 }
});
