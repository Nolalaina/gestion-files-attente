import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type StatCardProps = {
  label: string;
  value: number | string;
  icon?: string;
  color?: string;
};

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color = '#4facfe' }) => (
  <View style={[styles.container, { borderColor: color }]}> 
    <Text style={[styles.icon, { color }]}>{icon ?? '📊'}</Text>
    <Text style={[styles.value, { color }]}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    width: '48%',
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
    marginBottom: 6,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
  },
  label: {
    marginTop: 6,
    fontSize: 12,
    color: '#334155',
  },
});

export default StatCard;
