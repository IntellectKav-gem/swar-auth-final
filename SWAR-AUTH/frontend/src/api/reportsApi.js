import { request } from './apiClient';

export const reportsApi = {
  getFacultyDaily: (date) => request(`/api/reports/faculty/daily${date ? `?date=${date}` : ''}`, 'GET'),
  getFacultySubject: (subjectId) => request(`/api/reports/faculty/subject${subjectId ? `?subject_id=${subjectId}` : ''}`, 'GET'),
  getAdminDepartment: () => request('/api/reports/admin/department', 'GET'),
};
