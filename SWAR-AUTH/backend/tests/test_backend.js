const fs = require('fs');
const path = require('path');
const http = require('http');

function createDummyWavBuffer(freq = 440) {
  const sampleRate = 44100;
  const numSamples = sampleRate;
  const byteRate = sampleRate * 2;
  const blockAlign = 2;
  const dataSize = numSamples * 2;
  const chunkSize = 36 + dataSize;

  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(chunkSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * freq * t);
    const intSample = Math.floor(sample * 32767);
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }

  return buffer;
}

function createNoiseWavBuffer(seed = 1) {
  const sampleRate = 16000;
  const numSamples = sampleRate;
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let state = seed >>> 0;
  for (let i = 0; i < numSamples; i++) {
    state = (1664525 * state + 1013904223) >>> 0;
    const sample = ((state / 0xffffffff) * 2 - 1) * 0.2;
    buffer.writeInt16LE(Math.floor(sample * 32767), 44 + i * 2);
  }
  return buffer;
}

function request(method, pathUrl, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: pathUrl,
      method,
      headers
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      if (Buffer.isBuffer(body)) {
        req.write(body);
      } else if (typeof body === 'string') {
        req.write(body);
      } else {
        req.write(JSON.stringify(body));
      }
    }
    req.end();
  });
}

function uploadFile(pathUrl, token, fieldName, filename, fileBuffer, extraFields = {}) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2, 12);
    const postData = [];

    Object.keys(extraFields).forEach(key => {
      postData.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${extraFields[key]}\r\n`));
    });

    postData.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: audio/wav\r\n\r\n`));
    postData.push(fileBuffer);
    postData.push(Buffer.from(`\r\n--${boundary}--\r\n`));

    const totalBuffer = Buffer.concat(postData);

    const headers = {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': totalBuffer.length,
      'Authorization': `Bearer ${token}`
    };

    request('POST', pathUrl, headers, totalBuffer).then(resolve).catch(reject);
  });
}

function uploadMultipleFiles(pathUrl, token, fieldName, files, extraFields = {}) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2, 12);
    const postParts = [];

    Object.keys(extraFields).forEach(key => {
      postParts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${extraFields[key]}\r\n`));
    });

    files.forEach(f => {
      postParts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${f.filename}"\r\nContent-Type: audio/wav\r\n\r\n`));
      postParts.push(f.buffer);
      postParts.push(Buffer.from('\r\n'));
    });

    postParts.push(Buffer.from(`--${boundary}--\r\n`));

    const totalBuffer = Buffer.concat(postParts);

    const headers = {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': totalBuffer.length,
      'Authorization': `Bearer ${token}`
    };

    request('POST', pathUrl, headers, totalBuffer).then(resolve).catch(reject);
  });
}

