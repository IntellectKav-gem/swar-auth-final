const {
  queryOne,
  queryMany,
  insertRecord,
  updateRecords
} = require('../config/db');

const closeExpiredSessionIfNeeded = async (session) => {
  if (!session || session.status !== 'active') return session;
  if (session.end_time && new Date() > new Date(session.end_time)) {
    const updated = await updateRecords(
      'attendance_sessions',
      { id: session.id },
      { status: 'closed', updated_at: new Date().toISOString() },
      true
    );
    return updated || { ...session, status: 'closed' };
  }
  return session;
};

const getAssignedSubjects = async (req, res) => {
  try {
    const faculty = await queryOne('faculty', { user_id: req.user.id });
    if (!faculty) {
      return res.status(404).json({ error: 'Faculty profile not found' });
    }

    const subjects = await queryMany('subjects', { faculty_id: faculty.id });
    return res.status(200).json(subjects);
  } catch (err) {
    console.error('Get assigned subjects error:', err);
    return res.status(500).json({ error: err.message });
  }
};

const startAttendanceSession = async (req, res) => {
  try {
    const { subject_id, semester, section, duration } = req.body;
    if (!subject_id || !semester || !section) {
      return res.status(400).json({ error: 'subject_id, semester, and section are required' });
    }

    const sessionDuration = parseInt(duration || 10, 10);
    if (![10, 12, 15].includes(sessionDuration)) {
      return res.status(400).json({ error: 'Session duration must be strictly 10, 12, or 15 minutes' });
    }

    const faculty = await queryOne('faculty', { user_id: req.user.id });
    if (!faculty) return res.status(404).json({ error: 'Faculty profile not found' });

    const subject = await queryOne('subjects', { id: subject_id });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });

    if (subject.faculty_id !== faculty.id) {
      return res.status(403).json({ error: 'Faculty does not own or is not assigned to this subject' });
    }

    const existingActive = await queryOne('attendance_sessions', {
      subject_id,
      faculty_id: faculty.id,
      status: 'active'
    });

    if (existingActive) {
      const expiredExisting = await closeExpiredSessionIfNeeded(existingActive);
      if (expiredExisting && expiredExisting.status === 'active') {
        return res.status(200).json({
          message: 'Active attendance session already in progress',
          session: existingActive
        });
      }
    }

    const now = new Date();
    const startTimeStr = now.toISOString();
    const endTimeStr = new Date(now.getTime() + sessionDuration * 60 * 1000).toISOString();
    const todayStr = now.toISOString().split('T')[0];
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    const session = await insertRecord('attendance_sessions', {
      id: sessionId,
      subject_id,
      faculty_id: faculty.id,
      semester: parseInt(semester, 10),
      section: section.toUpperCase(),
      duration: sessionDuration,
      start_time: startTimeStr,
      end_time: endTimeStr,
      date: todayStr,
      status: 'active'
    });

    return res.status(201).json({
      message: `Attendance session started for ${sessionDuration} minutes successfully`,
      session
    });
  } catch (err) {
    console.error('Start attendance session error:', err);
    return res.status(500).json({ error: err.message });
  }
};

const endAttendanceSession = async (req, res) => {
  try {
    const { id } = req.params;
    const faculty = await queryOne('faculty', { user_id: req.user.id });
    if (!faculty) return res.status(404).json({ error: 'Faculty profile not found' });

    const session = await queryOne('attendance_sessions', { id });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    if (session.faculty_id !== faculty.id) {
      return res.status(403).json({ error: 'Faculty does not own this attendance session' });
    }

    await updateRecords('attendance_sessions', { id }, { status: 'closed', updated_at: new Date().toISOString() }, true);
    const attendees = await queryMany('attendance', { session_id: id });

    return res.status(200).json({
      message: 'Attendance session closed successfully',
      session_id: id,
      total_present: attendees.length
    });
  } catch (err) {
    console.error('End attendance session error:', err);
    return res.status(500).json({ error: err.message });
  }
};

const getActiveSession = async (req, res) => {
  try {
    const faculty = await queryOne('faculty', { user_id: req.user.id });
    if (!faculty) return res.status(404).json({ error: 'Faculty profile not found' });

    const session = await queryOne('attendance_sessions', {
      faculty_id: faculty.id,
      status: 'active'
    });

    if (!session) {
      return res.status(200).json({ active: false, session: null });
    }

    const normalizedSession = await closeExpiredSessionIfNeeded(session);
    if (!normalizedSession || normalizedSession.status !== 'active') {
      return res.status(200).json({ active: false, session: null });
    }

    const activeSession = normalizedSession;

    const subject = await queryOne('subjects', { id: activeSession.subject_id });
    const attendees = await queryMany('attendance', { session_id: activeSession.id });
    const enrolledStudents = await queryMany('students', { semester: activeSession.semester, section: activeSession.section });

    const remainingSeconds = activeSession.end_time
      ? Math.max(0, Math.floor((new Date(activeSession.end_time).getTime() - Date.now()) / 1000))
      : 0;

    return res.status(200).json({
      active: true,
      session: {
        ...activeSession,
        subject_name: subject ? subject.subject_name : '',
        subject_code: subject ? subject.subject_code : '',
        total_marked: attendees.length,
        total_students: enrolledStudents.length,
        remaining_students: Math.max(0, enrolledStudents.length - attendees.length),
        remaining_seconds: remainingSeconds
      }
    });
  } catch (err) {
    console.error('Get active session error:', err);
    return res.status(500).json({ error: err.message });
  }
};

const getAttendanceHistory = async (req, res) => {
  try {
    const faculty = await queryOne('faculty', { user_id: req.user.id });
    if (!faculty) return res.status(404).json({ error: 'Faculty profile not found' });

    const [sessions, subjects, students, users, attendanceRecords] = await Promise.all([
      queryMany('attendance_sessions', { faculty_id: faculty.id }),
      queryMany('subjects', {}),
      queryMany('students', {}),
      queryMany('users', {}),
      queryMany('attendance', {})
    ]);

    const history = sessions.map(sess => {
      const subj = subjects.find(sb => sb.id === sess.subject_id) || {};
      const markedRecords = attendanceRecords.filter(a => a.session_id === sess.id);

      const attendees = markedRecords.map(rec => {
        const std = students.find(s => s.id === rec.student_id) || {};
        const usr = users.find(u => u.id === std.user_id) || {};
        return {
          student_id: rec.student_id,
          roll_number: std.roll_number,
          name: usr.name || 'Unknown',
          time: rec.time,
          score: rec.verification_score
        };
      });

      return {
        id: sess.id,
        subject_name: subj.subject_name,
        subject_code: subj.subject_code,
        semester: sess.semester,
        section: sess.section,
        duration: sess.duration || 10,
        start_time: sess.start_time,
        end_time: sess.end_time,
        date: sess.date,
        status: sess.status,
        total_present: attendees.length,
        attendees
      };
    });

    return res.status(200).json(history);
  } catch (err) {
    console.error('Get attendance history error:', err);
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAssignedSubjects,
  startAttendanceSession,
  endAttendanceSession,
  getActiveSession,
  getAttendanceHistory
};
