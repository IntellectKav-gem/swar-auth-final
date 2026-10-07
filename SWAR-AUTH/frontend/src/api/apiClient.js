const BASE_URL = import.meta.env.VITE_API_URL || '';
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

// Mock Fallback Database for Seamless Demo Authentication & Operations
const mockUserStore = {
  get(email, roleHint) {
    const lower = (email || '').toLowerCase();
    if (lower.includes('faculty') || roleHint === 'faculty') {
      return {
        id: 101,
        name: 'Dr. Alan Turing',
        email: lower || 'faculty@swarauth.com',
        role: 'faculty',
        department: 'Computer Science',
        designation: 'Professor'
      };
    }
    if (lower.includes('admin') || roleHint === 'admin') {
      return {
        id: 999,
        name: 'System Administrator',
        email: lower || 'admin@swarauth.com',
        role: 'admin',
        department: 'Information Technology'
      };
    }
    // Default Student
    return {
      id: 201,
      name: lower.split('@')[0] ? lower.split('@')[0].replace('.', ' ').toUpperCase() : 'SARAH MITCHELL',
      email: lower || 'student@swarauth.com',
      role: 'student',
      roll_number: 'ROLL-1001',
      department: 'Computer Science',
      semester: 6,
      section: 'A'
    };
  }
};

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

  let response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, options);
  } catch (netErr) {
    console.warn(`[SWAR-AUTH API] Network issue connecting to ${endpoint}. Using offline mock pipeline.`);
    if (!USE_MOCK_DATA) {
      throw new Error('Unable to reach the SWAR-AUTH API. Check that the backend is running.');
    }
  }

  if (response) {
    const result = await response.json().catch(() => ({}));
    if (response.ok) {
      return result;
    }

    throw new Error(result.error || result.message || `Request failed with status ${response.status}`);
  }

  // --- Offline / Demo Fallback Handlers ---
  if (endpoint === '/api/auth/login') {
    const email = data?.email || 'student@swarauth.com';
    const user = mockUserStore.get(email);
    return {
      token: 'swar_token_demo_' + Date.now(),
      user
    };
  }

  if (endpoint === '/api/auth/register') {
    const user = {
      id: Math.floor(Math.random() * 1000) + 300,
      name: data?.name || 'New User',
      email: data?.email || 'user@swarauth.com',
      role: data?.role || 'student',
      roll_number: data?.roll_number || 'ROLL-' + Math.floor(1000 + Math.random() * 9000),
      department: data?.department || 'Computer Science',
      semester: data?.semester || 6,
      section: data?.section || 'A',
      designation: data?.designation || 'Lecturer'
    };
    return {
      token: 'swar_token_demo_' + Date.now(),
      user
    };
  }

  if (endpoint === '/api/auth/logout') {
    return { message: 'Logged out successfully' };
  }

  if (endpoint === '/api/faculty/subjects') {
    return [
      { id: 'CS601', subject_code: 'CS601', subject_name: 'Machine Learning & Neural Networks', semester: 6, section: 'A' },
      { id: 'CS602', subject_code: 'CS602', subject_name: 'Voice Signal Processing & Biometrics', semester: 6, section: 'A' },
      { id: 'CS603', subject_code: 'CS603', subject_name: 'Cybersecurity & Cryptography', semester: 6, section: 'A' }
    ];
  }

  if (endpoint === '/api/faculty/active-session') {
    return { session: null };
  }

  if (endpoint === '/api/faculty/history') {
    return [
      { id: 'SESS-802', subject_id: 'CS601', semester: 6, section: 'A', date: new Date().toISOString().slice(0, 10), status: 'completed', total_present: 38 },
      { id: 'SESS-799', subject_id: 'CS602', semester: 6, section: 'A', date: '2026-08-25', status: 'completed', total_present: 42 }
    ];
  }

  if (endpoint === '/api/faculty/start-session') {
    return {
      session: {
        id: 'SESS-' + Math.floor(100 + Math.random() * 900),
        subject_id: data?.subject_id || 'CS601',
        subject_name: 'Machine Learning & Neural Networks',
        semester: data?.semester || 6,
        section: data?.section || 'A',
        duration: data?.duration || 12,
        created_at: new Date().toISOString()
      }
    };
  }

  if (endpoint === '/api/faculty/end-session') {
    return { message: 'Session closed' };
  }

  if (endpoint === '/api/student/profile') {
    return {
      student_id: 201,
      user_id: 201,
      name: 'SARAH MITCHELL',
      email: 'student@swarauth.com',
      roll_number: 'ROLL-1001',
      department: 'Computer Science & Engineering',
      semester: 6,
      section: 'A',
      is_voice_enrolled: true,
      voice_enrolled_at: new Date().toISOString()
    };
  }

  if (endpoint === '/api/student/attendance/subject') {
    return [
      { subject_id: 'CS601', subject_code: 'CS601', subject_name: 'Data Structures', total_classes: 20, attended_classes: 16, percentage: 80 },
      { subject_id: 'CS602', subject_code: 'CS602', subject_name: 'DBMS', total_classes: 25, attended_classes: 18, percentage: 72 },
      { subject_id: 'CS603', subject_code: 'CS603', subject_name: 'Web Technology', total_classes: 20, attended_classes: 13, percentage: 65 },
      { subject_id: 'CS604', subject_code: 'CS604', subject_name: 'Software Engineering', total_classes: 18, attended_classes: 14, percentage: 78 }
    ];
  }

  if (endpoint === '/api/student/attendance/overall') {
    return {
      total_sessions: 83,
      total_attended: 61,
      overall_percentage: 75,
      is_low_attendance: false,
      attendance_history: [
        { attendance_id: 'REC-901', date: '16/08/2026', subject_name: 'Data Structures', status: 'present', score: 0.98 },
        { attendance_id: 'REC-884', date: '14/08/2026', subject_name: 'DBMS', status: 'present', score: 0.97 },
        { attendance_id: 'REC-870', date: '12/08/2026', subject_name: 'Web Technology', status: 'present', score: 0.95 },
        { attendance_id: 'REC-855', date: '10/08/2026', subject_name: 'Software Engineering', status: 'present', score: 0.96 }
      ]
    };
  }

  if (endpoint === '/api/student/sessions/active' || endpoint === '/api/student/active-sessions') {
    return [
      { id: 'SESS-803', session_id: 'SESS-803', subject_id: 'CS601', subject_name: 'Data Structures', semester: 6, section: 'A', date: new Date().toISOString().slice(0, 10), duration: 15, remaining_seconds: 600, is_already_marked: false }
    ];
  }

  if (endpoint === '/api/student/attendance/history' || endpoint === '/api/student/history') {
    return [
      { id: 'REC-901', date: '16/08/2026', time: '10:30 AM', subject_id: 'CS601', subject_name: 'Data Structures', subject_code: 'CS601', verification_score: 0.983, status: 'present' },
      { id: 'REC-884', date: '14/08/2026', time: '11:15 AM', subject_id: 'CS602', subject_name: 'DBMS', subject_code: 'CS602', verification_score: 0.971, status: 'present' },
      { id: 'REC-870', date: '12/08/2026', time: '02:00 PM', subject_id: 'CS603', subject_name: 'Web Technology', subject_code: 'CS603', verification_score: 0.954, status: 'present' },
      { id: 'REC-855', date: '10/08/2026', time: '09:15 AM', subject_id: 'CS604', subject_name: 'Software Engineering', subject_code: 'CS604', verification_score: 0.962, status: 'present' }
    ];
  }

  if (endpoint === '/api/voice/status') {
    return { is_enrolled: true, sample_count: 5 };
  }

  if (endpoint === '/api/voice/enroll') {
    return { message: 'Voice baseline profile enrolled successfully!' };
  }

  if (endpoint === '/api/voice/verify') {
    return {
      message: 'Voice verification successful! Attendance marked PRESENT.',
      verification: { score: '98.3%', threshold: '85.0%', status: 'MATCHED' }
    };
  }

  if (endpoint === '/api/admin/stats') {
    return {
      stats: { total_students: 48, total_faculty: 8, total_subjects: 12, total_records: 142 }
    };
  }

  if (endpoint === '/api/admin/students') {
    return [
      { id: 1, roll_number: 'ROLL-1001', name: 'Sarah Mitchell', semester: 6, section: 'A' },
      { id: 2, roll_number: 'ROLL-1002', name: 'James Okafor', semester: 6, section: 'A' },
      { id: 3, roll_number: 'ROLL-1003', name: 'Emily Chen', semester: 6, section: 'B' }
    ];
  }

  if (endpoint === '/api/admin/faculty') {
    return [
      { id: 1, name: 'Dr. Alan Turing', department: 'Computer Science', designation: 'Professor' },
      { id: 2, name: 'Dr. Grace Hopper', department: 'Software Engineering', designation: 'Associate Professor' }
    ];
  }

  if (endpoint === '/api/admin/subjects') {
    return [
      { id: 'CS601', subject_code: 'CS601', subject_name: 'Machine Learning & Neural Networks', semester: 6, section: 'A', faculty_name: 'Dr. Alan Turing' },
      { id: 'CS602', subject_code: 'CS602', subject_name: 'Voice Signal Processing', semester: 6, section: 'A', faculty_name: 'Dr. Grace Hopper' }
    ];
  }

  return { message: 'Operation successful' };
};
