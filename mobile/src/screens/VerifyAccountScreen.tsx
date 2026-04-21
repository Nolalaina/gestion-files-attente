// screens/VerifyAccountScreen.tsx — Aurora Design v5
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { Colors, Radius, Shadow } from '../types/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyAccount'>;

export default function VerifyAccountScreen({ navigation, route }: Props) {
  const { addToast } = useNotification();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const email = route.params?.email || '';

  const handleVerify = async () => {
    if (!token) { addToast('Veuillez saisir votre code.', 'warning'); return; }
    setLoading(true);
    try {
      await api.post('/auth/verify-email', { token });
      addToast('Compte validé ! Connectez-vous.', 'success');
      navigation.navigate('Login');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Code invalide ou expiré.', 'error');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex:1 }}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
          
          <View style={s.header}>
            <View style={s.iconBox}>
              <Text style={{ fontSize: 48 }}>✉️</Text>
            </View>
            <Text style={s.badge}>SÉCURITÉ</Text>
            <Text style={s.title}>Vérifiez votre email</Text>
            <Text style={s.subtitle}>
              Nous avons envoyé un code de validation à{'\n'}
              <Text style={s.emailHighlight}>{email || 'votre adresse email'}</Text>
            </Text>
          </View>

          <View style={s.card}>
            <Text style={s.label}>Code à 6 chiffres</Text>
            <TextInput
              style={s.input}
              placeholder="0 0 0 0 0 0"
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
              maxLength={10}
            />

            <TouchableOpacity style={s.btn} onPress={handleVerify} disabled={loading} activeOpacity={0.8}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Confirmer mon compte</Text>}
            </TouchableOpacity>
            
            <TouchableOpacity style={s.resendBtn}>
              <Text style={s.resendText}>Je n'ai pas reçu le code. <Text style={s.resendHighlight}>Renvoyer</Text></Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={s.footer}>
            <Text style={s.footerBtnText}>‹ Retour à la connexion</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  iconBox: { 
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#fff', 
    justifyContent: 'center', alignItems: 'center', marginBottom: 24, ...Shadow.sm,
    borderWidth: 1, borderColor: Colors.border
  },
  badge: { fontSize: 10, fontWeight: '900', color: Colors.primary, letterSpacing: 2, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.navy, marginBottom: 8 },
  subtitle: { fontSize: 15, color: Colors.muted, textAlign: 'center', lineHeight: 22 },
  emailHighlight: { color: Colors.navy, fontWeight: '800' },
  
  card: { 
    backgroundColor: '#fff', borderRadius: Radius.xl, padding: 32, ...Shadow.md,
    borderWidth: 1, borderColor: Colors.border
  },
  label: { fontSize: 12, fontWeight: '800', color: Colors.subtle, marginBottom: 16, textAlign: 'center', textTransform: 'uppercase' },
  input: {
    backgroundColor: Colors.surface2, borderRadius: Radius.lg, padding: 20, fontSize: 28,
    color: Colors.navy, textAlign: 'center', letterSpacing: 4, fontWeight: '900',
    borderWidth: 2, borderColor: Colors.border
  },
  btn: { backgroundColor: Colors.primary, borderRadius: Radius.md, padding: 20, alignItems: 'center', marginTop: 24, ...Shadow.sm },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  
  resendBtn: { marginTop: 24, alignItems: 'center' },
  resendText: { color: Colors.muted, fontSize: 13 },
  resendHighlight: { color: Colors.primary, fontWeight: '700' },
  
  footer: { marginTop: 40, alignItems: 'center', paddingBottom: 24 },
  footerBtnText: { color: Colors.subtle, fontWeight: '700', fontSize: 14 },
});
