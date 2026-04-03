import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Transaction = {
  id: number;
  transaction_type: string;
  amount: number;
  status: string;
  created_at: string;
};

type TransactionListProps = {
  transactions: Transaction[];
};

const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  if (transactions.length === 0) {
    return <Text style={styles.empty}>Aucune transaction disponible</Text>;
  }

  return (
    <View style={styles.container}>
      {transactions.map((tx) => (
        <View key={tx.id} style={styles.item}>
          <Text style={styles.type}>{tx.transaction_type}</Text>
          <Text style={styles.amount}>{tx.amount.toFixed(2)} DZ</Text>
          <Text style={styles.status}>{tx.status}</Text>
          <Text style={styles.date}>{new Date(tx.created_at).toLocaleDateString('fr-FR')}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  item: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  type: {
    fontSize: 14,
    fontWeight: '700',
  },
  amount: {
    fontSize: 14,
    marginTop: 2,
  },
  status: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.75,
  },
  date: {
    fontSize: 12,
    marginTop: 2,
    color: '#64748b',
  },
  empty: {
    textAlign: 'center',
    color: '#64748b',
    padding: 12,
  },
});

export default TransactionList;
