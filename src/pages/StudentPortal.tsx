import React, { useEffect, useMemo, useState } from 'react';
import { Route, Routes, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  CalendarCheck,
  BookOpen,
  ClipboardList,
  Award,
  IndianRupee,
  Bell,
  Clock,
  HelpCircle,
  Download,
  Printer,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { PortalShell, NavItem } from '../components/PortalShell';
import { useAuth } from '../contexts/AuthContext';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  formatFirestoreDate,
  logAudit,
  printHtmlReport,
} from '../lib/firestoreDb';
import { db } from '../lib/firebase';
import type {
  AttendanceRecord,
  DoubtRequest,
  DoubtResponse,
  ExamAttempt,
  Examination,
  ExamQuestion,
  FeeAccount,
  LeaveApplication,
  Notice,
  Payment,
  ProfileCorrection,
  PublicSettings,
  StudyMaterial,
  TimetableSlot,
} from '../types/domain';

const STUDENT_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/student/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'My Profile', to: '/student/profile', icon: <User className="w-4 h-4" /> },
  { label: 'Attendance & Leave', to: '/student/attendance', icon: <CalendarCheck className="w-4 h-4" /> },
  { label: 'Study Materials', to: '/student/materials', icon: <BookOpen className="w-4 h-4" /> },
  { label: 'Online Tests', to: '/student/tests', icon: <ClipboardList className="w-4 h-4" /> },
  { label: 'Results', to: '/student/results', icon: <Award className="w-4 h-4" /> },
  { label: 'Fees & Receipts', to: '/student/fees', icon: <IndianRupee className="w-4 h-4" /> },
  { label: 'Notices', to: '/student/notices', icon: <Bell className="w-4 h-4" /> },
  { label: 'Timetable', to: '/student/timetable', icon: <Clock className="w-4 h-4" /> },
  { label: 'Doubt Support', to: '/student/doubts', icon: <HelpCircle className="w-4 h-4" /> },
];

