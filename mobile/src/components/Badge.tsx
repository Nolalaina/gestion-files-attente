// components/Badge.tsx — Badge de statut typé
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { TicketStatus } from '../types';

const COLORS: Record<TicketStatus | string, { bg: string; text: string }> = {
  waiting:   { bg: '#fef3c7', text: '#b45309' },
  called:    { bg: '#d1fae5', text: '#047857' },
  serving:   { bg: '#dbeafe', text: '#1d4ed8' },
  done:      { bg: '#ede9fe', text: '#6d28d9' },
  absent:    { bg: '#fce7f3', text: '#be185d' },
  cancelled: { bg: '#fee2e2', text: '#b91c1c' },
};

const LABELS: Record<string, string> = {
  waiting:'En attente', called:'Appelé', serving:'En service',
  done:'Terminé', absent:'Absent', cancelled:'Annulé',
};

interface Props { status: TicketStatus; }

export default function Badge({ status }: Props) {
  const c = COLORS[status] || { bg: '#f1f5f9', text: '#64748b' };
  return (
    <View style={[s.badge, { backgroundColor: c.bg }]}>
      <Text style={[s.text, { color: c.text }]}>{LABELS[status] || status}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  text:  { fontSize: 11, fontWeight: '700' },
});
