// screens/TicketScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import type { Service, Ticket, ApiResponse } from '../types';

interface FormData {
  user_name:  string;
  phone:      string;
  email:      string;
  service_id: number | null;
}

export default function TicketScreen() {
  const { addToast } = useToast();
  const [form,     setForm]     = useState<FormData>({ user_name:'', phone:'', email:'', service_id:null });
  const [errors,   setErrors]   = useState<Partial<Record<keyof FormData, string>>>({});
  const [services, setServices] = useState<Service[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [ticket,   setTicket]   = useState<Ticket | null>(null);

  useEffect(() => {
    api.get<ApiResponse<Service[]>>('/services')
      .then(({ data }) => setServices(data.data))
      .catch(() => Alert.alert('Erreur', 'Impossible de charger les services'));
  }, []);

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.user_name.trim())  e.user_name  = 'Nom requis';
    if (!form.service_id)        e.service_id = 'Veuillez choisir un service';
    if (form.phone && !/^\+?[\d\s\-]{7,}$/.test(form.phone)) e.phone = 'Numéro invalide';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post<ApiResponse<Ticket>>('/tickets', form);
      setTicket(data.data);
      addToast('🎫 Ticket créé avec succès !', 'success');
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.error || 'Impossible de créer le ticket');
    } finally { setLoading(false); }
  };

  const reset = () => {
    setTicket(null);
    setForm({ user_name:'', phone:'', email:'', service_id:null });
    setErrors({});
  };

  const svcName = services.find(s => s.id === ticket?.service_id)?.name ?? '';

  // ── Ticket confirmé ───────────────────────────────────────
  if (ticket) return (
    <SafeAreaView style={s.safe}>
      <View style={s.ticketCard}>
        <Text style={s.ticketNum}>{ticket.number}</Text>
        <Text style={s.ticketSvc}>{svcName}</Text>
        <Text style={s.ticketName}>Bonjour, {ticket.user_name} 👋</Text>
        {(ticket.estimated_wait ?? 0) > 0 && (
          <Text style={s.ticketInfo}>Attente estimée : ~{ticket.estimated_wait} min</Text>
        )}
        <Text style={s.ticketInfo}>Conservez ce numéro et suivez l'affichage.</Text>
        <TouchableOpacity style={s.newBtn} onPress={reset} activeOpacity={0.85}>
          <Text style={s.newBtnText}>Nouveau ticket</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  // ── Formulaire ────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS==='ios' ? 'padding' : undefined} style={{ flex:1 }}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
          <Text style={s.title}>🎫 Prendre un ticket</Text>

          {/* Nom */}
          <Text style={s.label}>Nom complet <Text style={s.required}>*</Text></Text>
          <TextInput style={[s.input, errors.user_name ? s.inputErr : undefined]}
            value={form.user_name}
            onChangeText={v => { setForm(f => ({...f, user_name:v})); setErrors(e => ({...e, user_name:undefined})); }}
            placeholder="Jean Rakoto" placeholderTextColor="#94a3b8" autoCapitalize="words" />
          {errors.user_name && <Text style={s.errMsg}>{errors.user_name}</Text>}

          {/* Téléphone */}
          <Text style={[s.label, {marginTop:14}]}>Téléphone <Text style={s.optional}>(optionnel)</Text></Text>
          <TextInput style={s.input} value={form.phone}
            onChangeText={v => setForm(f => ({...f, phone:v}))}
            placeholder="+261 34 00 000 00" placeholderTextColor="#94a3b8" keyboardType="phone-pad" />
          {errors.phone && <Text style={s.errMsg}>{errors.phone}</Text>}

          {/* Service */}
          <Text style={[s.label, {marginTop:14}]}>Service <Text style={s.required}>*</Text></Text>
          <View style={s.servicesGrid}>
            {services.map(svc => {
              const selected = form.service_id === svc.id;
              return (
                <TouchableOpacity key={svc.id}
                  style={[s.svcOption, selected && s.svcSelected]}
                  onPress={() => { setForm(f => ({...f, service_id:svc.id})); setErrors(e => ({...e, service_id:undefined})); }}
                  activeOpacity={0.8}>
                  <Text style={[s.svcPrefix, selected && s.svcPrefixSelected]}>{svc.prefix}</Text>
                  <Text style={[s.svcName, selected && s.svcNameSelected]}>{svc.name}</Text>
                  {svc.waiting_count > 0 && (
                    <Text style={[s.svcWait, selected && { color:'rgba(255,255,255,.8)' }]}>
                      {svc.waiting_count} en attente
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.service_id && <Text style={s.errMsg}>{errors.service_id}</Text>}

          <TouchableOpacity style={[s.btn, loading && s.btnDisabled]}
            onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Obtenir mon ticket</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const BLUE = '#2563eb';
const s = StyleSheet.create({
  safe:       { flex:1, backgroundColor:'#f8fafc' },
  container:  { padding:18, paddingBottom:40 },
  title:      { fontSize:22, fontWeight:'900', color:BLUE, marginBottom:20 },
  label:      { fontSize:13, fontWeight:'600', color:'#64748b', marginBottom:6 },
  required:   { color:'#ef4444' },
  optional:   { fontWeight:'400', fontSize:12 },
  input:      { borderWidth:2, borderColor:'#e2e8f0', borderRadius:10,
                padding:13, fontSize:15, backgroundColor:'#fff', color:'#1e293b' },
  inputErr:   { borderColor:'#ef4444' },
  errMsg:     { color:'#ef4444', fontSize:12, marginTop:4 },
  servicesGrid:{ flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom:4 },
  svcOption:  { width:'47%', borderWidth:2, borderColor:'#e2e8f0', borderRadius:12,
                padding:14, backgroundColor:'#fff' },
  svcSelected:{ borderColor:BLUE, backgroundColor:BLUE },
  svcPrefix:  { fontSize:22, fontWeight:'900', color:BLUE },
  svcPrefixSelected:{ color:'#fff' },
  svcName:    { fontSize:13, fontWeight:'600', color:'#1e293b', marginTop:4 },
  svcNameSelected:  { color:'#fff' },
  svcWait:    { fontSize:11, color:'#94a3b8', marginTop:2 },
  btn:        { backgroundColor:BLUE, borderRadius:12, padding:16, alignItems:'center', marginTop:20 },
  btnDisabled:{ opacity:.6 },
  btnText:    { color:'#fff', fontWeight:'700', fontSize:16 },
  // Ticket confirmé
  ticketCard: { flex:1, margin:20, borderRadius:20, backgroundColor:BLUE,
                alignItems:'center', justifyContent:'center', padding:32 },
  ticketNum:  { fontSize:96, fontWeight:'900', color:'#fff', lineHeight:100 },
  ticketSvc:  { fontSize:16, color:'rgba(255,255,255,.8)', marginVertical:6 },
  ticketName: { fontSize:18, fontWeight:'600', color:'#fff' },
  ticketInfo: { color:'rgba(255,255,255,.75)', textAlign:'center', marginTop:8, fontSize:13 },
  newBtn:     { marginTop:24, borderWidth:2, borderColor:'rgba(255,255,255,.6)',
                borderRadius:12, paddingHorizontal:24, paddingVertical:12 },
  newBtnText: { color:'#fff', fontWeight:'700', fontSize:15 },
});
