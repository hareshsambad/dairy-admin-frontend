import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('milk_admin_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const config = error.config;
    // Auto-retry transient gateway/restart errors (502, 503, 504) once after 1 second
    if (
      error.response &&
      [502, 503, 504].includes(error.response.status) &&
      config &&
      !config._isRetry
    ) {
      config._isRetry = true;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return api(config);
    }

    if (error.response && error.response.status === 401) {
      const requestUrl = error.config?.url || '';
      const isAuthEndpoint =
        requestUrl.includes('/auth/admin/login') ||
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/forgot-password') ||
        requestUrl.includes('/auth/reset-password');

      localStorage.removeItem('milk_admin_token');
      localStorage.removeItem('milk_admin_user');

      // Only redirect when an existing session token expires, never on login attempts or when already on login/root
      if (
        !isAuthEndpoint &&
        typeof window !== 'undefined' &&
        window.location.pathname !== '/login' &&
        window.location.pathname !== '/'
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
