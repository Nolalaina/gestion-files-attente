import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from 'react-native';
import { Text } from 'react-native';
import { useTheme } from '@react-navigation/native';
import api from '../services/api';

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

const ClientAccountsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
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
    } catch (error) {
      console.warn('Erreur comptes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTransactions = async (accountId: number) => {
    try {
      const response = await api.get(`/bank/accounts/${accountId}/transactions`);
      setTransactions(response.data.transactions);
    } catch (error) {
      console.warn('Erreur transactions:', error);
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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Mes Comptes</Text>
      </View>

      {/* Carrousel comptes */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountsScroll}>
        {accounts.map(account => (
          <Pressable
            key={account.id}
            onPress={() => handleSelectAccount(account)}
            style={[
              styles.accountCardMobile,
              {
                backgroundColor:
                  selectedAccount?.id === account.id
                    ? colors.primary
                    : colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.accountTypeSmall,
                {
                  color: selectedAccount?.id === account.id ? 'white' : colors.text,
                },
              ]}
            >
              {account.account_type}
            </Text>
            <Text
              style={[
                styles.balanceSmall,
                {
                  color: selectedAccount?.id === account.id ? 'white' : colors.primary,
                },
              ]}
            >
              ${account.balance.toFixed(2)}
            </Text>
            <Text
              style={[
                styles.accountNumberSmall,
                {
                  color: selectedAccount?.id === account.id ? 'white' : colors.text,
                },
              ]}
            >
              {account.account_number}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {selectedAccount && (
        <>
          {/* Boutons d'actions */}
          <View style={styles.actionsGrid}>
            <Pressable style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.actionBtnText}>💸 Virement</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, { backgroundColor: colors.card }]}>
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>📥 Dépôt</Text>
            </Pressable>
          </View>
          <View style={styles.actionsGrid}>
            <Pressable style={[styles.actionBtn, { backgroundColor: colors.card }]}>
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>📤 Retrait</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, { backgroundColor: colors.card }]}>
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>📄 RIB</Text>
            </Pressable>
          </View>

          {/* Historique */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Historique Récent
            </Text>

            {transactions.length === 0 ? (
              <Text style={[styles.noData, { color: colors.text }]}>Aucune transaction</Text>
            ) : (
              transactions.slice(0, 5).map(tx => (
                <View
                  key={tx.id}
                  style={[styles.txItem, { backgroundColor: colors.card }]}
                >
                  <View style={styles.txLeft}>
                    <Text style={[styles.txType, { color: colors.text }]}>
                      {tx.transaction_type}
                    </Text>
                    <Text style={[styles.txDesc, { color: colors.text }]}>
                      {tx.description}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.txAmount,
                      {
                        color:
                          tx.transaction_type === 'DEPOSIT' ? '#4caf50' : '#f44336',
                      },
                    ]}
                  >
                    {tx.transaction_type === 'DEPOSIT' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </Text>
                </View>
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  accountsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  accountCardMobile: {
    width: 150,
    marginRight: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
  },
  accountTypeSmall: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  balanceSmall: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  accountNumberSmall: {
    fontSize: 10,
    fontFamily: 'monospace',
    opacity: 0.7,
  },
  actionsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnText: {
    color: 'white',
    fontWeight: '600',
  },
  section: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  txItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  txLeft: {
    flex: 1,
  },
  txType: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  txDesc: {
    fontSize: 12,
    opacity: 0.7,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  noData: {
    textAlign: 'center',
    paddingVertical: 16,
    fontSize: 14,
  },
});

export default ClientAccountsScreen;
