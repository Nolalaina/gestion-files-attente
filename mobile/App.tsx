// App.tsx — Point d'entrée React Native + Expo
import React from 'react';
import { Text, View, Platform, StyleSheet, Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator }  from '@react-navigation/native-stack';
import { createBottomTabNavigator }    from '@react-navigation/bottom-tabs';
import { StatusBar }                   from 'expo-status-bar';
import { SafeAreaProvider }            from 'react-native-safe-area-context';
import { AuthProvider, useAuth }       from './src/context/AuthContext';
import { NotificationProvider }         from './src/context/NotificationContext';
import { LanguageProvider, useLanguage } from './src/context/LanguageContext';
import LanguageSelector                 from './src/components/LanguageSelector';
import { Colors }                       from './src/types/theme';
import type { RootStackParamList, MainTabParamList } from './src/types';

import HomeScreen               from './src/screens/HomeScreen';
import TicketScreen             from './src/screens/TicketScreen';
import QueueScreen              from './src/screens/QueueScreen';
import LoginScreen              from './src/screens/LoginScreen';
import RegisterScreen           from './src/screens/RegisterScreen';
import VerifyAccountScreen      from './src/screens/VerifyAccountScreen';
import AgentScreen              from './src/screens/AgentScreen';
import AdminDashboardScreen     from './src/screens/AdminDashboardScreen';
import AdminAgentsScreen        from './src/screens/AdminAgentsScreen';
import UsagerDashboardScreen    from './src/screens/UsagerDashboardScreen';
import AdminAccountsScreen      from './src/screens/AdminAccountsScreen';
import ClientAccountsScreen     from './src/screens/ClientAccountsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab   = createBottomTabNavigator<MainTabParamList>();

const ICON_MAP: Record<string, string> = {
  AdminDash: '📊', Agents: '👥', File: '📱',
  Guichet: '🎯', Stats: '📈',
  Accueil: '🏠', Ticket: '🎫', MonCompte: '👤',
};

function MainTabs() {
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const commonScreenOptions = {
    tabBarActiveTintColor: Colors.primary,
    tabBarInactiveTintColor: Colors.muted,
    tabBarStyle: {
      height: 68,
      paddingBottom: 10,
      paddingTop: 8,
      borderTopColor: Colors.border,
      backgroundColor: Colors.surface,
      borderTopWidth: 1,
    },
    tabBarLabelStyle: { fontSize: 11, fontWeight: '700' as const },
    headerStyle: { 
      backgroundColor: Colors.bg,
      elevation: 0,
      shadowOpacity: 0,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    headerTintColor: Colors.text,
    headerTitleStyle: { fontWeight: '900' as const, fontSize: 18 },
  };

  // ── ADMIN ──
  if (user?.role === 'admin') {
    return (
      <Tab.Navigator screenOptions={({ route }) => ({
        ...commonScreenOptions,
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>{ICON_MAP[route.name] || '📄'}</Text>,
      })}>
        <Tab.Screen name="AdminDash" component={AdminDashboardScreen}
          options={{ title: 'Statistiques' }} />
        <Tab.Screen name="Agents" component={AdminAgentsScreen}
          options={{ title: 'Agents' }} />
        <Tab.Screen name="File" component={QueueScreen}
          options={{ title: 'Vue Live' }} />
      </Tab.Navigator>
    );
  }

  // ── AGENT ──
  if (user?.role === 'agent') {
    return (
      <Tab.Navigator screenOptions={({ route }) => ({
        ...commonScreenOptions,
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>{ICON_MAP[route.name] || '📄'}</Text>,
      })}>
        <Tab.Screen name="Guichet" component={AgentScreen}
          options={{ title: 'Mon Guichet' }} />
        <Tab.Screen name="File" component={QueueScreen}
          options={{ title: 'File d\'attente' }} />
      </Tab.Navigator>
    );
  }

  // ── USAGER ──
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      ...commonScreenOptions,
      tabBarIcon: () => <Text style={{ fontSize: 20 }}>{ICON_MAP[route.name] || '📄'}</Text>,
    })}>
      <Tab.Screen name="Accueil" component={HomeScreen}
        options={{ title: t("nav_home") || 'Accueil' }} />
      <Tab.Screen name="Ticket" component={TicketScreen}
        options={{ title: t("nav_ticket") || 'Ticket' }} />
      <Tab.Screen name="File" component={QueueScreen}
        options={{ title: t("nav_queue") || 'Direct' }} />
      <Tab.Screen name="MonCompte" component={UsagerDashboardScreen}
        options={{ title: t("nav_account") || 'Mon Espace' }} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return null; 
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user
        ? (
          <>
            <Stack.Screen name="Login"    component={LoginScreen}    />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="VerifyAccount" component={VerifyAccountScreen} />
          </>
        )
        : <Stack.Screen name="Main"  component={MainTabs} />
      }
    </Stack.Navigator>
  );
}

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');
const isWebDesktop = Platform.OS === 'web' && WINDOW_WIDTH > 500;

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <NotificationProvider>
            <View style={styles.appWrapper}>
              <View style={isWebDesktop ? styles.phoneContainer : styles.fullContainer}>
                {isWebDesktop && <View style={styles.notch} />}
                <NavigationContainer>
                  <StatusBar style="light" />
                  <RootNavigator />
                </NavigationContainer>
                <LanguageSelector />
                {isWebDesktop && <View style={styles.homeIndicator} />}
              </View>
            </View>
          </NotificationProvider>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appWrapper: {
    flex: 1,
    backgroundColor: isWebDesktop ? '#0a0a0b' : Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: Colors.bg,
  },
  phoneContainer: {
    width: 420,
    height: 850,
    backgroundColor: Colors.bg,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 12,
    borderColor: '#1f1f23',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
    position: 'relative',
  },
  notch: {
    width: 200,
    height: 30,
    backgroundColor: '#1f1f23',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    zIndex: 9999,
  },
  homeIndicator: {
    width: 140,
    height: 5,
    backgroundColor: '#1f1f23',
    borderRadius: 10,
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    zIndex: 9999,
    opacity: 0.5,
  },
});
