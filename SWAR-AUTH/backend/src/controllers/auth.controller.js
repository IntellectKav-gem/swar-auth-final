const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { queryOne, insertRecord } = require('../config/db');

const createJwtToken = (user, profile) => {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    profileId: profile ? profile.id : null,
    profile
  };
  const jwtSecret = process.env.JWT_SECRET || 'swar_auth_jwt_secret_key_2026';
  return {
    payload,
    token: jwt.sign(payload, jwtSecret, { expiresIn: '24h' })
  };
};

const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      roll_number,
      department,
      semester,
      section,
      designation
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    const userRole = role.toLowerCase();
    if (!['admin', 'faculty', 'student'].includes(userRole)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin, faculty, or student' });
    }

    if (userRole === 'admin') {
      return res.status(403).json({
        error: 'Admin accounts cannot be created through the public registration endpoint. Use a secure seed script or manual database provisioning.'
      });
    }

    const existingUser = await queryOne('users', { email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email address is already registered' });
    }

    if (userRole === 'student') {
      if (!roll_number || !department || !semester || !section) {
        return res.status(400).json({
          error: 'roll_number, department, semester, and section are required for students'
        });
      }

      const existingRoll = await queryOne('students', { roll_number: roll_number.toUpperCase() });
      if (existingRoll) {
        return res.status(400).json({ error: 'Roll number is already registered' });
      }
    } else if (userRole === 'faculty') {
      if (!department || !designation) {
        return res.status(400).json({ error: 'department and designation are required for faculty' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    const user = await insertRecord('users', {
      id: userId,
      name,
      email: email.toLowerCase(),
      password: passwordHash,
      role: userRole
    });

    let profile = null;
    if (userRole === 'student') {
      const studentId = `std_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      profile = await insertRecord('students', {
        id: studentId,
        roll_number: roll_number.toUpperCase(),
        department,
        semester: parseInt(semester, 10),
        section: section.toUpperCase(),
        user_id: user.id
      });
    } else if (userRole === 'faculty') {
      const facultyId = `fac_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      profile = await insertRecord('faculty', {
        id: facultyId,
        department,
        designation,
        user_id: user.id
      });
    }

    const { token, payload } = createJwtToken(user, profile);
    return res.status(201).json({ message: 'Account registered successfully', token, user: payload });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error during registration' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await queryOne('users', { email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    let profile = null;
    if (user.role === 'student') {
      profile = await queryOne('students', { user_id: user.id });
    } else if (user.role === 'faculty') {
      profile = await queryOne('faculty', { user_id: user.id });
    }

    const { token, payload } = createJwtToken(user, profile);
    return res.status(200).json({ message: 'Login successful', token, user: payload });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await queryOne('users', { id: req.user.id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let profile = null;
    if (user.role === 'student') {
      profile = await queryOne('students', { user_id: user.id });
    } else if (user.role === 'faculty') {
      profile = await queryOne('faculty', { user_id: user.id });
    }

    const { password, ...userWithoutPassword } = user;
    return res.status(200).json({
      user: {
        ...userWithoutPassword,
        profileId: profile ? profile.id : null,
        profile
      }
    });
  } catch (err) {
    console.error('GetMe error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const logout = async (req, res) => {
  return res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = {
  register,
  login,
  getMe,
  logout
};
