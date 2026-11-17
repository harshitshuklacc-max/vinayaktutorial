export type UserRole = 'super_admin' | 'admin' | 'faculty' | 'student';
export type BoardType = 'CBSE' | 'GSEB' | 'CBSE & GSEB';
export type EnquiryStatus = 'New' | 'Contacted' | 'Follow-up' | 'Interested' | 'Admitted' | 'Rejected';
export type AttendanceStatus = 'Present' | 'Absent' | 'Late';
export type FeeStatus = 'Paid' | 'Partial' | 'Pending' | 'Overdue';
export type PaymentMethod = 'Cash' | 'UPI' | 'Bank Transfer' | 'Razorpay';

export interface PublicSettings {
  id: string;
  instituteName: string;
  tagline: string;
  aboutSummary: string;
  address: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  businessHours: string;
  instagramUrl: string;
  facebookUrl: string;
  googleRating: string;
  googleReviewCount: number;
  yearsExperience: string;
  heroHeadline: string;
  heroSubheadline: string;
  razorpayEnabled: boolean;
  whatsappEnabled: boolean;
  seoTitle: string;
  seoDescription: string;
  updatedAt?: unknown;
}

export interface Course {
  id: string;
  name: string;
  classLevel: string;
  board: BoardType;
  medium: string;
  subjects: string[];
  description: string;
  duration: string;
  feeAmount: number;
  facultyName?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PublicFaculty {
  id: string;
  name: string;
  qualification: string;
  specialization: string;
  experienceYears: number;
  bio: string;
  photoUrl?: string;
  assignedClasses?: string[];
  isActive: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Notice {
  id: string;
  title: string;
  category: 'Admission' | 'Examination' | 'Holiday' | 'Test Schedule' | 'Fee Reminder' | 'General';
  content: string;
  targetClass: string;
  audience: 'Public' | 'Students' | 'Faculty' | 'All';
  isPinned: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: 'Classrooms' | 'Faculty' | 'Students' | 'Events' | 'Celebrations' | 'Infrastructure';
  imageUrl: string;
  caption?: string;
  createdAt?: unknown;
}

export interface Testimonial {
  id: string;
  authorName: string;
  authorRole: string;
  classInfo?: string;
  rating: number;
  content: string;
  isApproved: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AdmissionEnquiry {
  id: string;
  enquiryCode: string;
  studentFullName: string;
  fatherName: string;
  motherName?: string;
  mobile: string;
  whatsapp?: string;
  email?: string;
  dob?: string;
  currentClass?: string;
  applyingForClass: string;
  board: 'CBSE' | 'GSEB';
  medium: string;
  subjects?: string[];
  previousSchool?: string;
  address?: string;
  message?: string;
  status: EnquiryStatus;
  internalNotes?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;
  status: 'Unread' | 'Replied' | 'Archived';
  createdAt?: unknown;
}

export interface AdminUser {
  id: string;
  uid: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin';
  permissions?: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Student {
  id: string;
  admissionNumber: string;
  fullName: string;
  fatherName?: string;
  motherName?: string;
  mobile: string;
  whatsapp?: string;
  email: string;
  dob?: string;
  board: 'CBSE' | 'GSEB';
  medium: string;
  classLevel: string;
  courseId: string;
  courseName: string;
  assignedFacultyIds?: string[];
  address?: string;
  photoUrl?: string;
  admissionDate: string;
  status: 'Active' | 'Inactive';
  uid?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface FacultyMember {
  id: string;
  facultyCode: string;
  fullName: string;
  email: string;
  mobile?: string;
  qualification: string;
  specialization: string;
  experienceYears: number;
  bio?: string;
  photoUrl?: string;
  assignedClasses: string[];
  assignedSubjects: string[];
  permissions?: string[];
  status: 'Active' | 'Inactive';
  uid?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  classLevel: string;
  date: string;
  status: AttendanceStatus;
  markedByUid: string;
  markedByName: string;
  remarks?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface StudyMaterial {
  id: string;
  title: string;
  description?: string;
  classLevel: string;
  board: string;
  subject: string;
  category: 'PDF Notes' | 'Chapter Notes' | 'Worksheet' | 'Previous Year Paper' | 'Practice Questions' | 'Important Questions';
  fileUrl: string;
  fileName: string;
  uploadedByUid: string;
  uploadedByName: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Examination {
  id: string;
  title: string;
  classLevel: string;
  board: string;
  subject: string;
  description?: string;
  durationMinutes: number;
  maxMarks: number;
  scheduledDate: string;
  status: 'Draft' | 'Published' | 'Completed';
  resultsPublished: boolean;
  showRank?: boolean;
  createdByUid: string;
  createdByName: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ExamQuestion {
  id: string;
  questionText: string;
  questionType: 'MCQ' | 'Subjective';
  options?: string[];
  correctOptionIndex?: number;
  marks: number;
  orderIndex: number;
}

export interface ExamAnswerItem {
  questionId: string;
  questionText: string;
  questionType: 'MCQ' | 'Subjective';
  selectedOptionIndex?: number;
  subjectiveAnswer?: string;
  correctOptionIndex?: number;
  maxMarks: number;
  awardedMarks: number;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  examTitle: string;
  subject: string;
  classLevel: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentUid: string;
  answers: ExamAnswerItem[];
  obtainedMarks: number;
  maxMarks: number;
  percentage: number;
  status: 'Submitted' | 'Evaluated';
  facultyRemarks?: string;
  submittedAt?: unknown;
  updatedAt?: unknown;
}

export interface FeeAccount {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  studentEmail: string;
  courseName: string;
  classLevel: string;
  totalFee: number;
  paidFee: number;
  remainingFee: number;
  dueDate: string;
  status: FeeStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Payment {
  id: string;
  feeId: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  studentEmail: string;
  amount: number;
  method: PaymentMethod;
  referenceId: string;
  receiptNumber: string;
  notes?: string;
  recordedByUid: string;
  paidAt?: unknown;
}

export interface TimetableSlot {
  id: string;
  classLevel: string;
  board: string;
  subject: string;
  facultyId: string;
  facultyName: string;
  facultyEmail?: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string;
  endTime: string;
  classroom: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface DoubtRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentUid: string;
  classLevel: string;
  subject: string;
  chapter: string;
  question: string;
  attachmentUrl?: string;
  status: 'Open' | 'Resolved';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface DoubtResponse {
  id: string;
  responderUid: string;
  responderName: string;
  responderRole: 'faculty' | 'admin' | 'student';
  message: string;
  createdAt?: unknown;
}

export interface LeaveApplication {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentUid: string;
  classLevel: string;
  leaveDate: string;
  reason: string;
  description?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reviewedBy?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface FacultyAnnouncement {
  id: string;
  title: string;
  content: string;
  classLevel: string;
  submittedByUid: string;
  submittedByName: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ProfileCorrection {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentUid: string;
  fieldName: string;
  requestedValue: string;
  reason?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AuditLog {
  id: string;
  actorUid: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetCollection: string;
  targetId?: string;
  details: string;
  createdAt?: unknown;
}
