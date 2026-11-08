// components/Badge.tsx — Statut de ticket
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius} from '../types/theme';
import type { TicketStatus } from '../types';

const TONE: Record<string, { bg: string; text: string }> = {
  waiting: { bg: Colors.warningSoft, text: Colors.warning },
  called: { bg: Colors.infoSoft, text: Colors.info },
  serving: { bg: Colors.successSoft, text: Colors.success },
  done: { bg: Colors.successSoft, text: Colors.success },
  absent: { bg: Colors.dangerSoft, text: Colors.danger },
  cancelled: { bg: Colors.neutralSoft, text: Colors.neutral },
};

const LABELS: Record<string, string> = {
  waiting: 'En attente',
  called: 'Appelé',
  serving: 'En service',
  done: 'Terminé',
  absent: 'Absent',
  cancelled: 'Annulé',
};

interface Props {
  status: TicketStatus;
}

export default function Badge({ status }: Props) {
  const tone = TONE[status] || { bg: Colors.neutralSoft, text: Colors.neutral };
  return (
    <View style={[s.badge, { backgroundColor: tone.bg, borderColor: tone.text }]}>
      <Text style={[s.text, { color: tone.text }]}>{LABELS[status] || status}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 11, fontWeight: '600' },
});
