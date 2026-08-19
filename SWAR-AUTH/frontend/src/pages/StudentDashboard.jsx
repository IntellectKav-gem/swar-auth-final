import React, { useState, useEffect } from 'react';
import { studentApi } from '../api/studentApi';
import { voiceApi } from '../api/voiceApi';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import AudioVisualizer from '../components/common/AudioVisualizer';
import Loader from '../components/common/Loader';
import { Mic, CheckCircle2, Clock, ShieldCheck, Square, AlertTriangle, Calendar } from 'lucide-react';

export const StudentDashboard = ({ setToast, user, activeTab = 'dashboard' }) => {
  const [voiceStatus, setVoiceStatus] = useState(null);
  const [activeSessions, setActiveSessions] = useState([]);
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState({ overallPercentage: 0, todayAttendance: 0, totalSubjects: 0, alerts: [] });
  const [loading, setLoading] = useState(true);

  // Verification Modal / Action state
  const [selectedSession, setSelectedSession] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const { isRecording, audioBlob, audioLevels, recordingTime, startRecording, stopRecording, generateSampleBlob } = useAudioRecorder();

  const loadStudentData = async () => {
    setLoading(true);
    try {
      const [vStatus, actSess, histRes] = await Promise.all([
        voiceApi.getStatus().catch(() => null),
        studentApi.getActiveSessions().catch(() => []),
        studentApi.getHistory().catch(() => []),
      ]);

      if (vStatus) setVoiceStatus(vStatus);
      if (Array.isArray(actSess)) setActiveSessions(actSess);
      if (Array.isArray(histRes)) setHistory(histRes);

      const overallPercentage = histRes?.length ? Math.min(100, Math.round((histRes.length / Math.max(1, actSess.length + histRes.length)) * 100)) : 0;
      const todayKey = new Date().toISOString().slice(0, 10);
      const todayAttendance = histRes.filter(record => record.date === todayKey).length;
      const alerts = overallPercentage < 75 ? ['Attendance is below the 75% target.'] : [];
      setSummary({
        overallPercentage,
        todayAttendance,
        totalSubjects: Math.max(1, histRes.length ? new Set(histRes.map(item => item.subject_code || item.subject_id)).size : 0),
        alerts
      });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Error loading student data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, []);

  // Execute Voice Verification
  const handleVerifyAttendance = async () => {
    if (!selectedSession) {
      setToast({ type: 'error', message: 'Please select an active session for verification' });
      return;
    }
    let blobToUpload = audioBlob;
    if (!blobToUpload) {
      blobToUpload = generateSampleBlob(440);
    }

    setVerifyLoading(true);
    setVerificationResult(null);

    try {
      const formData = new FormData();
      formData.append('session_id', selectedSession.id);
      formData.append('audio', blobToUpload, 'student_voice_verification.wav');

      const res = await voiceApi.verify(formData);
      setVerificationResult(res);
      setToast({ type: 'success', message: res.message || 'Voice verification successful! Attendance marked PRESENT.' });
      loadStudentData();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Voice verification failed' });
    } finally {
      setVerifyLoading(false);
    }
  };

  if (loading) return <Loader text="Loading student workspace..." />;

  return (
    <div>
      {/* Student Profile & Biometric Status Banner */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>
              Welcome, {user?.name || 'Student'}
            </h2>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>
              Roll Number: <strong style={{ color: '#fff' }}>{user?.roll_number || 'N/A'}</strong> | Department: {user?.department || 'Computer Science'} | Sem {user?.semester || 6}-{user?.section || 'A'}
            </p>
          </div>

          <div>
            {voiceStatus?.is_enrolled ? (
              <span className="badge badge-success" style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}>
                <CheckCircle2 size={16} /> Voice Profile Enrolled ({voiceStatus.sample_count} Samples)
              </span>
            ) : (
              <span className="badge badge-warning" style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}>
                <AlertTriangle size={16} /> Voice Profile Pending Enrollment
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Active Sessions for Verification */}
      {(activeTab === 'verification' || activeTab === 'sessions' || activeTab === 'dashboard') && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.5rem', borderRadius: '10px', color: 'var(--accent-success)' }}>
              <Clock size={22} />
            </div>
            <div>
              <h3>Active Attendance Sessions</h3>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                Select an active session to authenticate your identity via voice biometric verification.
              </p>
            </div>
          </div>

          {activeSessions.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {activeSessions.map((sess) => {
                const isSelected = selectedSession?.id === sess.id;
                return (
                  <div
                    key={sess.id}
                    onClick={() => setSelectedSession(sess)}
                    style={{
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-dark)',
                      border: `2px solid ${isSelected ? 'var(--accent-primary)' : 'var(--card-border)'}`,
                      cursor: 'pointer',
                      transition: 'all 150ms ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span className="badge badge-success">Live Session</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{sess.date}</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      Subject: {sess.subject_id}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Sem {sess.semester} - Section {sess.section}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', background: '#0f172a', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid var(--card-border)' }}>
              <p className="text-muted">No active attendance sessions currently open for your semester & section.</p>
            </div>
          )}

          {/* Voice Verification Panel */}
          {selectedSession && (
            <div style={{ background: '#0f172a', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-primary)' }}>
              <h4 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mic size={18} className="text-primary" />
                Voice Biometric Verification for Session {selectedSession.id}
              </h4>

              <AudioVisualizer isRecording={isRecording} levels={audioLevels} />

              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  Speak clearly into your microphone: <em>"My voice is my password and authentication."</em>
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                  {!isRecording ? (
                    <button type="button" onClick={startRecording} className="btn btn-primary">
                      <Mic size={16} /> Record Voice Verification
                    </button>
                  ) : (
                    <button type="button" onClick={stopRecording} className="btn btn-danger recording-pulse">
                      <Square size={16} /> Stop Recording ({recordingTime}s)
                    </button>
                  )}
                </div>
              </div>

              {audioBlob && (
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <button
                    type="button"
                    disabled={verifyLoading}
                    onClick={handleVerifyAttendance}
                    className="btn btn-success"
                    style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
                  >
                    <ShieldCheck size={20} />
                    {verifyLoading ? 'Computing Cosine Similarity...' : 'Authenticate & Log Attendance'}
                  </button>
                </div>
              )}

              {/* Verification Result Feedback Card */}
              {verificationResult && (
                <div style={{
                  marginTop: '1.25rem',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--accent-success)', marginBottom: '0.25rem' }}>
                    {verificationResult.message}
                  </div>
                  {verificationResult.verification && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Similarity Score: <strong style={{ color: '#fff' }}>{verificationResult.verification.score}</strong> | Threshold: {verificationResult.verification.threshold} | Status: <span className="badge badge-success">{verificationResult.verification.status}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Student Attendance History */}
      {(activeTab === 'dashboard' || activeTab === 'reports') && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Personal Attendance History</h3>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Subject</th>
                  <th>Verification Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.length > 0 ? (
                  history.map((rec, idx) => (
                    <tr key={rec.id || idx}>
                      <td>{rec.date}</td>
                      <td>{rec.time}</td>
                      <td style={{ fontWeight: 600 }}>{rec.subject_id}</td>
                      <td>{rec.verification_score ? `${(rec.verification_score * 100).toFixed(1)}%` : 'N/A'}</td>
                      <td>
                        <span className="badge badge-success">PRESENT</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No verified attendance logs yet.
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

export default StudentDashboard;
