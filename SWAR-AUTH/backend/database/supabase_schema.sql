-- ====================================================================
-- SWAR-AUTH SUPABASE POSTGRESQL DATABASE MIGRATION SCRIPT
-- ====================================================================
-- Description: Creates all database tables, primary keys, foreign keys,
-- enum constraints, composite unique constraints, indexes, and RLS policies
-- required for the SWAR-AUTH Voice Attendance Management System.
-- ====================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 1. USERS TABLE
-- Stores user credentials and access roles ('admin', 'faculty', 'student')
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'faculty', 'student')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 2. STUDENTS TABLE
-- Stores academic details for student users
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    roll_number VARCHAR(100) UNIQUE NOT NULL,
    department VARCHAR(255) NOT NULL,
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    section VARCHAR(10) NOT NULL DEFAULT 'A',
    user_id TEXT UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 3. FACULTY TABLE
-- Stores profile details for faculty users
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.faculty (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    department VARCHAR(255) NOT NULL,
    designation VARCHAR(255) NOT NULL,
    user_id TEXT UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 4. SUBJECTS TABLE
-- Stores subject details assigned to faculty members
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subjects (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    subject_name VARCHAR(255) NOT NULL,
    subject_code VARCHAR(100) UNIQUE NOT NULL,
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    section VARCHAR(10) DEFAULT 'A',
    faculty_id TEXT REFERENCES public.faculty(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 5. VOICE PROFILES TABLE
-- Stores 512-d normalized speaker embeddings extracted via SpeechBrain ECAPA-VOXCELEB
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.voice_profiles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id TEXT UNIQUE NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    embedding TEXT NOT NULL, -- JSON stringified float array
    sample_count INT DEFAULT 5 CHECK (sample_count = 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 6. ATTENDANCE SESSIONS TABLE
-- Stores active and closed attendance sessions initiated by faculty
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    faculty_id TEXT NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    section VARCHAR(10) NOT NULL,
    duration INT DEFAULT 10 CHECK (duration IN (10, 12, 15)),
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 7. ATTENDANCE RECORDS TABLE
-- Stores individual student attendance verification records
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    session_id TEXT REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time TIME NOT NULL DEFAULT CURRENT_TIME,
    status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present', 'absent')),
    verification_score DOUBLE PRECISION DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_student_session UNIQUE (student_id, session_id)
);

-- ====================================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_students_roll ON public.students(roll_number);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students(user_id);
CREATE INDEX IF NOT EXISTS idx_faculty_user_id ON public.faculty(user_id);
CREATE INDEX IF NOT EXISTS idx_subjects_code ON public.subjects(subject_code);
CREATE INDEX IF NOT EXISTS idx_subjects_faculty_id ON public.subjects(faculty_id);
CREATE INDEX IF NOT EXISTS idx_voice_student_id ON public.voice_profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_faculty_date ON public.attendance_sessions(faculty_id, date);
CREATE INDEX IF NOT EXISTS idx_sessions_subject ON public.attendance_sessions(subject_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON public.attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON public.attendance(session_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- 1. USERS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid()::text = id OR role = 'admin');

DROP POLICY IF EXISTS "Admins manage all users" ON public.users;
CREATE POLICY "Admins manage all users" ON public.users
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 2. STUDENTS TABLE POLICIES
DROP POLICY IF EXISTS "Students view own details" ON public.students;
CREATE POLICY "Students view own details" ON public.students
    FOR SELECT USING (auth.uid()::text = user_id OR auth.jwt() ->> 'role' IN ('admin', 'faculty'));

DROP POLICY IF EXISTS "Faculty and Admin manage students" ON public.students;
CREATE POLICY "Faculty and Admin manage students" ON public.students
    FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'faculty'));

-- 3. FACULTY TABLE POLICIES
DROP POLICY IF EXISTS "Faculty view own profile" ON public.faculty;
CREATE POLICY "Faculty view own profile" ON public.faculty
    FOR SELECT USING (auth.uid()::text = user_id OR auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Admin manages faculty" ON public.faculty;
CREATE POLICY "Admin manages faculty" ON public.faculty
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 4. SUBJECTS TABLE POLICIES
DROP POLICY IF EXISTS "Authenticated users view subjects" ON public.subjects;
CREATE POLICY "Authenticated users view subjects" ON public.subjects
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin manages subjects" ON public.subjects;
CREATE POLICY "Admin manages subjects" ON public.subjects
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 5. VOICE PROFILES POLICIES (Faculty registers voice profile)
DROP POLICY IF EXISTS "Faculty manage voice profiles" ON public.voice_profiles;
CREATE POLICY "Faculty manage voice profiles" ON public.voice_profiles
    FOR ALL USING (auth.jwt() ->> 'role' = 'faculty');

DROP POLICY IF EXISTS "Students view own voice profile status" ON public.voice_profiles;
CREATE POLICY "Students view own voice profile status" ON public.voice_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = voice_profiles.student_id AND s.user_id = auth.uid()::text
        )
    );

-- 6. ATTENDANCE SESSIONS POLICIES
DROP POLICY IF EXISTS "Faculty manages attendance sessions" ON public.attendance_sessions;
CREATE POLICY "Faculty manages attendance sessions" ON public.attendance_sessions
    FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'faculty'));

DROP POLICY IF EXISTS "Students view active sessions" ON public.attendance_sessions;
CREATE POLICY "Students view active sessions" ON public.attendance_sessions
    FOR SELECT USING (status = 'active');

-- 7. ATTENDANCE RECORDS POLICIES
DROP POLICY IF EXISTS "Students log own attendance during verification" ON public.attendance;
CREATE POLICY "Students log own attendance during verification" ON public.attendance
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = student_id AND s.user_id = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Faculty and Admin view and manage all attendance" ON public.attendance;
CREATE POLICY "Faculty and Admin view and manage all attendance" ON public.attendance
    FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'faculty'));
