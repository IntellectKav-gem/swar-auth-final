const bcrypt = require('bcryptjs');
const { queryOne, insertRecord } = require('../config/db');

async function seedDatabase() {
  try {
    const existingAdmin = await queryOne('users', { email: 'admin@swarauth.com' });
    if (existingAdmin) {
      console.log('Seed skipped: admin user already exists');
      return;
    }

    console.log('Seeding initial SWAR-AUTH database records...');
    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('password123', salt);
    const adminPasswordHash = await bcrypt.hash('admin123', salt);

    await insertRecord('users', {
      id: 'usr_admin_1',
      name: 'System Admin',
      email: 'admin@swarauth.com',
      password: adminPasswordHash,
      role: 'admin'
    });

    const facultyUser = await insertRecord('users', {
      id: 'usr_faculty_1',
      name: 'Dr. Alan Turing',
      email: 'faculty@swarauth.com',
      password: defaultPasswordHash,
      role: 'faculty'
    });

    await insertRecord('faculty', {
      id: 'fac_1',
      department: 'Computer Science',
      designation: 'Associate Professor',
      user_id: facultyUser.id
    });

    const studentUser = await insertRecord('users', {
      id: 'usr_student_1',
      name: 'Ada Lovelace',
      email: 'student@swarauth.com',
      password: defaultPasswordHash,
      role: 'student'
    });

    await insertRecord('students', {
      id: 'std_1',
      roll_number: 'CSE-2026-001',
      department: 'Computer Science',
      semester: 6,
      section: 'A',
      user_id: studentUser.id
    });

    await insertRecord('subjects', {
      id: 'subj_1',
      subject_name: 'Voice Authentication Systems',
      subject_code: 'CS601',
      semester: 6,
      section: 'A',
      faculty_id: 'fac_1'
    });

    console.log('Seed database completed successfully!');
    console.log('Default Accounts Created:');
    console.log(' - Admin: admin@swarauth.com / admin123');
    console.log(' - Faculty: faculty@swarauth.com / password123');
    console.log(' - Student: student@swarauth.com / password123');
  } catch (err) {
    console.error('Error seeding database:', err.message);
  }
}

module.exports = { seedDatabase };

