import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Type } from '../types/theme';

type StatCardProps = {
  label: string;
  value: number | string;
  icon?: string;
  color?: string;
};

const StatCard: React.FC<StatCardProps> = ({ label, value, color = Colors.primary }) => (
  <View style={styles.container}>
    <Text style={[styles.value, { color }]}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    width: '48%',
    padding: Spacing.lg,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopColor: Colors.primary,
    borderTopWidth: 2,
  },
  value: {
    fontSize: Type.xxl,
    fontWeight: '600',
  },
  label: {
    marginTop: Spacing.xs,
    fontSize: Type.sm,
    fontWeight: '500',
    color: Colors.muted,
  },
});

export default StatCard;
