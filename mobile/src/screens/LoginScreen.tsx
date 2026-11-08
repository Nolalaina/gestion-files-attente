// screens/LoginScreen.tsx — Aurora Midnight
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
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { Colors, Radius, Spacing, Type } from '../types/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const { addToast } = useNotification();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      addToast('Veuillez remplir tous les champs.', 'warning');
      return;
    }
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      addToast(`Content de vous revoir, ${user.name}.`, 'success');
    } catch (err: any) {
      const status = err.response?.status;
      const msg =
        status === 401
          ? 'Identifiants incorrects.'
          : err.response?.data?.error || 'Connexion au serveur impossible.';
      addToast(msg, 'error');
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
            <View style={s.mark} />
            <Text style={s.brand}>QueueFlow</Text>
            <Text style={s.tagline}>
              {t('home_subtitle') || 'Votre place dans la file, sans attendre sur place.'}
            </Text>
          </View>

          <View style={s.form}>
            <Text style={s.formTitle}>{t('login_title') || 'Connexion'}</Text>

            <View style={s.field}>
              <Text style={s.label}>{t('email') || 'Email'}</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                placeholder={t('login_email_ph') || 'vous@exemple.mg'}
                placeholderTextColor={Colors.subtle}
                accessibilityLabel="Adresse email"
              />
            </View>

            <View style={s.field}>
              <Text style={s.label}>{t('password') || 'Mot de passe'}</Text>
              <TextInput
                style={s.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="Votre mot de passe"
                placeholderTextColor={Colors.subtle}
                accessibilityLabel="Mot de passe"
              />
            </View>

            {loading ? (
              <View style={s.btn}>
                <ActivityIndicator color={Colors.onPrimary} />
              </View>
            ) : (
              <TouchableOpacity
                style={s.btn}
                onPress={handleLogin}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={t('login_btn') || 'Se connecter'}
              >
                <Text style={s.btnText}>{t('login_btn') || 'Se connecter'}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={s.registerLink}
              onPress={() => navigation.navigate('Register')}
              accessibilityRole="button"
            >
              <Text style={s.linkText}>
                {t('login_no_account')?.split('?')[0] || 'Pas encore de compte'} ?{' '}
                <Text style={s.linkHighlight}>{t('register') || 'Créer un compte'}</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={s.footer}>QueueFlow · 2026</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl },

  header: { alignItems: 'center', marginBottom: Spacing.xxl },
  mark: {
    width: 32,
    height: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
    marginBottom: Spacing.lg,
  },
  brand: { fontSize: Type.display, fontWeight: '600', color: Colors.text, letterSpacing: -1 },
  tagline: {
    color: Colors.muted,
    marginTop: Spacing.sm,
    fontSize: Type.sm,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },

  form: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formTitle: {
    fontSize: Type.xxl,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xl,
    letterSpacing: -0.4,
  },
  field: { marginBottom: Spacing.lg },
  label: { fontSize: Type.sm, fontWeight: '500', color: Colors.muted, marginBottom: Spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    padding: Spacing.lg,
    fontSize: Type.md,
    color: Colors.text,
    backgroundColor: Colors.surface2,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.sm,
    minHeight: 52,
    justifyContent: 'center',
  },
  btnText: { color: Colors.onPrimary, fontWeight: '600', fontSize: Type.md },
  registerLink: { marginTop: Spacing.xl, alignItems: 'center' },
  linkText: { color: Colors.muted, fontSize: Type.sm, textAlign: 'center' },
  linkHighlight: { color: Colors.primary, fontWeight: '600' },

  footer: { marginTop: Spacing.xxl, textAlign: 'center', color: Colors.subtle, fontSize: Type.xs },
});
