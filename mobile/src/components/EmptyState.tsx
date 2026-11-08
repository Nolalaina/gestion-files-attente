// components/EmptyState.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from './Button';
import { Colors, Radius, Spacing, Type } from '../types/theme';

interface Props {
  icon?: string;
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
}

export default function EmptyState({ title, subtitle, action }: Props) {
  return (
    <View style={s.container}>
      <View style={s.mark} />
      <Text style={s.title}>{title}</Text>
      {subtitle ? <Text style={s.sub}>{subtitle}</Text> : null}
      {action ? (
        <Button label={action.label} onPress={action.onPress} style={{ marginTop: Spacing.lg }} />
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: { alignItems: 'center', padding: Spacing.xxxl },
  mark: {
    width: 36,
    height: 3,
    marginBottom: Spacing.lg,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
  },
  title: {
    fontSize: Type.lg,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  sub: {
    marginTop: Spacing.sm,
    fontSize: Type.sm,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
