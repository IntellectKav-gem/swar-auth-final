const express = require('express');
const router = express.Router();
const {
  getStudentProfile,
  getSubjectAttendance,
  getOverallAttendance,
  getActiveSessionsForStudent,
  getStudentAttendanceHistory
} = require('../controllers/student.controller');

const { authenticateToken } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/rbac.middleware');

router.use(authenticateToken);
router.use(authorizeRoles('student'));

router.get('/profile', getStudentProfile);
router.get('/attendance/subject', getSubjectAttendance);
router.get('/attendance/overall', getOverallAttendance);
router.get('/attendance/history', getStudentAttendanceHistory);
router.get('/sessions/active', getActiveSessionsForStudent);

module.exports = router;
