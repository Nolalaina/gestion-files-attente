import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageSelector() {
  const { language, changeLanguage } = useLanguage();

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.btn, language === 'fr' && styles.active]} 
        onPress={() => changeLanguage('fr')}
      >
        <Text style={[styles.text, language === 'fr' && styles.textActive]}>🇫🇷 FR</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.btn, language === 'mg' && styles.active]} 
        onPress={() => changeLanguage('mg')}
      >
        <Text style={[styles.text, language === 'mg' && styles.textActive]}>🇲🇬 MG</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 6,
    borderRadius: 20,
  },
  btn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  active: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.5,
  },
  textActive: {
    opacity: 1,
  }
});
