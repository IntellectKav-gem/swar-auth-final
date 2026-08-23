import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/adminApi';
import Loader from '../components/common/Loader';
import { Users, GraduationCap, BookOpen, Activity, Plus, UserPlus, Trash2 } from 'lucide-react';

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

  const handleDeleteStudent = async student => {
    if (!window.confirm(`Delete student ${student.name || student.roll_number}?`)) return;
    try {
      await adminApi.deleteStudent(student.id);
      setToast({ type: 'success', message: `Student ${student.roll_number} deleted.` });
      await loadData();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to delete student' });
    }
  };

  const handleDeleteFaculty = async faculty => {
    if (!window.confirm(`Delete faculty member ${faculty.name || faculty.email}?`)) return;
    try {
      await adminApi.deleteFaculty(faculty.id);
      setToast({ type: 'success', message: `Faculty member ${faculty.name || faculty.email} deleted.` });
      await loadData();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to delete faculty member' });
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
    <div>
      {/* Overview Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div>
            <div className="text-muted" style={{ fontSize: '0.85rem' }}>Total Enrolled Students</div>
            <div className="stat-val text-primary">{stats?.stats?.total_students ?? students.length}</div>
          </div>
          <div className="stat-icon"><GraduationCap size={24} /></div>
        </div>

        <div className="stat-card">
          <div>
            <div className="text-muted" style={{ fontSize: '0.85rem' }}>Faculty Members</div>
            <div className="stat-val" style={{ color: '#06b6d4' }}>{stats?.stats?.total_faculty ?? facultyList.length}</div>
          </div>
          <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}><Users size={24} /></div>
        </div>

        <div className="stat-card">
          <div>
            <div className="text-muted" style={{ fontSize: '0.85rem' }}>Active Subjects</div>
            <div className="stat-val text-success">{stats?.stats?.total_subjects ?? subjects.length}</div>
          </div>
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}><BookOpen size={24} /></div>
        </div>

        <div className="stat-card">
          <div>
            <div className="text-muted" style={{ fontSize: '0.85rem' }}>Attendance Records</div>
            <div className="stat-val" style={{ color: '#f59e0b' }}>{stats?.stats?.totalAttendanceRecords ?? 0}</div>
          </div>
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}><Activity size={24} /></div>
        </div>
      </div>

      {/* Directory Sections based on Active Tab */}
      {(activeTab === 'dashboard' || activeTab === 'users') && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Students Directory */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Student Directory</h3>
              <button onClick={() => setShowAddStudent(!showAddStudent)} className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}>
                <Plus size={14} /> Add Student
              </button>
            </div>

            {showAddStudent && (
              <form onSubmit={handleCreateStudent} style={{ background: '#0f172a', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
                <div className="form-group"><label className="form-label">Name</label><input type="text" className="form-input" required value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" required value={newStudent.email} onChange={e => setNewStudent({...newStudent, email: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Roll Number</label><input type="text" className="form-input" required value={newStudent.roll_number} onChange={e => setNewStudent({...newStudent, roll_number: e.target.value})} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div className="form-group"><label className="form-label">Semester</label><input type="number" min="1" max="8" className="form-input" value={newStudent.semester} onChange={e => setNewStudent({...newStudent, semester: Number(e.target.value)})} /></div>
                  <div className="form-group"><label className="form-label">Section</label><input type="text" className="form-input" value={newStudent.section} onChange={e => setNewStudent({...newStudent, section: e.target.value})} /></div>
                </div>
                <button type="submit" className="btn btn-success" style={{ width: '100%', fontSize: '0.85rem' }}>Save Student</button>
              </form>
            )}

            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Roll Number</th>
                    <th>Name</th>
                    <th>Sem / Sec</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.slice(0, 10).map((s, idx) => (
                    <tr key={s.id || idx}>
                      <td style={{ fontWeight: 600 }}>{s.roll_number}</td>
                      <td>{s.users?.name || s.name}</td>
                      <td>Sem {s.semester} - {s.section}</td>
                      <td>
                        <button type="button" className="btn btn-danger" style={{ padding: '0.3rem 0.5rem' }} onClick={() => handleDeleteStudent(s)} title="Delete student">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Faculty Directory */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Faculty Directory</h3>
              <button onClick={() => setShowAddFaculty(!showAddFaculty)} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}>
                <UserPlus size={14} /> Add Faculty
              </button>
            </div>

            {showAddFaculty && (
              <form onSubmit={handleCreateFaculty} style={{ background: '#0f172a', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
                <div className="form-group"><label className="form-label">Name</label><input type="text" className="form-input" required value={newFaculty.name} onChange={e => setNewFaculty({...newFaculty, name: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" required value={newFaculty.email} onChange={e => setNewFaculty({...newFaculty, email: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Designation</label><input type="text" className="form-input" value={newFaculty.designation} onChange={e => setNewFaculty({...newFaculty, designation: e.target.value})} /></div>
                <button type="submit" className="btn btn-success" style={{ width: '100%', fontSize: '0.85rem' }}>Save Faculty</button>
              </form>
            )}

            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Faculty Name</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {facultyList.slice(0, 10).map((f, idx) => (
                    <tr key={f.id || idx}>
                      <td style={{ fontWeight: 600 }}>{f.users?.name || f.name}</td>
                      <td>{f.department}</td>
                      <td><span className="badge badge-primary">{f.designation}</span></td>
                      <td>
                        <button type="button" className="btn btn-danger" style={{ padding: '0.3rem 0.5rem' }} onClick={() => handleDeleteFaculty(f)} title="Delete faculty member">
                          <Trash2 size={14} />
                        </button>
                      </td>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Subjects Catalog & Faculty Assignments</h3>
            <button onClick={() => setShowAddSubject(!showAddSubject)} className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}>
              <Plus size={14} /> Add Subject
            </button>
          </div>

          {showAddSubject && (
            <form onSubmit={handleCreateSubject} style={{ background: '#0f172a', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
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
              <button type="submit" className="btn btn-success" style={{ width: '100%', fontSize: '0.85rem' }}>Create Subject Entry</button>
            </form>
          )}

          <div className="table-container">
            <table className="custom-table">
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
                    <td style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{subj.subject_code}</td>
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
