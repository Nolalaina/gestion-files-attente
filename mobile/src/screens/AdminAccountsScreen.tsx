import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Pressable,
  Text,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import api from '../services/api';

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

const AdminAccountsScreen: React.FC = () => {
  const { colors } = useTheme();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchAccounts = async (page: number = 1, searchText = '', type: string | null = null) => {
    try {
      const offset = (page - 1) * 20;
      const params: any = { limit: 20, offset };

      if (searchText) params.search = searchText;
      if (type) params.type = type;

      const response = await api.get('/bank/admin/accounts', { params });
      setAccounts(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.log('Erreur comptes:', error);
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

  const renderAccountCard = ({ item }: { item: BankAccount }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.accountType, { color: colors.primary }]}>
          {item.account_type}
        </Text>
        <Text style={[
          styles.status,
          {
            color: item.status === 'ACTIVE' ? '#4caf50' : '#ff9800',
            backgroundColor: item.status === 'ACTIVE' ? 'rgba(76,175,80,0.1)' : 'rgba(255,152,0,0.1)',
          }
        ]}>
          {item.status}
        </Text>
      </View>

      <Text style={[styles.label, { color: colors.text }]}>Numéro:</Text>
      <Text style={[styles.accountNumber, { color: colors.text }]}>
        {item.account_number}
      </Text>

      <Text style={[styles.label, { color: colors.text }]}>Propriétaire:</Text>
      <Text style={[styles.text, { color: colors.text }]}>{item.owner_name}</Text>
      <Text style={[styles.email, { color: colors.text }]}>{item.email}</Text>

      <Text style={[styles.label, { color: colors.text }]}>Solde:</Text>
      <Text style={[styles.balance, { color: '#667eea' }]}>
        ${item.balance.toFixed(2)}
      </Text>

      <Text style={[styles.date, { color: colors.text }]}>
        Créé le {new Date(item.created_at).toLocaleDateString('fr-FR')}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.filterSection}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border,
            }
          ]}
          placeholder="Rechercher..."
          placeholderTextColor={colors.text + '80'}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={accounts}
        renderItem={renderAccountCard}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />

      {pagination && pagination.pages > 1 && (
        <View style={styles.pagination}>
          <Pressable
            disabled={currentPage === 1}
            onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            style={[styles.pageButton, { opacity: currentPage === 1 ? 0.5 : 1 }]}
          >
            <Text style={[styles.pageButtonText, { color: colors.primary }]}>← Précédent</Text>
          </Pressable>

          <Text style={[styles.pageInfo, { color: colors.text }]}>
            {currentPage} / {pagination.pages}
          </Text>

          <Pressable
            disabled={currentPage === pagination.pages}
            onPress={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
            style={[styles.pageButton, { opacity: currentPage === pagination.pages ? 0.5 : 1 }]}
          >
            <Text style={[styles.pageButtonText, { color: colors.primary }]}>Suivant →</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  listContent: {
    padding: 16,
  },
  card: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountType: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  status: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textTransform: 'uppercase',
  },
  accountNumber: {
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 8,
    letterSpacing: 1,
  },
  text: {
    fontSize: 14,
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
    marginBottom: 8,
    opacity: 0.7,
  },
  balance: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  date: {
    fontSize: 12,
    marginTop: 8,
    opacity: 0.6,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  pageButton: {
    padding: 8,
  },
  pageButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pageInfo: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default AdminAccountsScreen;
