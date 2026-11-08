import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { Colors, Radius, Spacing, Type } from '../types/theme';

const LANGUAGES = [
  { code: 'fr', label: 'FR' },
  { code: 'mg', label: 'MG' },
];

export default function LanguageSelector() {
  const { language, changeLanguage } = useLanguage();

  return (
    <View style={styles.container} accessibilityRole="radiogroup" accessibilityLabel="Langue">
      {LANGUAGES.map((item) => {
        const active = language === item.code;
        return (
          <TouchableOpacity
            key={item.code}
            style={[styles.btn, active && styles.active]}
            onPress={() => changeLanguage(item.code)}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
          >
            <Text style={[styles.text, active && styles.textActive]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 2,
    position: 'absolute',
    top: 50,
    right: Spacing.lg,
    zIndex: 1000,
    padding: 2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
  },
  btn: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.xs,
  },
  active: {
    backgroundColor: Colors.surface3,
  },
  text: {
    fontSize: Type.xs,
    fontWeight: '600',
    color: Colors.muted,
  },
  textActive: {
    color: Colors.text,
  },
});
