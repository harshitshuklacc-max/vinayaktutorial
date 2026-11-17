import React, { useEffect, useMemo, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  IndianRupee,
  ClipboardList,
  Award,
  Bell,
  Image as ImageIcon,
  MessageSquareQuote,
  Clock,
  BarChart3,
  Settings,
  ShieldAlert,
  Download,
  Upload,
  Plus,
  Trash2,
  Printer,
  UserPlus,
  MessageCircle,
} from 'lucide-react';
import { PortalShell, NavItem } from '../components/PortalShell';
import { useAuth } from '../contexts/AuthContext';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  formatFirestoreDate,
  logAudit,
  exportToCsv,
  printHtmlReport,
  DEFAULT_PUBLIC_SETTINGS,
} from '../lib/firestoreDb';
import { db, provisionSecondaryAuthAccount } from '../lib/firebase';
import type {
  AdmissionEnquiry,
  AttendanceRecord,
  AuditLog,
  Course,
  EnquiryStatus,
  ExamAttempt,
  Examination,
  FacultyAnnouncement,
  FacultyMember,
  FeeAccount,
  GalleryItem,
  Notice,
  Payment,
  PaymentMethod,
  ProfileCorrection,
  PublicSettings,
  Student,
  Testimonial,
  TimetableSlot,
} from '../types/domain';
import {
  AdminExamsView,
  AdminNoticesView,
  AdminGalleryView,
  AdminTestimonialsView,
  AdminTimetableView,
  AdminReportsView,
  AdminSettingsView,
  AdminAuditLogsView,
} from './AdminPortalModules';

const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Students', to: '/admin/students', icon: <Users className="w-4 h-4" /> },
  { label: 'Faculty', to: '/admin/faculty', icon: <GraduationCap className="w-4 h-4" /> },
  { label: 'Courses', to: '/admin/courses', icon: <BookOpen className="w-4 h-4" /> },
  { label: 'Admissions', to: '/admin/admissions', icon: <FileText className="w-4 h-4" /> },
  { label: 'Fees & Receipts', to: '/admin/fees', icon: <IndianRupee className="w-4 h-4" /> },
  { label: 'Examinations', to: '/admin/examinations', icon: <ClipboardList className="w-4 h-4" /> },
  { label: 'Results', to: '/admin/results', icon: <Award className="w-4 h-4" /> },
  { label: 'Notices', to: '/admin/notices', icon: <Bell className="w-4 h-4" /> },
  { label: 'Gallery', to: '/admin/gallery', icon: <ImageIcon className="w-4 h-4" /> },
  { label: 'Testimonials', to: '/admin/testimonials', icon: <MessageSquareQuote className="w-4 h-4" /> },
  { label: 'Timetable', to: '/admin/timetable', icon: <Clock className="w-4 h-4" /> },
  { label: 'Reports', to: '/admin/reports', icon: <BarChart3 className="w-4 h-4" /> },
  { label: 'Website & Settings', to: '/admin/settings', icon: <Settings className="w-4 h-4" /> },
  { label: 'Audit Logs', to: '/admin/audit-logs', icon: <ShieldAlert className="w-4 h-4" /> },
];

