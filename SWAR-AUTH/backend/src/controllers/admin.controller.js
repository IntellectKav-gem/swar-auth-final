const bcrypt = require('bcryptjs');
const {
  queryOne,
  queryMany,
  insertRecord,
  updateRecords,
  deleteRecords
} = require('../config/db');

// Dashboard Overview
const getDashboardStats = async (req, res) => {
  try {
    const [students, faculty, subjects, activeSessions, attendance] = await Promise.all([
      queryMany('students', {}),
      queryMany('faculty', {}),
      queryMany('subjects', {}),
      queryMany('attendance_sessions', { status: 'active' }),
      queryMany('attendance', {})
    ]);

    return res.status(200).json({
      stats: {
        totalStudents: students.length,
        totalFaculty: faculty.length,
        totalSubjects: subjects.length,
        activeSessions: activeSessions.length,
        totalAttendanceRecords: attendance.length
      }
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// --- STUDENTS ---
const getStudents = async (req, res) => {
  try {
    const [students, users, voiceProfiles] = await Promise.all([
      queryMany('students', {}),
      queryMany('users', {}),
      queryMany('voice_profiles', {})
    ]);

    const result = students.map(st => {
      const u = users.find(usr => usr.id === st.user_id) || {};
      const vp = voiceProfiles.find(v => v.student_id === st.id);
      return {
        id: st.id,
        user_id: st.user_id,
        name: u.name || 'Unknown',
        email: u.email || '',
        roll_number: st.roll_number,
        department: st.department,
        semester: st.semester,
        section: st.section,
        is_voice_enrolled: !!vp,
        created_at: st.created_at
      };
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('Get students error:', err);
    return res.status(500).json({ error: err.message });
  }
};

const createStudent = async (req, res) => {
  try {
    const { name, email, password, roll_number, department, semester, section } = req.body;
    if (!name || !email || !password || !roll_number || !department || !semester || !section) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingUser = await queryOne('users', { email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const existingRoll = await queryOne('students', { roll_number: roll_number.toUpperCase() });
    if (existingRoll) {
      return res.status(400).json({ error: 'Roll number already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    const user = await insertRecord('users', {
      id: userId,
      name,
      email: email.toLowerCase(),
      password: passwordHash,
      role: 'student'
    });

    const studentId = `std_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const student = await insertRecord('students', {
      id: studentId,
      roll_number: roll_number.toUpperCase(),
      department,
      semester: parseInt(semester, 10),
      section: section.toUpperCase(),
      user_id: user.id
    });

    return res.status(201).json({
      message: 'Student created successfully',
      student: { ...student, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Create student error:', err);
    return res.status(500).json({ error: err.message });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, department, semester, section } = req.body;

    const student = await queryOne('students', { id });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    await updateRecords(
      'students',
      { id },
      {
        department: department || student.department,
        semester: semester ? parseInt(semester, 10) : student.semester,
        section: section ? section.toUpperCase() : student.section,
        updated_at: new Date().toISOString()
      },
      true
    );

    if (name) {
      await updateRecords('users', { id: student.user_id }, { name }, true);
    }

    return res.status(200).json({ message: 'Student updated successfully' });
  } catch (err) {
    console.error('Update student error:', err);
    return res.status(500).json({ error: err.message });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await queryOne('students', { id });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    await deleteRecords('users', { id: student.user_id });
    return res.status(200).json({ message: 'Student deleted successfully' });
  } catch (err) {
    console.error('Delete student error:', err);
    return res.status(500).json({ error: err.message });
  }
};

// --- FACULTY ---
const getFaculty = async (req, res) => {
  try {
    const [faculty, users, subjects] = await Promise.all([
      queryMany('faculty', {}),
      queryMany('users', {}),
      queryMany('subjects', {})
    ]);

    const result = faculty.map(f => {
      const u = users.find(usr => usr.id === f.user_id) || {};
      const assignedSubjects = subjects.filter(sb => sb.faculty_id === f.id);
      return {
        id: f.id,
        user_id: f.user_id,
        name: u.name || 'Unknown',
        email: u.email || '',
        department: f.department,
        designation: f.designation,
        assigned_subjects: assignedSubjects,
        created_at: f.created_at
      };
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('Get faculty error:', err);
    return res.status(500).json({ error: err.message });
  }
};

const createFaculty = async (req, res) => {
  try {
    const { name, email, password, department, designation } = req.body;
    if (!name || !email || !password || !department || !designation) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingUser = await queryOne('users', { email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    const user = await insertRecord('users', {
      id: userId,
      name,
      email: email.toLowerCase(),
      password: passwordHash,
      role: 'faculty'
    });

    const facultyId = `fac_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const faculty = await insertRecord('faculty', {
      id: facultyId,
      department,
      designation,
      user_id: user.id
    });

    return res.status(201).json({
      message: 'Faculty created successfully',
      faculty: { ...faculty, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Create faculty error:', err);
    return res.status(500).json({ error: err.message });
  }
};

const updateFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, department, designation } = req.body;

    const faculty = await queryOne('faculty', { id });
    if (!faculty) return res.status(404).json({ error: 'Faculty not found' });

    await updateRecords(
      'faculty',
      { id },
      {
        department: department || faculty.department,
        designation: designation || faculty.designation,
        updated_at: new Date().toISOString()
      },
      true
    );

    if (name) {
      await updateRecords('users', { id: faculty.user_id }, { name }, true);
    }

    return res.status(200).json({ message: 'Faculty updated successfully' });
  } catch (err) {
    console.error('Update faculty error:', err);
    return res.status(500).json({ error: err.message });
  }
};

const deleteFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const faculty = await queryOne('faculty', { id });
    if (!faculty) return res.status(404).json({ error: 'Faculty not found' });

    await deleteRecords('users', { id: faculty.user_id });
    await updateRecords('subjects', { faculty_id: id }, { faculty_id: null });

    return res.status(200).json({ message: 'Faculty deleted successfully' });
  } catch (err) {
    console.error('Delete faculty error:', err);
    return res.status(500).json({ error: err.message });
  }
};

// --- SUBJECTS ---
const getSubjects = async (req, res) => {
  try {
    const [subjects, faculty, users] = await Promise.all([
      queryMany('subjects', {}),
      queryMany('faculty', {}),
      queryMany('users', {})
    ]);

    const result = subjects.map(s => {
      let facultyName = 'Unassigned';
      if (s.faculty_id) {
        const fac = faculty.find(f => f.id === s.faculty_id);
        if (fac) {
          const usr = users.find(u => u.id === fac.user_id);
          if (usr) facultyName = usr.name;
        }
      }
      return { ...s, faculty_name: facultyName };
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('Get subjects error:', err);
    return res.status(500).json({ error: err.message });
  }
};

const createSubject = async (req, res) => {
  try {
    const { subject_name, subject_code, semester, section, faculty_id } = req.body;
    if (!subject_name || !subject_code || !semester) {
      return res.status(400).json({ error: 'Missing required subject details' });
    }

    const existingCode = await queryOne('subjects', { subject_code: subject_code.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({ error: 'Subject code already exists' });
    }

    const subjectId = `subj_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const subject = await insertRecord('subjects', {
      id: subjectId,
      subject_name,
      subject_code: subject_code.toUpperCase(),
      semester: parseInt(semester, 10),
      section: section ? section.toUpperCase() : 'A',
      faculty_id: faculty_id || null
    });

    return res.status(201).json({ message: 'Subject created successfully', subject });
  } catch (err) {
    console.error('Create subject error:', err);
    return res.status(500).json({ error: err.message });
  }
};

const assignFacultyToSubject = async (req, res) => {
  try {
    const { subject_id, faculty_id } = req.body;
    if (!subject_id || !faculty_id) {
      return res.status(400).json({ error: 'Subject ID and Faculty ID are required' });
    }

    const subject = await queryOne('subjects', { id: subject_id });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });

    const faculty = await queryOne('faculty', { id: faculty_id });
    if (!faculty) return res.status(404).json({ error: 'Faculty not found' });

    await updateRecords('subjects', { id: subject_id }, { faculty_id }, true);
    return res.status(200).json({ message: 'Faculty assigned to subject successfully' });
  } catch (err) {
    console.error('Assign faculty error:', err);
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getDashboardStats,
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getFaculty,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  getSubjects,
  createSubject,
  assignFacultyToSubject
};
