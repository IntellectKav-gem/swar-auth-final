import { request } from './apiClient';

export const studentApi = {
  getProfile: () => request('/api/student/profile', 'GET'),
  getSubjectAttendance: () => request('/api/student/attendance/subject', 'GET'),
  getActiveSessions: () => request('/api/student/sessions/active', 'GET'),
  getHistory: () => request('/api/student/attendance/history', 'GET'),
};
