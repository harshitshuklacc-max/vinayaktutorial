-- =============================================================================
-- VINAYAK TUTORIAL – Anand, Gujarat
-- Normalized Relational Database Schema & Initial Migration (Reference SQL)
-- Supports MySQL 8.0+ / TiDB / PostgreSQL-compatible deployments
-- Note: Live runtime persistence in AI Studio uses Cloud Firestore governed by
-- firestore.rules and firebase-blueprint.json.
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  role ENUM('super_admin', 'admin', 'faculty', 'student') NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS courses (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  class_level VARCHAR(50) NOT NULL,
  board ENUM('CBSE', 'GSEB', 'CBSE & GSEB') NOT NULL,
  medium VARCHAR(40) NOT NULL DEFAULT 'English',
  description TEXT NOT NULL,
  duration VARCHAR(80) NOT NULL,
  fee_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  image_url VARCHAR(500) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subjects (
  id VARCHAR(64) PRIMARY KEY,
  course_id VARCHAR(64) NOT NULL,
  name VARCHAR(80) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_subjects_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS faculty (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NULL,
  faculty_code VARCHAR(40) NOT NULL UNIQUE,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  mobile VARCHAR(20) NULL,
  qualification VARCHAR(160) NOT NULL,
  specialization VARCHAR(160) NOT NULL,
  experience_years INT NOT NULL DEFAULT 0,
  bio TEXT NULL,
  photo_url TEXT NULL,
  status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_faculty_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NULL,
  admission_number VARCHAR(40) NOT NULL UNIQUE,
  full_name VARCHAR(120) NOT NULL,
  father_name VARCHAR(120) NULL,
  mother_name VARCHAR(120) NULL,
  mobile VARCHAR(20) NOT NULL,
  whatsapp VARCHAR(20) NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  dob DATE NULL,
  board ENUM('CBSE', 'GSEB') NOT NULL,
  medium VARCHAR(40) NOT NULL DEFAULT 'English',
  class_level VARCHAR(50) NOT NULL,
  address TEXT NULL,
  photo_url TEXT NULL,
  admission_date DATE NOT NULL,
  status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_students_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS admissions (
  id VARCHAR(64) PRIMARY KEY,
  enquiry_code VARCHAR(40) NOT NULL UNIQUE,
  student_full_name VARCHAR(120) NOT NULL,
  father_name VARCHAR(120) NOT NULL,
  mother_name VARCHAR(120) NULL,
  mobile VARCHAR(20) NOT NULL,
  whatsapp VARCHAR(20) NULL,
  email VARCHAR(160) NULL,
  dob DATE NULL,
  current_class VARCHAR(40) NULL,
  applying_for_class VARCHAR(40) NOT NULL,
  board ENUM('CBSE', 'GSEB') NOT NULL,
  medium VARCHAR(40) NOT NULL DEFAULT 'English',
  previous_school VARCHAR(160) NULL,
  address TEXT NULL,
  message TEXT NULL,
  status ENUM('New', 'Contacted', 'Follow-up', 'Interested', 'Admitted', 'Rejected') NOT NULL DEFAULT 'New',
  internal_notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS enrollments (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL,
  course_id VARCHAR(64) NOT NULL,
  enrolled_at DATE NOT NULL,
  status ENUM('Active', 'Completed', 'Withdrawn') NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_enrollments_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_enrollments_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE KEY uq_student_course (student_id, course_id)
);

CREATE TABLE IF NOT EXISTS attendance (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL,
  class_level VARCHAR(50) NOT NULL,
  attendance_date DATE NOT NULL,
  status ENUM('Present', 'Absent', 'Late') NOT NULL,
  marked_by_user_id VARCHAR(64) NOT NULL,
  remarks VARCHAR(300) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_attendance_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY uq_student_date (student_id, attendance_date)
);

CREATE TABLE IF NOT EXISTS study_materials (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  description TEXT NULL,
  class_level VARCHAR(50) NOT NULL,
  board VARCHAR(30) NOT NULL,
  subject VARCHAR(60) NOT NULL,
  category VARCHAR(60) NOT NULL,
  file_url TEXT NOT NULL,
  file_name VARCHAR(200) NOT NULL,
  uploaded_by_user_id VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS examinations (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  class_level VARCHAR(50) NOT NULL,
  board VARCHAR(30) NOT NULL,
  subject VARCHAR(60) NOT NULL,
  description TEXT NULL,
  duration_minutes INT NOT NULL,
  max_marks INT NOT NULL,
  scheduled_date DATE NOT NULL,
  status ENUM('Draft', 'Published', 'Completed') NOT NULL DEFAULT 'Draft',
  results_published BOOLEAN NOT NULL DEFAULT FALSE,
  show_rank BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_user_id VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS questions (
  id VARCHAR(64) PRIMARY KEY,
  exam_id VARCHAR(64) NOT NULL,
  question_text TEXT NOT NULL,
  question_type ENUM('MCQ', 'Subjective') NOT NULL,
  options_json JSON NULL,
  correct_option_index INT NULL,
  marks INT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_questions_exam FOREIGN KEY (exam_id) REFERENCES examinations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exam_attempts (
  id VARCHAR(64) PRIMARY KEY,
  exam_id VARCHAR(64) NOT NULL,
  student_id VARCHAR(64) NOT NULL,
  obtained_marks DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
  max_marks INT NOT NULL,
  percentage DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  status ENUM('Submitted', 'Evaluated') NOT NULL DEFAULT 'Submitted',
  faculty_remarks TEXT NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_attempts_exam FOREIGN KEY (exam_id) REFERENCES examinations(id) ON DELETE CASCADE,
  CONSTRAINT fk_attempts_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY uq_exam_student (exam_id, student_id)
);

CREATE TABLE IF NOT EXISTS exam_answers (
  id VARCHAR(64) PRIMARY KEY,
  attempt_id VARCHAR(64) NOT NULL,
  question_id VARCHAR(64) NOT NULL,
  selected_option_index INT NULL,
  subjective_answer TEXT NULL,
  awarded_marks DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
  CONSTRAINT fk_answers_attempt FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS results (
  id VARCHAR(64) PRIMARY KEY,
  exam_id VARCHAR(64) NOT NULL,
  student_id VARCHAR(64) NOT NULL,
  obtained_marks DECIMAL(6, 2) NOT NULL,
  max_marks INT NOT NULL,
  percentage DECIMAL(5, 2) NOT NULL,
  rank_position INT NULL,
  remarks TEXT NULL,
  published_at TIMESTAMP NULL,
  CONSTRAINT fk_results_exam FOREIGN KEY (exam_id) REFERENCES examinations(id) ON DELETE CASCADE,
  CONSTRAINT fk_results_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS fees (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL,
  course_id VARCHAR(64) NOT NULL,
  total_fee DECIMAL(10, 2) NOT NULL,
  paid_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  remaining_fee DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  status ENUM('Paid', 'Partial', 'Pending', 'Overdue') NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_fees_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(64) PRIMARY KEY,
  fee_id VARCHAR(64) NOT NULL,
  student_id VARCHAR(64) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  method ENUM('Cash', 'UPI', 'Bank Transfer', 'Razorpay') NOT NULL,
  reference_id VARCHAR(120) NOT NULL UNIQUE,
  notes TEXT NULL,
  recorded_by_user_id VARCHAR(64) NOT NULL,
  paid_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_fee FOREIGN KEY (fee_id) REFERENCES fees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS receipts (
  id VARCHAR(64) PRIMARY KEY,
  payment_id VARCHAR(64) NOT NULL UNIQUE,
  receipt_number VARCHAR(60) NOT NULL UNIQUE,
  issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_receipts_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notices (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  category VARCHAR(60) NOT NULL,
  content TEXT NOT NULL,
  target_class VARCHAR(60) NOT NULL DEFAULT 'All Classes',
  audience ENUM('Public', 'Students', 'Faculty', 'All') NOT NULL DEFAULT 'All',
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gallery (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  category ENUM('Classrooms', 'Faculty', 'Students', 'Events', 'Celebrations', 'Infrastructure') NOT NULL,
  image_url TEXT NOT NULL,
  caption VARCHAR(400) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS testimonials (
  id VARCHAR(64) PRIMARY KEY,
  author_name VARCHAR(120) NOT NULL,
  author_role VARCHAR(120) NOT NULL,
  class_info VARCHAR(100) NULL,
  rating INT NOT NULL DEFAULT 5,
  content TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS timetables (
  id VARCHAR(64) PRIMARY KEY,
  class_level VARCHAR(50) NOT NULL,
  board VARCHAR(30) NOT NULL,
  subject VARCHAR(60) NOT NULL,
  faculty_id VARCHAR(64) NOT NULL,
  day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
  start_time VARCHAR(15) NOT NULL,
  end_time VARCHAR(15) NOT NULL,
  classroom VARCHAR(60) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_timetable_faculty FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS doubt_requests (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL,
  class_level VARCHAR(50) NOT NULL,
  subject VARCHAR(60) NOT NULL,
  chapter VARCHAR(120) NOT NULL,
  question TEXT NOT NULL,
  attachment_url TEXT NULL,
  status ENUM('Open', 'Resolved') NOT NULL DEFAULT 'Open',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_doubts_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS doubt_responses (
  id VARCHAR(64) PRIMARY KEY,
  doubt_id VARCHAR(64) NOT NULL,
  responder_user_id VARCHAR(64) NOT NULL,
  responder_name VARCHAR(120) NOT NULL,
  responder_role ENUM('faculty', 'admin', 'student') NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_doubt_resp_doubt FOREIGN KEY (doubt_id) REFERENCES doubt_requests(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leave_applications (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL,
  class_level VARCHAR(50) NOT NULL,
  leave_date DATE NOT NULL,
  reason VARCHAR(200) NOT NULL,
  description TEXT NULL,
  status ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
  reviewed_by VARCHAR(120) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_leave_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS announcements (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  content TEXT NOT NULL,
  class_level VARCHAR(50) NOT NULL,
  submitted_by_user_id VARCHAR(64) NOT NULL,
  status ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  actor_uid VARCHAR(128) NOT NULL,
  actor_email VARCHAR(160) NOT NULL,
  actor_role VARCHAR(40) NOT NULL,
  action VARCHAR(120) NOT NULL,
  target_collection VARCHAR(80) NOT NULL,
  target_id VARCHAR(128) NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  setting_key VARCHAR(80) PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_students_class ON students(class_level);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE INDEX idx_admissions_status ON admissions(status);
CREATE INDEX idx_fees_status ON fees(status);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
