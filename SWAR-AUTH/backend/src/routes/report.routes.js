const express = require('express');
const router = express.Router();
const {
  getFacultyDailyReport,
  getFacultySubjectReport,
  getAdminDepartmentReport
} = require('../controllers/report.controller');

const { authenticateToken } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/rbac.middleware');

router.use(authenticateToken);

router.get('/faculty/daily', authorizeRoles('faculty'), getFacultyDailyReport);
router.get('/faculty/subject', authorizeRoles('faculty'), getFacultySubjectReport);
router.get('/admin/department', authorizeRoles('admin'), getAdminDepartmentReport);

module.exports = router;
