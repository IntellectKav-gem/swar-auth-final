import React, { useState } from 'react';
import { authApi } from '../api/authApi';
import { Mic, ShieldCheck, LogIn, UserPlus } from 'lucide-react';

export const LoginPage = ({ onLoginSuccess, setToast }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [semester, setSemester] = useState(6);
  const [section, setSection] = useState('A');
  const [designation, setDesignation] = useState('Professor');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        if (role === 'admin') {
          setToast({ type: 'error', message: 'Public Admin registration is blocked. Contact system admin.' });
          setLoading(false);
          return;
        }

        const payload = {
          name,
          email,
          password,
          role,
          department,
          ...(role === 'student' ? { roll_number: rollNumber, semester: Number(semester), section } : { designation })
        };

        const res = await authApi.register(payload);
        setToast({ type: 'success', message: 'Registration successful! Welcome to SWAR-AUTH.' });
        onLoginSuccess(res.token, res.user);
      } else {
        const res = await authApi.login({ email, password });
        setToast({ type: 'success', message: `Welcome back, ${res.user.name}!` });
        onLoginSuccess(res.token, res.user);
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Authentication failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top right, #1e1b4b, #0f172a)',
      padding: '1.5rem'
    }}>
      <div className="card card-glass" style={{ width: '100%', maxWidth: '440px', padding: '2.25rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'var(--accent-primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Mic size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>SWAR-AUTH</h1>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>Voice Biometric Attendance Platform</p>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          background: '#0f172a',
          padding: '0.25rem',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1.5rem',
          border: '1px solid var(--card-border)'
        }}>
          <button
            type="button"
            onClick={() => setIsRegister(false)}
            style={{
              flex: 1,
              padding: '0.5rem',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: !isRegister ? 'var(--bg-surface)' : 'transparent',
              color: !isRegister ? '#fff' : 'var(--text-muted)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => setIsRegister(true)}
            style={{
              flex: 1,
              padding: '0.5rem',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: isRegister ? 'var(--bg-surface)' : 'transparent',
              color: isRegister ? '#fff' : 'var(--text-muted)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Self Register
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Account Role</label>
                <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty Member</option>
                </select>
              </div>

              {role === 'student' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Roll Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. ROLL-1001"
                      value={rollNumber}
                      onChange={e => setRollNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Semester (1-8)</label>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        className="form-input"
                        value={semester}
                        onChange={e => setSemester(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Section</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="A/B/C"
                        value={section}
                        onChange={e => setSection(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {role === 'faculty' && (
                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Professor / Asst. Professor"
                    value={designation}
                    onChange={e => setDesignation(e.target.value)}
                    required
                  />
                </div>
              )}
            </>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="user@swarauth.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem' }}
          >
            {isRegister ? <UserPlus size={18} /> : <LogIn size={18} />}
            {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
