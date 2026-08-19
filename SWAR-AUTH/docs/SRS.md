# Software Requirements Specification (SRS)
## SWAR-AUTH: Voice Biometric Attendance Management System

---

## 1. System Overview & Objectives
**SWAR-AUTH** is an enterprise-grade, real-time Voice Biometric Attendance Management Application. It leverages deep learning speaker embeddings (SpeechBrain ECAPA-VOXCELEB) and acoustic signature verification to deliver frictionless, contactless, and fraud-resistant attendance tracking for academic institutions.

### Key Objectives
1. **Biometric Security**: Eliminate proxy attendance using 512-dimensional voice embeddings and cosine similarity authentication.
2. **Unified Architecture**: Standardized on a high-performance **Express.js (Node.js)** backend API server and **Supabase PostgreSQL** cloud relational database platform.
3. **Role-Based Access Control (RBAC)**: Strict access boundaries enforced across `Admin`, `Faculty`, and `Student` roles.
4. **Data Integrity**: Complete database constraints, foreign keys, unique session attendance restrictions, and subject ownership validations.

---

## 2. System Architecture & Tech Stack

### 2.1 Technology Stack
- **Backend Framework**: Express.js (Node.js) RESTful API server.
- **Database Engine**: Supabase Cloud PostgreSQL with Row Level Security (RLS) and connection pooling.
- **Biometric Processing Engine**: Python 3.x with SpeechBrain (`speechbrain/spkrec-ecapa-voxceleb` PyTorch model).
- **Authentication**: JSON Web Tokens (JWT) signed with SHA-256 secret keys & bcrypt password hashing.
- **File Ingestion**: Multer multipart middleware for 16kHz WAV audio sample ingestion.

### 2.2 System Flow Diagram
```
┌──────────────────┐       JWT Auth        ┌──────────────────────┐
│                  │ ───────────────────>  │  Express.js Server   │
│ Client Web / Mobile │                       │   (Port 5000 REST)   │
│   (Frontend UI)  │ <───────────────────  └──────────┬───────────┘
└──────────────────┘    JSON Response                 │
                                                       │ Supabase SQL Client
                                                       ▼
┌──────────────────┐    Exec Subprocess    ┌──────────────────────┐
│  Python Engine   │ <───────────────────> │ Supabase PostgreSQL  │
│ (SpeechBrain/PyTorch)                     │    Cloud Database    │
└──────────────────┘                       └──────────────────────┘
```

---

## 3. Database Schema & Data Models (Supabase PostgreSQL)

### 3.1 Entities & Relationships
1. **`users`**: Base credentials table (`id`, `name`, `email`, `password`, `role`).
2. **`students`**: Academic profile (`id`, `roll_number`, `department`, `semester`, `section`, `user_id`).
3. **`faculty`**: Faculty profile (`id`, `department`, `designation`, `user_id`).
4. **`subjects`**: Course catalog (`id`, `subject_name`, `subject_code`, `semester`, `section`, `faculty_id`).
5. **`voice_profiles`**: Biometric data (`id`, `student_id`, `embedding`, `sample_count`).
6. **`attendance_sessions`**: Live session tracking (`id`, `subject_id`, `faculty_id`, `semester`, `section`, `date`, `status`).
7. **`attendance`**: Verification log (`id`, `student_id`, `subject_id`, `session_id`, `date`, `time`, `status`, `verification_score`).

### 3.2 SQL Table Schemas & Constraints
- **Primary Keys**: `UUID` / `TEXT` generated primary keys.
- **Foreign Key Actions**:
  - `user_id` -> `users(id)` ON DELETE CASCADE
  - `faculty_id` -> `faculty(id)` ON DELETE SET NULL / CASCADE
  - `student_id` -> `students(id)` ON DELETE CASCADE
- **Check Constraints**:
  - `role IN ('admin', 'faculty', 'student')`
  - `semester BETWEEN 1 AND 8`
  - `session status IN ('active', 'closed')`
  - `attendance status IN ('present', 'absent')`
  - `voice_profiles.sample_count = 5`
- **Unique Constraints**:
  - `attendance`: `UNIQUE(student_id, session_id)` (prevents duplicate attendance for the same session)
  - `attendance`: `UNIQUE(student_id, subject_id, date)` (prevents duplicate daily logging)

---

## 4. Role-Based Access Control (RBAC) & Security Policies

| Role | Public Registration | Voice Enrollment | Session Creation | Session Closure | Mark Attendance | Daily & Department Reports |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Admin** | ❌ Blocked (403) | ❌ Blocked (403) | ❌ | ❌ | ❌ | ✅ Full Access |
| **Faculty**| ✅ Public Self-Reg | ✅ Allowed (Exactly 5 samples) | ✅ (Subject Ownership Required) | ✅ (Session Owner Only) | ❌ | ✅ Daily & Subject Reports |
| **Student**| ✅ Public Self-Reg | ❌ Blocked (403) | ❌ | ❌ | ✅ Voice Verification (Semester/Section match) | ✅ Own Attendance |

