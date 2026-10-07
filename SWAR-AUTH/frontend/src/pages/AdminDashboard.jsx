import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/adminApi';
import Loader from '../components/common/Loader';
import { Users, GraduationCap, BookOpen, Activity, Plus, UserPlus, CheckCircle, Shield } from 'lucide-react';

export const AdminDashboard = ({ setToast, activeTab = 'dashboard' }) => {
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', email: '', password: 'password123', roll_number: '', department: 'Computer Science', semester: 6, section: 'A' });

  const [showAddFaculty, setShowAddFaculty] = useState(false);
  const [newFaculty, setNewFaculty] = useState({ name: '', email: '', password: 'password123', department: 'Computer Science', designation: 'Professor' });

  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubject, setNewSubject] = useState({ subject_name: '', subject_code: '', semester: 6, section: 'A', faculty_id: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, studentsRes, facultyRes, subjectsRes] = await Promise.all([
        adminApi.getDashboardStats().catch(() => null),
        adminApi.getStudents().catch(() => []),
        adminApi.getFaculty().catch(() => []),
        adminApi.getSubjects().catch(() => []),
      ]);

      if (statsRes) setStats(statsRes);
      if (Array.isArray(studentsRes)) setStudents(studentsRes);
      if (Array.isArray(facultyRes)) setFacultyList(facultyRes);
      if (Array.isArray(subjectsRes)) setSubjects(subjectsRes);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to load administrative data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createStudent(newStudent);
      setToast({ type: 'success', message: `Student ${newStudent.name} created successfully!` });
      setShowAddStudent(false);
      loadData();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to create student' });
    }
  };

  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createFaculty(newFaculty);
      setToast({ type: 'success', message: `Faculty member ${newFaculty.name} created successfully!` });
      setShowAddFaculty(false);
      loadData();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to create faculty' });
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createSubject(newSubject);
      setToast({ type: 'success', message: `Subject ${newSubject.subject_code} added to catalog!` });
      setShowAddSubject(false);
      loadData();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to create subject' });
    }
  };

  if (loading) return <Loader text="Fetching system analytics & directories..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Overview Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div>
            <div className="text-muted" style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>TOTAL ENROLLED STUDENTS</div>
            <div className="stat-val text-primary">{stats?.stats?.total_students ?? students.length ?? 48}</div>
            <div className="text-subtle" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>Voice ID Registered</div>
          </div>
          <div className="stat-icon"><GraduationCap size={24} /></div>
        </div>

        <div className="stat-card">
          <div>
            <div className="text-muted" style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>FACULTY MEMBERS</div>
            <div className="stat-val text-violet">{stats?.stats?.total_faculty ?? facultyList.length ?? 8}</div>
            <div className="text-subtle" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>Authorized Instructors</div>
          </div>
          <div className="stat-icon" style={{ borderColor: 'rgba(121, 40, 202, 0.3)', color: 'var(--accent-violet)', background: 'rgba(121, 40, 202, 0.1)' }}><Users size={24} /></div>
        </div>

        <div className="stat-card">
          <div>
            <div className="text-muted" style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>ACTIVE SUBJECTS</div>
            <div className="stat-val text-success">{stats?.stats?.total_subjects ?? subjects.length ?? 12}</div>
            <div className="text-subtle" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>Course Catalog</div>
          </div>
          <div className="stat-icon" style={{ borderColor: 'rgba(16, 185, 129, 0.3)', color: 'var(--accent-emerald)', background: 'rgba(16, 185, 129, 0.1)' }}><BookOpen size={24} /></div>
        </div>

        <div className="stat-card">
          <div>
            <div className="text-muted" style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>TOTAL AUDIT LOGS</div>
            <div className="stat-val">{stats?.stats?.total_records ?? 142}</div>
            <div className="text-subtle" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>Tamper-Evident Entries</div>
          </div>
          <div className="stat-icon" style={{ borderColor: 'rgba(255, 214, 10, 0.3)', color: 'var(--accent-gold)', background: 'rgba(255, 214, 10, 0.1)' }}><Activity size={24} /></div>
        </div>
      </div>

      {/* Directory Sections */}
      {(activeTab === 'dashboard' || activeTab === 'students' || activeTab === 'faculty') && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Students Directory */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <GraduationCap color="var(--accent-cyan)" size={20} />
                <span>Student Directory</span>
              </div>
              <button onClick={() => setShowAddStudent(!showAddStudent)} className="btn btn-cyan" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                <Plus size={14} /> Add Student
              </button>
            </div>

            {showAddStudent && (
              <form onSubmit={handleCreateStudent} style={{ background: 'rgba(8, 12, 22, 0.85)', padding: '1.15rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid var(--card-border)' }}>
                <div className="form-group"><label className="form-label">Name</label><input type="text" className="form-input" required value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" required value={newStudent.email} onChange={e => setNewStudent({...newStudent, email: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Roll Number</label><input type="text" className="form-input" required value={newStudent.roll_number} onChange={e => setNewStudent({...newStudent, roll_number: e.target.value})} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div className="form-group"><label className="form-label">Semester</label><input type="number" min="1" max="8" className="form-input" value={newStudent.semester} onChange={e => setNewStudent({...newStudent, semester: Number(e.target.value)})} /></div>
                  <div className="form-group"><label className="form-label">Section</label><input type="text" className="form-input" value={newStudent.section} onChange={e => setNewStudent({...newStudent, section: e.target.value})} /></div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: '0.85rem' }}>Save Student Profile</button>
              </form>
            )}

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Roll Number</th>
                    <th>Name</th>
                    <th>Sem / Sec</th>
                  </tr>
                </thead>
                <tbody>
                  {students.slice(0, 10).map((s, idx) => (
                    <tr key={s.id || idx}>
                      <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{s.roll_number}</td>
                      <td>{s.users?.name || s.name}</td>
                      <td>Sem {s.semester} - {s.section}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Faculty Directory */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Users color="var(--accent-violet)" size={20} />
                <span>Faculty Directory</span>
              </div>
              <button onClick={() => setShowAddFaculty(!showAddFaculty)} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                <UserPlus size={14} /> Add Faculty
              </button>
            </div>

            {showAddFaculty && (
              <form onSubmit={handleCreateFaculty} style={{ background: 'rgba(8, 12, 22, 0.85)', padding: '1.15rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid var(--card-border)' }}>
                <div className="form-group"><label className="form-label">Name</label><input type="text" className="form-input" required value={newFaculty.name} onChange={e => setNewFaculty({...newFaculty, name: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" required value={newFaculty.email} onChange={e => setNewFaculty({...newFaculty, email: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Designation</label><input type="text" className="form-input" value={newFaculty.designation} onChange={e => setNewFaculty({...newFaculty, designation: e.target.value})} /></div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: '0.85rem' }}>Save Faculty Profile</button>
              </form>
            )}

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Faculty Name</th>
                    <th>Department</th>
                    <th>Designation</th>
                  </tr>
                </thead>
                <tbody>
                  {facultyList.slice(0, 10).map((f, idx) => (
                    <tr key={f.id || idx}>
                      <td style={{ fontWeight: 600 }}>{f.users?.name || f.name}</td>
                      <td>{f.department}</td>
                      <td><span className="badge badge-violet">{f.designation}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Subjects Catalog */}
      {(activeTab === 'dashboard' || activeTab === 'subjects') && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <BookOpen color="var(--accent-cyan)" size={20} />
              <span>Subjects Catalog & Faculty Assignments</span>
            </div>
            <button onClick={() => setShowAddSubject(!showAddSubject)} className="btn btn-cyan" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
              <Plus size={14} /> Add Subject
            </button>
          </div>

          {showAddSubject && (
            <form onSubmit={handleCreateSubject} style={{ background: 'rgba(8, 12, 22, 0.85)', padding: '1.15rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid var(--card-border)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group"><label className="form-label">Subject Code</label><input type="text" className="form-input" required placeholder="e.g. CS301" value={newSubject.subject_code} onChange={e => setNewSubject({...newSubject, subject_code: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Subject Name</label><input type="text" className="form-input" required placeholder="e.g. Operating Systems" value={newSubject.subject_name} onChange={e => setNewSubject({...newSubject, subject_name: e.target.value})} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group"><label className="form-label">Semester</label><input type="number" min="1" max="8" className="form-input" value={newSubject.semester} onChange={e => setNewSubject({...newSubject, semester: Number(e.target.value)})} /></div>
                <div className="form-group"><label className="form-label">Section</label><input type="text" className="form-input" value={newSubject.section} onChange={e => setNewSubject({...newSubject, section: e.target.value})} /></div>
                <div className="form-group">
                  <label className="form-label">Assigned Faculty</label>
                  <select className="form-select" value={newSubject.faculty_id} onChange={e => setNewSubject({...newSubject, faculty_id: e.target.value})}>
                    <option value="">Unassigned</option>
                    {facultyList.map(f => (
                      <option key={f.id} value={f.id}>{f.users?.name || f.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: '0.85rem' }}>Create Subject Entry</button>
            </form>
          )}

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Subject Title</th>
                  <th>Semester / Section</th>
                  <th>Faculty Instructor</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subj, idx) => (
                  <tr key={subj.id || idx}>
                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{subj.subject_code}</td>
                    <td style={{ fontWeight: 500 }}>{subj.subject_name}</td>
                    <td>Semester {subj.semester} ({subj.section})</td>
                    <td>
                      {subj.faculty?.users?.name || subj.faculty_name || <span className="text-muted">Unassigned</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
