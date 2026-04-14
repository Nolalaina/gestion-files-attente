// screens/AdminAgentsScreen.tsx — Full Agent Management
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, TextInput, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { Colors, Shadow } from '../types/theme';
import { useNotification } from '../context/NotificationContext';
import type { User, ApiResponse } from '../types';

export default function AdminAgentsScreen() {
  const { addToast } = useNotification();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: '', email: '', password: '', phone: '', role: 'agent' });

  const fetchAgents = useCallback(async () => {
    try {
      const { data } = await api.get<ApiResponse<any[]>>('/users');
      setAgents(data.data || []);
    } catch {
      addToast('Erreur chargement agents', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [addToast]);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  const toggleStatus = async (agent: any) => {
    try {
      await api.patch(`/users/${agent.id}/toggle`);
      addToast(`Agent ${agent.active ? 'désactivé' : 'activé'}`, 'success');
      fetchAgents();
    } catch { addToast('Erreur modification statut', 'error'); }
  };

  const createAgent = async () => {
    if (!newAgent.name || !newAgent.email || !newAgent.password) {
      addToast('Veuillez remplir tous les champs obligatoires', 'warning');
      return;
    }
    try {
      await api.post('/users', newAgent);
      addToast('Agent créé avec succès !', 'success');
      setShowModal(false);
      setNewAgent({ name: '', email: '', password: '', phone: '', role: 'agent' });
      fetchAgents();
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Erreur création agent', 'error');
    }
  };

  const renderAgent = ({ item }: { item: any }) => (
    <View style={s.card}>
      <View style={s.cardContent}>
        <View style={s.cardLeft}>
          <View style={[s.avatar, { backgroundColor: item.active ? '#e0e7ff' : '#f1f5f9' }]}>
            <Text style={s.avatarText}>{item.name?.[0] || '?'}</Text>
          </View>
          <View style={s.info}>
            <Text style={s.name}>{item.name}</Text>
            <Text style={s.email}>{item.email}</Text>
            <View style={s.metaRow}>
              <View style={[s.roleBadge, { backgroundColor: item.role === 'admin' ? '#dbeafe' : '#fef3c7' }]}>
                <Text style={[s.roleText, { color: item.role === 'admin' ? '#1d4ed8' : '#b45309' }]}>
                  {item.role?.toUpperCase()}
                </Text>
              </View>
              {item.phone && <Text style={s.phone}>📱 {item.phone}</Text>}
              <Text style={s.ticketCount}>{item.ticket_count || 0} tickets</Text>
            </View>
          </View>
        </View>
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
        <View>
          <Text style={s.title}>Gestion des Agents</Text>
          <Text style={s.subtitle}>{agents.length} utilisateurs</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowModal(true)}>
          <Text style={s.addBtnText}>➕ Ajouter</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={agents}
        keyExtractor={item => item.id.toString()}
        renderItem={renderAgent}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAgents(); }} tintColor={Colors.primary} />}
        ListEmptyComponent={!loading ? <Text style={s.empty}>Aucun agent trouvé</Text> : null}
      />
      {loading && <ActivityIndicator style={s.loader} color={Colors.primary} />}

      {/* Add Agent Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Nouvel Agent</Text>
            
            {[
              { key: 'name', label: 'Nom complet *', placeholder: 'Ex: Jean Rakoto' },
              { key: 'email', label: 'Email *', placeholder: 'agent@queue.mg', keyboard: 'email-address' as const },
              { key: 'password', label: 'Mot de passe *', placeholder: '••••••••', secure: true },
              { key: 'phone', label: 'Téléphone', placeholder: '034 00 000 00', keyboard: 'phone-pad' as const },
            ].map(f => (
              <View key={f.key} style={s.modalField}>
                <Text style={s.modalLabel}>{f.label}</Text>
                <TextInput
                  style={s.modalInput}
                  value={(newAgent as any)[f.key]}
                  onChangeText={(t: string) => setNewAgent({ ...newAgent, [f.key]: t })}
                  placeholder={f.placeholder}
                  placeholderTextColor="#94a3b8"
                  keyboardType={(f as any).keyboard || 'default'}
                  secureTextEntry={f.secure}
                  autoCapitalize={f.key === 'email' ? 'none' : 'words'}
                />
              </View>
            ))}

            {/* Role selector */}
            <View style={s.modalField}>
              <Text style={s.modalLabel}>Rôle</Text>
              <View style={s.roleSelector}>
                {['agent', 'admin'].map(r => (
                  <TouchableOpacity
                    key={r}
                    style={[s.roleOption, newAgent.role === r && s.roleOptionActive]}
                    onPress={() => setNewAgent({ ...newAgent, role: r })}
                  >
                    <Text style={[s.roleOptionText, newAgent.role === r && s.roleOptionTextActive]}>
                      {r.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={s.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={createAgent}>
                <Text style={s.confirmBtnText}>Créer l'agent</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '900', color: '#1e293b' },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  addBtn: { backgroundColor: '#4f46e5', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14, ...Shadow.sm },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  list: { padding: 20, paddingTop: 0 },
  
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12, ...Shadow.sm },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 14 },
  avatar: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#4f46e5' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  email: { fontSize: 12, color: '#64748b', marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  roleBadge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6 },
  roleText: { fontSize: 9, fontWeight: '800' },
  phone: { fontSize: 11, color: '#94a3b8' },
  ticketCount: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  statusBadge: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 12, marginLeft: 12 },
  statusText: { fontSize: 11, fontWeight: '800' },
  
  empty: { textAlign: 'center', marginTop: 40, color: '#94a3b8', fontSize: 14 },
  loader: { marginTop: 20 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28, paddingBottom: 40 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#1e293b', marginBottom: 24 },
  modalField: { marginBottom: 16 },
  modalLabel: { fontSize: 11, fontWeight: '800', color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  modalInput: { backgroundColor: '#f8fafc', borderRadius: 14, padding: 14, fontSize: 15, color: '#0f172a', borderWidth: 1, borderColor: '#f1f5f9' },
  roleSelector: { flexDirection: 'row', gap: 10 },
  roleOption: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 2, borderColor: '#f1f5f9', alignItems: 'center' },
  roleOptionActive: { borderColor: '#4f46e5', backgroundColor: 'rgba(79,70,229,0.05)' },
  roleOptionText: { fontWeight: '800', color: '#94a3b8' },
  roleOptionTextActive: { color: '#4f46e5' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 14, backgroundColor: '#f1f5f9', alignItems: 'center' },
  cancelBtnText: { color: '#64748b', fontWeight: '800' },
  confirmBtn: { flex: 2, padding: 16, borderRadius: 14, backgroundColor: '#4f46e5', alignItems: 'center', ...Shadow.sm },
  confirmBtnText: { color: '#fff', fontWeight: '800' },
});
