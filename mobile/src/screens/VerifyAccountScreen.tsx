// screens/VerifyAccountScreen.tsx — Aurora Midnight
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { Colors, Radius, Spacing, Type } from '../types/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyAccount'>;

export default function VerifyAccountScreen({ navigation, route }: Props) {
  const { addToast } = useNotification();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const email = route.params?.email || '';

  const handleVerify = async () => {
    if (!token) {
      addToast('Veuillez saisir votre code.', 'warning');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/verify-email', { token });
      addToast('Compte validé. Vous pouvez vous connecter.', 'success');
      navigation.navigate('Login');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Code invalide ou expiré.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.flex}
      >
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
          <View style={s.header}>
            <View style={s.iconBox}>
              <View style={s.mailMark}>
                <View style={s.mailFlap} />
              </View>
            </View>
            <Text style={s.badge}>Vérification</Text>
            <Text style={s.title}>Confirmez votre email</Text>
            <Text style={s.subtitle}>
              Nous avons envoyé un code de validation à{' '}
              <Text style={s.emailHighlight}>{email || 'votre adresse email'}</Text>.
            </Text>
          </View>

          <View style={s.card}>
            <Text style={s.label}>Code de vérification</Text>
            <TextInput
              style={s.input}
              placeholder="000000"
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
              placeholderTextColor={Colors.subtle}
              keyboardType="number-pad"
              maxLength={10}
              accessibilityLabel="Code de vérification"
            />

            {loading ? (
              <View style={s.btn}>
                <ActivityIndicator color={Colors.onPrimary} />
              </View>
            ) : (
              <TouchableOpacity
                style={s.btn}
                onPress={handleVerify}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Confirmer mon compte"
              >
                <Text style={s.btnText}>Confirmer mon compte</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={s.resendBtn} accessibilityRole="button">
              <Text style={s.resendText}>
                Je n’ai pas reçu le code. <Text style={s.resendHighlight}>Renvoyer</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={s.footer}
            accessibilityRole="button"
          >
            <Text style={s.footerText}>Retour à la connexion</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: Spacing.xl, justifyContent: 'center' },

  header: { alignItems: 'center', marginBottom: Spacing.xxl },
  iconBox: {
    width: 88,
    height: 88,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mailMark: {
    width: 40,
    height: 28,
    borderRadius: Radius.xs,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mailFlap: {
    width: 22,
    height: 2,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
    transform: [{ rotate: '-38deg' }],
  },
  badge: { fontSize: Type.xs, fontWeight: '500', color: Colors.muted, marginBottom: Spacing.xs },
  title: {
    fontSize: Type.xxl,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: { fontSize: Type.sm, color: Colors.muted, textAlign: 'center', lineHeight: 21 },
  emailHighlight: { color: Colors.text, fontWeight: '600' },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: {
    fontSize: Type.sm,
    fontWeight: '500',
    color: Colors.muted,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  input: {
    backgroundColor: Colors.surface2,
    borderRadius: Radius.sm,
    padding: Spacing.lg,
    fontSize: 28,
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: 6,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.xl,
    minHeight: 52,
    justifyContent: 'center',
  },
  btnText: { color: Colors.onPrimary, fontWeight: '600', fontSize: Type.md },

  resendBtn: { marginTop: Spacing.xl, alignItems: 'center' },
  resendText: { color: Colors.muted, fontSize: Type.sm },
  resendHighlight: { color: Colors.primary, fontWeight: '600' },

  footer: { marginTop: Spacing.xxl, alignItems: 'center' },
  footerText: { color: Colors.subtle, fontWeight: '500', fontSize: Type.sm },
});
