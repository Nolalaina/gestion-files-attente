// screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth }  from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginScreen() {
  const { login }    = useAuth();
  const { addToast } = useToast();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Champs requis', 'Veuillez saisir votre email et mot de passe.');
      return;
    }
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      addToast(`Bienvenue, ${user.name} !`, 'success');
    } catch {
      Alert.alert('Erreur', 'Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex:1 }}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
          <Text style={s.logo}>🎫</Text>
          <Text style={s.title}>FileAttente MG</Text>
          <Text style={s.subtitle}>Connexion agent / administrateur</Text>

          <View style={s.form}>
            <Text style={s.label}>Adresse email</Text>
            <TextInput style={s.input} value={email} onChangeText={setEmail}
              keyboardType="email-address" autoCapitalize="none" autoComplete="email"
              placeholder="agent@queue.mg" placeholderTextColor="#94a3b8" />

            <Text style={[s.label, { marginTop: 14 }]}>Mot de passe</Text>
            <TextInput style={s.input} value={password} onChangeText={setPassword}
              secureTextEntry placeholder="••••••••" placeholderTextColor="#94a3b8"
              autoComplete="password" />

            <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnText}>Se connecter</Text>}
            </TouchableOpacity>
          </View>

          <View style={s.hint}>
            <Text style={s.hintText}>Comptes de test :</Text>
            <Text style={s.hintText}>admin@queue.mg  |  agent1@queue.mg</Text>
            <Text style={[s.hintText, { fontWeight: '700' }]}>Mot de passe : password123</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex:1, backgroundColor:'#f8fafc' },
  container: { flexGrow:1, justifyContent:'center', padding:28, paddingBottom:48 },
  logo:      { fontSize:64, textAlign:'center', marginBottom:12 },
  title:     { fontSize:28, fontWeight:'900', color:'#2563eb', textAlign:'center' },
  subtitle:  { color:'#64748b', textAlign:'center', marginBottom:32, fontSize:14 },
  form:      { backgroundColor:'#fff', borderRadius:16, padding:20,
               shadowColor:'#000', shadowOpacity:.07, shadowRadius:12, elevation:3 },
  label:     { fontSize:13, fontWeight:'600', color:'#64748b', marginBottom:6 },
  input:     { borderWidth:2, borderColor:'#e2e8f0', borderRadius:10,
               padding:13, fontSize:15, color:'#1e293b', backgroundColor:'#f8fafc' },
  btn:       { backgroundColor:'#2563eb', borderRadius:12, padding:16,
               alignItems:'center', marginTop:20 },
  btnText:   { color:'#fff', fontWeight:'700', fontSize:16 },
  hint:      { marginTop:24, padding:14, backgroundColor:'#f1f5f9',
               borderRadius:10, alignItems:'center' },
  hintText:  { fontSize:12, color:'#64748b', lineHeight:20 },
});
