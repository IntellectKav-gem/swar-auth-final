const { queryOne, queryMany, insertRecord, updateRecords } = require('../config/db');
const { extractEmbedding, compareVoice } = require('../services/voice.service');

const enrollVoiceByFaculty = async (req, res) => {
  try {
    // Testing hook: allow simulating model unavailability
    if (req.headers && req.headers['x-force-model-fail'] === '1') {
      return res.status(500).json({ error: 'Speaker embedding model unavailable' });
    }
    const { roll_number, student_id } = req.body;

    if (!roll_number && !student_id) {
      return res.status(400).json({ error: 'Student roll_number or student_id is required' });
    }

    if (req.user && req.user.role !== 'faculty') {
      return res.status(403).json({
        error: 'Access denied: Voice enrollment is restricted exclusively to Faculty.'
      });
    }

    if (!req.files || req.files.length !== 5) {
      return res.status(400).json({
        error: 'Exactly 5 voice sample files are required for enrollment'
      });
    }

    const student = roll_number
      ? await queryOne('students', { roll_number: roll_number.toUpperCase() })
      : await queryOne('students', { id: student_id });

    if (!student) {
      return res.status(404).json({ error: `Student not found for roll number / ID: ${roll_number || student_id}` });
    }

    const sampleFiles = req.files.map(f => f.path);
    const embedding = await extractEmbedding(sampleFiles);

    const existingProfile = await queryOne('voice_profiles', { student_id: student.id });
    if (existingProfile) {
      await updateRecords(
        'voice_profiles',
        { student_id: student.id },
        {
          embedding: JSON.stringify(embedding),
          sample_count: sampleFiles.length,
          updated_at: new Date().toISOString()
        },
        true
      );
    } else {
      const vpId = `vp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      await insertRecord('voice_profiles', {
        id: vpId,
        student_id: student.id,
        embedding: JSON.stringify(embedding),
        sample_count: sampleFiles.length
      });
    }

    const user = await queryOne('users', { id: student.user_id });

    return res.status(200).json({
      message: `Voice biometric enrollment registered successfully by Faculty for student ${user ? user.name : student.roll_number}`,
      student_id: student.id,
      roll_number: student.roll_number,
      student_name: user ? user.name : 'Unknown',
      sample_count: sampleFiles.length,
      is_enrolled: true
    });
  } catch (err) {
    console.error('Faculty Voice enrollment error:', err);
    return res.status(500).json({ error: err.message || 'Voice enrollment failed' });
  }
};

const getVoiceStatus = async (req, res) => {
  try {
    let studentId = null;
    if (req.user.role === 'student') {
      const student = await queryOne('students', { user_id: req.user.id });
      if (!student) return res.status(404).json({ error: 'Student profile not found' });
      studentId = student.id;
    } else if (req.query.roll_number) {
      const student = await queryOne('students', { roll_number: req.query.roll_number.toUpperCase() });
      if (student) studentId = student.id;
    } else if (req.query.student_id) {
      studentId = req.query.student_id;
    }

    if (!studentId) {
      return res.status(400).json({ error: 'Student identifier missing' });
    }

    const voiceProfile = await queryOne('voice_profiles', { student_id: studentId });

    return res.status(200).json({
      is_enrolled: !!voiceProfile,
      sample_count: voiceProfile ? voiceProfile.sample_count : 0,
      enrolled_at: voiceProfile ? voiceProfile.created_at : null
    });
  } catch (err) {
    console.error('Voice status error:', err);
    return res.status(500).json({ error: err.message || 'Failed to get voice enrollment status' });
  }
};

const verifyVoiceAndLogAttendance = async (req, res) => {
  try {
    // Testing hook: allow simulating model unavailability
    if (req.headers && req.headers['x-force-model-fail'] === '1') {
      return res.status(500).json({ error: 'Speaker embedding model unavailable' });
    }
    const { session_id } = req.body;
    if (!session_id) {
      return res.status(400).json({ error: 'Active attendance session_id is required' });
    }

    if (!req.file && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ error: 'Voice audio sample file is required' });
    }

    const samplePath = req.file ? req.file.path : req.files[0].path;
    const student = await queryOne('students', { user_id: req.user.id });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const session = await queryOne('attendance_sessions', { id: session_id });
    if (!session) return res.status(404).json({ error: 'Attendance session not found' });

    if (session.status !== 'active') {
      return res.status(400).json({ error: 'Attendance session is closed' });
    }

    if (session.end_time && new Date() > new Date(session.end_time)) {
      await updateRecords('attendance_sessions', { id: session.id }, { status: 'closed', updated_at: new Date().toISOString() }, true);
      return res.status(410).json({
        error: 'Attendance session time has expired. Attendance can no longer be logged for this session.'
      });
    }

    if (parseInt(student.semester, 10) !== parseInt(session.semester, 10) || String(student.section).toUpperCase() !== String(session.section).toUpperCase()) {
      return res.status(403).json({
        error: 'Student is not enrolled in the semester/section for this session'
      });
    }

    const existingAttendance = await queryOne('attendance', {
      student_id: student.id,
      session_id: session.id
    });
    if (existingAttendance) {
      return res.status(409).json({
        error: 'Duplicate attendance blocked: student has already logged attendance for this session',
        attendance: existingAttendance
      });
    }

    const voiceProfile = await queryOne('voice_profiles', { student_id: student.id });
    if (!voiceProfile) {
      return res.status(400).json({
        error: 'Voice profile not enrolled by Faculty. Please ask your Faculty to register your voice sample first.'
      });
    }

    const enrolledEmbedding = JSON.parse(voiceProfile.embedding);
    const verificationResult = await compareVoice(samplePath, enrolledEmbedding);

    if (!verificationResult.is_match) {
      return res.status(401).json({
        error: 'Voice verification failed. Voice signature does not match your Faculty-registered voice profile.',
        similarity_score: verificationResult.similarity_score,
        threshold: verificationResult.threshold
      });
    }

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const attId = `att_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    const attendanceRecord = await insertRecord('attendance', {
      id: attId,
      student_id: student.id,
      subject_id: session.subject_id,
      session_id: session.id,
      date: now.toISOString().split('T')[0],
      time: timeStr,
      status: 'present',
      verification_score: verificationResult.similarity_score
    });

    return res.status(200).json({
      message: 'Voice authenticated successfully! Attendance recorded as PRESENT.',
      verification: {
        score: verificationResult.similarity_score,
        threshold: verificationResult.threshold,
        status: 'VERIFIED'
      },
      attendance: attendanceRecord
    });
  } catch (err) {
    console.error('Voice verification error:', err);
    return res.status(500).json({ error: err.message || 'Voice verification failed' });
  }
};

module.exports = {
  enrollVoiceByFaculty,
  getVoiceStatus,
  verifyVoiceAndLogAttendance
};
