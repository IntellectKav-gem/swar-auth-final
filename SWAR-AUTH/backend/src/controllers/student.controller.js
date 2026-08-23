const { queryOne, queryMany, updateRecords } = require('../config/db');

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

const getStudentProfile = async (req, res) => {
  try {
    const student = await queryOne('students', { user_id: req.user.id });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const user = await queryOne('users', { id: req.user.id });
    const voiceProfile = await queryOne('voice_profiles', { student_id: student.id });

    return res.status(200).json({
      student_id: student.id,
      user_id: student.user_id,
      name: user ? user.name : '',
      email: user ? user.email : '',
      roll_number: student.roll_number,
      department: student.department,
      semester: student.semester,
      section: student.section,
      is_voice_enrolled: !!voiceProfile,
      voice_enrolled_at: voiceProfile ? voiceProfile.created_at : null
    });
  } catch (err) {
    console.error('Get student profile error:', err);
    return res.status(500).json({ error: err.message });
  }
};

const getSubjectAttendance = async (req, res) => {
  try {
    const student = await queryOne('students', { user_id: req.user.id });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const subjects = (await queryMany('subjects', { semester: student.semester })).filter(subj =>
      subj.section === student.section || subj.section === 'A'
    );

    const allSessions = await queryMany('attendance_sessions', {
      semester: student.semester,
      section: student.section
    });

    const studentAttendance = await queryMany('attendance', { student_id: student.id });

    const subjectBreakdown = subjects.map(subj => {
      const totalSubjectSessions = allSessions.filter(s => s.subject_id === subj.id).length;
      const attendedSubjectSessions = studentAttendance.filter(a => a.subject_id === subj.id && a.status === 'present').length;
      const percentage = totalSubjectSessions > 0
        ? parseFloat(((attendedSubjectSessions / totalSubjectSessions) * 100).toFixed(2))
        : 100.0;

      return {
        subject_id: subj.id,
        subject_name: subj.subject_name,
        subject_code: subj.subject_code,
        total_classes: totalSubjectSessions,
        attended_classes: attendedSubjectSessions,
        percentage
      };
    });

    return res.status(200).json(subjectBreakdown);
  } catch (err) {
    console.error('Get subject attendance error:', err);
    return res.status(500).json({ error: err.message });
  }
};

const getOverallAttendance = async (req, res) => {
  try {
    const student = await queryOne('students', { user_id: req.user.id });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const totalSessions = (await queryMany('attendance_sessions', {
      semester: student.semester,
      section: student.section
    })).length;

    const attendedRecords = await queryMany('attendance', {
      student_id: student.id,
      status: 'present'
    });

    const overallPercentage = totalSessions > 0
      ? parseFloat(((attendedRecords.length / totalSessions) * 100).toFixed(2))
      : 100.0;

    const subjects = await queryMany('subjects', {});

    const history = attendedRecords.map(rec => {
      const subj = subjects.find(s => s.id === rec.subject_id);
      return {
        attendance_id: rec.id,
        subject_name: subj ? subj.subject_name : 'Unknown',
        subject_code: subj ? subj.subject_code : '',
        date: rec.date,
        time: rec.time,
        status: rec.status,
        score: rec.verification_score
      };
    });

    return res.status(200).json({
      total_sessions: totalSessions,
      total_attended: attendedRecords.length,
      overall_percentage: overallPercentage,
      is_low_attendance: overallPercentage < 75.0,
      attendance_history: history
    });
  } catch (err) {
    console.error('Get overall attendance error:', err);
    return res.status(500).json({ error: err.message });
  }
};

const getActiveSessionsForStudent = async (req, res) => {
  try {
    const student = await queryOne('students', { user_id: req.user.id });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const activeSessions = await queryMany('attendance_sessions', {
      semester: student.semester,
      section: student.section,
      status: 'active'
    });

    const subjects = await queryMany('subjects', {});
    const studentAttendance = await queryMany('attendance', { student_id: student.id });

    const validSessions = [];
    for (const sess of activeSessions) {
      const expiredSession = await closeExpiredSessionIfNeeded(sess);
      if (!expiredSession || expiredSession.status !== 'active') {
        continue;
      }
      const subj = subjects.find(s => s.id === expiredSession.subject_id) || {};
      const isMarked = studentAttendance.some(a => a.session_id === expiredSession.id);
      const remainingSeconds = expiredSession.end_time
        ? Math.max(0, Math.floor((new Date(expiredSession.end_time).getTime() - Date.now()) / 1000))
        : 0;

      validSessions.push({
        id: expiredSession.id,
        subject_id: expiredSession.subject_id,
        subject_name: subj.subject_name || 'Unknown',
        subject_code: subj.subject_code || '',
        semester: expiredSession.semester,
        section: expiredSession.section,
        duration: expiredSession.duration || 10,
        start_time: expiredSession.start_time,
        end_time: expiredSession.end_time,
        remaining_seconds: remainingSeconds,
        is_already_marked: isMarked
      });
    }

    return res.status(200).json(validSessions);
  } catch (err) {
    console.error('Get active sessions for student error:', err);
    return res.status(500).json({ error: err.message });
  }
};

const getStudentAttendanceHistory = async (req, res) => {
  try {
    const student = await queryOne('students', { user_id: req.user.id });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const attendanceRecords = await queryMany('attendance', { student_id: student.id });
    const subjects = await queryMany('subjects', {});

    const history = attendanceRecords
      .filter(record => record.status === 'present')
      .map(record => {
        const subject = subjects.find(subj => subj.id === record.subject_id) || {};
        return {
          id: record.id,
          date: record.date,
          time: record.time,
          subject_id: record.subject_id,
          subject_name: subject.subject_name || 'Unknown',
          subject_code: subject.subject_code || '',
          verification_score: record.verification_score,
          status: record.status
        };
      })
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    return res.status(200).json(history);
  } catch (err) {
    console.error('Get student attendance history error:', err);
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getStudentProfile,
  getSubjectAttendance,
  getOverallAttendance,
  getActiveSessionsForStudent,
  getStudentAttendanceHistory
};
