// services/api.ts - iOS Optimized
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl, API_CONFIG } from '../config/env';

const api = axios.create({
  baseURL: getApiUrl(),
  timeout: API_CONFIG.timeout,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('queue_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const config = err.config;
    
    // Si pas de config ou si la requête a déjà été réessayée trop de fois
    if (!config || !API_CONFIG.retries) {
      return Promise.reject(err);
    }

    // Initialiser le compteur de retries pour cette requête spécifique
    config.__retryCount = config.__retryCount || 0;

    // Vérifier si on doit réessayer (Erreur réseau ou timeout)
    const isNetworkError = !err.response;
    if (isNetworkError && config.__retryCount < API_CONFIG.retries) {
      config.__retryCount += 1;
      
      const fullUrl = `${config.baseURL || ''}${config.url || ''}`;
      console.warn(`🔄 Retry ${config.__retryCount}/${API_CONFIG.retries} for ${fullUrl}`);
      
      // Delay exponentiel simple
      const delay = API_CONFIG.retryDelay * config.__retryCount;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return api(config);
    }

    // Auth error handling (401)
    if (err.response?.status === 401) {
      console.warn('🔑 Session expirée (401)');
      await AsyncStorage.multiRemove(['queue_token', 'queue_user']);
    }

    return Promise.reject(err);
  }
);

export default api;