export function StudentPortal() {
  const { firebaseUser, studentProfile } = useAuth();
  const location = useLocation();

  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [exams, setExams] = useState<Examination[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [fees, setFees] = useState<FeeAccount[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [doubts, setDoubts] = useState<DoubtRequest[]>([]);
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [corrections, setCorrections] = useState<ProfileCorrection[]>([]);
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  const loadStudentData = async () => {
    if (!studentProfile || !firebaseUser) return;
    setLoadingData(true);
    try {
      const email = studentProfile.email.toLowerCase();
      const [
        attSnap,
        matSnap,
        examSnap,
        attmSnap,
        feeSnap,
        paySnap,
        notSnap,
        ttSnap,
        doubtSnap,
        leaveSnap,
        corrSnap,
        setSnap,
      ] = await Promise.all([
        getDocs(query(collection(db, 'attendance'), where('studentEmail', '==', email))).catch(() => null),
        getDocs(query(collection(db, 'study_materials'), where('classLevel', '==', studentProfile.classLevel))).catch(() => null),
        getDocs(query(collection(db, 'examinations'), where('classLevel', '==', studentProfile.classLevel))).catch(() => null),
        getDocs(query(collection(db, 'exam_attempts'), where('studentEmail', '==', email))).catch(() => null),
        getDocs(query(collection(db, 'fees'), where('studentEmail', '==', email))).catch(() => null),
        getDocs(query(collection(db, 'payments'), where('studentEmail', '==', email))).catch(() => null),
        getDocs(collection(db, 'public_notices')).catch(() => null),
        getDocs(query(collection(db, 'timetables'), where('classLevel', '==', studentProfile.classLevel))).catch(() => null),
        getDocs(query(collection(db, 'doubt_requests'), where('studentEmail', '==', email))).catch(() => null),
        getDocs(query(collection(db, 'leave_applications'), where('studentEmail', '==', email))).catch(() => null),
        getDocs(query(collection(db, 'profile_corrections'), where('studentUid', '==', firebaseUser.uid))).catch(() => null),
        getDocs(collection(db, 'public_settings')).catch(() => null),
      ]);

      if (attSnap) setAttendance(attSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as AttendanceRecord[]);
      if (matSnap) setMaterials(matSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as StudyMaterial[]);
      if (examSnap) {
        const list = examSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as Examination[];
        setExams(list.filter((e) => e.status !== 'Draft'));
      }
      if (attmSnap) setAttempts(attmSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as ExamAttempt[]);
      if (feeSnap) setFees(feeSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as FeeAccount[]);
      if (paySnap) setPayments(paySnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as Payment[]);
      if (notSnap) {
        const list = notSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as Notice[];
        setNotices(
          list.filter(
            (n) =>
              (n.audience === 'Students' || n.audience === 'All' || n.audience === 'Public') &&
              (n.targetClass === 'All Classes' || n.targetClass === studentProfile.classLevel)
          )
        );
      }
      if (ttSnap) setTimetable(ttSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as TimetableSlot[]);
      if (doubtSnap) setDoubts(doubtSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as DoubtRequest[]);
      if (leaveSnap) setLeaves(leaveSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as LeaveApplication[]);
      if (corrSnap) setCorrections(corrSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as ProfileCorrection[]);
      if (setSnap && !setSnap.empty) {
        setSettings({ id: setSnap.docs[0].id, ...(setSnap.docs[0].data() as object) } as PublicSettings);
      }
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, [studentProfile?.id, firebaseUser?.uid]);

  const attendanceStats = useMemo(() => {
    const total = attendance.length;
    const present = attendance.filter((a) => a.status === 'Present').length;
    const late = attendance.filter((a) => a.status === 'Late').length;
    const absent = attendance.filter((a) => a.status === 'Absent').length;
    const pct = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    return { total, present, late, absent, pct };
  }, [attendance]);

  const feeSummary = useMemo(() => {
    const totalFee = fees.reduce((s, f) => s + Number(f.totalFee || 0), 0);
    const paidFee = fees.reduce((s, f) => s + Number(f.paidFee || 0), 0);
    const remainingFee = fees.reduce((s, f) => s + Number(f.remainingFee || 0), 0);
    return { totalFee, paidFee, remainingFee };
  }, [fees]);

  if (!studentProfile) {
    return (
      <PortalShell portalName="Student Portal" portalSubtitle="Student Portal" navItems={STUDENT_NAV}>
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-sm text-slate-600">
          Student profile is still loading or not linked.
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell portalName="Student Portal" portalSubtitle="Student Portal" navItems={STUDENT_NAV}>
      <Routes>
        <Route
          path="dashboard"
          element={
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-[#2457B2]">
                    Admission No: <span className="font-mono">{studentProfile.admissionNumber}</span> · {studentProfile.classLevel} · {studentProfile.board}
                  </p>
                  <h1 className="mt-1 font-display text-2xl font-bold text-[#102A56]">
                    Welcome, {studentProfile.fullName}
                  </h1>
                  <p className="mt-1 text-sm text-slate-600">
                    Enrolled Course: <span className="font-medium text-[#17243A]">{studentProfile.courseName}</span>
                  </p>
                </div>
                <Link
                  to="/student/tests"
                  className="px-4 py-2.5 rounded-lg bg-[#FF8A24] hover:bg-[#e67817] text-white text-xs font-semibold whitespace-nowrap self-start sm:self-center"
                >
                  Open Online Tests
                </Link>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <p className="text-xs text-slate-500">Attendance Rate</p>
                  <p className="mt-2 font-mono text-2xl font-bold text-[#102A56] tabular-nums">
                    {attendanceStats.pct}%
                  </p>
                  <p className="mt-1 text-xs text-slate-500 tabular-nums">
                    {attendanceStats.present} Present / {attendanceStats.total} Days
                  </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <p className="text-xs text-slate-500">Pending Fees</p>
                  <p className="mt-2 font-mono text-2xl font-bold text-[#102A56] tabular-nums">
                    ₹{feeSummary.remainingFee.toLocaleString('en-IN')}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 tabular-nums">
                    Paid ₹{feeSummary.paidFee.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <p className="text-xs text-slate-500">Available Tests</p>
                  <p className="mt-2 font-mono text-2xl font-bold text-[#102A56] tabular-nums">{exams.length}</p>
                  <p className="mt-1 text-xs text-slate-500 tabular-nums">{attempts.length} Attempted</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <p className="text-xs text-slate-500">Study Materials</p>
                  <p className="mt-2 font-mono text-2xl font-bold text-[#102A56] tabular-nums">{materials.length}</p>
                  <p className="mt-1 text-xs text-slate-500">For {studentProfile.classLevel}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-lg font-semibold text-[#102A56]">Upcoming &amp; Published Tests</h2>
                    <Link to="/student/tests" className="text-xs font-semibold text-[#2457B2]">View All</Link>
                  </div>
                  {exams.length === 0 ? (
                    <p className="text-sm text-slate-500">No tests scheduled for {studentProfile.classLevel} right now.</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {exams.slice(0, 4).map((ex) => (
                        <div key={ex.id} className="py-3 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-[#102A56]">{ex.title}</p>
                            <p className="text-xs text-slate-500">
                              {ex.subject} · {ex.durationMinutes} min · {ex.maxMarks} marks
                            </p>
                          </div>
                          <span className="font-mono text-xs text-slate-600 tabular-nums">{ex.scheduledDate}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-lg font-semibold text-[#102A56]">Latest Notices</h2>
                    <Link to="/student/notices" className="text-xs font-semibold text-[#2457B2]">All Notices</Link>
                  </div>
                  {notices.length === 0 ? (
                    <p className="text-sm text-slate-500">No new notices posted yet.</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {notices.slice(0, 4).map((n) => (
                        <div key={n.id} className="py-3">
                          <p className="text-xs text-[#2457B2] font-medium">
                            {n.category} · {formatFirestoreDate(n.createdAt)}
                          </p>
                          <p className="text-sm font-semibold text-[#102A56] mt-0.5">{n.title}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          }
        />

        <Route
          path="profile"
          element={
            <StudentProfileView
              student={studentProfile}
              corrections={corrections}
              uid={firebaseUser?.uid || ''}
              onReload={loadStudentData}
            />
          }
        />

        <Route
          path="attendance"
          element={
            <StudentAttendanceLeaveView
              student={studentProfile}
              uid={firebaseUser?.uid || ''}
              attendance={attendance}
              stats={attendanceStats}
              leaves={leaves}
              onReload={loadStudentData}
            />
          }
        />

        <Route path="materials" element={<StudentMaterialsView materials={materials} loading={loadingData} />} />

        <Route
          path="tests"
          element={
            <StudentTestsView
              student={studentProfile}
              uid={firebaseUser?.uid || ''}
              exams={exams}
              attempts={attempts}
              onReload={loadStudentData}
            />
          }
        />

        <Route
          path="results"
          element={<StudentResultsView exams={exams} attempts={attempts} />}
        />

        <Route
          path="fees"
          element={
            <StudentFeesView
              student={studentProfile}
              fees={fees}
              payments={payments}
              razorpayEnabled={Boolean(settings?.razorpayEnabled)}
              onReload={loadStudentData}
            />
          }
        />

        <Route
          path="notices"
          element={
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h1 className="font-display text-xl font-bold text-[#102A56] mb-4">Student Notices &amp; Circulars</h1>
              {notices.length === 0 ? (
                <p className="text-sm text-slate-500">No announcements available right now.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notices.map((n) => (
                    <div key={n.id} className="py-4">
                      <p className="text-xs font-medium text-[#2457B2]">
                        {n.category} · {n.targetClass} · {formatFirestoreDate(n.createdAt)}
                      </p>
                      <h2 className="mt-1 font-display text-base font-semibold text-[#102A56]">{n.title}</h2>
                      <p className="mt-1.5 text-sm text-slate-600 whitespace-pre-line">{n.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          }
        />

        <Route
          path="timetable"
          element={
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h1 className="font-display text-xl font-bold text-[#102A56] mb-4">
                Class Timetable — {studentProfile.classLevel}
              </h1>
              {timetable.length === 0 ? (
                <p className="text-sm text-slate-500">Timetable slots have not been published for {studentProfile.classLevel} yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs text-slate-500">
                        <th className="py-2.5 pr-4">Day</th>
                        <th className="py-2.5 pr-4">Time</th>
                        <th className="py-2.5 pr-4">Subject</th>
                        <th className="py-2.5 pr-4">Faculty</th>
                        <th className="py-2.5">Classroom</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {timetable.map((slot) => (
                        <tr key={slot.id} className="hover:bg-[#F4F7FC]/60">
                          <td className="py-3 pr-4 font-semibold text-[#102A56]">{slot.dayOfWeek}</td>
                          <td className="py-3 pr-4 font-mono text-xs tabular-nums">
                            {slot.startTime} – {slot.endTime}
                          </td>
                          <td className="py-3 pr-4">{slot.subject}</td>
                          <td className="py-3 pr-4">{slot.facultyName}</td>
                          <td className="py-3">{slot.classroom}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          }
        />

        <Route
          path="doubts"
          element={
            <StudentDoubtsView
              student={studentProfile}
              uid={firebaseUser?.uid || ''}
              doubts={doubts}
              onReload={loadStudentData}
            />
          }
        />

        <Route
          path="*"
          element={
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <p className="text-sm text-slate-600">Select a section from the sidebar ({location.pathname}).</p>
            </div>
          }
        />
      </Routes>
    </PortalShell>
  );
}

function StudentProfileView({
  student,
  corrections,
  uid,
  onReload,
}: {
  student: NonNullable<ReturnType<typeof useAuth>['studentProfile']>;
  corrections: ProfileCorrection[];
  uid: string;
  onReload: () => Promise<void>;
}) {
  const [fieldName, setFieldName] = useState('Mobile Number');
  const [requestedValue, setRequestedValue] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await addDoc(collection(db, 'profile_corrections'), {
        studentId: student.id,
        studentName: student.fullName,
        studentEmail: student.email.toLowerCase(),
        studentUid: uid,
        fieldName,
        requestedValue: requestedValue.trim(),
        reason: reason.trim(),
        status: 'Pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await logAudit('student', 'REQUEST_PROFILE_CORRECTION', 'profile_corrections', `${fieldName} -> ${requestedValue}`);
      setRequestedValue('');
      setReason('');
      setMsg('Profile correction request sent to Administration.');
      await onReload();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-6 border-b border-slate-200">
          <div className="w-20 h-20 rounded-xl bg-[#F4F7FC] border border-slate-200 overflow-hidden flex items-center justify-center text-[#102A56] shrink-0">
            {student.photoUrl ? (
              <img src={student.photoUrl} alt={student.fullName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8" />
            )}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-[#102A56]">{student.fullName}</h1>
            <p className="text-sm text-slate-600">
              Admission No: <span className="font-mono font-semibold text-[#102A56]">{student.admissionNumber}</span> · {student.classLevel} · {student.board} ({student.medium})
            </p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-sm">
          <div>
            <dt className="text-xs text-slate-500">Father&apos;s Name</dt>
            <dd className="mt-1 font-medium text-[#17243A]">{student.fatherName || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Mother&apos;s Name</dt>
            <dd className="mt-1 font-medium text-[#17243A]">{student.motherName || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Mobile / WhatsApp</dt>
            <dd className="mt-1 font-medium text-[#17243A] tabular-nums">{student.mobile}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Registered Email</dt>
            <dd className="mt-1 font-medium text-[#17243A]">{student.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Course</dt>
            <dd className="mt-1 font-medium text-[#17243A]">{student.courseName}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Admission Date</dt>
            <dd className="mt-1 font-medium text-[#17243A] tabular-nums">{student.admissionDate}</dd>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <dt className="text-xs text-slate-500">Residential Address</dt>
            <dd className="mt-1 font-medium text-[#17243A]">{student.address || '—'}</dd>
          </div>
        </dl>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-display text-lg font-semibold text-[#102A56]">Request Profile Correction</h2>
        <form onSubmit={submitCorrection} className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <select
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-slate-300 text-sm bg-white"
          >
            <option>Mobile Number</option>
            <option>Residential Address</option>
            <option>Full Name Spelling</option>
            <option>Parent Name</option>
            <option>Date of Birth</option>
          </select>
          <input
            type="text"
            required
            value={requestedValue}
            onChange={(e) => setRequestedValue(e.target.value)}
            placeholder="Corrected value"
            className="px-3 py-2.5 rounded-lg border border-slate-300 text-sm"
          />
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            className="px-3 py-2.5 rounded-lg border border-slate-300 text-sm"
          />
          <div className="sm:col-span-3 flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-lg bg-[#102A56] text-white text-xs font-semibold hover:bg-[#2457B2] transition-colors"
            >
              {saving ? 'Submitting...' : 'Submit Correction Request'}
            </button>
            {msg && <span className="text-xs text-emerald-700 font-medium">{msg}</span>}
          </div>
        </form>

        {corrections.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
            <p className="text-xs font-semibold text-slate-500">Previous Requests</p>
            {corrections.map((c) => (
              <div key={c.id} className="text-xs flex items-center justify-between py-1.5">
                <span>
                  <span className="font-semibold text-[#102A56]">{c.fieldName}:</span> {c.requestedValue}
                </span>
                <span className="font-semibold text-[#2457B2]">{c.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StudentAttendanceLeaveView({
  student,
  uid,
  attendance,
  stats,
  leaves,
  onReload,
}: {
  student: NonNullable<ReturnType<typeof useAuth>['studentProfile']>;
  uid: string;
  attendance: AttendanceRecord[];
  stats: { total: number; present: number; late: number; absent: number; pct: number };
  leaves: LeaveApplication[];
  onReload: () => Promise<void>;
}) {
  const [leaveDate, setLeaveDate] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const submitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addDoc(collection(db, 'leave_applications'), {
        studentId: student.id,
        studentName: student.fullName,
        studentEmail: student.email.toLowerCase(),
        studentUid: uid,
        classLevel: student.classLevel,
        leaveDate,
        reason: reason.trim(),
        description: description.trim(),
        status: 'Pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setLeaveDate('');
      setReason('');
      setDescription('');
      await onReload();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Overall Attendance</p>
          <p className="mt-1 font-mono text-2xl font-bold text-[#102A56] tabular-nums">{stats.pct}%</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Present Days</p>
          <p className="mt-1 font-mono text-2xl font-bold text-emerald-700 tabular-nums">{stats.present}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Absent Days</p>
          <p className="mt-1 font-mono text-2xl font-bold text-red-700 tabular-nums">{stats.absent}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Late Entries</p>
          <p className="mt-1 font-mono text-2xl font-bold text-amber-700 tabular-nums">{stats.late}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-display text-lg font-semibold text-[#102A56] mb-4">Attendance Register</h2>
        {attendance.length === 0 ? (
          <p className="text-sm text-slate-500">No attendance records marked yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {attendance
              .slice()
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((rec) => (
                <div key={rec.id} className="p-3 rounded-lg border border-slate-200 bg-[#F4F7FC]">
                  <p className="font-mono text-xs text-slate-600 tabular-nums">{rec.date}</p>
                  <p
                    className={`mt-1 text-xs font-semibold ${
                      rec.status === 'Present'
                        ? 'text-emerald-700'
                        : rec.status === 'Late'
                        ? 'text-amber-700'
                        : 'text-red-700'
                    }`}
                  >
                    {rec.status}
                  </p>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={submitLeave} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-[#102A56]">Apply for Leave</h2>
          <div>
            <label className="block text-xs font-semibold text-[#17243A] mb-1">Leave Date *</label>
            <input
              type="date"
              required
              value={leaveDate}
              onChange={(e) => setLeaveDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#17243A] mb-1">Reason *</label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Family function / Medical rest"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#17243A] mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-[#102A56] text-white text-xs font-semibold hover:bg-[#2457B2]"
          >
            {saving ? 'Submitting...' : 'Submit Leave Application'}
          </button>
        </form>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-display text-lg font-semibold text-[#102A56] mb-4">Leave Request History</h2>
          {leaves.length === 0 ? (
            <p className="text-sm text-slate-500">No leave requests submitted.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {leaves.map((l) => (
                <div key={l.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#102A56]">{l.reason}</p>
                    <p className="text-xs text-slate-500 font-mono tabular-nums">{l.leaveDate}</p>
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      l.status === 'Approved'
                        ? 'text-emerald-700'
                        : l.status === 'Rejected'
                        ? 'text-red-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {l.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StudentMaterialsView({ materials, loading }: { materials: StudyMaterial[]; loading: boolean }) {
  const [subjectFilter, setSubjectFilter] = useState('All');
  const subjects = ['All', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Science', 'English'];
  const filtered = materials.filter((m) => subjectFilter === 'All' || m.subject === subjectFilter);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="font-display text-xl font-bold text-[#102A56]">Digital Learning Library</h1>
        <div className="flex flex-wrap gap-1 p-1 bg-[#F4F7FC] border border-slate-200 rounded-lg">
          {subjects.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => setSubjectFilter(sub)}
              className={`px-3 py-1 rounded-md text-xs font-semibold ${
                subjectFilter === sub ? 'bg-white text-[#102A56] shadow-xs' : 'text-slate-600'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading study materials...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-500">No study materials uploaded for this filter yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((m) => (
            <div key={m.id} className="p-4 rounded-xl border border-slate-200 bg-[#F4F7FC] flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-[#2457B2]">
                  {m.subject} · {m.category}
                </p>
                <h2 className="mt-1 font-display text-base font-semibold text-[#102A56]">{m.title}</h2>
                {m.description && <p className="mt-1 text-xs text-slate-600">{m.description}</p>}
                <p className="mt-2 text-xs text-slate-500">Uploaded by {m.uploadedByName}</p>
              </div>
              <a
                href={m.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={m.fileName}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#102A56] text-white text-xs font-semibold whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" /> Open
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StudentTestsView({
  student,
  uid,
  exams,
  attempts,
  onReload,
}: {
  student: NonNullable<ReturnType<typeof useAuth>['studentProfile']>;
  uid: string;
  exams: Examination[];
  attempts: ExamAttempt[];
  onReload: () => Promise<void>;
}) {
  const [activeExam, setActiveExam] = useState<Examination | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, { option?: number; text?: string }>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const startExam = async (exam: Examination) => {
    const qSnap = await getDocs(query(collection(db, 'examinations', exam.id, 'questions'), orderBy('orderIndex', 'asc')));
    const loaded = qSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as ExamQuestion[];
    setQuestions(loaded);
    setAnswers({});
    setSecondsLeft(exam.durationMinutes * 60);
    setActiveExam(exam);
  };

  useEffect(() => {
    if (!activeExam || secondsLeft <= 0) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          void submitExam();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [activeExam]);

  const submitExam = async () => {
    if (!activeExam || submitting) return;
    setSubmitting(true);
    try {
      let obtained = 0;
      let hasSubjective = false;
      const formattedAnswers = questions.map((q) => {
        const ans = answers[q.id] || {};
        if (q.questionType === 'MCQ') {
          const isCorrect = ans.option !== undefined && ans.option === q.correctOptionIndex;
          const awarded = isCorrect ? q.marks : 0;
          obtained += awarded;
          return {
            questionId: q.id,
            questionText: q.questionText,
            questionType: 'MCQ' as const,
            selectedOptionIndex: ans.option ?? -1,
            correctOptionIndex: q.correctOptionIndex ?? 0,
            maxMarks: q.marks,
            awardedMarks: awarded,
          };
        } else {
          hasSubjective = true;
          return {
            questionId: q.id,
            questionText: q.questionText,
            questionType: 'Subjective' as const,
            subjectiveAnswer: ans.text || '',
            maxMarks: q.marks,
            awardedMarks: 0,
          };
        }
      });

      const pct = activeExam.maxMarks > 0 ? Math.round((obtained / activeExam.maxMarks) * 100) : 0;
      await addDoc(collection(db, 'exam_attempts'), {
        examId: activeExam.id,
        examTitle: activeExam.title,
        subject: activeExam.subject,
        classLevel: activeExam.classLevel,
        studentId: student.id,
        studentName: student.fullName,
        studentEmail: student.email.toLowerCase(),
        studentUid: uid,
        answers: formattedAnswers,
        obtainedMarks: obtained,
        maxMarks: activeExam.maxMarks,
        percentage: pct,
        status: hasSubjective ? 'Submitted' : 'Evaluated',
        facultyRemarks: hasSubjective ? 'Pending subjective evaluation' : 'Auto-evaluated objective exam',
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setActiveExam(null);
      await onReload();
    } finally {
      setSubmitting(false);
    }
  };

  if (activeExam) {
    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <p className="text-xs font-medium text-[#2457B2]">
              {activeExam.subject} · {activeExam.classLevel}
            </p>
            <h1 className="font-display text-xl font-bold text-[#102A56]">{activeExam.title}</h1>
          </div>
          <div className="px-4 py-2 rounded-lg bg-[#F4F7FC] border border-slate-200 font-mono text-sm font-bold text-[#102A56] tabular-nums">
            Time Left: {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </div>
        </div>

        {questions.length === 0 ? (
          <p className="text-sm text-slate-500">No questions have been added to this examination yet.</p>
        ) : (
          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div key={q.id} className="p-5 rounded-xl border border-slate-200 bg-[#F4F7FC]/50">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-semibold text-[#102A56]">
                    Q{idx + 1}. {q.questionText}
                  </p>
                  <span className="font-mono text-xs text-slate-500 shrink-0 tabular-nums">{q.marks} Marks</span>
                </div>
                {q.questionType === 'MCQ' && q.options ? (
                  <div className="mt-3 space-y-2">
                    {q.options.map((opt, oIdx) => (
                      <label
                        key={oIdx}
                        className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-[#2457B2]"
                      >
                        <input
                          type="radio"
                          name={q.id}
                          checked={answers[q.id]?.option === oIdx}
                          onChange={() => setAnswers((p) => ({ ...p, [q.id]: { option: oIdx } }))}
                        />
                        <span className="text-sm text-slate-700">{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea
                    rows={3}
                    value={answers[q.id]?.text || ''}
                    onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: { text: e.target.value } }))}
                    placeholder="Write your answer here..."
                    className="mt-3 w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            disabled={submitting || questions.length === 0}
            onClick={submitExam}
            className="px-6 py-2.5 rounded-lg bg-[#FF8A24] text-white text-sm font-semibold hover:bg-[#e67817] disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Submit Examination'}
          </button>
          <button
            type="button"
            onClick={() => setActiveExam(null)}
            className="px-5 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
      <h1 className="font-display text-xl font-bold text-[#102A56]">Online Tests &amp; Examinations</h1>
      {exams.length === 0 ? (
        <p className="text-sm text-slate-500">No published examinations available for {student.classLevel}.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.map((ex) => {
            const done = attempts.find((a) => a.examId === ex.id);
            return (
              <div key={ex.id} className="p-5 rounded-xl border border-slate-200 bg-[#F4F7FC] flex flex-col justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-[#2457B2]">
                    {ex.subject} · {ex.board} · {ex.scheduledDate}
                  </p>
                  <h2 className="mt-1 font-display text-lg font-semibold text-[#102A56]">{ex.title}</h2>
                  <p className="mt-1 text-xs text-slate-600 tabular-nums">
                    Duration: {ex.durationMinutes} mins · Maximum Marks: {ex.maxMarks}
                  </p>
                </div>
                {done ? (
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
                    <span className="inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Submitted ({done.obtainedMarks}/{done.maxMarks})
                    </span>
                    <Link to="/student/results" className="text-[#2457B2] underline">View Result</Link>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => startExam(ex)}
                    className="self-start px-4 py-2 rounded-lg bg-[#102A56] hover:bg-[#2457B2] text-white text-xs font-semibold"
                  >
                    Start Timed Exam
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StudentResultsView({ exams, attempts }: { exams: Examination[]; attempts: ExamAttempt[] }) {
  const publishedExamIds = new Set(exams.filter((e) => e.resultsPublished).map((e) => e.id));
  const visibleAttempts = attempts.filter((a) => publishedExamIds.has(a.examId) || a.status === 'Evaluated');

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
      <h1 className="font-display text-xl font-bold text-[#102A56]">Examination Results &amp; Evaluation</h1>
      {visibleAttempts.length === 0 ? (
        <p className="text-sm text-slate-500">No published examination results available yet.</p>
      ) : (
        <div className="space-y-4">
          {visibleAttempts.map((a) => (
            <div key={a.id} className="p-5 rounded-xl border border-slate-200 bg-[#F4F7FC]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-[#2457B2]">{a.subject} · {a.classLevel}</p>
                  <h2 className="font-display text-lg font-semibold text-[#102A56]">{a.examTitle}</h2>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xl font-bold text-[#102A56] tabular-nums">
                    {a.obtainedMarks} / {a.maxMarks} ({a.percentage}%)
                  </p>
                  <p className="text-xs text-slate-500">{a.status}</p>
                </div>
              </div>
              {a.facultyRemarks && (
                <p className="mt-3 text-xs text-slate-600">
                  <span className="font-semibold text-[#17243A]">Faculty Remarks:</span> {a.facultyRemarks}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StudentFeesView({
  student,
  fees,
  payments,
  razorpayEnabled,
  onReload,
}: {
  student: NonNullable<ReturnType<typeof useAuth>['studentProfile']>;
  fees: FeeAccount[];
  payments: Payment[];
  razorpayEnabled: boolean;
  onReload: () => Promise<void>;
}) {
  const [rzpMsg, setRzpMsg] = useState<string | null>(null);
  const { firebaseUser } = useAuth();

  const printReceipt = (p: Payment) => {
    printHtmlReport(
      `OFFICIAL FEE RECEIPT · ${p.receiptNumber}`,
      `
        <table style="width:100%; border-collapse:collapse; font-size:13px;">
          <tr><td style="padding:8px; border:1px solid #cbd5e1;"><strong>Student Name</strong></td><td style="padding:8px; border:1px solid #cbd5e1;">${p.studentName}</td></tr>
          <tr><td style="padding:8px; border:1px solid #cbd5e1;"><strong>Admission No.</strong></td><td style="padding:8px; border:1px solid #cbd5e1;">${p.admissionNumber}</td></tr>
          <tr><td style="padding:8px; border:1px solid #cbd5e1;"><strong>Class</strong></td><td style="padding:8px; border:1px solid #cbd5e1;">${student.classLevel} (${student.board})</td></tr>
          <tr><td style="padding:8px; border:1px solid #cbd5e1;"><strong>Amount Paid</strong></td><td style="padding:8px; border:1px solid #cbd5e1;">₹${Number(p.amount).toLocaleString('en-IN')}</td></tr>
          <tr><td style="padding:8px; border:1px solid #cbd5e1;"><strong>Payment Method</strong></td><td style="padding:8px; border:1px solid #cbd5e1;">${p.method}</td></tr>
          <tr><td style="padding:8px; border:1px solid #cbd5e1;"><strong>Reference ID</strong></td><td style="padding:8px; border:1px solid #cbd5e1;">${p.referenceId}</td></tr>
          <tr><td style="padding:8px; border:1px solid #cbd5e1;"><strong>Date</strong></td><td style="padding:8px; border:1px solid #cbd5e1;">${formatFirestoreDate(p.paidAt)}</td></tr>
        </table>
      `
    );
  };

  const handleRazorpayClick = async (fee: FeeAccount) => {
    setRzpMsg(null);
    if (!firebaseUser) return;
    const token = await firebaseUser.getIdToken();
    const res = await fetch('/api/payments/razorpay/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        amountInr: fee.remainingFee,
        receipt: `VT_${student.admissionNumber}`,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setRzpMsg(data.error || 'Online payment gateway is not configured on the server.');
      return;
    }
    setRzpMsg(`Razorpay Order Created: ${data.order?.id}. Complete checkout via Razorpay SDK.`);
    await onReload();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h1 className="font-display text-xl font-bold text-[#102A56] mb-4">Fee Summary</h1>
        {fees.length === 0 ? (
          <p className="text-sm text-slate-500">No fee ledger assigned yet.</p>
        ) : (
          <div className="space-y-4">
            {fees.map((f) => (
              <div key={f.id} className="p-5 rounded-xl border border-slate-200 bg-[#F4F7FC] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-[#2457B2]">{f.courseName} · Due {f.dueDate}</p>
                  <p className="mt-1 font-mono text-lg font-bold text-[#102A56] tabular-nums">
                    Total ₹{f.totalFee.toLocaleString('en-IN')} · Paid ₹{f.paidFee.toLocaleString('en-IN')} · Remaining ₹{f.remainingFee.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-[#102A56]">{f.status}</span>
                  {razorpayEnabled && f.remainingFee > 0 && (
                    <button
                      type="button"
                      onClick={() => handleRazorpayClick(f)}
                      className="px-4 py-2 rounded-lg bg-[#FF8A24] text-white text-xs font-semibold"
                    >
                      Pay via Razorpay
                    </button>
                  )}
                </div>
              </div>
            ))}
            {rzpMsg && <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-3 rounded-lg">{rzpMsg}</p>}
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-display text-lg font-semibold text-[#102A56] mb-4">Payment History &amp; Receipts</h2>
        {payments.length === 0 ? (
          <p className="text-sm text-slate-500">No fee payments recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="py-2.5 pr-4">Receipt No.</th>
                  <th className="py-2.5 pr-4">Date</th>
                  <th className="py-2.5 pr-4">Method</th>
                  <th className="py-2.5 pr-4">Reference ID</th>
                  <th className="py-2.5 pr-4 text-right">Amount</th>
                  <th className="py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 pr-4 font-mono text-xs font-semibold text-[#102A56]">{p.receiptNumber}</td>
                    <td className="py-3 pr-4 text-xs tabular-nums">{formatFirestoreDate(p.paidAt)}</td>
                    <td className="py-3 pr-4 text-xs">{p.method}</td>
                    <td className="py-3 pr-4 font-mono text-xs">{p.referenceId}</td>
                    <td className="py-3 pr-4 text-right font-mono font-semibold tabular-nums">
                      ₹{Number(p.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => printReceipt(p)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#2457B2] hover:text-[#102A56]"
                      >
                        <Printer className="w-3.5 h-3.5" /> Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StudentDoubtsView({
  student,
  uid,
  doubts,
  onReload,
}: {
  student: NonNullable<ReturnType<typeof useAuth>['studentProfile']>;
  uid: string;
  doubts: DoubtRequest[];
  onReload: () => Promise<void>;
}) {
  const { firebaseUser } = useAuth();
  const [subject, setSubject] = useState('Mathematics');
  const [chapter, setChapter] = useState('');
  const [question, setQuestion] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedDoubt, setSelectedDoubt] = useState<DoubtRequest | null>(null);
  const [responses, setResponses] = useState<DoubtResponse[]>([]);
  const [replyText, setReplyText] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !firebaseUser) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const token = await firebaseUser.getIdToken();
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fileName: file.name, mimeType: file.type, base64Data: reader.result }),
      });
      const data = await res.json();
      if (res.ok && data.url) setAttachmentUrl(data.url);
    };
    reader.readAsDataURL(file);
  };

  const submitDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addDoc(collection(db, 'doubt_requests'), {
        studentId: student.id,
        studentName: student.fullName,
        studentEmail: student.email.toLowerCase(),
        studentUid: uid,
        classLevel: student.classLevel,
        subject,
        chapter: chapter.trim(),
        question: question.trim(),
        ...(attachmentUrl ? { attachmentUrl } : {}),
        status: 'Open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setChapter('');
      setQuestion('');
      setAttachmentUrl('');
      await onReload();
    } finally {
      setSaving(false);
    }
  };

  const openThread = async (d: DoubtRequest) => {
    setSelectedDoubt(d);
    const snap = await getDocs(query(collection(db, 'doubt_requests', d.id, 'responses'), orderBy('createdAt', 'asc')));
    setResponses(snap.docs.map((r) => ({ id: r.id, ...(r.data() as object) })) as DoubtResponse[]);
  };

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoubt || !replyText.trim()) return;
    await addDoc(collection(db, 'doubt_requests', selectedDoubt.id, 'responses'), {
      responderUid: uid,
      responderName: student.fullName,
      responderRole: 'student',
      message: replyText.trim(),
      createdAt: serverTimestamp(),
    });
    setReplyText('');
    await openThread(selectedDoubt);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <form onSubmit={submitDoubt} className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4 self-start">
        <h1 className="font-display text-lg font-bold text-[#102A56]">Ask a Doubt</h1>
        <div>
          <label className="block text-xs font-semibold mb-1">Subject *</label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
          >
            <option>Mathematics</option>
            <option>Physics</option>
            <option>Chemistry</option>
            <option>Biology</option>
            <option>Science</option>
            <option>English</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Chapter *</label>
          <input
            type="text"
            required
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
            placeholder="e.g., Chapter 4 Quadratic Equations"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Question Description *</label>
          <textarea
            rows={4}
            required
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Explain your question or step where you are stuck..."
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Attach Image (optional, JPG/PNG)</label>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileUpload} className="text-xs" />
          {attachmentUrl && <p className="mt-1 text-xs text-emerald-700">Image attached.</p>}
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 rounded-lg bg-[#102A56] text-white text-xs font-semibold hover:bg-[#2457B2]"
        >
          {saving ? 'Submitting...' : 'Submit Doubt'}
        </button>
      </form>

      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold text-[#102A56]">My Doubt Threads</h2>
        {doubts.length === 0 ? (
          <p className="text-sm text-slate-500">No doubts submitted yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {doubts.map((d) => (
              <div key={d.id} className="py-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-[#2457B2] font-medium">
                    {d.subject} · {d.chapter} · {d.status}
                  </p>
                  <p className="mt-1 text-sm text-[#102A56]">{d.question}</p>
                </div>
                <button
                  type="button"
                  onClick={() => openThread(d)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-[#102A56] shrink-0"
                >
                  Open Thread
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedDoubt && (
          <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-[#102A56]">Thread: {selectedDoubt.chapter}</h3>
            {selectedDoubt.attachmentUrl && (
              <img src={selectedDoubt.attachmentUrl} alt="Doubt attachment" className="max-h-48 rounded-lg border border-slate-200" />
            )}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {responses.map((r) => (
                <div key={r.id} className="p-3 rounded-lg bg-[#F4F7FC] text-xs">
                  <p className="font-semibold text-[#102A56]">
                    {r.responderName} ({r.responderRole})
                  </p>
                  <p className="mt-1 text-slate-700">{r.message}</p>
                </div>
              ))}
            </div>
            {selectedDoubt.status !== 'Resolved' && (
              <form onSubmit={sendReply} className="flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Add follow-up note..."
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
                <button type="submit" className="px-3 py-2 rounded-lg bg-[#102A56] text-white text-xs font-semibold inline-flex items-center gap-1">
                  <Send className="w-3.5 h-3.5" /> Reply
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