export function AdminPortal() {
  const { firebaseUser, role } = useAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [admissions, setAdmissions] = useState<AdmissionEnquiry[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [fees, setFees] = useState<FeeAccount[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [exams, setExams] = useState<Examination[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [announcements, setAnnouncements] = useState<FacultyAnnouncement[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [corrections, setCorrections] = useState<ProfileCorrection[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<PublicSettings>(DEFAULT_PUBLIC_SETTINGS);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [
        studSnap,
        facSnap,
        courseSnap,
        admSnap,
        attSnap,
        feeSnap,
        paySnap,
        examSnap,
        attmSnap,
        notSnap,
        annSnap,
        galSnap,
        testSnap,
        ttSnap,
        corrSnap,
        logSnap,
        setSnap,
      ] = await Promise.all([
        getDocs(collection(db, 'students')).catch(() => null),
        getDocs(collection(db, 'faculty')).catch(() => null),
        getDocs(collection(db, 'public_courses')).catch(() => null),
        getDocs(query(collection(db, 'admissions'), orderBy('createdAt', 'desc'))).catch(() => getDocs(collection(db, 'admissions')).catch(() => null)),
        getDocs(collection(db, 'attendance')).catch(() => null),
        getDocs(collection(db, 'fees')).catch(() => null),
        getDocs(query(collection(db, 'payments'), orderBy('paidAt', 'desc'))).catch(() => getDocs(collection(db, 'payments')).catch(() => null)),
        getDocs(collection(db, 'examinations')).catch(() => null),
        getDocs(collection(db, 'exam_attempts')).catch(() => null),
        getDocs(query(collection(db, 'public_notices'), orderBy('createdAt', 'desc'))).catch(() => getDocs(collection(db, 'public_notices')).catch(() => null)),
        getDocs(collection(db, 'announcements')).catch(() => null),
        getDocs(query(collection(db, 'public_gallery'), orderBy('createdAt', 'desc'))).catch(() => getDocs(collection(db, 'public_gallery')).catch(() => null)),
        getDocs(collection(db, 'public_testimonials')).catch(() => null),
        getDocs(collection(db, 'timetables')).catch(() => null),
        getDocs(collection(db, 'profile_corrections')).catch(() => null),
        getDocs(query(collection(db, 'audit_logs'), orderBy('createdAt', 'desc'))).catch(() => getDocs(collection(db, 'audit_logs')).catch(() => null)),
        getDocs(collection(db, 'public_settings')).catch(() => null),
      ]);

      if (studSnap) setStudents(studSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as Student[]);
      if (facSnap) setFaculty(facSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as FacultyMember[]);
      if (courseSnap) setCourses(courseSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as Course[]);
      if (admSnap) setAdmissions(admSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as AdmissionEnquiry[]);
      if (attSnap) setAttendance(attSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as AttendanceRecord[]);
      if (feeSnap) setFees(feeSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as FeeAccount[]);
      if (paySnap) setPayments(paySnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as Payment[]);
      if (examSnap) setExams(examSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as Examination[]);
      if (attmSnap) setAttempts(attmSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as ExamAttempt[]);
      if (notSnap) setNotices(notSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as Notice[]);
      if (annSnap) setAnnouncements(annSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as FacultyAnnouncement[]);
      if (galSnap) setGallery(galSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as GalleryItem[]);
      if (testSnap) setTestimonials(testSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as Testimonial[]);
      if (ttSnap) setTimetable(ttSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as TimetableSlot[]);
      if (corrSnap) setCorrections(corrSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as ProfileCorrection[]);
      if (logSnap) setAuditLogs(logSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as AuditLog[]);
      if (setSnap && !setSnap.empty) {
        setSettings({ ...DEFAULT_PUBLIC_SETTINGS, ...(setSnap.docs[0].data() as Partial<PublicSettings>), id: setSnap.docs[0].id });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [firebaseUser?.uid]);

  return (
    <PortalShell portalName="Admin ERP Portal" portalSubtitle="Admin ERP" navItems={ADMIN_NAV}>
      <Routes>
        <Route
          path="dashboard"
          element={
            <AdminDashboardView
              students={students}
              faculty={faculty}
              courses={courses}
              admissions={admissions}
              attendance={attendance}
              exams={exams}
              fees={fees}
              payments={payments}
              loading={loading}
            />
          }
        />
        <Route
          path="students"
          element={
            <AdminStudentsView
              students={students}
              courses={courses}
              faculty={faculty}
              corrections={corrections}
              role={role || 'admin'}
              onReload={loadAll}
            />
          }
        />
        <Route
          path="faculty"
          element={<AdminFacultyView faculty={faculty} role={role || 'admin'} onReload={loadAll} />}
        />
        <Route
          path="courses"
          element={<AdminCoursesView courses={courses} faculty={faculty} role={role || 'admin'} onReload={loadAll} />}
        />
        <Route
          path="admissions"
          element={
            <AdminAdmissionsView
              admissions={admissions}
              courses={courses}
              settings={settings}
              role={role || 'admin'}
              onReload={loadAll}
            />
          }
        />
        <Route
          path="fees"
          element={
            <AdminFeesView
              fees={fees}
              payments={payments}
              students={students}
              settings={settings}
              adminUid={firebaseUser?.uid || ''}
              role={role || 'admin'}
              onReload={loadAll}
            />
          }
        />
        <Route
          path="examinations"
          element={
            <AdminExamsView
              exams={exams}
              attempts={attempts}
              adminUid={firebaseUser?.uid || ''}
              role={role || 'admin'}
              onReload={loadAll}
            />
          }
        />
        <Route
          path="results"
          element={
            <AdminExamsView
              exams={exams}
              attempts={attempts}
              adminUid={firebaseUser?.uid || ''}
              role={role || 'admin'}
              onReload={loadAll}
              focusResults
            />
          }
        />
        <Route
          path="notices"
          element={
            <AdminNoticesView
              notices={notices}
              announcements={announcements}
              role={role || 'admin'}
              onReload={loadAll}
            />
          }
        />
        <Route
          path="gallery"
          element={<AdminGalleryView gallery={gallery} role={role || 'admin'} onReload={loadAll} />}
        />
        <Route
          path="testimonials"
          element={<AdminTestimonialsView testimonials={testimonials} role={role || 'admin'} onReload={loadAll} />}
        />
        <Route
          path="timetable"
          element={<AdminTimetableView timetable={timetable} faculty={faculty} role={role || 'admin'} onReload={loadAll} />}
        />
        <Route
          path="reports"
          element={
            <AdminReportsView
              students={students}
              faculty={faculty}
              attendance={attendance}
              fees={fees}
              payments={payments}
              admissions={admissions}
              attempts={attempts}
            />
          }
        />
        <Route
          path="settings"
          element={<AdminSettingsView settings={settings} role={role || 'admin'} onReload={loadAll} />}
        />
        <Route path="audit-logs" element={<AdminAuditLogsView logs={auditLogs} />} />
      </Routes>
    </PortalShell>
  );
}

function AdminDashboardView({
  students,
  faculty,
  courses,
  admissions,
  attendance,
  exams,
  fees,
  payments,
  loading,
}: {
  students: Student[];
  faculty: FacultyMember[];
  courses: Course[];
  admissions: AdmissionEnquiry[];
  attendance: AttendanceRecord[];
  exams: Examination[];
  fees: FeeAccount[];
  payments: Payment[];
  loading: boolean;
}) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayAtt = attendance.filter((a) => a.date === todayStr);
  const todayPresentPct =
    todayAtt.length > 0
      ? Math.round((todayAtt.filter((a) => a.status !== 'Absent').length / todayAtt.length) * 100)
      : 0;
  const totalCollected = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const pendingFees = fees.reduce((s, f) => s + Number(f.remainingFee || 0), 0);

  const classDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of students) {
      counts.set(s.classLevel, (counts.get(s.classLevel) || 0) + 1);
    }
    return Array.from(counts.entries());
  }, [students]);

  const enquiryStatusCounts = useMemo(() => {
    const statuses: EnquiryStatus[] = ['New', 'Contacted', 'Follow-up', 'Interested', 'Admitted', 'Rejected'];
    return statuses.map((st) => ({
      label: st,
      count: admissions.filter((a) => a.status === st).length,
    }));
  }, [admissions]);

  const maxDist = Math.max(1, ...classDistribution.map(([, c]) => c));
  const maxEnq = Math.max(1, ...enquiryStatusCounts.map((e) => e.count));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#102A56]">Institute Overview — Vinayak Tutorial</h1>
          <p className="text-xs text-slate-500 mt-0.5">Live database-driven operational metrics</p>
        </div>
        {loading && <span className="text-xs text-[#2457B2]">Refreshing records...</span>}
      </div>

      {/* 8 Real KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Total Students</p>
          <p className="mt-2 font-mono text-2xl font-bold text-[#102A56] tabular-nums">{students.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Total Faculty</p>
          <p className="mt-2 font-mono text-2xl font-bold text-[#102A56] tabular-nums">{faculty.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Active Courses</p>
          <p className="mt-2 font-mono text-2xl font-bold text-[#102A56] tabular-nums">{courses.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Admission Enquiries</p>
          <p className="mt-2 font-mono text-2xl font-bold text-[#FF8A24] tabular-nums">{admissions.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Today&apos;s Attendance ({todayStr})</p>
          <p className="mt-2 font-mono text-2xl font-bold text-[#102A56] tabular-nums">{todayPresentPct}%</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Published / Upcoming Tests</p>
          <p className="mt-2 font-mono text-2xl font-bold text-[#102A56] tabular-nums">{exams.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Total Fee Collection</p>
          <p className="mt-2 font-mono text-2xl font-bold text-emerald-700 tabular-nums">
            ₹{totalCollected.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Pending Fees</p>
          <p className="mt-2 font-mono text-2xl font-bold text-amber-700 tabular-nums">
            ₹{pendingFees.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Interactive Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-display text-base font-semibold text-[#102A56] mb-4">
            Course / Class-wise Student Distribution
          </h2>
          {classDistribution.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">Enroll students to view class distribution.</p>
          ) : (
            <div className="space-y-3">
              {classDistribution.map(([cls, count]) => (
                <div key={cls} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-[#17243A]">{cls}</span>
                    <span className="font-mono font-semibold text-[#102A56] tabular-nums">{count}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#F4F7FC] overflow-hidden">
                    <div
                      className="h-full bg-[#2457B2] rounded-full"
                      style={{ width: `${Math.round((count / maxDist) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-display text-base font-semibold text-[#102A56] mb-4">
            Admission Pipeline Funnel
          </h2>
          <div className="space-y-3">
            {enquiryStatusCounts.map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-[#17243A]">{item.label}</span>
                  <span className="font-mono font-semibold text-[#102A56] tabular-nums">{item.count}</span>
                </div>
                <div className="h-2.5 rounded-full bg-[#F4F7FC] overflow-hidden">
                  <div
                    className="h-full bg-[#FF8A24] rounded-full"
                    style={{ width: `${Math.round((item.count / maxEnq) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminStudentsView({
  students,
  courses,
  faculty,
  corrections,
  role,
  onReload,
}: {
  students: Student[];
  courses: Course[];
  faculty: FacultyMember[];
  corrections: ProfileCorrection[];
  role: string;
  onReload: () => Promise<void>;
}) {
  const { firebaseUser } = useAuth();
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    admissionNumber: `VT-${new Date().getFullYear()}-${String(students.length + 1).padStart(3, '0')}`,
    fullName: '',
    fatherName: '',
    motherName: '',
    mobile: '',
    email: '',
    board: 'GSEB' as 'CBSE' | 'GSEB',
    medium: 'English',
    classLevel: 'Class 10',
    courseId: courses[0]?.id || 'course_class_10',
    address: '',
    password: '',
  });
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    try {
      const selectedCourse = courses.find((c) => c.id === form.courseId);
      const emailLower = form.email.trim().toLowerCase();
      let provisionedUid = '';

      if (form.password && firebaseUser) {
        const token = await firebaseUser.getIdToken();
        await fetch('/api/security/hash-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ password: form.password }),
        });
        const authRes = await provisionSecondaryAuthAccount(emailLower, form.password);
        if (authRes.created && authRes.uid) provisionedUid = authRes.uid;
      }

      const studentRef = await addDoc(collection(db, 'students'), {
        admissionNumber: form.admissionNumber.trim(),
        fullName: form.fullName.trim(),
        fatherName: form.fatherName.trim(),
        motherName: form.motherName.trim(),
        mobile: form.mobile.trim(),
        whatsapp: form.mobile.trim(),
        email: emailLower,
        board: form.board,
        medium: form.medium,
        classLevel: selectedCourse?.classLevel || form.classLevel,
        courseId: form.courseId,
        courseName: selectedCourse?.name || form.classLevel,
        assignedFacultyIds: faculty.filter((f) => f.assignedClasses.includes(selectedCourse?.classLevel || form.classLevel)).map((f) => f.id),
        address: form.address.trim(),
        admissionDate: new Date().toISOString().slice(0, 10),
        status: 'Active',
        ...(provisionedUid ? { uid: provisionedUid } : {}),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'fees'), {
        studentId: studentRef.id,
        studentName: form.fullName.trim(),
        admissionNumber: form.admissionNumber.trim(),
        studentEmail: emailLower,
        courseName: selectedCourse?.name || form.classLevel,
        classLevel: selectedCourse?.classLevel || form.classLevel,
        totalFee: Number(selectedCourse?.feeAmount || 0),
        paidFee: 0,
        remainingFee: Number(selectedCourse?.feeAmount || 0),
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        status: 'Pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await logAudit(role, 'CREATE_STUDENT', 'students', `Admitted ${form.fullName} (${form.admissionNumber})`, studentRef.id);
      setStatusMsg(`Student ${form.fullName} admitted and Fee Ledger created.`);
      setForm({
        ...form,
        admissionNumber: `VT-${new Date().getFullYear()}-${String(students.length + 2).padStart(3, '0')}`,
        fullName: '',
        fatherName: '',
        motherName: '',
        mobile: '',
        email: '',
        address: '',
        password: '',
      });
      await onReload();
    } catch (err: any) {
      setStatusMsg(err?.message || 'Failed to add student.');
    } finally {
      setSaving(false);
    }
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return;
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    let count = 0;
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => (row[h] = cols[idx] || ''));
      if (!row.fullname || !row.email) continue;
      await addDoc(collection(db, 'students'), {
        admissionNumber: row.admissionnumber || `VT-${new Date().getFullYear()}-${100 + i}`,
        fullName: row.fullname,
        mobile: row.mobile || '9825257153',
        email: row.email.toLowerCase(),
        board: row.board === 'CBSE' ? 'CBSE' : 'GSEB',
        medium: row.medium || 'English',
        classLevel: row.classlevel || 'Class 10',
        courseId: courses[0]?.id || 'course_class_10',
        courseName: courses[0]?.name || 'Class 10',
        admissionDate: new Date().toISOString().slice(0, 10),
        status: 'Active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      count++;
    }
    setStatusMsg(`Imported ${count} students from CSV.`);
    await onReload();
  };

  const filtered = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.classLevel.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreateStudent} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-xl font-bold text-[#102A56]">Enroll / Add Student</h1>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-[#102A56] cursor-pointer hover:bg-[#F4F7FC]">
              <Upload className="w-3.5 h-3.5" /> Import CSV
              <input type="file" accept=".csv" onChange={handleCsvImport} className="hidden" />
            </label>
            <button
              type="button"
              onClick={() => exportToCsv('vinayak_students.csv', students as unknown as Record<string, unknown>[])}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-[#102A56]"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <input required value={form.admissionNumber} onChange={(e) => setForm({ ...form, admissionNumber: e.target.value })} placeholder="Admission No (VT-2026-001)" className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono" />
          <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Student Full Name *" className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Student Login Email *" className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <input required value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="Mobile Number *" className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <input value={form.fatherName} onChange={(e) => setForm({ ...form, fatherName: e.target.value })} placeholder="Father's Name" className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name} (₹{c.feeAmount})</option>
            ))}
          </select>
          <select value={form.board} onChange={(e) => setForm({ ...form, board: e.target.value as 'CBSE' | 'GSEB' })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
            <option value="GSEB">GSEB</option>
            <option value="CBSE">CBSE</option>
          </select>
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Initial Password (min 6 chars)" className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
        </div>

        <div className="flex items-center gap-4">
          <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg bg-[#102A56] text-white text-xs font-semibold hover:bg-[#2457B2]">
            {saving ? 'Saving...' : 'Create Student & Fee Account'}
          </button>
          {statusMsg && <span className="text-xs font-medium text-emerald-700">{statusMsg}</span>}
        </div>
      </form>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-lg font-semibold text-[#102A56]">Enrolled Students ({filtered.length})</h2>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students..."
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm w-64"
          />
        </div>
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-500">No students enrolled yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="py-2 pr-4">Adm. No</th>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Class / Board</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2.5 pr-4 font-mono text-xs font-semibold text-[#102A56]">{s.admissionNumber}</td>
                    <td className="py-2.5 pr-4 font-medium">{s.fullName}</td>
                    <td className="py-2.5 pr-4 text-xs">{s.classLevel} · {s.board}</td>
                    <td className="py-2.5 pr-4 text-xs text-slate-600">{s.email}</td>
                    <td className="py-2.5 pr-4 text-xs font-semibold">{s.status}</td>
                    <td className="py-2.5 text-right space-x-2">
                      <button
                        type="button"
                        onClick={async () => {
                          const next = s.status === 'Active' ? 'Inactive' : 'Active';
                          await updateDoc(doc(db, 'students', s.id), { status: next, updatedAt: serverTimestamp() });
                          await onReload();
                        }}
                        className="text-xs font-semibold text-[#2457B2]"
                      >
                        {s.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteDoc(doc(db, 'students', s.id));
                          await logAudit(role, 'DELETE_STUDENT', 'students', s.fullName, s.id);
                          await onReload();
                        }}
                        className="text-xs font-semibold text-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {corrections.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <h2 className="font-display text-lg font-semibold text-[#102A56]">Student Profile Correction Requests</h2>
          {corrections.map((c) => (
            <div key={c.id} className="p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
              <span>
                <strong>{c.studentName}</strong> requested <strong>{c.fieldName}</strong> &rarr; {c.requestedValue} ({c.status})
              </span>
              {c.status === 'Pending' && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await updateDoc(doc(db, 'profile_corrections', c.id), { status: 'Approved', updatedAt: serverTimestamp() });
                      await onReload();
                    }}
                    className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await updateDoc(doc(db, 'profile_corrections', c.id), { status: 'Rejected', updatedAt: serverTimestamp() });
                      await onReload();
                    }}
                    className="px-2.5 py-1 rounded bg-red-600 text-white font-semibold"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminFacultyView({
  faculty,
  role,
  onReload,
}: {
  faculty: FacultyMember[];
  role: string;
  onReload: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    facultyCode: `FAC-${String(faculty.length + 1).padStart(2, '0')}`,
    fullName: '',
    email: '',
    mobile: '',
    qualification: '',
    specialization: '',
    experienceYears: 5,
    bio: '',
    assignedClasses: ['Class 10', 'Class 12 Science'] as string[],
    assignedSubjects: ['Mathematics'] as string[],
    password: '',
  });
  const [saving, setSaving] = useState(false);

  const toggleClass = (cls: string) => {
    setForm((p) => ({
      ...p,
      assignedClasses: p.assignedClasses.includes(cls)
        ? p.assignedClasses.filter((c) => c !== cls)
        : [...p.assignedClasses, cls],
    }));
  };

  const toggleSubject = (sub: string) => {
    setForm((p) => ({
      ...p,
      assignedSubjects: p.assignedSubjects.includes(sub)
        ? p.assignedSubjects.filter((s) => s !== sub)
        : [...p.assignedSubjects, sub],
    }));
  };

  const createFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const emailLower = form.email.trim().toLowerCase();
      let uid = '';
      if (form.password) {
        const res = await provisionSecondaryAuthAccount(emailLower, form.password);
        if (res.created && res.uid) uid = res.uid;
      }

      const facRef = await addDoc(collection(db, 'faculty'), {
        facultyCode: form.facultyCode.trim(),
        fullName: form.fullName.trim(),
        email: emailLower,
        mobile: form.mobile.trim(),
        qualification: form.qualification.trim(),
        specialization: form.specialization.trim(),
        experienceYears: Number(form.experienceYears),
        bio: form.bio.trim(),
        assignedClasses: form.assignedClasses,
        assignedSubjects: form.assignedSubjects,
        status: 'Active',
        ...(uid ? { uid } : {}),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await setDoc(doc(db, 'faculty_emails', emailLower), {
        facultyId: facRef.id,
        fullName: form.fullName.trim(),
        assignedClasses: form.assignedClasses,
        assignedSubjects: form.assignedSubjects,
        status: 'Active',
        updatedAt: serverTimestamp(),
      });

      await setDoc(doc(db, 'public_faculty', facRef.id), {
        name: form.fullName.trim(),
        qualification: form.qualification.trim(),
        specialization: form.specialization.trim(),
        experienceYears: Number(form.experienceYears),
        bio: form.bio.trim() || `${form.specialization} faculty at Vinayak Tutorial.`,
        assignedClasses: form.assignedClasses,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await logAudit(role, 'CREATE_FACULTY', 'faculty', `Added faculty ${form.fullName}`, facRef.id);
      setForm({
        ...form,
        facultyCode: `FAC-${String(faculty.length + 2).padStart(2, '0')}`,
        fullName: '',
        email: '',
        mobile: '',
        qualification: '',
        specialization: '',
        bio: '',
        password: '',
      });
      await onReload();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={createFaculty} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h1 className="font-display text-xl font-bold text-[#102A56]">Add Faculty Member</h1>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <input required value={form.facultyCode} onChange={(e) => setForm({ ...form, facultyCode: e.target.value })} placeholder="Faculty Code" className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono" />
          <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Full Name *" className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Login Email *" className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <input required value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} placeholder="Qualification (e.g., M.Sc., B.Ed.) *" className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <input required value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} placeholder="Subject Specialization *" className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <input type="number" min={0} value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: Number(e.target.value) })} placeholder="Years Experience" className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="Mobile" className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Optional Password" className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <input value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Short Biography" className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#17243A]">Assigned Classes</p>
          <div className="flex flex-wrap gap-2">
            {['Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11 Science', 'Class 12 Science'].map((cls) => (
              <button
                key={cls}
                type="button"
                onClick={() => toggleClass(cls)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  form.assignedClasses.includes(cls) ? 'bg-[#102A56] text-white border-[#102A56]' : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#17243A]">Assigned Subjects</p>
          <div className="flex flex-wrap gap-2">
            {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Science', 'English'].map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => toggleSubject(sub)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  form.assignedSubjects.includes(sub) ? 'bg-[#2457B2] text-white border-[#2457B2]' : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg bg-[#102A56] text-white text-xs font-semibold">
          {saving ? 'Saving...' : 'Create & Publish Faculty Profile'}
        </button>
      </form>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
        <h2 className="font-display text-lg font-semibold text-[#102A56]">Faculty Directory ({faculty.length})</h2>
        {faculty.length === 0 ? (
          <p className="text-sm text-slate-500">No faculty profiles added yet. Profiles created here appear on the public Faculty page.</p>
        ) : (
          faculty.map((f) => (
            <div key={f.id} className="p-4 rounded-xl border border-slate-200 bg-[#F4F7FC] flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs text-[#2457B2] font-medium">
                  {f.facultyCode} · {f.qualification} · {f.experienceYears} yrs exp
                </p>
                <p className="font-semibold text-[#102A56]">{f.fullName} ({f.email})</p>
                <p className="text-xs text-slate-600">Classes: {f.assignedClasses.join(', ')} · Subjects: {f.assignedSubjects.join(', ')}</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await deleteDoc(doc(db, 'faculty', f.id));
                  await deleteDoc(doc(db, 'public_faculty', f.id)).catch(() => {});
                  await deleteDoc(doc(db, 'faculty_emails', f.email.toLowerCase())).catch(() => {});
                  await logAudit(role, 'DELETE_FACULTY', 'faculty', f.fullName, f.id);
                  await onReload();
                }}
                className="text-red-600 p-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AdminCoursesView({
  courses,
  faculty,
  role,
  onReload,
}: {
  courses: Course[];
  faculty: FacultyMember[];
  role: string;
  onReload: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: '',
    classLevel: 'Class 10',
    board: 'CBSE & GSEB' as Course['board'],
    medium: 'English',
    subjectsText: 'Mathematics, Science',
    description: '',
    duration: 'Academic Year (11 Months)',
    feeAmount: 28000,
    facultyName: faculty[0]?.fullName || 'Institute Subject Specialist',
  });

  const createCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const subjects = form.subjectsText.split(',').map((s) => s.trim()).filter(Boolean);
    const ref = await addDoc(collection(db, 'public_courses'), {
      name: form.name.trim(),
      classLevel: form.classLevel,
      board: form.board,
      medium: form.medium,
      subjects: subjects.length ? subjects : ['Mathematics'],
      description: form.description.trim(),
      duration: form.duration.trim(),
      feeAmount: Number(form.feeAmount),
      facultyName: form.facultyName.trim(),
      imageUrl: '/src/assets/images/course_science_lab_1794896107316.jpg',
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await logAudit(role, 'CREATE_COURSE', 'public_courses', form.name, ref.id);
    setForm((p) => ({ ...p, name: '', description: '' }));
    await onReload();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={createCourse} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h1 className="font-display text-xl font-bold text-[#102A56]">Add New Course</h1>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Course Name *" className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <input required value={form.classLevel} onChange={(e) => setForm({ ...form, classLevel: e.target.value })} placeholder="Class (e.g. Class 12 Science)" className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <select value={form.board} onChange={(e) => setForm({ ...form, board: e.target.value as Course['board'] })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
            <option value="CBSE & GSEB">CBSE &amp; GSEB</option>
            <option value="CBSE">CBSE</option>
            <option value="GSEB">GSEB</option>
          </select>
          <input value={form.subjectsText} onChange={(e) => setForm({ ...form, subjectsText: e.target.value })} placeholder="Subjects (comma separated)" className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <input type="number" min={0} value={form.feeAmount} onChange={(e) => setForm({ ...form, feeAmount: Number(e.target.value) })} placeholder="Annual Fee (INR)" className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="Duration" className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <input value={form.facultyName} onChange={(e) => setForm({ ...form, facultyName: e.target.value })} placeholder="Lead Faculty Name" className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <textarea rows={2} required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Course description..." className="sm:col-span-3 px-3 py-2 rounded-lg border border-slate-300 text-sm" />
        </div>
        <button type="submit" className="px-5 py-2.5 rounded-lg bg-[#102A56] text-white text-xs font-semibold inline-flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Save Course
        </button>
      </form>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
        <h2 className="font-display text-lg font-semibold text-[#102A56]">Published Courses ({courses.length})</h2>
        {courses.map((c) => (
          <div key={c.id} className="p-4 rounded-xl border border-slate-200 bg-[#F4F7FC] flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs text-[#2457B2] font-medium">{c.classLevel} · {c.board} · ₹{c.feeAmount.toLocaleString('en-IN')}</p>
              <p className="font-semibold text-[#102A56]">{c.name}</p>
              <p className="text-xs text-slate-600">{c.subjects.join(', ')}</p>
            </div>
            <button
              type="button"
              onClick={async () => {
                await deleteDoc(doc(db, 'public_courses', c.id));
                await onReload();
              }}
              className="text-red-600 p-2"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminAdmissionsView({
  admissions,
  courses,
  settings,
  role,
  onReload,
}: {
  admissions: AdmissionEnquiry[];
  courses: Course[];
  settings: PublicSettings;
  role: string;
  onReload: () => Promise<void>;
}) {
  const { firebaseUser } = useAuth();
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [waFeedback, setWaFeedback] = useState<string | null>(null);

  const filtered = admissions.filter((a) => {
    const matchesSearch =
      a.studentFullName.toLowerCase().includes(search.toLowerCase()) ||
      a.enquiryCode.toLowerCase().includes(search.toLowerCase()) ||
      a.mobile.includes(search);
    const matchesClass = classFilter === 'All' || a.applyingForClass === classFilter;
    return matchesSearch && matchesClass;
  });

  const convertToStudent = async (enq: AdmissionEnquiry) => {
    const matchedCourse =
      courses.find((c) => c.classLevel === enq.applyingForClass) || courses[0];
    const admNo = `VT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const email = (enq.email || `${admNo.toLowerCase()}@students.vinayaktutorial.in`).toLowerCase();

    const sRef = await addDoc(collection(db, 'students'), {
      admissionNumber: admNo,
      fullName: enq.studentFullName,
      fatherName: enq.fatherName,
      motherName: enq.motherName || '',
      mobile: enq.mobile,
      whatsapp: enq.whatsapp || enq.mobile,
      email,
      board: enq.board,
      medium: enq.medium,
      classLevel: enq.applyingForClass,
      courseId: matchedCourse?.id || 'course_class_10',
      courseName: matchedCourse?.name || enq.applyingForClass,
      address: enq.address || '',
      admissionDate: new Date().toISOString().slice(0, 10),
      status: 'Active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await addDoc(collection(db, 'fees'), {
      studentId: sRef.id,
      studentName: enq.studentFullName,
      admissionNumber: admNo,
      studentEmail: email,
      courseName: matchedCourse?.name || enq.applyingForClass,
      classLevel: enq.applyingForClass,
      totalFee: Number(matchedCourse?.feeAmount || 0),
      paidFee: 0,
      remainingFee: Number(matchedCourse?.feeAmount || 0),
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      status: 'Pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, 'admissions', enq.id), {
      status: 'Admitted',
      updatedAt: serverTimestamp(),
    });

    await logAudit(role, 'CONVERT_ADMISSION', 'admissions', `Converted ${enq.enquiryCode} to ${admNo}`, enq.id);
    await onReload();
  };

  const sendWhatsAppApi = async (enq: AdmissionEnquiry) => {
    if (!firebaseUser) return;
    setWaFeedback(null);
    const token = await firebaseUser.getIdToken();
    const res = await fetch('/api/notifications/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        to: enq.whatsapp || enq.mobile,
        message: `Namaste from Vinayak Tutorial, Anand! Regarding admission enquiry ${enq.enquiryCode} for ${enq.studentFullName} (${enq.applyingForClass}).`,
      }),
    });
    const data = await res.json();
    setWaFeedback(data.sent ? `WhatsApp sent (ID: ${data.messageId})` : data.message || data.error);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-xl font-bold text-[#102A56]">Admission Enquiries ({filtered.length})</h1>
        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, code, mobile..."
            className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
          />
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white">
            <option value="All">All Classes</option>
            <option value="Class 7">Class 7</option>
            <option value="Class 8">Class 8</option>
            <option value="Class 9">Class 9</option>
            <option value="Class 10">Class 10</option>
            <option value="Class 11 Science">Class 11 Science</option>
            <option value="Class 12 Science">Class 12 Science</option>
          </select>
          <button
            type="button"
            onClick={() => exportToCsv('admission_enquiries.csv', filtered as unknown as Record<string, unknown>[])}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-[#102A56]"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {waFeedback && (
        <p className="p-3 rounded-lg bg-[#F4F7FC] border border-slate-200 text-xs text-[#102A56]">{waFeedback}</p>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500">No admission enquiries found.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((enq) => (
            <EnquiryRow
              key={enq.id}
              enq={enq}
              whatsappApiEnabled={settings.whatsappEnabled}
              onUpdate={async (status, notes) => {
                await updateDoc(doc(db, 'admissions', enq.id), {
                  status,
                  internalNotes: notes,
                  updatedAt: serverTimestamp(),
                });
                await onReload();
              }}
              onConvert={() => convertToStudent(enq)}
              onWhatsAppApi={() => sendWhatsAppApi(enq)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EnquiryRow({
  enq,
  whatsappApiEnabled,
  onUpdate,
  onConvert,
  onWhatsAppApi,
}: {
  enq: AdmissionEnquiry;
  whatsappApiEnabled: boolean;
  onUpdate: (status: EnquiryStatus, notes: string) => Promise<void>;
  onConvert: () => Promise<void>;
  onWhatsAppApi: () => Promise<void>;
}) {
  const [status, setStatus] = useState<EnquiryStatus>(enq.status);
  const [notes, setNotes] = useState(enq.internalNotes || '');

  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-[#F4F7FC] space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-[#2457B2] font-semibold">
            {enq.enquiryCode} · {enq.applyingForClass} · {enq.board} · {formatFirestoreDate(enq.createdAt)}
          </p>
          <p className="font-semibold text-[#102A56]">{enq.studentFullName} (Father: {enq.fatherName})</p>
          <p className="text-xs text-slate-600 tabular-nums">
            Mobile: {enq.mobile} {enq.email ? `· ${enq.email}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`https://wa.me/${(enq.whatsapp || enq.mobile).replace(/\D/g, '')}?text=${encodeURIComponent(
              `Hello, contacting from Vinayak Tutorial regarding admission enquiry ${enq.enquiryCode} for ${enq.studentFullName}.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#16A34A] text-white text-xs font-semibold"
          >
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Chat
          </a>
          {whatsappApiEnabled && (
            <button type="button" onClick={onWhatsAppApi} className="px-3 py-1.5 rounded-lg border border-emerald-600 text-emerald-700 text-xs font-semibold">
              Send API Alert
            </button>
          )}
          {enq.status !== 'Admitted' && (
            <button
              type="button"
              onClick={onConvert}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FF8A24] text-white text-xs font-semibold"
            >
              <UserPlus className="w-3.5 h-3.5" /> Convert to Admission
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/80">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as EnquiryStatus)}
          className="px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white"
        >
          {(['New', 'Contacted', 'Follow-up', 'Interested', 'Admitted', 'Rejected'] as EnquiryStatus[]).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Internal counselor notes..."
          className="flex-1 min-w-[200px] px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white"
        />
        <button
          type="button"
          onClick={() => onUpdate(status, notes)}
          className="px-3 py-1.5 rounded-lg bg-[#102A56] text-white text-xs font-semibold"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function AdminFeesView({
  fees,
  payments,
  students,
  settings,
  adminUid,
  role,
  onReload,
}: {
  fees: FeeAccount[];
  payments: Payment[];
  students: Student[];
  settings: PublicSettings;
  adminUid: string;
  role: string;
  onReload: () => Promise<void>;
}) {
  const { firebaseUser } = useAuth();
  const [selectedFeeId, setSelectedFeeId] = useState(fees[0]?.id || '');
  const [amount, setAmount] = useState(5000);
  const [method, setMethod] = useState<PaymentMethod>('UPI');
  const [referenceId, setReferenceId] = useState('');
  const [notes, setNotes] = useState('');
  const [waMsg, setWaMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFeeId && fees.length > 0) setSelectedFeeId(fees[0].id);
  }, [fees]);

  const recordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const fee = fees.find((f) => f.id === selectedFeeId);
    if (!fee || amount <= 0) return;

    const payAmount = Math.min(Number(amount), fee.remainingFee || Number(amount));
    const newPaid = Number(fee.paidFee) + payAmount;
    const newRem = Math.max(0, Number(fee.totalFee) - newPaid);
    const receiptNumber = `VT-REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const txRef = referenceId.trim() || `TXN-${Date.now()}`;

    await addDoc(collection(db, 'payments'), {
      feeId: fee.id,
      studentId: fee.studentId,
      studentName: fee.studentName,
      admissionNumber: fee.admissionNumber,
      studentEmail: fee.studentEmail,
      amount: payAmount,
      method,
      referenceId: txRef,
      receiptNumber,
      notes: notes.trim(),
      recordedByUid: adminUid,
      paidAt: serverTimestamp(),
    });

    await updateDoc(doc(db, 'fees', fee.id), {
      paidFee: newPaid,
      remainingFee: newRem,
      status: newRem === 0 ? 'Paid' : 'Partial',
      updatedAt: serverTimestamp(),
    });

    await logAudit(role, 'RECORD_PAYMENT', 'payments', `${receiptNumber} ₹${payAmount} (${fee.studentName})`, fee.id);
    setReferenceId('');
    setNotes('');
    await onReload();
  };

  const sendFeeReminder = async (f: FeeAccount) => {
    if (!firebaseUser) return;
    const st = students.find((s) => s.id === f.studentId);
    const phone = st?.whatsapp || st?.mobile || '';
    if (!phone) return;
    if (settings.whatsappEnabled) {
      const token = await firebaseUser.getIdToken();
      const res = await fetch('/api/notifications/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          to: phone,
          message: `Fee Reminder from Vinayak Tutorial: Pending fee ₹${f.remainingFee} for ${f.studentName} (${f.courseName}), due ${f.dueDate}.`,
        }),
      });
      const data = await res.json();
      setWaMsg(data.sent ? `Reminder sent to ${phone}` : data.message || data.error);
    } else {
      window.open(
        `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(
          `Fee Reminder from Vinayak Tutorial: Pending fee ₹${f.remainingFee} for ${f.studentName}, due ${f.dueDate}.`
        )}`,
        '_blank'
      );
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={recordPayment} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h1 className="font-display text-xl font-bold text-[#102A56]">Record Student Fee Payment</h1>
        {fees.length === 0 ? (
          <p className="text-sm text-slate-500">Enroll a student first to generate their fee ledger.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <select value={selectedFeeId} onChange={(e) => setSelectedFeeId(e.target.value)} className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
              {fees.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.studentName} ({f.admissionNumber}) — Pending ₹{f.remainingFee}
                </option>
              ))}
            </select>
            <input type="number" min={1} required value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder="Amount (INR)" className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono" />
            <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
            <input value={referenceId} onChange={(e) => setReferenceId(e.target.value)} placeholder="Transaction / Ref ID" className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono" />
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#102A56] text-white text-xs font-semibold">
              Record &amp; Issue Receipt
            </button>
          </div>
        )}
      </form>

      {waMsg && <p className="p-3 rounded-lg bg-white border border-slate-200 text-xs">{waMsg}</p>}

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold text-[#102A56]">Student Fee Ledgers</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="py-2 pr-4">Student</th>
                <th className="py-2 pr-4">Course</th>
                <th className="py-2 pr-4 text-right">Total</th>
                <th className="py-2 pr-4 text-right">Paid</th>
                <th className="py-2 pr-4 text-right">Remaining</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 text-right">Reminder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fees.map((f) => (
                <tr key={f.id}>
                  <td className="py-2.5 pr-4 font-medium">{f.studentName}</td>
                  <td className="py-2.5 pr-4 text-xs">{f.courseName}</td>
                  <td className="py-2.5 pr-4 text-right font-mono tabular-nums">₹{f.totalFee.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 pr-4 text-right font-mono tabular-nums text-emerald-700">₹{f.paidFee.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 pr-4 text-right font-mono tabular-nums text-amber-700">₹{f.remainingFee.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 pr-4 text-xs font-semibold">{f.status}</td>
                  <td className="py-2.5 text-right">
                    {f.remainingFee > 0 && (
                      <button type="button" onClick={() => sendFeeReminder(f)} className="text-xs font-semibold text-[#2457B2]">
                        Send Reminder
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-[#102A56]">Recent Receipts ({payments.length})</h2>
          <button
            type="button"
            onClick={() => exportToCsv('fee_collection_report.csv', payments as unknown as Record<string, unknown>[])}
            className="text-xs font-semibold text-[#2457B2]"
          >
            Export Collection CSV
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {payments.map((p) => (
            <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
              <span>
                <span className="font-mono font-bold text-[#102A56]">{p.receiptNumber}</span> · {p.studentName} · {p.method} ({p.referenceId})
              </span>
              <div className="flex items-center gap-3">
                <span className="font-mono font-semibold tabular-nums">₹{p.amount.toLocaleString('en-IN')}</span>
                <button
                  type="button"
                  onClick={() =>
                    printHtmlReport(
                      `FEE RECEIPT · ${p.receiptNumber}`,
                      `<p>Student: <strong>${p.studentName}</strong> (${p.admissionNumber})</p><p>Amount Paid: <strong>₹${p.amount}</strong> via ${p.method}</p><p>Ref: ${p.referenceId}</p>`
                    )
                  }
                  className="inline-flex items-center gap-1 text-[#2457B2] font-semibold"
                >
                  <Printer className="w-3.5 h-3.5" /> PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
