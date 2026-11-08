// screens/ClientAccountsScreen.tsx — Aurora Midnight
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { Colors, Radius, Spacing, Type } from '../types/theme';

interface Account {
  id: number;
  account_number: string;
  account_type: string;
  balance: number;
  currency: string;
  status: string;
  created_at: string;
}

interface Transaction {
  id: number;
  transaction_type: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
}

const TYPE_LABEL: Record<string, string> = {
  COURANT: 'Compte courant',
  EPARGNE: 'Épargne',
  PROFESSIONNEL: 'Professionnel',
};

const TRANSACTION_LABEL: Record<string, string> = {
  DEPOSIT: 'Dépôt',
  WITHDRAW: 'Retrait',
  TRANSFER: 'Virement',
};

const ClientAccountsScreen: React.FC<{ navigation: any }> = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/bank/accounts');
      setAccounts(response.data);
      if (response.data.length > 0) {
        setSelectedAccount(response.data[0]);
        fetchTransactions(response.data[0].id);
      }
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTransactions = async (accountId: number) => {
    try {
      const response = await api.get(`/bank/accounts/${accountId}/transactions`);
      setTransactions(response.data.transactions);
    } catch {
      setTransactions([]);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAccounts();
  };

  const handleSelectAccount = (account: Account) => {
    setSelectedAccount(account);
    fetchTransactions(account.id);
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
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={s.header}>
          <View style={s.mark} />
          <Text style={s.title}>Mes comptes</Text>
          <Text style={s.subtitle}>Suivez vos soldes et vos dernières opérations.</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.accountsScroll}
        >
          {accounts.map((account) => {
            const isSelected = selectedAccount?.id === account.id;
            return (
              <Pressable
                key={account.id}
                onPress={() => handleSelectAccount(account)}
                style={[s.accountCard, isSelected && s.accountCardSelected]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={[s.accountType, isSelected && s.accountTextSelected]}>
                  {TYPE_LABEL[account.account_type] || account.account_type}
                </Text>
                <Text style={[s.balance, isSelected && s.accountTextSelected]}>
                  {Number(account.balance || 0).toFixed(2)} {account.currency || 'MGA'}
                </Text>
                <Text style={[s.accountNumber, isSelected && s.accountTextSelected]}>
                  {account.account_number}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {selectedAccount && (
          <>
            <View style={s.actionsGrid}>
              {['Virement', 'Dépôt'].map((label) => (
                <Pressable
                  key={label}
                  style={s.actionBtn}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                >
                  <Text style={s.actionBtnText}>{label}</Text>
                </Pressable>
              ))}
            </View>
            <View style={s.actionsGrid}>
              {['Retrait', 'RIB'].map((label) => (
                <Pressable
                  key={label}
                  style={s.actionBtn}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                >
                  <Text style={s.actionBtnText}>{label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={s.section}>
              <Text style={s.sectionTitle}>Historique récent</Text>

              {transactions.length === 0 ? (
                <View style={s.emptyBox}>
                  <Text style={s.emptyText}>Aucune transaction pour ce compte.</Text>
                </View>
              ) : (
                transactions.slice(0, 5).map((transaction) => {
                  const credit = transaction.transaction_type === 'DEPOSIT';
                  return (
                    <View key={transaction.id} style={s.transactionRow}>
                      <View style={s.transactionLeft}>
                        <Text style={s.transactionType}>
                          {TRANSACTION_LABEL[transaction.transaction_type] ||
                            transaction.transaction_type}
                        </Text>
                        <Text style={s.transactionDescription}>{transaction.description}</Text>
                      </View>
                      <Text style={[s.transactionAmount, credit ? s.credit : s.debit]}>
                        {credit ? '+' : '-'}
                        {Number(transaction.amount || 0).toFixed(2)} MGA
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          </>
        )}
      </ScrollView>
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
  scroll: { flexGrow: 1, paddingBottom: Spacing.xxxl },

  header: { padding: Spacing.lg, paddingBottom: Spacing.md },
  mark: {
    width: 28,
    height: 3,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
    marginBottom: Spacing.md,
  },
  title: { fontSize: Type.xxl, fontWeight: '600', color: Colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: Type.sm, color: Colors.muted, marginTop: Spacing.xs },

  accountsScroll: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  accountCard: {
    width: 170,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
  },
  accountCardSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  accountType: { fontSize: Type.xs, fontWeight: '500', color: Colors.muted, marginBottom: Spacing.sm },
  balance: {
    fontSize: Type.lg,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  accountNumber: { fontSize: Type.xs, color: Colors.muted },
  accountTextSelected: { color: Colors.onPrimary },

  actionsGrid: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  actionBtn: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.sm,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnText: { color: Colors.text, fontWeight: '600', fontSize: Type.sm },

  section: { padding: Spacing.lg, paddingTop: Spacing.sm },
  sectionTitle: {
    fontSize: Type.sm,
    fontWeight: '600',
    color: Colors.muted,
    marginBottom: Spacing.md,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.sm,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  transactionLeft: { flex: 1 },
  transactionType: { fontSize: Type.sm, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  transactionDescription: { fontSize: Type.xs, color: Colors.muted },
  transactionAmount: { fontSize: Type.sm, fontWeight: '600' },
  credit: { color: Colors.success },
  debit: { color: Colors.danger },

  emptyBox: {
    padding: Spacing.xl,
    borderRadius: Radius.sm,
    alignItems: 'center',
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.border,
  },
  emptyText: { fontSize: Type.sm, color: Colors.muted },
});

export default ClientAccountsScreen;