### 4.1 Security & Business Logic Rules
1. **Admin Registration Lockout**: The `/api/auth/register` endpoint strictly blocks requests attempting to create an `admin` user, returning `403 Forbidden`. Admin users must be seeded via `seed.service.js` or directly provisioned in the database.
2. **Faculty-Only Voice Enrollment**: Voice enrollment is strictly limited to users with the `faculty` role. Requests from `admin` or `student` roles return `403 Forbidden`.
3. **Strict 5-Sample Biometric Rule**: Voice enrollment requires exactly **5 audio sample files**. Ingestion of fewer or more than 5 samples returns `400 Bad Request`.
4. **Subject Ownership Enforcement**: When creating an attendance session, the backend checks `subjects.faculty_id`. If the assigned faculty ID does not match the authenticated user's faculty ID, the action is rejected with `403 Forbidden`.
5. **Session Closure Security**: Closing an attendance session requires verifying that `attendance_sessions.faculty_id` matches the authenticated faculty member's ID. Mismatches return `403 Forbidden`.
6. **Student Session Verification**: When a student attempts voice verification, the server checks that the student's `semester` and `section` match the session's `semester` and `section`. Mismatches return `403 Forbidden`.
7. **Duplicate Attendance Rule**: Students are strictly prohibited from logging attendance more than once for the same `session_id`. Re-submission returns `409 Conflict`.

---

## 5. API Endpoints Specification

### 5.1 Authentication (`/api/auth`)
- `POST /api/auth/register`: Public self-registration for Faculty and Students. Returns JWT token. (Admin role blocked with 403).
- `POST /api/auth/login`: Authenticates user credentials, returns JWT token & role payload.
- `GET /api/auth/me`: Retrieves current authenticated user profile details.
- `POST /api/auth/logout`: Invalidates client token session.

### 5.2 Voice Processing (`/api/voice`)
- `POST /api/voice/enroll`: [Faculty Only] Registers 5-sample voice biometric profile for a student roll number.
- `GET /api/voice/status`: Retrieves student voice enrollment status (`is_enrolled`, `sample_count`).
- `POST /api/voice/verify`: [Student Only] Submits 1 audio sample to verify biometric identity against active session. Returns verification score & records attendance as `PRESENT`.

### 5.3 Faculty Management (`/api/faculty`)
- `GET /api/faculty/subjects`: Retrieves subjects assigned to the authenticated faculty.
- `POST /api/faculty/sessions/start`: Starts a new active attendance session (Subject ownership verified).
- `POST /api/faculty/sessions/:id/end`: Closes an active attendance session (Session owner verified).
- `GET /api/faculty/sessions/active`: Retrieves current active session details and total live attendees.
- `GET /api/faculty/attendance/history`: Retrieves historical session logs and student attendee details.

### 5.4 Admin Operations (`/api/admin`)
- `GET /api/admin/dashboard`: System overview statistics (total students, faculty, subjects, sessions, records).
- `GET/POST/PUT/DELETE /api/admin/students`: CRUD operations for student profiles.
- `GET/POST/PUT/DELETE /api/admin/faculty`: CRUD operations for faculty profiles.
- `GET/POST /api/admin/subjects`: CRUD operations for subjects catalog.
- `POST /api/admin/assign-faculty`: Maps faculty assignment to a subject code.

### 5.5 Reports (`/api/reports`)
- `GET /api/reports/faculty/daily`: Daily session attendance summary for faculty.
- `GET /api/reports/faculty/subject`: Detailed attendance breakdown by subject and student.
- `GET /api/reports/admin/department`: Department-wide overall attendance percentage and enrollment metrics.

---

## 6. Voice Biometric Engine Specifications
- **Model Architecture**: SpeechBrain ECAPA-VOXCELEB (Pretrained Speaker Recognition Neural Network).
- **Embedding Dimension**: 512-float normalized vector.
- **Enrollment Aggregation**: 5 audio samples extracted, element-wise averaged, and L2-normalized.
- **Verification Metric**: Cosine Similarity between live sample embedding and enrolled profile embedding.
- **Decision Threshold**: `similarity_score >= 0.70` (Returns `VERIFIED` status).
- **Error Handling**: Graceful 500 error reporting if PyTorch or audio processing model is unavailable.

---

## 7. Verification & Quality Assurance Matrix

| Test ID | Test Scenario | Expected Status | Result |
| :--- | :--- | :---: | :---: |
| **TC-01** | Backend Health Check (`/api/health`) | `200 OK` | PASSED |
| **TC-02** | Public Admin Registration Attempt | `403 Forbidden` | PASSED |
| **TC-03** | Faculty Self-Registration & Login | `201 Created` | PASSED |
| **TC-04** | Faculty Voice Enrollment (5 Samples) | `200 OK` | PASSED |
| **TC-05** | Faculty Voice Enrollment (< 5 Samples) | `400 Bad Request` | PASSED |
| **TC-06** | Student Voice Enrollment Attempt | `403 Forbidden` | PASSED |
| **TC-07** | Start Session for Assigned Subject | `201 Created` | PASSED |
| **TC-08** | Start Session for Unassigned Subject | `403 Forbidden` | PASSED |
| **TC-09** | Close Session by Session Owner | `200 OK` | PASSED |
| **TC-10** | Close Session by Non-Owner Faculty | `403 Forbidden` | PASSED |
| **TC-11** | Student Voice Attendance Verification | `200 OK` | PASSED |
| **TC-12** | Student Mismatched Semester/Section Verification | `403 Forbidden` | PASSED |
| **TC-13** | Duplicate Attendance Submission for Session | `409 Conflict` | PASSED |

---
*Document Version 2.0 - SWAR-AUTH Architectural Standardized Specification*
