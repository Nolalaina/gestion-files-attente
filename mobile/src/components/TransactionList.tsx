import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Type } from '../types/theme';

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
      {transactions.map((tx) => {
        const isCredit = tx.transaction_type === 'DEPOSIT';
        return (
          <View key={tx.id} style={styles.item}>
            <View style={styles.main}>
              <Text style={styles.type}>{tx.transaction_type}</Text>
              <Text style={styles.date}>
                {new Date(tx.created_at).toLocaleDateString('fr-FR')}
              </Text>
            </View>
            <View style={styles.side}>
              <Text style={[styles.amount, isCredit ? styles.credit : styles.debit]}>
                {isCredit ? '+' : '-'}{Number(tx.amount || 0).toFixed(2)} MGA
              </Text>
              <Text style={styles.status}>{tx.status}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  main: {
    flex: 1,
  },
  side: {
    alignItems: 'flex-end',
  },
  type: {
    fontSize: Type.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  amount: {
    fontSize: Type.sm,
    fontWeight: '600',
  },
  credit: {
    color: Colors.success,
  },
  debit: {
    color: Colors.danger,
  },
  status: {
    marginTop: 2,
    fontSize: Type.xs,
    color: Colors.muted,
  },
  date: {
    marginTop: 2,
    fontSize: Type.xs,
    color: Colors.muted,
  },
  empty: {
    padding: Spacing.md,
    color: Colors.muted,
    textAlign: 'center',
  },
});

export default TransactionList;
