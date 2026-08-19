const express = require('express');
const router = express.Router();
const {
  getAssignedSubjects,
  startAttendanceSession,
  endAttendanceSession,
  getActiveSession,
  getAttendanceHistory
} = require('../controllers/faculty.controller');

const { authenticateToken } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/rbac.middleware');

router.use(authenticateToken);
router.use(authorizeRoles('faculty'));

router.get('/subjects', getAssignedSubjects);
router.post('/sessions/start', startAttendanceSession);
router.post('/sessions/:id/end', endAttendanceSession);
router.get('/sessions/active', getActiveSession);
router.get('/attendance/history', getAttendanceHistory);

module.exports = router;
