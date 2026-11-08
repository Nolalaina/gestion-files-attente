// screens/AdminAgentsScreen.tsx — Aurora Midnight
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { Colors, Radius, Spacing, Type } from '../types/theme';
import { useNotification } from '../context/NotificationContext';
import type { ApiResponse } from '../types';

export default function AdminAgentsScreen() {
  const { addToast, socket } = useNotification();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newAgent, setNewAgent] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'agent',
  });

  const fetchAgents = useCallback(async () => {
    try {
      const { data } = await api.get<ApiResponse<any[]>>('/users');
      setAgents(data.data || []);
    } catch {
      addToast('Chargement des agents impossible.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchAgents();
    if (socket) {
      socket.on('user:updated', fetchAgents);
      socket.on('stats:refresh', fetchAgents);
    }
    return () => {
      if (socket) {
        socket.off('user:updated', fetchAgents);
        socket.off('stats:refresh', fetchAgents);
      }
    };
  }, [fetchAgents, socket]);

  const toggleStatus = async (agent: any) => {
    try {
      await api.patch(`/users/${agent.id}/toggle`);
      addToast(`Agent ${agent.active ? 'désactivé' : 'activé'}.`, 'success');
      fetchAgents();
    } catch {
      addToast('Modification du statut impossible.', 'error');
    }
  };

  const createAgent = async () => {
    if (!newAgent.name || !newAgent.email || !newAgent.password) {
      addToast('Renseignez les champs obligatoires.', 'warning');
      return;
    }
    try {
      await api.post('/users', newAgent);
      addToast('Agent créé.', 'success');
      setShowModal(false);
      setNewAgent({ name: '', email: '', password: '', phone: '', role: 'agent' });
      fetchAgents();
    } catch (err: any) {
      addToast(err.response?.data?.error || "Création de l'agent impossible.", 'error');
    }
  };

  const renderAgent = ({ item }: { item: any }) => (
    <View style={s.card}>
      <View style={s.cardContent}>
        <View style={s.cardLeft}>
          <View style={[s.avatar, item.active ? s.avatarActive : s.avatarInactive]}>
            <Text style={s.avatarText}>{item.name?.[0] || '?'}</Text>
          </View>
          <View style={s.info}>
            <Text style={s.name}>{item.name}</Text>
            <Text style={s.email}>{item.email}</Text>
            <View style={s.metaRow}>
              <View
                style={[
                  s.roleBadge,
                  item.role === 'admin' ? s.roleBadgeAdmin : s.roleBadgeAgent,
                ]}
              >
                <Text
                  style={[
                    s.roleText,
                    item.role === 'admin' ? s.roleTextAdmin : s.roleTextAgent,
                  ]}
                >
                  {item.role === 'admin' ? 'Admin' : 'Agent'}
                </Text>
              </View>
              {item.phone && <Text style={s.phone}>{item.phone}</Text>}
              <Text style={s.ticketCount}>{item.ticket_count || 0} tickets</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={[s.statusBadge, item.active ? s.stateOn : s.stateOff]}
          onPress={() => toggleStatus(item)}
          accessibilityRole="button"
          accessibilityLabel={item.active ? 'Désactiver' : 'Activer'}
        >
          <Text
            style={[s.statusText, item.active ? s.stateTextOn : s.stateTextOff]}
          >
            {item.active ? 'Actif' : 'Inactif'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <View style={s.headerText}>
          <Text style={s.title}>Agents</Text>
          <Text style={s.subtitle}>{agents.length} utilisateurs</Text>
        </View>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => setShowModal(true)}
          accessibilityRole="button"
        >
          <Text style={s.addBtnText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={agents}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderAgent}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchAgents();
            }}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={s.emptyBox}>
              <Text style={s.emptyText}>Aucun agent trouvé.</Text>
            </View>
          ) : null
        }
      />
      {loading && <ActivityIndicator style={s.loader} color={Colors.primary} />}

      <Modal visible={showModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Nouvel agent</Text>

            {[
              { key: 'name', label: 'Nom complet', placeholder: 'Jean Rakoto' },
              {
                key: 'email',
                label: 'Email',
                placeholder: 'agent@queue.mg',
                keyboard: 'email-address' as const,
              },
              {
                key: 'password',
                label: 'Mot de passe',
                placeholder: '8 caractères minimum',
                secure: true,
              },
              {
                key: 'phone',
                label: 'Téléphone',
                placeholder: '034 00 000 00',
                keyboard: 'phone-pad' as const,
              },
            ].map((field) => (
              <View key={field.key} style={s.modalField}>
                <Text style={s.modalLabel}>{field.label}</Text>
                <TextInput
                  style={s.modalInput}
                  value={(newAgent as any)[field.key]}
                  onChangeText={(value: string) =>
                    setNewAgent({ ...newAgent, [field.key]: value })
                  }
                  placeholder={field.placeholder}
                  placeholderTextColor={Colors.subtle}
                  keyboardType={(field as any).keyboard || 'default'}
                  secureTextEntry={field.secure}
                  autoCapitalize={field.key === 'email' ? 'none' : 'words'}
                  accessibilityLabel={field.label}
                />
              </View>
            ))}

            <View style={s.modalField}>
              <Text style={s.modalLabel}>Rôle</Text>
              <View style={s.roleSelector}>
                {['agent', 'admin'].map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      s.roleOption,
                      newAgent.role === role && s.roleOptionActive,
                    ]}
                    onPress={() => setNewAgent({ ...newAgent, role })}
                    accessibilityRole="button"
                    accessibilityState={{ selected: newAgent.role === role }}
                  >
                    <Text
                      style={[
                        s.roleOptionText,
                        newAgent.role === role && s.roleOptionTextActive,
                      ]}
                    >
                      {role === 'admin' ? 'Admin' : 'Agent'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={s.modalActions}>
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => setShowModal(false)}
                accessibilityRole="button"
              >
                <Text style={s.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.confirmBtn}
                onPress={createAgent}
                accessibilityRole="button"
              >
                <Text style={s.confirmBtnText}>Créer l’agent</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerText: { flex: 1 },
  title: { fontSize: Type.xxl, fontWeight: '600', color: Colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: Type.xs, color: Colors.muted, marginTop: Spacing.xs },
  addBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.xs,
  },
  addBtnText: { color: Colors.onPrimary, fontSize: Type.xs, fontWeight: '600' },
  list: { padding: Spacing.lg, paddingTop: 0 },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: Spacing.md },
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
  info: { flex: 1 },
  name: { fontSize: Type.md, fontWeight: '600', color: Colors.text },
  email: { fontSize: Type.xs, color: Colors.muted, marginTop: 2 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    flexWrap: 'wrap',
  },
  roleBadge: { paddingVertical: 2, paddingHorizontal: Spacing.sm, borderRadius: Radius.xs },
  roleBadgeAdmin: { backgroundColor: Colors.infoSoft },
  roleBadgeAgent: { backgroundColor: Colors.warningSoft },
  roleText: { fontSize: 11, fontWeight: '600' },
  roleTextAdmin: { color: Colors.info },
  roleTextAgent: { color: Colors.warning },
  phone: { fontSize: Type.xs, color: Colors.subtle },
  ticketCount: { fontSize: Type.xs, color: Colors.muted },
  statusBadge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.xs,
  },
  stateOn: { backgroundColor: Colors.successSoft },
  stateOff: { backgroundColor: Colors.dangerSoft },
  statusText: { fontSize: Type.xs, fontWeight: '600' },
  stateTextOn: { color: Colors.success },
  stateTextOff: { color: Colors.danger },

  emptyBox: { paddingVertical: Spacing.xxl, alignItems: 'center' },
  emptyText: { color: Colors.muted, fontSize: Type.sm },
  loader: { marginTop: Spacing.lg },

  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  modalHandle: {
    width: 36,
    height: 3,
    borderRadius: Radius.pill,
    backgroundColor: Colors.borderStrong,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: Type.xl,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  modalField: { marginBottom: Spacing.md },
  modalLabel: { fontSize: Type.xs, fontWeight: '500', color: Colors.muted, marginBottom: Spacing.xs },
  modalInput: {
    backgroundColor: Colors.surface2,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    fontSize: Type.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleSelector: { flexDirection: 'row', gap: Spacing.sm },
  roleOption: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  roleOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLt },
  roleOptionText: { fontWeight: '600', color: Colors.muted, fontSize: Type.sm },
  roleOptionTextActive: { color: Colors.primary },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  cancelBtn: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtnText: { color: Colors.muted, fontWeight: '600', fontSize: Type.sm },
  confirmBtn: {
    flex: 2,
    padding: Spacing.lg,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  confirmBtnText: { color: Colors.onPrimary, fontWeight: '600', fontSize: Type.sm },
});
