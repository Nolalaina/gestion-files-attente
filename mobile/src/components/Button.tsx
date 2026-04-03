// components/Button.tsx — Bouton réutilisable typé
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, Radius } from '../types/theme';

type Variant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';

interface ButtonProps {
  label:     string;
  onPress:   () => void;
  variant?:  Variant;
  loading?:  boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  size?:     'sm' | 'md' | 'lg';
  style?:    ViewStyle;
}

const BG: Record<Variant, string> = {
  primary:   Colors.primary,
  secondary: Colors.surface2,
  success:   Colors.accent,
  danger:    Colors.danger,
  ghost:     'transparent',
};
const FG: Record<Variant, string> = {
  primary:   '#fff',
  secondary: Colors.text,
  success:   '#fff',
  danger:    '#fff',
  ghost:     Colors.primary,
};

export default function Button({
  label, onPress, variant = 'primary', loading = false,
  disabled = false, fullWidth = false, size = 'md', style
}: ButtonProps) {
  const pad = { sm: { h: 10, v: 7 }, md: { h: 14, v: 10 }, lg: { h: 18, v: 14 } }[size];
  const fs  = { sm: 13, md: 15, lg: 17 }[size];

  return (
    <TouchableOpacity
      style={[
        s.base,
        { backgroundColor: BG[variant], paddingHorizontal: pad.h, paddingVertical: pad.v,
          borderWidth: variant === 'ghost' ? 2 : 0,
          borderColor: variant === 'ghost' ? Colors.primary : undefined,
          width: fullWidth ? '100%' : undefined,
          opacity: disabled || loading ? .55 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}>
      {loading
        ? <ActivityIndicator color={FG[variant]} size="small" />
        : <Text style={[s.label, { color: FG[variant], fontSize: fs }]}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  base:  { borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  label: { fontWeight: '700' },
});
