// App.tsx — Point d'entrée React Native + Expo
import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator }  from '@react-navigation/native-stack';
import { createBottomTabNavigator }    from '@react-navigation/bottom-tabs';
import { StatusBar }                   from 'expo-status-bar';
import { SafeAreaProvider }            from 'react-native-safe-area-context';
import { AuthProvider, useAuth }       from './src/context/AuthContext';
import { NotificationProvider }         from './src/context/NotificationContext';
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
  AdminDash: '📊', Agents: '👥', Banque: '🏦', File: '📱',
  Guichet: '🎯', Stats: '📈',
  Accueil: '🏠', Ticket: '🎫', MonCompte: '👤',
};

function MainTabs() {
  const { user } = useAuth();
  
  const commonScreenOptions = {
    tabBarActiveTintColor: '#4f46e5',
    tabBarInactiveTintColor: '#94a3b8',
    tabBarStyle: {
      height: 64,
      paddingBottom: 8,
      paddingTop: 8,
      borderTopColor: '#e2e8f0',
      backgroundColor: '#fff',
      borderTopWidth: 1,
    },
    tabBarLabelStyle: { fontSize: 11, fontWeight: '700' as const },
    headerStyle: { backgroundColor: '#4f46e5' },
    headerTintColor: '#fff',
    headerTitleStyle: { fontWeight: 'bold' as const },
  };

  // ── ADMIN ──
  if (user?.role === 'admin') {
    return (
      <Tab.Navigator screenOptions={({ route }) => ({
        ...commonScreenOptions,
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>{ICON_MAP[route.name] || '📄'}</Text>,
      })}>
        <Tab.Screen name="AdminDash" component={AdminDashboardScreen}
          options={{ title: 'Dashboard' }} />
        <Tab.Screen name="Agents" component={AdminAgentsScreen}
          options={{ title: 'Agents' }} />
        <Tab.Screen name="File" component={QueueScreen}
          options={{ title: 'Files' }} />
        <Tab.Screen name="Banque" component={AdminAccountsScreen}
          options={{ title: 'Banque' }} />
        <Tab.Screen name="Ticket" component={TicketScreen}
          options={{ title: 'Ticket' }} />
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
          options={{ title: 'Console' }} />
        <Tab.Screen name="File" component={QueueScreen}
          options={{ title: 'Files' }} />
        <Tab.Screen name="Ticket" component={TicketScreen}
          options={{ title: 'Ticket' }} />
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
        options={{ title: 'Accueil' }} />
      <Tab.Screen name="Ticket" component={TicketScreen}
        options={{ title: 'Ticket' }} />
      <Tab.Screen name="File" component={QueueScreen}
        options={{ title: 'Direct' }} />
      <Tab.Screen name="Banque" component={ClientAccountsScreen}
        options={{ title: 'Banque' }} />
      <Tab.Screen name="MonCompte" component={UsagerDashboardScreen}
        options={{ title: 'Mon Espace' }} />
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

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <RootNavigator />
          </NavigationContainer>
        </NotificationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
