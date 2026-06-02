import { Platform } from 'react-native';
import Constants from 'expo-constants';

// === DÉTECTION D'ENVIRONNEMENT ===
export const IS_DEV        = __DEV__;
export const IS_IOS        = Platform.OS === 'ios';
export const IS_ANDROID    = Platform.OS === 'android';

// On utilise expo-constants pour savoir s'il s'agit d'un appareil physique ou d'un émulateur/simulateur
export const IS_PHYSICAL_DEVICE = Constants.executionEnvironment !== 'storeClient' && Constants.isDevice;
export const IS_SIMULATOR       = !Constants.isDevice;

// === URLs API ===
// ✅ Modifiez DEV_IP avec l'adresse IP de votre machine sur le réseau local
const DEV_IP = '172.20.10.4'; // ← Changez cette IP si nécessaire

export const API_URLS = {
  // iOS simulateur : localhost fonctionne directement
  dev_simulator: `http://localhost:5000/api`,
  // Appareil physique iOS & Android : IP locale de la machine de développement
  dev_device:    `http://${DEV_IP}:5000/api`,
  // Émulateur Android : adresse spéciale vers la machine hôte
  dev_android:   `http://10.0.2.2:5000/api`,
  // Production
  production:    `https://api.fileattente.mg/api`,
};

/**
 * Retourne l'URL API appropriée selon la plateforme et l'environnement.
 */
export const getApiUrl = (): string => {
  if (IS_DEV) {
    if (Platform.OS === 'web') return API_URLS.dev_simulator; 
    // Sur mobile, l'IP réseau est le choix le plus sûr pour éviter les problèmes localhost
    return API_URLS.dev_device; 
  }
  return API_URLS.production;
};

// === API CONFIG ===
export const API_CONFIG = {
  timeout:    15000,
  retries:    3,
  retryDelay: 1000,
};

// === LOG CONFIGURATION ===
export const logConfig = () => {
  console.log(`
  🔌 === API Configuration ===
  📱 Platform:   ${Platform.OS}
  🏗️  Device:    ${IS_SIMULATOR ? 'Simulator/Emulator' : 'Physical Device'}
  🌐 API URL:    ${getApiUrl()}
  ⚡ Dev Mode:   ${IS_DEV}
  ============================
  `);
};
