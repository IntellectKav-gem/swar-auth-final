import { request } from './apiClient';

export const adminApi = {
  getDashboardStats: () => request('/api/admin/dashboard', 'GET'),
  getStudents: () => request('/api/admin/students', 'GET'),
  createStudent: (data) => request('/api/admin/students', 'POST', data),
  getFaculty: () => request('/api/admin/faculty', 'GET'),
  createFaculty: (data) => request('/api/admin/faculty', 'POST', data),
  getSubjects: () => request('/api/admin/subjects', 'GET'),
  createSubject: (data) => request('/api/admin/subjects', 'POST', data),
  assignFaculty: (data) => request('/api/admin/assign-faculty', 'POST', data),
};
