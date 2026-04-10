// App.tsx — Point d'entrée React Native + Expo
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator }  from '@react-navigation/native-stack';
import { createBottomTabNavigator }    from '@react-navigation/bottom-tabs';
import { StatusBar }                   from 'expo-status-bar';
import { SafeAreaProvider }            from 'react-native-safe-area-context';
import { AuthProvider, useAuth }       from './src/context/AuthContext';
import { NotificationProvider }         from './src/context/NotificationContext';
import type { RootStackParamList, MainTabParamList } from './src/types';

import HomeScreen    from './src/screens/HomeScreen';
import TicketScreen  from './src/screens/TicketScreen';
import QueueScreen   from './src/screens/QueueScreen';
import LoginScreen   from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import VerifyAccountScreen from './src/screens/VerifyAccountScreen';
import AgentScreen          from './src/screens/AgentScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import AdminAgentsScreen    from './src/screens/AdminAgentsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab   = createBottomTabNavigator<MainTabParamList>();

const TAB_OPTIONS = (title: string) => ({
  headerStyle: { backgroundColor: '#4f46e5' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: 'bold' as const },
  title,
});

function MainTabs() {
  const { user } = useAuth();
  
  if (user?.role === 'admin') {
    return (
      <Tab.Navigator screenOptions={{ tabBarActiveTintColor: '#4f46e5' }}>
        <Tab.Screen name="AdminDash" component={AdminDashboardScreen} 
          options={TAB_OPTIONS('Dashboard Admin')} />
        <Tab.Screen name="Agents" component={AdminAgentsScreen} 
          options={TAB_OPTIONS('Gestion Agents')} />
        <Tab.Screen name="File" component={QueueScreen} 
          options={TAB_OPTIONS('Vue Globale')} />
      </Tab.Navigator>
    );
  }

  if (user?.role === 'agent') {
    return (
      <Tab.Navigator screenOptions={{ tabBarActiveTintColor: '#4f46e5' }}>
        <Tab.Screen name="Guichet" component={AgentScreen} 
          options={TAB_OPTIONS('Ma Console Agent')} />
        <Tab.Screen name="File" component={QueueScreen} 
          options={TAB_OPTIONS('File d\'attente')} />
      </Tab.Navigator>
    );
  }

  return (
    <Tab.Navigator screenOptions={{
      tabBarActiveTintColor:   '#4f46e5',
      tabBarInactiveTintColor: '#94a3b8',
      tabBarStyle: { paddingBottom: 4, height: 60, borderTopColor: '#e2e8f0' },
    }}>
      <Tab.Screen name="Accueil" component={HomeScreen} options={TAB_OPTIONS('Accueil')} />
      <Tab.Screen name="Ticket"  component={TicketScreen} options={TAB_OPTIONS('Tickets')} />
      <Tab.Screen name="File"    component={QueueScreen} options={TAB_OPTIONS('Direct')} />
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
