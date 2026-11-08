// App.tsx — Point d'entrée React Native + Expo
import React from 'react';
import { View, Platform, StyleSheet, Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { LanguageProvider, useLanguage } from './src/context/LanguageContext';
import { logConfig } from './src/config/env';
import LanguageSelector from './src/components/LanguageSelector';
import { Colors } from './src/types/theme';
import type { RootStackParamList, MainTabParamList } from './src/types';

import HomeScreen from './src/screens/HomeScreen';
import TicketScreen from './src/screens/TicketScreen';
import QueueScreen from './src/screens/QueueScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import VerifyAccountScreen from './src/screens/VerifyAccountScreen';
import AgentScreen from './src/screens/AgentScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import AdminAgentsScreen from './src/screens/AdminAgentsScreen';
import UsagerDashboardScreen from './src/screens/UsagerDashboardScreen';
import AdminAccountsScreen from './src/screens/AdminAccountsScreen';
import ClientAccountsScreen from './src/screens/ClientAccountsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const commonScreenOptions = {
    tabBarActiveTintColor: Colors.primary,
    tabBarInactiveTintColor: Colors.muted,
    tabBarStyle: {
      height: 64,
      paddingBottom: 10,
      paddingTop: 8,
      borderTopColor: Colors.border,
      backgroundColor: Colors.surface,
      borderTopWidth: 1,
    },
    tabBarLabelStyle: { fontSize: 11, fontWeight: '600' as const },
    headerStyle: {
      backgroundColor: Colors.bg,
      elevation: 0,
      shadowOpacity: 0,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    headerTintColor: Colors.text,
    headerTitleStyle: { fontWeight: '600' as const, fontSize: 18 },
  };

  if (user?.role === 'admin') {
    return (
      <Tab.Navigator screenOptions={commonScreenOptions}>
        <Tab.Screen
          name="AdminDash"
          component={AdminDashboardScreen}
          options={{ title: 'Statistiques', headerShown: false }}
        />
        <Tab.Screen
          name="Agents"
          component={AdminAgentsScreen}
          options={{ title: 'Agents', headerShown: false }}
        />
        <Tab.Screen name="File" component={QueueScreen} options={{ title: 'Vue en direct' }} />
      </Tab.Navigator>
    );
  }

  if (user?.role === 'agent') {
    return (
      <Tab.Navigator screenOptions={commonScreenOptions}>
        <Tab.Screen name="Guichet" component={AgentScreen} options={{ title: 'Mon guichet' }} />
        <Tab.Screen name="File" component={QueueScreen} options={{ title: "File d'attente" }} />
      </Tab.Navigator>
    );
  }

  return (
    <Tab.Navigator screenOptions={commonScreenOptions}>
      <Tab.Screen
        name="Accueil"
        component={HomeScreen}
        options={{ title: t('nav_home') || 'Accueil' }}
      />
      <Tab.Screen
        name="Ticket"
        component={TicketScreen}
        options={{ title: t('nav_ticket') || 'Ticket' }}
      />
      <Tab.Screen
        name="File"
        component={QueueScreen}
        options={{ title: t('nav_queue') || 'Direct' }}
      />
      <Tab.Screen
        name="MonCompte"
        component={UsagerDashboardScreen}
        options={{ title: t('nav_account') || 'Mon espace' }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="VerifyAccount" component={VerifyAccountScreen} />
        </>
      ) : (
        <Stack.Screen name="Main" component={MainTabs} />
      )}
    </Stack.Navigator>
  );
}

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const isWebDesktop = Platform.OS === 'web' && WINDOW_WIDTH > 500;

export default function App() {
  React.useEffect(() => {
    logConfig();
  }, []);

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
    backgroundColor: isWebDesktop ? Colors.bg : Colors.bg,
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
    borderWidth: 10,
    borderColor: Colors.surface2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
    position: 'relative',
  },
  notch: {
    width: 200,
    height: 28,
    backgroundColor: Colors.surface2,
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
    backgroundColor: Colors.surface3,
    borderRadius: 10,
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    zIndex: 9999,
    opacity: 0.6,
  },
});
