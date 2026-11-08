// screens/AdminAccountsScreen.tsx — Aurora Midnight
import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Pressable,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { Colors, Radius, Spacing, Type } from '../types/theme';

interface BankAccount {
  id: number;
  account_number: string;
  owner_name: string;
  email: string;
  phone: string;
  account_type: string;
  balance: number;
  status: string;
  created_at: string;
}

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  pages: number;
}

const TYPE_LABEL: Record<string, string> = {
  COURANT: 'Compte courant',
  EPARGNE: 'Épargne',
  PROFESSIONNEL: 'Professionnel',
};

const AdminAccountsScreen: React.FC = () => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchAccounts = async (
    page: number = 1,
    searchText = '',
    type: string | null = null
  ) => {
    try {
      const offset = (page - 1) * 20;
      const params: any = { limit: 20, offset };

      if (searchText) params.search = searchText;
      if (type) params.type = type;

      const response = await api.get('/admin/accounts', { params });
      setAccounts(response.data.data);
      setPagination(response.data.pagination);
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAccounts(currentPage, search, typeFilter);
  }, [currentPage, search, typeFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    fetchAccounts(1, search, typeFilter);
  };

  const renderAccountCard = ({ item }: { item: BankAccount }) => {
    const active = item.status === 'ACTIVE';
    return (
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.accountType}>
            {TYPE_LABEL[item.account_type] || item.account_type}
          </Text>
          <View style={[s.statusBadge, active ? s.statusOn : s.statusOff]}>
            <Text style={[s.statusText, active ? s.statusTextOn : s.statusTextOff]}>
              {active ? 'Actif' : 'En attente'}
            </Text>
          </View>
        </View>

        <Text style={s.label}>Numéro</Text>
        <Text style={s.accountNumber}>{item.account_number}</Text>

        <Text style={s.label}>Titulaire</Text>
        <Text style={s.text}>{item.owner_name}</Text>
        <Text style={s.email}>{item.email}</Text>

        <Text style={s.label}>Solde</Text>
        <Text style={s.balance}>{Number(item.balance || 0).toFixed(2)} MGA</Text>

        <Text style={s.date}>
          Créé le {new Date(item.created_at).toLocaleDateString('fr-FR')}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>Comptes bancaires</Text>
        <Text style={s.subtitle}>{pagination?.total || accounts.length} comptes</Text>
      </View>

      <View style={s.filterSection}>
        <TextInput
          style={s.searchInput}
          placeholder="Rechercher un titulaire ou un numéro"
          placeholderTextColor={Colors.subtle}
          value={search}
          onChangeText={setSearch}
          accessibilityLabel="Rechercher un compte"
        />
      </View>

      <FlatList
        data={accounts}
        renderItem={renderAccountCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={s.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <Text style={s.emptyText}>Aucun compte trouvé.</Text>
          </View>
        }
      />

      {pagination && pagination.pages > 1 && (
        <View style={s.pagination}>
          <Pressable
            disabled={currentPage === 1}
            onPress={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
            style={[s.pageButton, currentPage === 1 && s.pageButtonDisabled]}
            accessibilityRole="button"
          >
            <Text style={s.pageButtonText}>Précédent</Text>
          </Pressable>

          <Text style={s.pageInfo}>
            {currentPage} / {pagination.pages}
          </Text>

          <Pressable
            disabled={currentPage === pagination.pages}
            onPress={() =>
              setCurrentPage((previous) => Math.min(pagination.pages, previous + 1))
            }
            style={[
              s.pageButton,
              currentPage === pagination.pages && s.pageButtonDisabled,
            ]}
            accessibilityRole="button"
          >
            <Text style={s.pageButtonText}>Suivant</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg,
  },
  header: { padding: Spacing.lg, paddingBottom: Spacing.sm },
  title: { fontSize: Type.xxl, fontWeight: '600', color: Colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: Type.xs, color: Colors.muted, marginTop: Spacing.xs },

  filterSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInput: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    color: Colors.text,
    fontSize: Type.sm,
  },
  listContent: { padding: Spacing.lg },

  card: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  accountType: { fontSize: Type.md, fontWeight: '600', color: Colors.text },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.xs },
  statusOn: { backgroundColor: Colors.successSoft },
  statusOff: { backgroundColor: Colors.warningSoft },
  statusText: { fontSize: Type.xs, fontWeight: '600' },
  statusTextOn: { color: Colors.success },
  statusTextOff: { color: Colors.warning },

  label: { fontSize: Type.xs, fontWeight: '500', color: Colors.muted, marginTop: Spacing.sm },
  accountNumber: {
    fontSize: Type.sm,
    color: Colors.text,
    marginTop: 2,
  },
  text: { fontSize: Type.sm, color: Colors.text, marginTop: 2 },
  email: { fontSize: Type.xs, color: Colors.muted, marginTop: 2 },
  balance: {
    fontSize: Type.lg,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 2,
  },
  date: { fontSize: Type.xs, color: Colors.subtle, marginTop: Spacing.md },

  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  pageButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.xs,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pageButtonDisabled: { opacity: 0.4 },
  pageButtonText: { fontSize: Type.sm, fontWeight: '600', color: Colors.primary },
  pageInfo: { fontSize: Type.sm, fontWeight: '500', color: Colors.text },

  emptyBox: { paddingVertical: Spacing.xxl, alignItems: 'center' },
  emptyText: { color: Colors.muted, fontSize: Type.sm },
});

export default AdminAccountsScreen;
