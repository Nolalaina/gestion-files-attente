// screens/HomeScreen.tsx — Version améliorée
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { Colors, Radius, Shadow } from '../types/theme';

type Nav = BottomTabNavigationProp<MainTabParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user, logout } = useAuth();

  const actions = [
    { icon:'🎫', title:'Prendre un ticket', desc:'Réservez votre tour sans attendre', tab:'Ticket',  color: Colors.primary },
    { icon:'📺', title:'Affichage live',    desc:'Files en temps réel',               tab:'File',    color:'#8b5cf6' },
    { icon:'🖥️', title:'Guichet agent',    desc:'Interface de gestion',              tab:'Guichet', color: Colors.accent },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero banner */}
        <View style={s.hero}>
          <View>
            <Text style={s.heroTitle}>FileAttente MG</Text>
            <Text style={s.heroSub}>Gestion intelligente des files d'attente</Text>
          </View>
          <View style={s.dot} />
        </View>

        {/* Utilisateur connecté */}
        {user && (
          <View style={s.userCard}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={s.userName}>{user.name}</Text>
              <Text style={s.userRole}>{user.role === 'admin' ? '🔑 Administrateur' : '🖥️ Agent'}</Text>
            </View>
            <TouchableOpacity style={s.logoutBtn} onPress={logout}>
              <Text style={s.logoutText}>Déco</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Actions */}
        <Text style={s.sectionLabel}>ACTIONS RAPIDES</Text>
        {actions.map(a => (
          <TouchableOpacity key={a.title} style={s.actionCard}
            onPress={() => navigation.navigate(a.tab as keyof MainTabParamList)}
            activeOpacity={0.82}>
            <View style={[s.actionIcon, { backgroundColor: a.color + '18' }]}>
              <Text style={{ fontSize:24 }}>{a.icon}</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={s.actionTitle}>{a.title}</Text>
              <Text style={s.actionDesc}>{a.desc}</Text>
            </View>
            <Text style={[s.arrow, { color: a.color }]}>›</Text>
          </TouchableOpacity>
        ))}

        {/* Footer */}
        <Text style={s.footer}>FileAttente MG v3.0 · Madagascar</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex:1, backgroundColor: Colors.primary },
  scroll:  { backgroundColor: Colors.bg, flexGrow:1, paddingBottom:40 },
  hero:    { backgroundColor: Colors.primary, padding:24, paddingBottom:32,
             flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' },
  heroTitle: { fontSize:26, fontWeight:'900', color:'#fff', letterSpacing:-.5 },
  heroSub:   { fontSize:13, color:'rgba(255,255,255,.75)', marginTop:4 },
  dot:     { width:60, height:60, borderRadius:30, backgroundColor:'rgba(255,255,255,.1)' },
  userCard:{ flexDirection:'row', alignItems:'center', gap:12, backgroundColor: Colors.surface,
             margin:16, borderRadius: Radius.md, padding:14, ...Shadow.sm },
  avatar:  { width:40, height:40, borderRadius:20, backgroundColor: Colors.primaryLt,
             justifyContent:'center', alignItems:'center' },
  avatarText:{ fontSize:17, fontWeight:'800', color: Colors.primary },
  userName:{ fontSize:15, fontWeight:'700', color: Colors.text },
  userRole:{ fontSize:12, color: Colors.muted, marginTop:2 },
  logoutBtn:{ borderWidth:1.5, borderColor: Colors.border, borderRadius: Radius.sm,
              paddingHorizontal:10, paddingVertical:5 },
  logoutText:{ fontSize:12, fontWeight:'600', color: Colors.muted },
  sectionLabel:{ fontSize:11, fontWeight:'700', color: Colors.subtle, letterSpacing:1,
                 paddingHorizontal:16, paddingTop:8, paddingBottom:8 },
  actionCard:{ flexDirection:'row', alignItems:'center', gap:14, backgroundColor: Colors.surface,
               marginHorizontal:16, marginBottom:10, borderRadius: Radius.md, padding:16, ...Shadow.sm },
  actionIcon:{ width:48, height:48, borderRadius:14, justifyContent:'center', alignItems:'center' },
  actionTitle:{ fontSize:15, fontWeight:'700', color: Colors.text },
  actionDesc: { fontSize:12, color: Colors.subtle, marginTop:2 },
  arrow:  { fontSize:26, fontWeight:'300' },
  footer: { textAlign:'center', fontSize:11, color: Colors.subtle, padding:24 },
});
