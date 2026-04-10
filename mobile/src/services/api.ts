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
    return Promise.reject(err);
  }
);

export default api;
