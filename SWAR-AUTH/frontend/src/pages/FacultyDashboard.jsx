import React, { useState, useEffect } from 'react';
import { facultyApi } from '../api/facultyApi';
import { voiceApi } from '../api/voiceApi';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import AudioVisualizer from '../components/common/AudioVisualizer';
import Loader from '../components/common/Loader';
import { Play, Square, Mic, CheckCircle2, Clock, Users, ShieldAlert, Award } from 'lucide-react';

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

  if (loading) return <Loader text="Loading faculty workspace..." />;

  return (
    <div>
      {/* Active Session Status Header */}
      {activeSession ? (
        <div className="card" style={{ borderColor: 'var(--accent-success)', background: 'rgba(16, 185, 129, 0.08)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'var(--accent-success)', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={22} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-success)', textTransform: 'uppercase' }}>
                  Session Live & Active
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  {activeSession.subject_name || activeSession.subject_id} | Sem {activeSession.semester}-{activeSession.section}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Duration {activeSession.duration || 10} mins • Created at {new Date(activeSession.created_at || Date.now()).toLocaleTimeString()}
                </div>
              </div>
            </div>

            <button onClick={handleEndSession} className="btn btn-danger">
              <Square size={16} /> Close Attendance
            </button>
          </div>
        </div>
      ) : (
        activeTab === 'sessions' && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Start New Attendance Session</h3>
            <form onSubmit={handleStartSession}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <select className="form-select" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} required>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.subject_code} - {s.subject_name}</option>
                    ))}
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
                  <label className="form-label">Duration</label>
                  <select className="form-select" value={duration} onChange={e => setDuration(Number(e.target.value))} required>
                    <option value={10}>10 minutes</option>
                    <option value={12}>12 minutes</option>
                    <option value={15}>15 minutes</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <Play size={18} /> Launch Live Attendance Session
              </button>
            </form>
          </div>
        )
      )}

      {/* Voice Enrollment Tab / Section */}
      {(activeTab === 'enrollment' || activeTab === 'dashboard') && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '0.5rem', borderRadius: '10px', color: 'var(--accent-primary)' }}>
              <Mic size={22} />
            </div>
            <div>
              <h3>Faculty Student Voice Enrollment</h3>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                Record exactly 5 WAV audio samples for a student roll number to generate deep-learning ECAPA speaker embeddings.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
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

              <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--card-border)' }}>
                <AudioVisualizer isRecording={isRecording} levels={audioLevels} />

                <div style={{ fontSize: '0.9rem', color: isRecording ? 'var(--accent-danger)' : 'var(--text-muted)', marginBottom: '1rem', fontWeight: 500 }}>
                  {isRecording ? `Recording Sample #${enrolledSamples.length + 1}... (${recordingTime}s)` : `Ready for Sample #${enrolledSamples.length + 1}`}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                  {!isRecording ? (
                    <button
                      type="button"
                      disabled={enrolledSamples.length >= 5}
                      onClick={startRecording}
                      className="btn btn-primary"
                    >
                      <Mic size={16} /> Record Sample #{enrolledSamples.length + 1}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="btn btn-danger recording-pulse"
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
                    title="Generate test WAV sample automatically"
                  >
                    Quick Add Sample
                  </button>
                </div>
              </div>
            </div>

            {/* Collected Samples Status */}
            <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--card-border)' }}>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>Collected Samples</span>
                <span className={`badge ${enrolledSamples.length === 5 ? 'badge-success' : 'badge-warning'}`}>
                  {enrolledSamples.length} / 5
                </span>
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {[1, 2, 3, 4, 5].map(idx => {
                  const isDone = idx <= enrolledSamples.length;
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'space-between',
                        padding: '0.6rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        background: isDone ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-surface)',
                        border: `1px solid ${isDone ? 'rgba(16, 185, 129, 0.3)' : 'var(--card-border)'}`,
                        fontSize: '0.85rem'
                      }}
                    >
                      <span>Sample Audio File #{idx}.wav</span>
                      {isDone ? (
                        <span style={{ color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                          <CheckCircle2 size={16} /> Captured
                        </span>
                      ) : (
                        <span className="text-muted">Pending</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={enrolledSamples.length !== 5 || enrollLoading}
                onClick={handleVoiceEnroll}
                className="btn btn-success"
                style={{ width: '100%' }}
              >
                <Award size={18} />
                {enrollLoading ? 'Processing Biometric Profile...' : 'Submit & Register Voice Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance History */}
      {(activeTab === 'dashboard' || activeTab === 'reports') && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Faculty Attendance History Log</h3>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>Subject</th>
                  <th>Sem / Sec</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.length > 0 ? (
                  history.map((h, idx) => (
                    <tr key={h.id || idx}>
                      <td style={{ fontWeight: 600 }}>{h.id}</td>
                      <td>{h.subject_id}</td>
                      <td>Sem {h.semester}-{h.section}</td>
                      <td>{h.date}</td>
                      <td>
                        <span className={`badge ${h.status === 'active' ? 'badge-success' : 'badge-primary'}`}>
                          {h.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No prior attendance session logs found.
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
