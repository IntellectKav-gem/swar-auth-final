import { request } from './apiClient';

export const authApi = {
  login: (credentials) => request('/api/auth/login', 'POST', credentials),
  register: (userData) => request('/api/auth/register', 'POST', userData),
  getMe: () => request('/api/auth/me', 'GET'),
  logout: () => request('/api/auth/logout', 'POST'),
};
