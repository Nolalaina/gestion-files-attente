import { Platform } from 'react-native';

// === DETECTER ENVIRONNEMENT ===
export const IS_DEV = __DEV__;
export const IS_SIMULATOR = Platform.OS === 'ios' && __DEV__;
export const IS_PHYSICAL_DEVICE = !IS_SIMULATOR;

// === URLs API ===
// ✅ Configuré pour 172.20.10.4 (Votre IP actuelle)
export const API_URLS = {
  dev_simulator: 'http://localhost:5000/api',      
  dev_device:    'http://172.20.10.4:5000/api',  
  dev_android:   'http://10.0.2.2:5000/api',  
  production:    'https://api.fileattente.mg/api',
};

export const getApiUrl = (): string => {
  if (IS_DEV) {
    // Si c'est sur un vrai téléphone, ou via Expo, on utilise TOUJOURS l'adresse IP locale.
    return API_URLS.dev_device;
  }
  return API_URLS.production;
};

// === API CONFIG ===
export const API_CONFIG = {
  timeout: 15000,
  retries: 3,
  retryDelay: 1000,
};

// === LOG CONFIGURATION ===
export const logConfig = () => {
  console.log(`
  🔌 === API Configuration ===
  📱 Platform: ${Platform.OS}
  🏗️  Device: ${IS_SIMULATOR ? 'Simulator' : IS_PHYSICAL_DEVICE ? 'Physical Device' : 'Unknown'}
  🌐 API URL: ${getApiUrl()}
  ⚡ Dev Mode: ${IS_DEV}
  ============================
  `);
};
