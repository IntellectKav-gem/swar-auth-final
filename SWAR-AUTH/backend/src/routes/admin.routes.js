const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/admin.controller');

const { authenticateToken } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/rbac.middleware');

// Protect all admin routes
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

router.get('/dashboard', getDashboardStats);

// Student endpoints
router.get('/students', getStudents);
router.post('/students', createStudent);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);

// Faculty endpoints
router.get('/faculty', getFaculty);
router.post('/faculty', createFaculty);
router.put('/faculty/:id', updateFaculty);
router.delete('/faculty/:id', deleteFaculty);

// Subject endpoints
router.get('/subjects', getSubjects);
router.post('/subjects', createSubject);
router.post('/assign-faculty', assignFacultyToSubject);

module.exports = router;
