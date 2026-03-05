import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_URL } from '../env';

// Must match AuthContext storage keys
const ACCESS_TOKEN_KEY = 'clinic_access_token';
const REFRESH_TOKEN_KEY = 'clinic_refresh_token';
const USER_KEY = 'clinic_user';
const TOKEN_EXPIRY_KEY = 'clinic_token_expiry';

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 1000; // 1 second

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: handle 401, retry on 5xx
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { _retryCount?: number };

    if (error.response?.status === 401) {
      // Skip redirect for auth endpoints (login/register return 401 for invalid credentials)
      const requestUrl = config?.url || '';
      const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');
      if (!isAuthEndpoint) {
        // Token expired or invalid — clear auth and redirect to login
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);
        const path = window.location.pathname;
        if (path !== '/login' && path !== '/client/login') {
          window.location.href = path.startsWith('/client') ? '/client/login' : '/login';
        }
      }
      return Promise.reject(error);
    }

    // Retry on 5xx server errors with exponential backoff
    const status = error.response?.status;
    if (config && status && status >= 500 && status < 600) {
      const retryCount = config._retryCount || 0;
      if (retryCount < MAX_RETRIES) {
        config._retryCount = retryCount + 1;
        const delay = RETRY_BASE_DELAY * Math.pow(2, retryCount);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return apiClient(config);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
