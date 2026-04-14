import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Shadow } from '../types/theme';

type StatCardProps = {
  label: string;
  value: number | string;
  icon?: string;
  color?: string;
};

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color = '#4f46e5' }) => (
  <View style={[styles.container]}>
    <Text style={styles.icon}>{icon ?? '📊'}</Text>
    <Text style={[styles.value, { color }]}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  icon: {
    fontSize: 20,
    marginBottom: 6,
  },
  value: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1e293b',
  },
  label: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});

export default StatCard;
