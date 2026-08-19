import { request } from './apiClient';

export const studentApi = {
  getActiveSessions: () => request('/api/student/sessions/active', 'GET'),
  getHistory: () => request('/api/student/attendance/history', 'GET'),
};
