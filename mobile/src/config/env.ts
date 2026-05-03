import { Platform } from 'react-native';

// === DÉTECTION D'ENVIRONNEMENT ===
export const IS_DEV        = __DEV__;
export const IS_IOS        = Platform.OS === 'ios';
export const IS_ANDROID    = Platform.OS === 'android';
export const IS_SIMULATOR  = Platform.OS === 'ios' && __DEV__;
export const IS_PHYSICAL_DEVICE = !IS_SIMULATOR;

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
  if (!IS_DEV) return API_URLS.production;

  if (IS_SIMULATOR) {
    // iOS simulateur — localhost accessible directement
    return API_URLS.dev_simulator;
  }

  if (IS_ANDROID && !IS_PHYSICAL_DEVICE) {
    // Émulateur Android — redirection vers la machine hôte
    return API_URLS.dev_android;
  }

  // Appareil physique (iOS ou Android) — IP locale du PC/Mac
  return API_URLS.dev_device;
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
  🏗️  Device:    ${IS_SIMULATOR ? 'iOS Simulator' : IS_ANDROID ? 'Android Emulator/Device' : 'Physical Device'}
  🌐 API URL:    ${getApiUrl()}
  ⚡ Dev Mode:   ${IS_DEV}
  ============================
  `);
};
