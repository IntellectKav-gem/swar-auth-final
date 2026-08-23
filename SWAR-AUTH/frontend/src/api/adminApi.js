import { request } from './apiClient';

export const adminApi = {
  getDashboardStats: () => request('/api/admin/dashboard', 'GET'),
  getStudents: () => request('/api/admin/students', 'GET'),
  createStudent: (data) => request('/api/admin/students', 'POST', data),
  updateStudent: (id, data) => request(`/api/admin/students/${id}`, 'PUT', data),
  deleteStudent: (id) => request(`/api/admin/students/${id}`, 'DELETE'),
  getFaculty: () => request('/api/admin/faculty', 'GET'),
  createFaculty: (data) => request('/api/admin/faculty', 'POST', data),
  updateFaculty: (id, data) => request(`/api/admin/faculty/${id}`, 'PUT', data),
  deleteFaculty: (id) => request(`/api/admin/faculty/${id}`, 'DELETE'),
  getSubjects: () => request('/api/admin/subjects', 'GET'),
  createSubject: (data) => request('/api/admin/subjects', 'POST', data),
  assignFaculty: (data) => request('/api/admin/assign-faculty', 'POST', data),
};
