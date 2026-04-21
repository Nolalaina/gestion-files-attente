// screens/LoginScreen.tsx — Aurora Design v5
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth }  from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Colors, Radius, Shadow } from '../types/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { login }    = useAuth();
  const { addToast } = useNotification();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      addToast('Veuillez remplir tous les champs', 'warning');
      return;
    }
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      addToast(`Content de vous revoir, ${user.name} !`, 'success');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Identifiants incorrects', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex:1 }}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
          
          <View style={s.headerGradient}>
            <View style={s.decorCircle1} />
            <View style={s.decorCircle2} />
            <View style={s.decorCircle3} />
            <Text style={s.logo}>🏦</Text>
            <Text style={s.title}>QueueFlow</Text>
            <Text style={s.subtitle}>Libérez votre temps, on gère l'attente.</Text>
          </View>

          <View style={s.form}>
            <Text style={s.formTitle}>Connexion</Text>
            
            <View style={s.field}>
              <Text style={s.label}>E-mail</Text>
              <TextInput style={s.input} value={email} onChangeText={setEmail}
                keyboardType="email-address" autoCapitalize="none"
                placeholder="Ex: jean@mail.com" placeholderTextColor={Colors.subtle} />
            </View>

            <View style={s.field}>
              <Text style={s.label}>Mot de passe</Text>
              <TextInput style={s.input} value={password} onChangeText={setPassword}
                secureTextEntry placeholder="••••••••" placeholderTextColor={Colors.subtle} />
            </View>

            <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnText}>Accéder à mon espace</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={s.registerLink} onPress={() => navigation.navigate('Register')}>
              <Text style={s.linkText}>Pas encore de compte ? <Text style={s.linkHighlight}>Créer un compte</Text></Text>
            </TouchableOpacity>
          </View>

          <View style={s.footerContainer}>
            <Text style={s.footerText}>QueueFlow Premium © 2026</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flexGrow: 1 },
  headerGradient: {
    backgroundColor: Colors.primary, paddingTop: 60, paddingBottom: 60,
    alignItems: 'center', position: 'relative', overflow: 'hidden',
    borderBottomLeftRadius: 44, borderBottomRightRadius: 44,
  },
  decorCircle1: {
    position: 'absolute', top: -30, right: -30, width: 140, height: 140,
    borderRadius: 70, backgroundColor: 'rgba(6,182,212,.15)',
  },
  decorCircle2: {
    position: 'absolute', bottom: -10, left: -20, width: 90, height: 90,
    borderRadius: 45, backgroundColor: 'rgba(167,139,250,.12)',
  },
  decorCircle3: {
    position: 'absolute', top: 40, left: 30, width: 60, height: 60,
    borderRadius: 30, backgroundColor: 'rgba(6,182,212,.08)',
  },
  logo: { fontSize: 60, marginBottom: 12 },
  title: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  subtitle: { color: 'rgba(255,255,255,.75)', marginTop: 4, fontSize: 14, fontWeight: '500' },
  
  form: {
    backgroundColor: '#fff', borderRadius: Radius.xl, padding: 32,
    marginHorizontal: 24, marginTop: -32, ...Shadow.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  formTitle: { fontSize: 24, fontWeight: '800', color: Colors.navy, marginBottom: 24 },
  field: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    borderWidth: 2, borderColor: Colors.border, borderRadius: Radius.md,
    padding: 16, fontSize: 16, color: Colors.navy, backgroundColor: Colors.surface2,
  },
  btn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md, padding: 20,
    alignItems: 'center', marginTop: 12, ...Shadow.sm,
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  registerLink: { marginTop: 24, alignItems: 'center' },
  linkText: { color: Colors.muted, fontSize: 14 },
  linkHighlight: { color: Colors.primary, fontWeight: '800' },
  
  footerContainer: { marginTop: 40, alignItems: 'center', paddingBottom: 24 },
  footerText: { color: Colors.subtle, fontSize: 12, fontWeight: '600' },
});
