import { request } from './apiClient';

export const voiceApi = {
  enroll: (formData) => request('/api/voice/enroll', 'POST', formData, true),
  getStatus: () => request('/api/voice/status', 'GET'),
  verify: (formData) => request('/api/voice/verify', 'POST', formData, true),
};
