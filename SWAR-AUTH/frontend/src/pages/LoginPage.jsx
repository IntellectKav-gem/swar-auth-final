import React, { useState } from 'react';
import { authApi } from '../api/authApi';
import { ShieldCheck, LogIn, UserPlus, Activity, Lock } from 'lucide-react';
import SwarBackground from '../components/common/SwarBackground';
import Logo from '../components/common/Logo';

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
    <div className="auth-page">
      <SwarBackground />

      <header className="auth-nav">
        <Logo size="md" subtitle={true} />
        <div className="brand-status">
          <span className="pulse-dot" style={{ background: '#4cff91' }}></span>
          <span>Neural Engine Operational</span>
        </div>
      </header>

      <main className="auth-layout">
        <section className="auth-story">
          <div className="eyebrow">
            <span></span> Neural Voice Biometrics
          </div>
          <h1>Your voice.<br /><strong>Zero friction.</strong></h1>
          <p>Next-generation attendance & authentication powered by 140+ vocal biomarkers. Zero cards to tap, zero passwords to lose.</p>

          <div className="voice-core">
            <div className="voice-rings">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
              <Logo size="xl" showText={false} animated={true} />
            </div>
            <div className="voice-wave">
              {[14, 24, 38, 20, 48, 30, 58, 36, 24, 46, 32, 18, 42, 28, 14].map((height, idx) => (
                <i key={idx} style={{ height: `${height}px`, animationDelay: `${idx * 80}ms` }} />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(12, 18, 30, 0.65)', border: '1px solid var(--card-border)', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
              <ShieldCheck size={18} color="var(--accent-cyan)" />
              <div>
                <div style={{ fontWeight: 600, color: '#fff' }}>128-Bit Acoustic Signature</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cryptographically Verified</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(12, 18, 30, 0.65)', border: '1px solid var(--card-border)', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
              <Activity size={18} color="var(--accent-violet)" />
              <div>
                <div style={{ fontWeight: 600, color: '#fff' }}>99.97% Match Precision</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>&lt;180ms Neural Inference</div>
              </div>
            </div>
          </div>
        </section>

        <section className="card card-glass">
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="badge badge-primary" style={{ marginBottom: '0.6rem' }}>
              <Lock size={12} /> SECURE IDENTITY PORTAL
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              {isRegister ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-muted" style={{ fontSize: '0.88rem' }}>
              {isRegister ? 'Register for AI voice-enabled attendance.' : 'Sign in to access your attendance workspace.'}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="auth-tabs">
            <button
              type="button"
              onClick={() => setIsRegister(false)}
              className={!isRegister ? 'active' : ''}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsRegister(true)}
              className={isRegister ? 'active' : ''}
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
                    placeholder="e.g. Dr. Alan Turing / Sarah Jenkins"
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
              className="auth-submit"
            >
              {isRegister ? <UserPlus size={18} /> : <LogIn size={18} />}
              {loading ? 'Processing Authentication...' : isRegister ? 'Create Voice Identity' : 'Sign In to Workspace'}
            </button>
          </form>

          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--card-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
            <ShieldCheck size={14} color="var(--accent-cyan)" />
            <span>Biometric audio data is encrypted and zero-knowledge protected.</span>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LoginPage;
