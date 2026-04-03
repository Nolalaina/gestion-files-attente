// App.tsx — Point d'entrée React Native + Expo
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator }  from '@react-navigation/native-stack';
import { createBottomTabNavigator }    from '@react-navigation/bottom-tabs';
import { StatusBar }                   from 'expo-status-bar';
import { SafeAreaProvider }            from 'react-native-safe-area-context';
import { AuthProvider, useAuth }       from './src/context/AuthContext';
import { ToastProvider }               from './src/context/ToastContext';
import type { RootStackParamList, MainTabParamList } from './src/types';

import HomeScreen    from './src/screens/HomeScreen';
import TicketScreen  from './src/screens/TicketScreen';
import QueueScreen   from './src/screens/QueueScreen';
import LoginScreen   from './src/screens/LoginScreen';
import AgentScreen   from './src/screens/AgentScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab   = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const { user } = useAuth();
  return (
    <Tab.Navigator screenOptions={{
      tabBarActiveTintColor:   '#2563eb',
      tabBarInactiveTintColor: '#94a3b8',
      tabBarStyle: { paddingBottom: 4, height: 60, borderTopColor: '#e2e8f0' },
      headerStyle: { backgroundColor: '#2563eb' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}>
      <Tab.Screen name="Accueil" component={HomeScreen}
        options={{ tabBarLabel: 'Accueil', title: 'FileAttente MG' }} />
      <Tab.Screen name="Ticket"  component={TicketScreen}
        options={{ tabBarLabel: 'Mon ticket', title: 'Prendre un ticket' }} />
      <Tab.Screen name="File"    component={QueueScreen}
        options={{ tabBarLabel: 'Affichage', title: 'Files d\'attente' }} />
      {(user?.role === 'agent' || user?.role === 'admin') && (
        <Tab.Screen name="Guichet" component={AgentScreen}
          options={{ tabBarLabel: 'Guichet', title: 'Interface Agent' }} />
      )}
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return null; // Attente restauration session
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user
        ? <Stack.Screen name="Login" component={LoginScreen} />
        : <Stack.Screen name="Main"  component={MainTabs} />
      }
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <RootNavigator />
          </NavigationContainer>
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
