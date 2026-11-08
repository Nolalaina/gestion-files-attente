// screens/RegisterScreen.tsx — Aurora Midnight
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
import { Colors, Radius, Spacing, Type } from '../types/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const { addToast } = useNotification();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const { firstName, lastName, email, phone, password, confirmPassword } = form;
    if (!firstName || !lastName || !email || !phone || !password) {
      addToast('Veuillez remplir tous les champs.', 'warning');
      return;
    }
    if (password !== confirmPassword) {
      addToast('Les mots de passe ne correspondent pas.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await register({
        firstName,
        lastName,
        email: email.trim(),
        phone,
        password,
        confirmPassword,
      });
      addToast(res.message || 'Inscription réussie.', 'success');
      navigation.navigate('VerifyAccount', { email: email.trim() });
    } catch (err: any) {
      addToast(err.response?.data?.error || "L'inscription a échoué.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'firstName', label: 'Prénom', placeholder: 'Jean', autoCapitalize: 'words' as const, half: true },
    { key: 'lastName', label: 'Nom', placeholder: 'Rakoto', autoCapitalize: 'words' as const, half: true },
    { key: 'email', label: 'Email', placeholder: 'jean@exemple.mg', keyboardType: 'email-address' as const, autoCapitalize: 'none' as const },
    { key: 'phone', label: 'Téléphone', placeholder: '034 00 000 00', keyboardType: 'phone-pad' as const },
    { key: 'password', label: 'Mot de passe', placeholder: '8 caractères minimum', secure: true },
    { key: 'confirmPassword', label: 'Confirmation', placeholder: 'Répétez le mot de passe', secure: true },
  ];

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.flex}
      >
        <ScrollView
          contentContainerStyle={s.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={s.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <Text style={s.backText}>Retour</Text>
          </TouchableOpacity>

          <View style={s.header}>
            <View style={s.mark} />
            <Text style={s.title}>Créer un compte</Text>
            <Text style={s.subtitle}>
              Réservez votre place et suivez la file depuis votre téléphone.
            </Text>
          </View>

          <View style={s.card}>
            <View style={s.inputGrid}>
              {fields.map((f) => (
                <View key={f.key} style={[s.inputWrapper, f.half && s.inputHalf]}>
                  <Text style={s.label}>{f.label}</Text>
                  <TextInput
                    style={s.input}
                    placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChangeText={(value: string) => setForm({ ...form, [f.key]: value })}
                    keyboardType={(f as any).keyboardType || 'default'}
                    autoCapitalize={(f as any).autoCapitalize || 'sentences'}
                    secureTextEntry={f.secure}
                    placeholderTextColor={Colors.subtle}
                    accessibilityLabel={f.label}
                  />
                </View>
              ))}
            </View>

            {loading ? (
              <View style={s.btn}>
                <ActivityIndicator color={Colors.onPrimary} />
              </View>
            ) : (
              <TouchableOpacity
                style={s.btn}
                onPress={handleRegister}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Créer mon compte"
              >
                <Text style={s.btnText}>Créer mon compte</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={s.footer}
            accessibilityRole="button"
          >
            <Text style={s.footerText}>
              Déjà inscrit ? <Text style={s.link}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: Spacing.xl, paddingBottom: Spacing.xxxl },

  backBtn: { alignSelf: 'flex-start', paddingVertical: Spacing.sm, marginBottom: Spacing.lg },
  backText: { color: Colors.muted, fontSize: Type.sm, fontWeight: '500' },

  header: { marginBottom: Spacing.xl },
  mark: {
    width: 28,
    height: 3,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
    marginBottom: Spacing.md,
  },
  title: { fontSize: Type.xxl, fontWeight: '600', color: Colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: Type.sm, color: Colors.muted, marginTop: Spacing.xs, lineHeight: 20 },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  inputWrapper: { width: '100%' },
  inputHalf: { width: '47%' },
  label: { fontSize: Type.sm, fontWeight: '500', color: Colors.muted, marginBottom: Spacing.sm },
  input: {
    backgroundColor: Colors.surface2,
    borderRadius: Radius.sm,
    padding: Spacing.lg,
    fontSize: Type.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.lg,
    minHeight: 52,
    justifyContent: 'center',
  },
  btnText: { color: Colors.onPrimary, fontWeight: '600', fontSize: Type.md },

  footer: { marginTop: Spacing.xl, alignItems: 'center' },
  footerText: { color: Colors.muted, fontSize: Type.sm },
  link: { color: Colors.primary, fontWeight: '600' },
});
