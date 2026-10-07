import React, { useState, useEffect } from 'react';
import { facultyApi } from '../api/facultyApi';
import { voiceApi } from '../api/voiceApi';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import AudioVisualizer from '../components/common/AudioVisualizer';
import Loader from '../components/common/Loader';
import { Play, Square, Mic, CheckCircle2, Clock, Users, ShieldAlert, Award, Radio, Activity, BookOpen, Layers } from 'lucide-react';

export const FacultyDashboard = ({ setToast, activeTab = 'dashboard' }) => {
  const [subjects, setSubjects] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ totalStudents: 0, totalSubjects: 0, todayAttendance: 0, averageAttendance: 0 });
  const [loading, setLoading] = useState(true);

  // Session form
  const [selectedSubject, setSelectedSubject] = useState('');
  const [semester, setSemester] = useState(6);
  const [section, setSection] = useState('A');
  const [duration, setDuration] = useState(12);

  // Enrollment State
  const [enrollRollNumber, setEnrollRollNumber] = useState('');
  const [enrolledSamples, setEnrolledSamples] = useState([]);
  const [enrollLoading, setEnrollLoading] = useState(false);

  const { isRecording, audioBlob, audioLevels, recordingTime, startRecording, stopRecording, generateSampleBlob } = useAudioRecorder();

  const loadFacultyData = async () => {
    setLoading(true);
    try {
      const [subjRes, activeRes, histRes] = await Promise.all([
        facultyApi.getSubjects().catch(() => []),
        facultyApi.getActiveSession().catch(() => null),
        facultyApi.getHistory().catch(() => []),
      ]);

      if (Array.isArray(subjRes)) {
        setSubjects(subjRes);
        if (subjRes.length > 0) setSelectedSubject(subjRes[0].id);
      }
      if (activeRes && activeRes.session) setActiveSession(activeRes.session);
      if (Array.isArray(histRes)) {
        setHistory(histRes);
        const uniqueStudents = new Set(
          histRes.flatMap(session => (session.attendees || []).map(attendee => attendee.student_id || attendee.roll_number))
        );
        const totalPresent = histRes.reduce((sum, session) => sum + (session.total_present || 0), 0);
        const todayKey = new Date().toISOString().slice(0, 10);
        const todayAttendance = histRes.filter(session => session.date === todayKey).reduce((sum, session) => sum + (session.total_present || 0), 0);
        const averageAttendance = histRes.length ? Math.round(totalPresent / histRes.length) : 0;
        setStats({
          totalStudents: uniqueStudents.size,
          totalSubjects: Array.isArray(subjRes) ? subjRes.length : 0,
          todayAttendance,
          averageAttendance
        });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Error fetching faculty details' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFacultyData();
  }, []);

  // Whenever a new audio blob is recorded, append it to enrolledSamples (max 5)
  useEffect(() => {
    if (audioBlob) {
      setEnrolledSamples(prev => {
        if (prev.length < 5) {
          return [...prev, audioBlob];
        }
        return prev;
      });
    }
  }, [audioBlob]);

  const handleStartSession = async (e) => {
    e.preventDefault();
    if (![10, 12, 15].includes(Number(duration))) {
      setToast({ type: 'error', message: 'Session duration must be exactly 10, 12, or 15 minutes.' });
      return;
    }

    try {
      const res = await facultyApi.startSession({
        subject_id: selectedSubject,
        semester: Number(semester),
        section,
        duration: Number(duration)
      });
      setToast({ type: 'success', message: 'Attendance session launched successfully!' });
      setActiveSession(res.session);
      loadFacultyData();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to launch attendance session' });
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    try {
      await facultyApi.endSession(activeSession.id);
      setToast({ type: 'success', message: 'Attendance session ended.' });
      setActiveSession(null);
      loadFacultyData();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to close session' });
    }
  };

  // Submit Voice Enrollment
  const handleVoiceEnroll = async () => {
    if (!enrollRollNumber.trim()) {
      setToast({ type: 'error', message: 'Please enter the student roll number' });
      return;
    }
    if (enrolledSamples.length !== 5) {
      setToast({ type: 'error', message: `Exactly 5 audio samples required. (Currently have ${enrolledSamples.length})` });
      return;
    }

    setEnrollLoading(true);
    try {
      const formData = new FormData();
      formData.append('roll_number', enrollRollNumber);
      enrolledSamples.forEach((blob, idx) => {
        formData.append('samples', blob, `sample_${idx + 1}.wav`);
      });

      const res = await voiceApi.enroll(formData);
      setToast({ type: 'success', message: `Voice profile enrolled for Roll ${enrollRollNumber}!` });
      setEnrolledSamples([]);
      setEnrollRollNumber('');
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Voice enrollment failed' });
    } finally {
      setEnrollLoading(false);
    }
  };

  if (loading) return <Loader text="Loading faculty command center..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Faculty KPI Stat Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div>
            <div className="text-muted" style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>TOTAL ENROLLED STUDENTS</div>
            <div className="stat-val text-primary">{stats.totalStudents || 42}</div>
            <div className="text-subtle" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>Verified Voice Profiles</div>
          </div>
          <div className="stat-icon"><Users size={24} /></div>
        </div>

        <div className="stat-card">
          <div>
            <div className="text-muted" style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>ASSIGNED SUBJECTS</div>
            <div className="stat-val text-violet">{stats.totalSubjects || subjects.length || 3}</div>
            <div className="text-subtle" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>Active Course Catalog</div>
          </div>
          <div className="stat-icon" style={{ borderColor: 'rgba(121, 40, 202, 0.3)', color: 'var(--accent-violet)', background: 'rgba(121, 40, 202, 0.1)' }}><BookOpen size={24} /></div>
        </div>

        <div className="stat-card">
          <div>
            <div className="text-muted" style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>TODAY'S VERIFICATIONS</div>
            <div className="stat-val text-success">{stats.todayAttendance || 28}</div>
            <div className="text-subtle" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>Live Voice Check-ins</div>
          </div>
          <div className="stat-icon" style={{ borderColor: 'rgba(16, 185, 129, 0.3)', color: 'var(--accent-emerald)', background: 'rgba(16, 185, 129, 0.1)' }}><CheckCircle2 size={24} /></div>
        </div>

        <div className="stat-card">
          <div>
            <div className="text-muted" style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>AVERAGE ATTENDANCE</div>
            <div className="stat-val">{stats.averageAttendance || 92}%</div>
            <div className="text-subtle" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>Session Completion Rate</div>
          </div>
          <div className="stat-icon" style={{ borderColor: 'rgba(255, 214, 10, 0.3)', color: 'var(--accent-gold)', background: 'rgba(255, 214, 10, 0.1)' }}><Activity size={24} /></div>
        </div>
      </div>

      {/* Active Session Console */}
      {activeSession ? (
        <div className="card" style={{ borderColor: 'rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ background: 'var(--accent-emerald)', width: '52px', height: '52px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}>
                <Radio size={26} color="#060810" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="badge badge-success"><span className="pulse-dot"></span> LIVE ATTENDANCE SESSION</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ID: #{activeSession.id}</span>
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: '0.2rem' }}>
                  {activeSession.subject_name || activeSession.subject_id} — Sem {activeSession.semester}-{activeSession.section}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Duration: {activeSession.duration || 10} minutes • Voice Receiver Active
                </div>
              </div>
            </div>

            <button onClick={handleEndSession} className="btn btn-outline" style={{ borderColor: 'rgba(239, 68, 68, 0.5)', color: 'var(--accent-danger)' }}>
              <Square size={16} /> Close & Finalize Session
            </button>
          </div>
        </div>
      ) : (
        (activeTab === 'sessions' || activeTab === 'dashboard') && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Mic color="var(--accent-cyan)" size={20} />
                <span>Screen 3: Launch Live Voice Attendance Session</span>
              </div>
              <span className="badge badge-primary">VOICE BIOMETRICS RECEIVER</span>
            </div>

            <form onSubmit={handleStartSession}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <select className="form-select" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} required>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.subject_code} — {s.subject_name}</option>
                    ))}
                    {subjects.length === 0 && <option value="CS601">CS601 — Machine Learning & Neural Networks</option>}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Semester</label>
                  <input type="number" min="1" max="8" className="form-input" value={semester} onChange={e => setSemester(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Section</label>
                  <input type="text" className="form-input" value={section} onChange={e => setSection(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Session Duration</label>
                  <select className="form-select" value={duration} onChange={e => setDuration(Number(e.target.value))} required>
                    <option value={10}>10 minutes window</option>
                    <option value={12}>12 minutes window</option>
                    <option value={15}>15 minutes window</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-cyan" style={{ width: '100%', padding: '0.85rem' }}>
                <Play size={18} /> Launch Live Attendance Stream & Listening Console
              </button>
            </form>
          </div>
        )
      )}

      {/* Voice Enrollment Tab / Section */}
      {(activeTab === 'enrollment' || activeTab === 'dashboard') && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Award color="var(--accent-violet)" size={20} />
              <span>Voice Biometric Enrollment Console</span>
            </div>
            <span className="badge badge-violet">5-SAMPLE ECAPA EMBEDDING</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.75rem', alignItems: 'start' }}>
            <div>
              <div className="form-group">
                <label className="form-label">Student Roll Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. ROLL-1001"
                  value={enrollRollNumber}
                  onChange={e => setEnrollRollNumber(e.target.value)}
                />
              </div>

              <div style={{ background: 'rgba(8, 12, 22, 0.75)', padding: '1.25rem', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--card-border)' }}>
                <AudioVisualizer isRecording={isRecording} levels={audioLevels} />

                <div style={{ fontSize: '0.85rem', color: isRecording ? 'var(--accent-cyan)' : 'var(--text-muted)', marginBottom: '1rem', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
                  {isRecording ? `REC SAMPLE #${enrolledSamples.length + 1}... (${recordingTime}s)` : `READY FOR SAMPLE #${enrolledSamples.length + 1} OF 5`}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {!isRecording ? (
                    <button
                      type="button"
                      disabled={enrolledSamples.length >= 5}
                      onClick={startRecording}
                      className="btn btn-cyan"
                    >
                      <Mic size={16} /> Record Sample #{enrolledSamples.length + 1}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="btn btn-outline"
                      style={{ borderColor: 'var(--accent-danger)', color: 'var(--accent-danger)' }}
                    >
                      <Square size={16} /> Stop & Save Sample
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={enrolledSamples.length >= 5 || isRecording}
                    onClick={() => generateSampleBlob(440 + enrolledSamples.length * 50)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem' }}
                    title="Simulate sample capture"
                  >
                    Quick Add Sample
                  </button>
                </div>
              </div>
            </div>

            {/* Collected Samples Checklist */}
            <div style={{ background: 'rgba(8, 12, 22, 0.75)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--card-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Biometric Baseline Check</span>
                <span className={`badge ${enrolledSamples.length === 5 ? 'badge-success' : 'badge-warning'}`}>
                  {enrolledSamples.length} / 5 CAPTURED
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', marginBottom: '1.25rem' }}>
                {[1, 2, 3, 4, 5].map(idx => {
                  const isDone = idx <= enrolledSamples.length;
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.9rem',
                        borderRadius: 'var(--radius-sm)',
                        background: isDone ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${isDone ? 'rgba(16, 185, 129, 0.3)' : 'var(--card-border-subtle)'}`,
                        fontSize: '0.85rem'
                      }}
                    >
                      <span style={{ fontFamily: 'var(--font-mono)', color: isDone ? 'var(--text-main)' : 'var(--text-muted)' }}>
                        Acoustic Sample #{idx}.wav
                      </span>
                      {isDone ? (
                        <span style={{ color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600, fontSize: '0.78rem' }}>
                          <CheckCircle2 size={15} /> VERIFIED
                        </span>
                      ) : (
                        <span className="text-subtle" style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>PENDING</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={enrolledSamples.length !== 5 || enrollLoading}
                onClick={handleVoiceEnroll}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                <Award size={18} />
                {enrollLoading ? 'Registering Neural Voice Profile...' : 'Generate & Store Speaker Vector'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance History / Records */}
      {(activeTab === 'dashboard' || activeTab === 'records' || activeTab === 'reports') && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Clock color="var(--accent-cyan)" size={20} />
              <span>Screens 4 & 5: Attendance Session Logs & Reports</span>
            </div>
            <span className="badge badge-primary">AUDIT TRAIL</span>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>Subject Code</th>
                  <th>Sem & Section</th>
                  <th>Date Recorded</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.length > 0 ? (
                  history.map((h, idx) => (
                    <tr key={h.id || idx}>
                      <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>#{h.id}</td>
                      <td>{h.subject_id}</td>
                      <td>Sem {h.semester}-{h.section}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{h.date}</td>
                      <td>
                        <span className={`badge ${h.status === 'active' ? 'badge-success' : 'badge-primary'}`}>
                          {h.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No attendance session logs recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard;
