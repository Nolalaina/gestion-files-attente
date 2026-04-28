// services/api.ts - iOS Optimized
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl, API_CONFIG } from '../config/env';

const api = axios.create({
  baseURL: getApiUrl(),
  timeout: API_CONFIG.timeout,
  headers: { 'Content-Type': 'application/json' },
});

let retryCount = 0;

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('queue_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => {
    retryCount = 0;
    return res;
  },
  async (err) => {
    // Network error retry (iOS specific)
    if (!err.response && retryCount < API_CONFIG.retries) {
      retryCount++;
      console.warn(`🔄 Retry ${retryCount}/${API_CONFIG.retries}`);
      return new Promise(resolve => 
        setTimeout(() => resolve(api(err.config)), API_CONFIG.retryDelay * retryCount)
      );
    }

    // Auth error handling
    if (err.response?.status === 401) {
      console.warn('🔑 Sesssion expirée (401)');
      await AsyncStorage.multiRemove(['queue_token', 'queue_user']);
      // Note: On ne peut pas facilement rediriger ici sans contexte de navigation, 
      // mais le prochain rechargement ou action Auth detectera l'absence de user.
    }
    return Promise.reject(err);
  }
);

export default api;
