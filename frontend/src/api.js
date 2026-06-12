import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // support cookie auth if fallback needed
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle expired access tokens and perform refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/register') &&
      !originalRequest.url.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;
      try {
        // Post request to refresh endpoint (sends httpOnly refreshToken cookie)
        const refreshRes = await axios.post(
          'http://localhost:4000/api/auth/refresh',
          {},
          { withCredentials: true }
        );
        const { token } = refreshRes.data;
        localStorage.setItem('token', token);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest); // Retry original request with new token
      } catch (refreshError) {
        console.error('Refresh token expired or revoked:', refreshError);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (
          !window.location.pathname.includes('/login') &&
          !window.location.pathname.includes('/register') &&
          window.location.pathname !== '/'
        ) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
