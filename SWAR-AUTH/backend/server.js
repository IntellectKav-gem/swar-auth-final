const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { seedDatabase } = require('./src/services/seed.service');

const authRoutes = require('./src/routes/auth.routes');
const adminRoutes = require('./src/routes/admin.routes');
const facultyRoutes = require('./src/routes/faculty.routes');
const studentRoutes = require('./src/routes/student.routes');
const voiceRoutes = require('./src/routes/voice.routes');
const reportRoutes = require('./src/routes/report.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Public Web UI and Uploads statically
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    system: 'SWAR-AUTH Voice Attendance API Server',
    timestamp: new Date().toISOString()
  });
});

// API Module Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/reports', reportRoutes);

// Serve Web App index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Requested API endpoint not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start Server & Seed Database
app.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`SWAR-AUTH Voice Attendance Backend Running on Port ${PORT}`);
  console.log(`Web Portal: http://localhost:${PORT}/`);
  console.log(`Health Check: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
  
  await seedDatabase();
});

module.exports = app;
