// components/Button.tsx
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius } from '../types/theme';

type Variant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

const BG: Record<Variant, string> = {
  primary: Colors.primary,
  secondary: Colors.surface2,
  success: Colors.success,
  danger: Colors.danger,
  ghost: 'transparent',
};

const FG: Record<Variant, string> = {
  primary: Colors.onPrimary,
  secondary: Colors.text,
  success: Colors.onPrimary,
  danger: Colors.bg,
  ghost: Colors.primary,
};

export default function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  size = 'md',
  style,
}: ButtonProps) {
  const pad = { sm: { h: 12, v: 8 }, md: { h: 16, v: 12 }, lg: { h: 20, v: 15 } }[size];
  const fs = { sm: 13, md: 15, lg: 16 }[size];

  return (
    <TouchableOpacity
      style={[
        s.base,
        {
          backgroundColor: BG[variant],
          paddingHorizontal: pad.h,
          paddingVertical: pad.v,
          borderWidth: variant === 'ghost' ? 1 : 0,
          borderColor: variant === 'ghost' ? Colors.borderStrong : undefined,
          width: fullWidth ? '100%' : undefined,
          opacity: disabled || loading ? 0.5 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator color={FG[variant]} size="small" />
      ) : (
        <Text style={[s.label, { color: FG[variant], fontSize: fs }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  base: {
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  label: { fontWeight: '600' },
});
