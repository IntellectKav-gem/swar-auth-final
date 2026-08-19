const { queryOne, queryMany } = require('../config/db');

// Faculty Daily Report
const getFacultyDailyReport = async (req, res) => {
  try {
    const { date } = req.query;
    const reportDate = date || new Date().toISOString().split('T')[0];

    const faculty = await queryOne('faculty', { user_id: req.user.id });
    if (!faculty) return res.status(404).json({ error: 'Faculty profile not found' });

    const sessions = await queryMany('attendance_sessions', {
      faculty_id: faculty.id,
      date: reportDate
    });

    const [subjects, students, users, attendanceRecords] = await Promise.all([
      queryMany('subjects', {}),
      queryMany('students', {}),
      queryMany('users', {}),
      queryMany('attendance', {})
    ]);

    const sessionReports = sessions.map(sess => {
      const subj = subjects.find(sb => sb.id === sess.subject_id) || {};
      const recs = attendanceRecords.filter(a => a.session_id === sess.id);

      const attendees = recs.map(r => {
        const std = students.find(s => s.id === r.student_id) || {};
        const usr = users.find(u => u.id === std.user_id) || {};
        return {
          roll_number: std.roll_number,
          name: usr.name || 'Unknown',
          time: r.time,
          score: r.verification_score
        };
      });

      return {
        session_id: sess.id,
        subject_name: subj.subject_name,
        subject_code: subj.subject_code,
        semester: sess.semester,
        section: sess.section,
        total_marked: attendees.length,
        attendees
      };
    });

    return res.status(200).json({
      date: reportDate,
      total_sessions: sessions.length,
      sessions: sessionReports
    });
  } catch (err) {
    console.error('Get faculty daily report error:', err);
    return res.status(500).json({ error: err.message });
  }
};

// Faculty Subject Attendance Report
const getFacultySubjectReport = async (req, res) => {
  try {
    const { subject_id } = req.query;
    if (!subject_id) return res.status(400).json({ error: 'subject_id parameter is required' });

    const subject = await queryOne('subjects', { id: subject_id });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });

    const totalSessions = (await queryMany('attendance_sessions', { subject_id })).length;
    const enrolledStudents = await queryMany('students', {
      semester: subject.semester,
      section: subject.section
    });

    const [users, attendanceRecords] = await Promise.all([
      queryMany('users', {}),
      queryMany('attendance', {})
    ]);

    const studentReport = enrolledStudents.map(std => {
      const usr = users.find(u => u.id === std.user_id) || {};
      const stdAttended = attendanceRecords.filter(a => a.student_id === std.id && a.subject_id === subject_id && a.status === 'present').length;
      const percentage = totalSessions > 0 ? parseFloat(((stdAttended / totalSessions) * 100).toFixed(2)) : 100.0;

      return {
        student_id: std.id,
        roll_number: std.roll_number,
        name: usr.name || 'Unknown',
        total_sessions: totalSessions,
        attended_sessions: stdAttended,
        percentage
      };
    });

    return res.status(200).json({
      subject_id: subject.id,
      subject_name: subject.subject_name,
      subject_code: subject.subject_code,
      total_sessions: totalSessions,
      students: studentReport
    });
  } catch (err) {
    console.error('Get faculty subject report error:', err);
    return res.status(500).json({ error: err.message });
  }
};

// Admin Department Attendance Summary
const getAdminDepartmentReport = async (req, res) => {
  try {
    const [students, subjects, sessions, attendance, voiceProfiles] = await Promise.all([
      queryMany('students', {}),
      queryMany('subjects', {}),
      queryMany('attendance_sessions', {}),
      queryMany('attendance', {}),
      queryMany('voice_profiles', {})
    ]);

    const totalStudents = students.length;
    const enrolledStudents = voiceProfiles.length;
    const totalSessions = sessions.length;
    const totalRecords = attendance.length;

    const overallDeptPercentage = (totalStudents * totalSessions) > 0
      ? parseFloat(((totalRecords / (totalStudents * totalSessions)) * 100).toFixed(2))
      : 100.0;

    return res.status(200).json({
      summary: {
        total_students: totalStudents,
        voice_enrolled_students: enrolledStudents,
        enrollment_rate: totalStudents > 0 ? parseFloat(((enrolledStudents / totalStudents) * 100).toFixed(2)) : 0,
        total_subjects: subjects.length,
        total_sessions_conducted: totalSessions,
        overall_department_attendance_percentage: overallDeptPercentage
      }
    });
  } catch (err) {
    console.error('Get admin department report error:', err);
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getFacultyDailyReport,
  getFacultySubjectReport,
  getAdminDepartmentReport
};
