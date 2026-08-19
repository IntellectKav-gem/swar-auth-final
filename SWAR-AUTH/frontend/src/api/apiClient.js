const BASE_URL = import.meta.env.VITE_API_URL || '';

export const request = async (endpoint, method = 'GET', data = null, isFormData = false) => {
  const token = localStorage.getItem('swar_token');

  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (data && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const options = {
    method,
    headers,
  };

  if (data) {
    options.body = isFormData ? data : JSON.stringify(data);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = result.error || result.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = result;
    throw err;
  }

  return result;
};
