// screens/RegisterScreen.tsx — Aurora Design v5
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

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const { addToast } = useNotification();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const { firstName, lastName, email, phone, password, confirmPassword } = form;
    if (!firstName || !lastName || !email || !phone || !password) {
      addToast('Veuillez remplir tous les champs.', 'warning'); return;
    }
    if (password !== confirmPassword) {
      addToast('Les mots de passe ne correspondent pas.', 'error'); return;
    }
    setLoading(true);
    try {
      const res = await register({
        firstName, lastName, email: email.trim(), phone, password, confirmPassword
      });
      addToast(res.message || 'Inscription réussie !', 'success');
      navigation.navigate('VerifyAccount', { email: email.trim() });
    } catch (err: any) {
      addToast(err.response?.data?.error || "Erreur d'inscription", 'error');
    } finally { setLoading(false); }
  };

  const fields = [
    { key: 'firstName', label: 'Prénom', placeholder: 'Ex: Jean', autoCapitalize: 'words' as const },
    { key: 'lastName',  label: 'Nom',    placeholder: 'Ex: Rakoto', autoCapitalize: 'words' as const },
    { key: 'email',     label: 'Email',  placeholder: 'jean@exemple.mg', keyboardType: 'email-address' as const, autoCapitalize: 'none' as const },
    { key: 'phone',     label: 'Téléphone', placeholder: '034 00 000 00', keyboardType: 'phone-pad' as const },
    { key: 'password',  label: 'Mot de passe', placeholder: '••••••••', secure: true },
    { key: 'confirmPassword', label: 'Confirmation', placeholder: '••••••••', secure: true },
  ];

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex:1 }}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          <View style={s.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <Text style={s.backEmoji}>‹</Text>
            </TouchableOpacity>
            <Text style={s.badge}>NOUVEAU COMPTE</Text>
            <Text style={s.title}>Rejoignez-nous</Text>
            <Text style={s.subtitle}>Libérez-vous des files d'attente</Text>
          </View>

          <View style={s.card}>
            <View style={s.inputGrid}>
              {fields.map(f => (
                <View key={f.key} style={[s.inputWrapper, (f.key==='firstName'||f.key==='lastName') && s.inputHalf]}>
                  <Text style={s.label}>{f.label}</Text>
                  <TextInput
                    style={s.input}
                    placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChangeText={(t: string) => setForm({ ...form, [f.key]: t })}
                    keyboardType={(f as any).keyboardType || 'default'}
                    autoCapitalize={(f as any).autoCapitalize || 'sentences'}
                    secureTextEntry={f.secure}
                    placeholderTextColor={Colors.subtle}
                  />
                </View>
              ))}
            </View>

            <TouchableOpacity style={s.btn} onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Créer mon compte</Text>}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={s.footer}>
            <Text style={s.footerText}>Déjà inscrit ? <Text style={s.link}>Se connecter</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flexGrow: 1, padding: 24 },
  header: { marginBottom: 32 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 24, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  backEmoji: { fontSize: 32, color: Colors.navy, marginTop: -4 },
  badge: { fontSize: 10, fontWeight: '900', color: Colors.primary, letterSpacing: 1.5, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: '900', color: Colors.navy, marginBottom: 8 },
  subtitle: { fontSize: 16, color: Colors.muted, fontWeight: '500' },
  
  card: { 
    backgroundColor: '#fff', borderRadius: Radius.xl, padding: 24, ...Shadow.md,
    borderWidth: 1, borderColor: Colors.border
  },
  inputGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  inputWrapper: { width: '100%', marginBottom: 16 },
  inputHalf: { width: '48%' },
  label: { fontSize: 11, fontWeight: '800', color: Colors.subtle, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  input: { 
    backgroundColor: Colors.surface2, borderRadius: Radius.md, padding: 16, fontSize: 15, 
    color: Colors.navy, borderWidth: 1, borderColor: Colors.border 
  },
  btn: { 
    backgroundColor: Colors.primary, borderRadius: Radius.md, padding: 20, alignItems: 'center', 
    marginTop: 12, ...Shadow.sm 
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  
  footer: { marginTop: 32, alignItems: 'center', paddingBottom: 24 },
  footerText: { color: Colors.muted, fontSize: 14, fontWeight: '500' },
  link: { color: Colors.primary, fontWeight: '800' },
});
