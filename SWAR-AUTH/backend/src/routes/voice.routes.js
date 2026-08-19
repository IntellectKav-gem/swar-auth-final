const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const {
  enrollVoiceByFaculty,
  getVoiceStatus,
  verifyVoiceAndLogAttendance
} = require('../controllers/voice.controller');

const { authenticateToken } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/rbac.middleware');

const { arrayUpload } = require('../middleware/upload.middleware');

router.use(authenticateToken);

// Voice Enrollment: Faculty registers student voice by roll number
router.post('/enroll', authorizeRoles('faculty'), arrayUpload('samples', 5), enrollVoiceByFaculty);

// Status check endpoint (Accessible by student, faculty, admin)
router.get('/status', authorizeRoles('student', 'faculty', 'admin'), getVoiceStatus);

// Voice Verification: Student submits voice sample to mark attendance in active session
router.post('/verify', authorizeRoles('student'), upload.single('audio'), verifyVoiceAndLogAttendance);

module.exports = router;