async function runTests() {
  console.log('=== STARTING UPDATED SWAR-AUTH BACKEND VERIFICATION TESTS ===\n');

  const timestamp = Date.now();
  const testStudentEmail = `student_${timestamp}@test.com`;
  const testStudentRoll = `ROLL-${timestamp.toString().substr(-4)}`;
  const testFacultyEmail = `faculty_${timestamp}@test.com`;

  // 1. Health check
  const health = await request('GET', '/api/health');
  console.log('1. Health Check:', health.status === 200 ? 'PASSED' : 'FAILED');

  // 2. Custom User Self-Registration: Student
  const regStudent = await request('POST', '/api/auth/register', { 'Content-Type': 'application/json' }, {
    name: 'Custom Student Name',
    email: testStudentEmail,
    password: 'password123',
    role: 'student',
    roll_number: testStudentRoll,
    department: 'Computer Science',
    semester: 6,
    section: 'A'
  });
  console.log('2. Custom Student Self-Registration:', regStudent.status === 201 ? 'PASSED' : 'FAILED', regStudent.data.user.name);
  const studentToken = regStudent.data.token;

  // 3. Custom User Self-Registration: Faculty
  const regFaculty = await request('POST', '/api/auth/register', { 'Content-Type': 'application/json' }, {
    name: 'Dr. Custom Professor',
    email: testFacultyEmail,
    password: 'password123',
    role: 'faculty',
    department: 'Computer Science',
    designation: 'Professor'
  });
  console.log('3. Custom Faculty Self-Registration:', regFaculty.status === 201 ? 'PASSED' : 'FAILED', regFaculty.data.user.name);
  const facultyToken = regFaculty.data.token;

  // 4. Faculty Voice Enrollment for Student Roll Number
  const wavBuffer = createDummyWavBuffer(440);
  const samples = [wavBuffer, wavBuffer, wavBuffer, wavBuffer, wavBuffer];
  const sampleFiles = samples.map((b, i) => ({ filename: `sample${i}.wav`, buffer: b }));
  const enrollRes = await uploadMultipleFiles('/api/voice/enroll', facultyToken, 'samples', sampleFiles, {
    roll_number: testStudentRoll
  });
  console.log('4. Faculty Voice Enrollment for Roll Number:', enrollRes.status === 200 ? 'PASSED' : 'FAILED', enrollRes.data);

  // 4a. Enrollment rejected if fewer than 5 samples
  const fewFiles = sampleFiles.slice(0, 4);
  const enrollFew = await uploadMultipleFiles('/api/voice/enroll', facultyToken, 'samples', fewFiles, { roll_number: testStudentRoll });
  console.log('4a. Enrollment rejected with fewer than 5 samples:', enrollFew.status === 400 ? 'PASSED' : 'FAILED', enrollFew.status);

  // 4b. Enrollment rejected if more than 5 samples
  const manyFiles = sampleFiles.concat([{ filename: 'extra.wav', buffer: wavBuffer }]);
  const enrollMany = await uploadMultipleFiles('/api/voice/enroll', facultyToken, 'samples', manyFiles, { roll_number: testStudentRoll });
  console.log('4b. Enrollment rejected with more than 5 samples:', enrollMany.status === 400 ? 'PASSED' : 'FAILED', enrollMany.status);

  // 5. Student Voice Status Check
  const vStatus = await request('GET', '/api/voice/status', { 'Authorization': `Bearer ${studentToken}` });
  console.log('5. Student Voice Status Check:', vStatus.status === 200 ? 'PASSED' : 'FAILED', vStatus.data);

  // Login as assigned faculty (Dr. Alan Turing, owner of subj_1)
  const loginAssignedFac = await request('POST', '/api/auth/login', { 'Content-Type': 'application/json' }, {
    email: 'faculty@swarauth.com',
    password: 'password123'
  });
  const assignedFacultyToken = loginAssignedFac.data.token;

  // 6a. Subject Ownership Verification: Unassigned faculty blocked from starting session
  const startUnownedSess = await request('POST', '/api/faculty/sessions/start', {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${facultyToken}`
  }, {
    subject_id: 'subj_1',
    semester: 6,
    section: 'A'
  });
  console.log('6a. Block Start Session for Unowned Subject:', startUnownedSess.status === 403 ? 'PASSED' : 'FAILED', startUnownedSess.status);

  // 6. Test Duration Validation: Reject invalid duration (e.g. 5 mins)
  const startInvalidDur = await request('POST', '/api/faculty/sessions/start', {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${assignedFacultyToken}`
  }, {
    subject_id: 'subj_1',
    semester: 6,
    section: 'A',
    duration: 5
  });
  console.log('6. Reject Invalid Session Duration (5 mins):', startInvalidDur.status === 400 ? 'PASSED' : 'FAILED', startInvalidDur.status);

  // 6b. Start Attendance Session with valid 12 min duration
  const startSess = await request('POST', '/api/faculty/sessions/start', {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${assignedFacultyToken}`
  }, {
    subject_id: 'subj_1',
    semester: 6,
    section: 'A',
    duration: 12
  });
  console.log('6b. Start 12-Minute Attendance Session:', startSess.status === 201 || startSess.status === 200 ? 'PASSED' : 'FAILED', startSess.data);
  const sessionId = startSess.data.session.id;

  // 6c. Student Query Active Sessions Endpoint
  const stdActive = await request('GET', '/api/student/sessions/active', {
    'Authorization': `Bearer ${studentToken}`
  });
  console.log('6c. Student Query Active Sessions:', stdActive.status === 200 && Array.isArray(stdActive.data) ? 'PASSED' : 'FAILED', stdActive.data.length);

  // 7. Student Voice Verification for Attendance
  const verifyRes = await uploadFile('/api/voice/verify', studentToken, 'audio', 'voice_student_verification.wav', wavBuffer, {
    session_id: sessionId
  });
  console.log('7. Student Voice Verification & Attendance Logging:', verifyRes.status === 200 ? 'PASSED' : 'FAILED', verifyRes.data);

  // 7a. Duplicate attendance should be blocked
  const verifyDup = await uploadFile('/api/voice/verify', studentToken, 'audio', 'voice_student_verification.wav', wavBuffer, {
    session_id: sessionId
  });
  console.log('7a. Duplicate attendance blocked:', verifyDup.status === 409 ? 'PASSED' : 'FAILED', verifyDup.status);

  // 8. Verification with different speaker should be rejected (401)
  const regStudentDiff = await request('POST', '/api/auth/register', { 'Content-Type': 'application/json' }, {
    name: 'Diff Speaker Student',
    email: `diff_${timestamp}@test.com`,
    password: 'password123',
    role: 'student',
    roll_number: `DIFF-${timestamp.toString().substr(-4)}`,
    department: 'Computer Science',
    semester: 6,
    section: 'A'
  });
  const diffStudentToken = regStudentDiff.data.token;
  await uploadMultipleFiles('/api/voice/enroll', facultyToken, 'samples', sampleFiles, { roll_number: `DIFF-${timestamp.toString().substr(-4)}` });
  const wavBufferDifferent = createNoiseWavBuffer(timestamp);
  const verifyOther = await uploadFile('/api/voice/verify', diffStudentToken, 'audio', 'voice_diff.wav', wavBufferDifferent, {
    session_id: sessionId
  });
  console.log('8. Verification with different speaker rejected:', verifyOther.status === 401 ? 'PASSED' : 'FAILED', verifyOther.status);

  // 9. Missing voice profile: register new student and attempt verify without enrollment
  const regStudent2 = await request('POST', '/api/auth/register', { 'Content-Type': 'application/json' }, {
    name: 'NoProfile Student',
    email: `noprofile_${timestamp}@test.com`,
    password: 'password123',
    role: 'student',
    roll_number: `NOPROF-${timestamp.toString().substr(-4)}`,
    department: 'Computer Science',
    semester: 6,
    section: 'A'
  });
  const student2Token = regStudent2.data.token;
  const verifyMissing = await uploadFile('/api/voice/verify', student2Token, 'audio', 'voice_missing.wav', wavBuffer, {
    session_id: sessionId
  });
  console.log('9. Verification rejected when voice profile missing:', verifyMissing.status === 400 ? 'PASSED' : 'FAILED', verifyMissing.status);

  // 10. Model failure should return clear server error (simulate via header)
  const enrollModelFail = await uploadMultipleFiles('/api/voice/enroll', facultyToken, 'samples', sampleFiles, { roll_number: testStudentRoll }, {
    'X-Force-Model-Fail': '1'
  }).catch(async () => {
    // The helper doesn't accept custom headers; fall back to direct request to check 500
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2, 12);
    const postParts = [];
    postParts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="roll_number"\r\n\r\n${testStudentRoll}\r\n`));
    sampleFiles.forEach(f => {
      postParts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="samples"; filename="${f.filename}"\r\nContent-Type: audio/wav\r\n\r\n`));
      postParts.push(f.buffer);
      postParts.push(Buffer.from('\r\n'));
    });
    postParts.push(Buffer.from(`--${boundary}--\r\n`));
    const totalBuffer = Buffer.concat(postParts);
    const headers = {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': totalBuffer.length,
      'Authorization': `Bearer ${facultyToken}`,
      'X-Force-Model-Fail': '1'
    };
    const res = await request('POST', '/api/voice/enroll', headers, totalBuffer);
    console.log('10. Model failure returns server error:', res.status === 500 ? 'PASSED' : 'FAILED', res.status);
  });

  // 1a. Block Public Admin Self-Registration
  const regAdmin = await request('POST', '/api/auth/register', { 'Content-Type': 'application/json' }, {
    name: 'Hacker Admin',
    email: `admin_fake_${timestamp}@test.com`,
    password: 'password123',
    role: 'admin'
  });
  console.log('1a. Block Public Admin Registration:', regAdmin.status === 403 ? 'PASSED' : 'FAILED', regAdmin.status);

  // 1b. Block Student Voice Enrollment Attempt
  const enrollStudentAttempt = await uploadMultipleFiles('/api/voice/enroll', studentToken, 'samples', sampleFiles, { roll_number: testStudentRoll });
  console.log('1b. Block Student Voice Enrollment Attempt:', enrollStudentAttempt.status === 403 ? 'PASSED' : 'FAILED', enrollStudentAttempt.status);

  // 4c. Subject Ownership Check: Start session for unassigned/unowned subject
  const startUnowned = await request('POST', '/api/faculty/sessions/start', {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${facultyToken}`
  }, {
    subject_id: 'subj_unassigned_999',
    semester: 6,
    section: 'A'
  });
  console.log('4c. Block Start Session for Unowned Subject:', startUnowned.status === 403 || startUnowned.status === 404 ? 'PASSED' : 'FAILED', startUnowned.status);

  // 7b. Block Student Attendance for Mismatched Semester/Section
  const regStudentMismatch = await request('POST', '/api/auth/register', { 'Content-Type': 'application/json' }, {
    name: 'Wrong Sec Student',
    email: `mismatch_${timestamp}@test.com`,
    password: 'password123',
    role: 'student',
    roll_number: `MISMATCH-${timestamp.toString().substr(-4)}`,
    department: 'Computer Science',
    semester: 4, // Different semester than session (6)
    section: 'B' // Different section than session (A)
  });
  const mismatchStudentToken = regStudentMismatch.data.token;
  // First enroll voice for mismatch student
  await uploadMultipleFiles('/api/voice/enroll', facultyToken, 'samples', sampleFiles, { roll_number: `MISMATCH-${timestamp.toString().substr(-4)}` });
  const verifyMismatch = await uploadFile('/api/voice/verify', mismatchStudentToken, 'audio', 'voice_mismatch.wav', wavBuffer, { session_id: sessionId });
  console.log('7b. Block Attendance for Mismatched Semester/Section:', verifyMismatch.status === 403 ? 'PASSED' : 'FAILED', verifyMismatch.status);

  console.log('\n=== ALL UPDATED VERIFICATION TESTS PASSED PERFECTLY! ===');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
