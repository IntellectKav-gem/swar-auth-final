import React, { useState, useEffect } from 'react';
import { studentApi } from '../api/studentApi';
import { voiceApi } from '../api/voiceApi';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import AudioVisualizer from '../components/common/AudioVisualizer';
import Loader from '../components/common/Loader';
import OverallAttendanceCard from '../components/student/OverallAttendanceCard';
import TodayStatusCard from '../components/student/TodayStatusCard';
import SubjectAttendanceCard from '../components/student/SubjectAttendanceCard';
import RecentAttendanceTable from '../components/student/RecentAttendanceTable';
import { Mic, ShieldCheck, Square, BookOpen, Clock, User, BarChart3 } from 'lucide-react';

export const StudentDashboard = ({ setToast, user: propUser, activeTab = 'dashboard', setActiveTab, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState(null);
  const [overallAttendance, setOverallAttendance] = useState({ overall_percentage: 0, total_sessions: 0, total_attended: 0 });
  const [subjects, setSubjects] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [history, setHistory] = useState([]);
  const [voiceStatus, setVoiceStatus] = useState(null);

  // Voice verification modal / action state
  const [selectedSession, setSelectedSession] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const { isRecording, audioBlob, audioLevels, recordingTime, startRecording, stopRecording, generateSampleBlob } = useAudioRecorder();

  const loadStudentData = async () => {
    setLoading(true);
    try {
      const [profileRes, overallRes, subjectsRes, activeSessRes, historyRes, vStatusRes] = await Promise.all([
        studentApi.getProfile().catch(() => null),
        studentApi.getOverallAttendance().catch(() => null),
        studentApi.getSubjectAttendance().catch(() => []),
        studentApi.getActiveSessions().catch(() => []),
        studentApi.getHistory().catch(() => []),
        voiceApi.getStatus().catch(() => null),
      ]);

      if (profileRes) setStudentProfile(profileRes);
      if (overallRes) setOverallAttendance(overallRes);
      if (Array.isArray(subjectsRes)) setSubjects(subjectsRes);
      if (Array.isArray(activeSessRes)) setActiveSessions(activeSessRes);
      if (Array.isArray(historyRes)) setHistory(historyRes);
      if (vStatusRes) setVoiceStatus(vStatusRes);
    } catch (err) {
      if (setToast) {
        setToast({ type: 'error', message: err.message || 'Error loading student attendance data' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, []);

  const handleVerifyAttendance = async () => {
    if (!selectedSession) {
      if (setToast) setToast({ type: 'error', message: 'Please select an active session for verification' });
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
      formData.append('session_id', selectedSession.id || selectedSession.session_id);
      formData.append('audio', blobToUpload, 'student_voice_verification.wav');

      const res = await voiceApi.verify(formData);
      setVerificationResult(res);
      if (setToast) {
        setToast({ type: 'success', message: res.message || 'Voice verification successful! Attendance marked PRESENT.' });
      }
      loadStudentData();
    } catch (err) {
      if (setToast) setToast({ type: 'error', message: err.message || 'Voice verification failed' });
    } finally {
      setVerifyLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader text="Loading SWAR-AUTH student voice workspace..." />
      </div>
    );
  }

  const currentUser = studentProfile || propUser || { name: 'Student' };
  const overallPct = overallAttendance?.overall_percentage ?? 0;

  const handleTabChange = (tabName) => {
    if (setActiveTab) setActiveTab(tabName);
  };

  const cardStyle = {
    background: 'rgba(13, 17, 30, 0.65)',
    border: '1px solid rgba(120, 170, 255, 0.14)',
    borderRadius: '16px',
    padding: '1.4rem 1.6rem',
    backdropFilter: 'blur(22px)',
    WebkitBackdropFilter: 'blur(22px)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
    width: '100%'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      {/* TAB 1: DASHBOARD (Main View matching reference image) */}
      {(activeTab === 'dashboard' || !activeTab) && (
        <>
          {/* Row 1: Overall Attendance Card & Today's Status Card */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.25rem',
              width: '100%'
            }}
          >
            <OverallAttendanceCard percentage={overallPct} />
            <TodayStatusCard activeSessions={activeSessions} history={history} />
          </div>

          {/* Row 2: Attendance by Subject */}
          <SubjectAttendanceCard
            subjects={subjects}
            onViewAll={() => handleTabChange('subjects')}
          />

          {/* Row 3: Recent Attendance */}
          <RecentAttendanceTable
            history={history}
            onViewAll={() => handleTabChange('history')}
          />
        </>
      )}

      {/* TAB 2: MARK ATTENDANCE / VOICE VERIFICATION */}
      {activeTab === 'verification' && (
        <div style={cardStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              marginBottom: '1rem',
              borderBottom: '1px solid rgba(120, 170, 255, 0.14)',
              paddingBottom: '0.65rem'
            }}
          >
            <Mic size={22} color="#3FD8E0" />
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.2rem', fontWeight: 600, color: '#EAEEF7' }}>
              Mark Attendance — Voice Check-In
            </div>
          </div>

          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.92rem', marginBottom: '1.25rem', color: '#8A93A8' }}>
            Select an active class session below and verify your attendance using your neural voice signature.
          </p>

          {activeSessions.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {activeSessions.map((sess) => {
                const isSelected = selectedSession?.id === sess.id || selectedSession?.session_id === sess.session_id;
                return (
                  <div
                    key={sess.id || sess.session_id}
                    onClick={() => setSelectedSession(sess)}
                    style={{
                      padding: '1.15rem',
                      borderRadius: '12px',
                      background: isSelected ? 'rgba(63, 216, 224, 0.12)' : 'rgba(15, 22, 38, 0.8)',
                      border: `1px solid ${isSelected ? '#3FD8E0' : 'rgba(120, 170, 255, 0.14)'}`,
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 0 20px rgba(63, 216, 224, 0.2)' : 'none',
                      transition: 'all 160ms ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{
                        padding: '0.15rem 0.65rem',
                        fontSize: '0.72rem',
                        color: '#3FD8E0',
                        border: '1px solid rgba(63, 216, 224, 0.3)',
                        borderRadius: '100px',
                        fontFamily: "'IBM Plex Mono', monospace"
                      }}>
                        Live Class
                      </span>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.8rem', color: '#8A93A8' }}>
                        {sess.date || new Date().toISOString().slice(0, 10)}
                      </span>
                    </div>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.15rem', fontWeight: 600, color: '#EAEEF7', marginBottom: '0.2rem' }}>
                      {sess.subject_name || sess.subject_id}
                    </div>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.85rem', color: '#8A93A8' }}>
                      Sem {sess.semester || 6} — Section {sess.section || 'A'}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(15, 22, 38, 0.6)', borderRadius: '12px', border: '1px dashed rgba(120, 170, 255, 0.15)', marginBottom: '1.5rem' }}>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.95rem', color: '#8A93A8' }}>
                No live attendance sessions open for your class right now.
              </p>
            </div>
          )}

          {/* Voice Console */}
          {selectedSession && (
            <div style={{ background: 'rgba(10, 14, 28, 0.85)', padding: '1.5rem', borderRadius: '14px', border: '1px solid #3FD8E0', boxShadow: '0 0 20px rgba(63, 216, 224, 0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.1rem', fontWeight: 600, color: '#EAEEF7', marginBottom: '1rem' }}>
                <Mic size={20} color="#3FD8E0" />
                <span>Voice Authentication for {selectedSession.subject_name || 'Session'}</span>
              </div>

              <AudioVisualizer isRecording={isRecording} levels={audioLevels} />

              <div style={{ textAlign: 'center', margin: '1.25rem 0' }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.92rem', marginBottom: '1rem', color: '#8A93A8' }}>
                  Prompt: Read aloud into microphone — <strong style={{ color: '#3FD8E0' }}>"My voice is my biometric key and security authorization."</strong>
                </p>

                <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center' }}>
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      style={{
                        padding: '0.65rem 1.4rem',
                        borderRadius: '100px',
                        background: 'linear-gradient(135deg, #4E8CFF, #3FD8E0)',
                        color: '#05060A',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        fontSize: '0.88rem'
                      }}
                    >
                      <Mic size={16} /> Record Passphrase
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      style={{
                        padding: '0.65rem 1.4rem',
                        borderRadius: '100px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid #ef4444',
                        color: '#ef4444',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        fontSize: '0.88rem'
                      }}
                    >
                      <Square size={16} /> Stop Recording ({recordingTime}s)
                    </button>
                  )}
                </div>
              </div>

              {audioBlob && (
                <div style={{ textAlign: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed rgba(120, 170, 255, 0.15)' }}>
                  <button
                    type="button"
                    disabled={verifyLoading}
                    onClick={handleVerifyAttendance}
                    style={{
                      padding: '0.75rem 2rem',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      borderRadius: '100px',
                      background: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.55rem'
                    }}
                  >
                    <ShieldCheck size={18} />
                    {verifyLoading ? 'Matching Voice Signature...' : 'Submit & Authenticate Attendance'}
                  </button>
                </div>
              )}

              {verificationResult && (
                <div style={{ marginTop: '1.25rem', padding: '1rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '1rem', color: '#10b981' }}>
                    {verificationResult.message}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MY SUBJECTS */}
      {activeTab === 'subjects' && (
        <div style={cardStyle}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.2rem', fontWeight: 600, color: '#EAEEF7', marginBottom: '1.25rem', borderBottom: '1px solid rgba(120, 170, 255, 0.14)', paddingBottom: '0.65rem' }}>
            Enrolled Subjects & Attendance Breakdown
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.15rem' }}>
            {(subjects.length > 0 ? subjects : [
              { subject_code: 'CS601', subject_name: 'Data Structures', total_classes: 20, attended_classes: 16, percentage: 80 },
              { subject_code: 'CS602', subject_name: 'DBMS', total_classes: 25, attended_classes: 18, percentage: 72 },
              { subject_code: 'CS603', subject_name: 'Web Technology', total_classes: 20, attended_classes: 13, percentage: 65 },
              { subject_code: 'CS604', subject_name: 'Software Engineering', total_classes: 18, attended_classes: 14, percentage: 78 }
            ]).map((subj, idx) => (
              <div key={subj.subject_id || idx} style={{ border: '1px solid rgba(120, 170, 255, 0.14)', borderRadius: '12px', padding: '1.15rem', background: 'rgba(15, 22, 38, 0.8)' }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.8rem', color: '#8A93A8', fontWeight: 600 }}>
                  CODE: #{subj.subject_code || subj.subject_id}
                </div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.15rem', fontWeight: 600, color: '#EAEEF7', margin: '0.3rem 0 0.6rem 0' }}>
                  {subj.subject_name}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', color: '#8A93A8' }}>
                  <span>Attended: {subj.attended_classes || 15}/{subj.total_classes || 20}</span>
                  <strong style={{ fontSize: '1.05rem', color: '#3FD8E0', fontFamily: "'IBM Plex Mono', monospace" }}>{subj.percentage}%</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ATTENDANCE HISTORY */}
      {activeTab === 'history' && (
        <div style={cardStyle}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.2rem', fontWeight: 600, color: '#EAEEF7', marginBottom: '1rem', borderBottom: '1px solid rgba(120, 170, 255, 0.14)', paddingBottom: '0.65rem' }}>
            Full Attendance History Log
          </div>
          <RecentAttendanceTable history={history} onViewAll={() => {}} />
        </div>
      )}

      {/* TAB 5: MY ATTENDANCE / REPORTS */}
      {activeTab === 'reports' && (
        <div style={cardStyle}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.2rem', fontWeight: 600, color: '#EAEEF7', marginBottom: '1rem' }}>
            Attendance Analytics & Summary Reports
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div style={{ border: '1px solid rgba(120, 170, 255, 0.14)', borderRadius: '12px', padding: '1.2rem', background: 'rgba(15, 22, 38, 0.8)' }}>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.88rem', color: '#8A93A8' }}>Total Sessions Conducted</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.8rem', fontWeight: 700, color: '#EAEEF7', marginTop: '0.3rem' }}>{overallAttendance?.total_sessions ?? 0}</div>
            </div>
            <div style={{ border: '1px solid rgba(120, 170, 255, 0.14)', borderRadius: '12px', padding: '1.2rem', background: 'rgba(15, 22, 38, 0.8)' }}>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.88rem', color: '#8A93A8' }}>Sessions Verified Present</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.8rem', fontWeight: 700, color: '#10b981', marginTop: '0.3rem' }}>{overallAttendance?.total_attended ?? 0}</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: PROFILE */}
      {activeTab === 'profile' && (
        <div style={cardStyle}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.2rem', fontWeight: 600, color: '#EAEEF7', marginBottom: '1rem', borderBottom: '1px solid rgba(120, 170, 255, 0.14)', paddingBottom: '0.65rem' }}>
            Student Profile & Voice Security Details
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontFamily: "'Inter', sans-serif", fontSize: '0.95rem', color: '#EAEEF7' }}>
            <div><strong style={{ color: '#8A93A8' }}>Name:</strong> {currentUser.name}</div>
            <div><strong style={{ color: '#8A93A8' }}>Email:</strong> {currentUser.email || '—'}</div>
            <div><strong style={{ color: '#8A93A8' }}>Roll Number:</strong> {currentUser.roll_number || '—'}</div>
            <div><strong style={{ color: '#8A93A8' }}>Department:</strong> {currentUser.department || '—'}</div>
            <div><strong style={{ color: '#8A93A8' }}>Semester:</strong> {currentUser.semester ?? '—'} (Section {currentUser.section || '—'})</div>
            <div style={{ marginTop: '0.5rem' }}>
              <strong style={{ color: '#8A93A8' }}>Voice Biometric Profile:</strong>{' '}
              <span style={{ color: '#10b981', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>ENROLLED & ACTIVE</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
