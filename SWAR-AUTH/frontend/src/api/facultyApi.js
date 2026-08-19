import { request } from './apiClient';

export const facultyApi = {
  getSubjects: () => request('/api/faculty/subjects', 'GET'),
  startSession: (data) => request('/api/faculty/sessions/start', 'POST', data),
  endSession: (sessionId) => request(`/api/faculty/sessions/${sessionId}/end`, 'POST'),
  getActiveSession: () => request('/api/faculty/sessions/active', 'GET'),
  getHistory: () => request('/api/faculty/attendance/history', 'GET'),
};
