// components/EmptyState.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from './Button';

interface Props {
  icon?:    string;
  title:    string;
  subtitle?: string;
  action?:  { label: string; onPress: () => void };
}

export default function EmptyState({ icon = '📭', title, subtitle, action }: Props) {
  return (
    <View style={s.container}>
      <Text style={s.icon}>{icon}</Text>
      <Text style={s.title}>{title}</Text>
      {subtitle && <Text style={s.sub}>{subtitle}</Text>}
      {action && (
        <Button label={action.label} onPress={action.onPress}
          style={{ marginTop: 16 }} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { alignItems: 'center', padding: 48 },
  icon:      { fontSize: 52, marginBottom: 12, opacity: .6 },
  title:     { fontSize: 17, fontWeight: '700', color: '#1e293b', textAlign: 'center' },
  sub:       { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginTop: 6, lineHeight: 20 },
});
