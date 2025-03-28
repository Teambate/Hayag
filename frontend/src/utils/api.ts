import axios from 'axios';

// Create axios instance with custom config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Enable request debugging in development
if (import.meta.env.DEV) {
  api.interceptors.request.use(request => {
    console.log('Starting API Request:', request.method?.toUpperCase(), request.url);
    return request;
  });

  api.interceptors.response.use(
    response => {
      console.log('API Response:', response.status, response.config.url);
      return response;
    },
    error => {
      console.error('API Error:', error.message, error.config?.url);
      return Promise.reject(error);
    }
  );
}

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    // Don't automatically add /auth prefix to URLs
    // The URLs should be explicitly defined in the API calls
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Clear localStorage on auth errors
      localStorage.removeItem('user');
      
      // For now, just redirect to login page on auth errors if not already there
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);

export default api; 