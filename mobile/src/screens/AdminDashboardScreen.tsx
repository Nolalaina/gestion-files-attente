import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Text,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import api from '../services/api';
import StatCard from '../components/StatCard';
import TransactionList from '../components/TransactionList';

interface DashboardStats {
  total_users: number;
  total_accounts: number;
  total_transactions: number;
  total_balance: number;
}

interface Transaction {
  id: number;
  reference_number: string;
  transaction_type: string;
  amount: number;
  status: string;
  created_at: string;
}

const AdminDashboardScreen: React.FC = () => {
  const { colors } = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/bank/admin/dashboard');
      setStats(response.data.statistics);
      setTransactions(response.data.recent_transactions);
    } catch (error) {
      console.error('Erreur dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
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
        <Text style={[styles.title, { color: colors.text }]}>Tableau de Bord</Text>
      </View>

      {stats && (
        <View style={styles.statsGrid}>
          <StatCard
            label="Utilisateurs"
            value={stats.total_users}
            icon="👥"
            color="#667eea"
          />
          <StatCard
            label="Comptes"
            value={stats.total_accounts}
            icon="🏦"
            color="#764ba2"
          />
          <StatCard
            label="Transactions"
            value={stats.total_transactions}
            icon="💸"
            color="#f093fb"
          />
          <StatCard
            label="Balance"
            value={`$${stats.total_balance.toFixed(2)}`}
            icon="💰"
            color="#4facfe"
          />
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Transactions Récentes
        </Text>
        <TransactionList transactions={transactions.slice(0, 10)} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
});

export default AdminDashboardScreen;
