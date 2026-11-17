import React, { useEffect, useMemo, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  ClipboardList,
  BookOpen,
  HelpCircle,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  Send,
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
  where,
  orderBy,
  serverTimestamp,
  logAudit,
} from '../lib/firestoreDb';
import { db } from '../lib/firebase';
import type {
  AttendanceRecord,
  AttendanceStatus,
  DoubtRequest,
  DoubtResponse,
  ExamAttempt,
  Examination,
  ExamQuestion,
  FacultyAnnouncement,
  LeaveApplication,
  Student,
  StudyMaterial,
  TimetableSlot,
} from '../types/domain';

const FACULTY_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/faculty/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Assigned Students', to: '/faculty/students', icon: <Users className="w-4 h-4" /> },
  { label: 'Attendance', to: '/faculty/attendance', icon: <CalendarCheck className="w-4 h-4" /> },
  { label: 'Tests & Evaluation', to: '/faculty/tests', icon: <ClipboardList className="w-4 h-4" /> },
  { label: 'Study Materials', to: '/faculty/materials', icon: <BookOpen className="w-4 h-4" /> },
  { label: 'Doubts', to: '/faculty/doubts', icon: <HelpCircle className="w-4 h-4" /> },
  { label: 'Timetable & Leave', to: '/faculty/timetable', icon: <Clock className="w-4 h-4" /> },
];

export function FacultyPortal() {
  const { firebaseUser, facultyProfile, role } = useAuth();
  const isAdminBypass = role === 'admin' || role === 'super_admin';
  const assignedClasses = facultyProfile?.assignedClasses || [];
  const assignedSubjects = facultyProfile?.assignedSubjects || ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Science'];
  const facultyName = facultyProfile?.fullName || firebaseUser?.displayName || 'Faculty';

  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [exams, setExams] = useState<Examination[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [doubts, setDoubts] = useState<DoubtRequest[]>([]);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [announcements, setAnnouncements] = useState<FacultyAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFacultyData = async () => {
    if (!firebaseUser) return;
    setLoading(true);
    try {
      const [studSnap, attSnap, examSnap, attmSnap, matSnap, doubtSnap, ttSnap, leaveSnap, annSnap] = await Promise.all([
        getDocs(collection(db, 'students')).catch(() => null),
        getDocs(collection(db, 'attendance')).catch(() => null),
        getDocs(collection(db, 'examinations')).catch(() => null),
        getDocs(collection(db, 'exam_attempts')).catch(() => null),
        getDocs(collection(db, 'study_materials')).catch(() => null),
        getDocs(collection(db, 'doubt_requests')).catch(() => null),
        getDocs(collection(db, 'timetables')).catch(() => null),
        getDocs(collection(db, 'leave_applications')).catch(() => null),
        getDocs(query(collection(db, 'announcements'), where('submittedByUid', '==', firebaseUser.uid))).catch(() => null),
      ]);

      const classAllowed = (cls: string) => isAdminBypass || assignedClasses.includes(cls);

      if (studSnap) {
        const list = studSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as Student[];
        setStudents(list.filter((s) => classAllowed(s.classLevel) && s.status === 'Active'));
      }
      if (attSnap) {
        const list = attSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as AttendanceRecord[];
        setAttendance(list.filter((a) => classAllowed(a.classLevel)));
      }
      if (examSnap) {
        const list = examSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as Examination[];
        setExams(list.filter((e) => classAllowed(e.classLevel)));
      }
      if (attmSnap) {
        const list = attmSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as ExamAttempt[];
        setAttempts(list.filter((a) => classAllowed(a.classLevel)));
      }
      if (matSnap) {
        const list = matSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as StudyMaterial[];
        setMaterials(list.filter((m) => classAllowed(m.classLevel)));
      }
      if (doubtSnap) {
        const list = doubtSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as DoubtRequest[];
        setDoubts(list.filter((d) => classAllowed(d.classLevel)));
      }
      if (ttSnap) {
        const list = ttSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as TimetableSlot[];
        setTimetable(
          isAdminBypass
            ? list
            : list.filter(
                (t) =>
                  t.facultyId === facultyProfile?.id ||
                  t.facultyEmail?.toLowerCase() === facultyProfile?.email?.toLowerCase()
              )
        );
      }
      if (leaveSnap) {
        const list = leaveSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as LeaveApplication[];
        setLeaves(list.filter((l) => classAllowed(l.classLevel)));
      }
      if (annSnap) {
        setAnnouncements(annSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as FacultyAnnouncement[]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFacultyData();
  }, [firebaseUser?.uid, facultyProfile?.id]);

  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaysSlots = timetable.filter((t) => t.dayOfWeek === todayName);
  const openDoubts = doubts.filter((d) => d.status === 'Open');

  return (
    <PortalShell portalName="Faculty Portal" portalSubtitle="Faculty Portal" navItems={FACULTY_NAV}>
      <Routes>
        <Route
          path="dashboard"
          element={
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <p className="text-xs font-medium text-[#2457B2]">
                  {facultyProfile?.facultyCode || 'FACULTY'} · {assignedSubjects.join(', ')}
                </p>
                <h1 className="mt-1 font-display text-2xl font-bold text-[#102A56]">Welcome, {facultyName}</h1>
                <p className="mt-1 text-sm text-slate-600">
                  Assigned Classes: {assignedClasses.length ? assignedClasses.join(' · ') : isAdminBypass ? 'All Classes (Admin View)' : 'None assigned yet'}
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <p className="text-xs text-slate-500">Assigned Students</p>
                  <p className="mt-2 font-mono text-2xl font-bold text-[#102A56] tabular-nums">{students.length}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <p className="text-xs text-slate-500">Today&apos;s Lectures</p>
                  <p className="mt-2 font-mono text-2xl font-bold text-[#102A56] tabular-nums">{todaysSlots.length}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <p className="text-xs text-slate-500">Pending Doubts</p>
                  <p className="mt-2 font-mono text-2xl font-bold text-[#FF8A24] tabular-nums">{openDoubts.length}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <p className="text-xs text-slate-500">Tests Created</p>
                  <p className="mt-2 font-mono text-2xl font-bold text-[#102A56] tabular-nums">{exams.length}</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h2 className="font-display text-lg font-semibold text-[#102A56] mb-3">Today&apos;s Teaching Schedule ({todayName})</h2>
                {todaysSlots.length === 0 ? (
                  <p className="text-sm text-slate-500">No lectures scheduled for today.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {todaysSlots.map((s) => (
                      <div key={s.id} className="py-3 flex items-center justify-between text-sm">
                        <span className="font-semibold text-[#102A56]">{s.classLevel} · {s.subject}</span>
                        <span className="font-mono text-xs text-slate-600 tabular-nums">{s.startTime} – {s.endTime} · {s.classroom}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          }
        />

        <Route
          path="students"
          element={
            <FacultyStudentsView students={students} attendance={attendance} attempts={attempts} loading={loading} />
          }
        />

        <Route
          path="attendance"
          element={
            <FacultyAttendanceView
              students={students}
              attendance={attendance}
              assignedClasses={assignedClasses.length ? assignedClasses : ['Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11 Science', 'Class 12 Science']}
              facultyUid={firebaseUser?.uid || ''}
              facultyName={facultyName}
              onReload={loadFacultyData}
            />
          }
        />

        <Route
          path="tests"
          element={
            <FacultyTestsView
              exams={exams}
              attempts={attempts}
              assignedClasses={assignedClasses.length ? assignedClasses : ['Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11 Science', 'Class 12 Science']}
              assignedSubjects={assignedSubjects}
              facultyUid={firebaseUser?.uid || ''}
              facultyName={facultyName}
              onReload={loadFacultyData}
            />
          }
        />

        <Route
          path="materials"
          element={
            <FacultyMaterialsView
              materials={materials}
              assignedClasses={assignedClasses.length ? assignedClasses : ['Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11 Science', 'Class 12 Science']}
              assignedSubjects={assignedSubjects}
              facultyUid={firebaseUser?.uid || ''}
              facultyName={facultyName}
              onReload={loadFacultyData}
            />
          }
        />

        <Route
          path="doubts"
          element={
            <FacultyDoubtsView
              doubts={doubts}
              facultyUid={firebaseUser?.uid || ''}
              facultyName={facultyName}
              onReload={loadFacultyData}
            />
          }
        />

        <Route
          path="timetable"
          element={
            <FacultyTimetableLeaveView
              timetable={timetable}
              leaves={leaves}
              announcements={announcements}
              assignedClasses={assignedClasses.length ? assignedClasses : ['Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11 Science', 'Class 12 Science']}
              facultyUid={firebaseUser?.uid || ''}
              facultyName={facultyName}
              onReload={loadFacultyData}
            />
          }
        />
      </Routes>
    </PortalShell>
  );
}

function FacultyStudentsView({
  students,
  attendance,
  attempts,
  loading,
}: {
  students: Student[];
  attendance: AttendanceRecord[];
  attempts: ExamAttempt[];
  loading: boolean;
}) {
  const [selected, setSelected] = useState<Student | null>(null);
  const [search, setSearch] = useState('');

  const filtered = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h1 className="font-display text-xl font-bold text-[#102A56]">Assigned Students</h1>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or ID..."
            className="px-3.5 py-2 rounded-lg border border-slate-300 text-sm w-full sm:w-64"
          />
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading assigned students...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-500">No students enrolled in your assigned classes yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="py-2.5 pr-4">Admission No.</th>
                  <th className="py-2.5 pr-4">Student Name</th>
                  <th className="py-2.5 pr-4">Class &amp; Board</th>
                  <th className="py-2.5 pr-4">Mobile</th>
                  <th className="py-2.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-[#F4F7FC]/70">
                    <td className="py-3 pr-4 font-mono text-xs font-semibold text-[#102A56]">{s.admissionNumber}</td>
                    <td className="py-3 pr-4 font-medium">{s.fullName}</td>
                    <td className="py-3 pr-4 text-xs text-slate-600">{s.classLevel} · {s.board}</td>
                    <td className="py-3 pr-4 font-mono text-xs tabular-nums">{s.mobile}</td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelected(s)}
                        className="text-xs font-semibold text-[#2457B2] hover:text-[#102A56]"
                      >
                        View Progress
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[#102A56]">
              Academic &amp; Attendance Summary — {selected.fullName}
            </h2>
            <button type="button" onClick={() => setSelected(null)} className="text-xs text-slate-500">
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-[#F4F7FC] border border-slate-200">
              <p className="font-semibold text-[#102A56] mb-2">Attendance Records</p>
              {attendance.filter((a) => a.studentId === selected.id).length === 0 ? (
                <p className="text-slate-500">No attendance marked yet.</p>
              ) : (
                <p className="tabular-nums">
                  Present: {attendance.filter((a) => a.studentId === selected.id && a.status === 'Present').length} ·{' '}
                  Absent: {attendance.filter((a) => a.studentId === selected.id && a.status === 'Absent').length} ·{' '}
                  Late: {attendance.filter((a) => a.studentId === selected.id && a.status === 'Late').length}
                </p>
              )}
            </div>
            <div className="p-4 rounded-lg bg-[#F4F7FC] border border-slate-200">
              <p className="font-semibold text-[#102A56] mb-2">Test Scores</p>
              {attempts.filter((a) => a.studentId === selected.id).length === 0 ? (
                <p className="text-slate-500">No test attempts yet.</p>
              ) : (
                attempts
                  .filter((a) => a.studentId === selected.id)
                  .map((a) => (
                    <p key={a.id} className="tabular-nums">
                      {a.examTitle}: {a.obtainedMarks}/{a.maxMarks} ({a.percentage}%)
                    </p>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FacultyAttendanceView({
  students,
  attendance,
  assignedClasses,
  facultyUid,
  facultyName,
  onReload,
}: {
  students: Student[];
  attendance: AttendanceRecord[];
  assignedClasses: string[];
  facultyUid: string;
  facultyName: string;
  onReload: () => Promise<void>;
}) {
  const [selectedClass, setSelectedClass] = useState(assignedClasses[0] || 'Class 10');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const classStudents = useMemo(
    () => students.filter((s) => s.classLevel === selectedClass),
    [students, selectedClass]
  );

  useEffect(() => {
    const nextStatuses: Record<string, AttendanceStatus> = {};
    const nextRemarks: Record<string, string> = {};
    for (const s of classStudents) {
      const existing = attendance.find((a) => a.studentId === s.id && a.date === date);
      nextStatuses[s.id] = existing ? existing.status : 'Present';
      nextRemarks[s.id] = existing?.remarks || '';
    }
    setStatuses(nextStatuses);
    setRemarks(nextRemarks);
  }, [classStudents, attendance, date]);

  const submitAttendance = async () => {
    setSaving(true);
    setMsg(null);
    try {
      for (const s of classStudents) {
        const docId = `${s.id}_${date}`;
        const existing = attendance.find((a) => a.id === docId || (a.studentId === s.id && a.date === date));
        const status = statuses[s.id] || 'Present';
        if (existing) {
          await updateDoc(doc(db, 'attendance', existing.id), {
            status,
            remarks: remarks[s.id] || '',
            markedByUid: facultyUid,
            markedByName: facultyName,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(doc(db, 'attendance', docId), {
            studentId: s.id,
            studentName: s.fullName,
            studentEmail: s.email.toLowerCase(),
            classLevel: s.classLevel,
            date,
            status,
            remarks: remarks[s.id] || '',
            markedByUid: facultyUid,
            markedByName: facultyName,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }
      await logAudit('faculty', 'MARK_ATTENDANCE', 'attendance', `${selectedClass} on ${date} (${classStudents.length} students)`);
      setMsg(`Attendance saved for ${classStudents.length} students on ${date}.`);
      await onReload();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-[#102A56]">Mark Daily Attendance</h1>
          <p className="text-xs text-slate-500 mt-1">
            Duplicate entries for the same student and date are prevented automatically.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
          >
            {assignedClasses.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
        </div>
      </div>

      {classStudents.length === 0 ? (
        <p className="text-sm text-slate-500">No active students found in {selectedClass}.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="py-2.5 pr-4">Admission No.</th>
                  <th className="py-2.5 pr-4">Student Name</th>
                  <th className="py-2.5 pr-4">Status</th>
                  <th className="py-2.5">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classStudents.map((s) => (
                  <tr key={s.id}>
                    <td className="py-3 pr-4 font-mono text-xs">{s.admissionNumber}</td>
                    <td className="py-3 pr-4 font-medium text-[#102A56]">{s.fullName}</td>
                    <td className="py-3 pr-4">
                      <div className="inline-flex gap-1 p-1 rounded-lg bg-[#F4F7FC] border border-slate-200">
                        {(['Present', 'Absent', 'Late'] as AttendanceStatus[]).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setStatuses((p) => ({ ...p, [s.id]: st }))}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                              statuses[s.id] === st
                                ? st === 'Present'
                                  ? 'bg-emerald-600 text-white'
                                  : st === 'Absent'
                                  ? 'bg-red-600 text-white'
                                  : 'bg-amber-500 text-white'
                                : 'text-slate-600 hover:text-[#102A56]'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="py-3">
                      <input
                        type="text"
                        value={remarks[s.id] || ''}
                        onChange={(e) => setRemarks((p) => ({ ...p, [s.id]: e.target.value }))}
                        placeholder="Optional note"
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              disabled={saving}
              onClick={submitAttendance}
              className="px-6 py-2.5 rounded-lg bg-[#102A56] hover:bg-[#2457B2] text-white text-xs font-semibold"
            >
              {saving ? 'Saving...' : 'Submit Attendance'}
            </button>
            {msg && (
              <span className="text-xs font-medium text-emerald-700 inline-flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> {msg}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function FacultyTestsView({
  exams,
  attempts,
  assignedClasses,
  assignedSubjects,
  facultyUid,
  facultyName,
  onReload,
}: {
  exams: Examination[];
  attempts: ExamAttempt[];
  assignedClasses: string[];
  assignedSubjects: string[];
  facultyUid: string;
  facultyName: string;
  onReload: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    title: '',
    classLevel: assignedClasses[0] || 'Class 10',
    board: 'GSEB',
    subject: assignedSubjects[0] || 'Mathematics',
    durationMinutes: 45,
    maxMarks: 25,
    scheduledDate: new Date().toISOString().slice(0, 10),
  });
  const [selectedExam, setSelectedExam] = useState<Examination | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [qForm, setQForm] = useState({
    questionText: '',
    questionType: 'MCQ' as 'MCQ' | 'Subjective',
    opt0: '',
    opt1: '',
    opt2: '',
    opt3: '',
    correctOptionIndex: 0,
    marks: 5,
  });

  const createExam = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'examinations'), {
      ...form,
      durationMinutes: Number(form.durationMinutes),
      maxMarks: Number(form.maxMarks),
      status: 'Draft',
      resultsPublished: false,
      showRank: false,
      createdByUid: facultyUid,
      createdByName: facultyName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setForm((p) => ({ ...p, title: '' }));
    await onReload();
  };

  const openQuestions = async (ex: Examination) => {
    setSelectedExam(ex);
    const snap = await getDocs(query(collection(db, 'examinations', ex.id, 'questions'), orderBy('orderIndex', 'asc')));
    setQuestions(snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as ExamQuestion[]);
  };

  const addQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam) return;
    await addDoc(collection(db, 'examinations', selectedExam.id, 'questions'), {
      questionText: qForm.questionText.trim(),
      questionType: qForm.questionType,
      ...(qForm.questionType === 'MCQ'
        ? {
            options: [qForm.opt0, qForm.opt1, qForm.opt2, qForm.opt3].map((x) => x.trim()),
            correctOptionIndex: Number(qForm.correctOptionIndex),
          }
        : {}),
      marks: Number(qForm.marks),
      orderIndex: questions.length,
    });
    setQForm({ ...qForm, questionText: '', opt0: '', opt1: '', opt2: '', opt3: '' });
    await openQuestions(selectedExam);
  };

  const toggleExamStatus = async (ex: Examination, status: 'Draft' | 'Published' | 'Completed') => {
    await updateDoc(doc(db, 'examinations', ex.id), { status, updatedAt: serverTimestamp() });
    await logAudit('faculty', 'UPDATE_EXAM_STATUS', 'examinations', `${ex.title} -> ${status}`, ex.id);
    await onReload();
  };

  const toggleResults = async (ex: Examination) => {
    await updateDoc(doc(db, 'examinations', ex.id), {
      resultsPublished: !ex.resultsPublished,
      updatedAt: serverTimestamp(),
    });
    await onReload();
  };

  const evaluateAttempt = async (att: ExamAttempt, newMarks: number, remarks: string) => {
    const pct = att.maxMarks > 0 ? Math.min(100, Math.round((newMarks / att.maxMarks) * 100)) : 0;
    await updateDoc(doc(db, 'exam_attempts', att.id), {
      obtainedMarks: Number(newMarks),
      percentage: pct,
      status: 'Evaluated',
      facultyRemarks: remarks,
      updatedAt: serverTimestamp(),
    });
    await onReload();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={createExam} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h1 className="font-display text-xl font-bold text-[#102A56]">Create Online Test / Examination</h1>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Test Title (e.g., Unit Test 1 - Trigonometry)"
            className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
          <select
            value={form.classLevel}
            onChange={(e) => setForm({ ...form, classLevel: e.target.value })}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
          >
            {assignedClasses.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
          >
            {assignedSubjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={form.board}
            onChange={(e) => setForm({ ...form, board: e.target.value })}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
          >
            <option value="CBSE">CBSE</option>
            <option value="GSEB">GSEB</option>
          </select>
          <input
            type="date"
            value={form.scheduledDate}
            onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
          <input
            type="number"
            min={5}
            value={form.durationMinutes}
            onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
            placeholder="Duration (mins)"
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
          <input
            type="number"
            min={1}
            value={form.maxMarks}
            onChange={(e) => setForm({ ...form, maxMarks: Number(e.target.value) })}
            placeholder="Max Marks"
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-[#102A56] text-white text-xs font-semibold hover:bg-[#2457B2] inline-flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Create Test
          </button>
        </div>
      </form>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold text-[#102A56]">Manage Examinations</h2>
        {exams.length === 0 ? (
          <p className="text-sm text-slate-500">No examinations created yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {exams.map((ex) => (
              <div key={ex.id} className="py-3.5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-[#2457B2] font-medium">
                    {ex.classLevel} · {ex.subject} · {ex.status} · Results: {ex.resultsPublished ? 'Published' : 'Hidden'}
                  </p>
                  <p className="font-semibold text-[#102A56] text-sm">{ex.title}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openQuestions(ex)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-[#102A56]"
                  >
                    Questions
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleExamStatus(ex, ex.status === 'Published' ? 'Draft' : 'Published')}
                    className="px-3 py-1.5 rounded-lg bg-[#102A56] text-white text-xs font-semibold"
                  >
                    {ex.status === 'Published' ? 'Unpublish' : 'Publish Test'}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleResults(ex)}
                    className="px-3 py-1.5 rounded-lg bg-[#FF8A24] text-white text-xs font-semibold"
                  >
                    {ex.resultsPublished ? 'Hide Results' : 'Publish Results'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedExam && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[#102A56]">
              Questions for {selectedExam.title} ({questions.length})
            </h2>
            <button type="button" onClick={() => setSelectedExam(null)} className="text-xs text-slate-500">Close</button>
          </div>
          <form onSubmit={addQuestion} className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-[#F4F7FC] border border-slate-200">
            <textarea
              rows={2}
              required
              value={qForm.questionText}
              onChange={(e) => setQForm({ ...qForm, questionText: e.target.value })}
              placeholder="Enter question statement..."
              className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
            />
            <select
              value={qForm.questionType}
              onChange={(e) => setQForm({ ...qForm, questionType: e.target.value as 'MCQ' | 'Subjective' })}
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
            >
              <option value="MCQ">MCQ (Auto-Evaluated)</option>
              <option value="Subjective">Subjective</option>
            </select>
            <input
              type="number"
              min={1}
              value={qForm.marks}
              onChange={(e) => setQForm({ ...qForm, marks: Number(e.target.value) })}
              placeholder="Marks"
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
            />
            {qForm.questionType === 'MCQ' && (
              <>
                <input required placeholder="Option A" value={qForm.opt0} onChange={(e) => setQForm({ ...qForm, opt0: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white" />
                <input required placeholder="Option B" value={qForm.opt1} onChange={(e) => setQForm({ ...qForm, opt1: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white" />
                <input required placeholder="Option C" value={qForm.opt2} onChange={(e) => setQForm({ ...qForm, opt2: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white" />
                <input required placeholder="Option D" value={qForm.opt3} onChange={(e) => setQForm({ ...qForm, opt3: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white" />
                <select
                  value={qForm.correctOptionIndex}
                  onChange={(e) => setQForm({ ...qForm, correctOptionIndex: Number(e.target.value) })}
                  className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                >
                  <option value={0}>Correct Answer: Option A</option>
                  <option value={1}>Correct Answer: Option B</option>
                  <option value={2}>Correct Answer: Option C</option>
                  <option value={3}>Correct Answer: Option D</option>
                </select>
              </>
            )}
            <button type="submit" className="sm:col-span-2 py-2.5 rounded-lg bg-[#102A56] text-white text-xs font-semibold">
              Add Question to Exam
            </button>
          </form>

          <div className="space-y-2">
            {questions.map((q, idx) => (
              <div key={q.id} className="p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-4 text-sm">
                <span>
                  <span className="font-semibold">Q{idx + 1}.</span> {q.questionText} ({q.questionType}, {q.marks}m)
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    await deleteDoc(doc(db, 'examinations', selectedExam.id, 'questions', q.id));
                    await openQuestions(selectedExam);
                  }}
                  className="text-red-600 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subjective Evaluation & Remarks */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold text-[#102A56]">Student Submissions &amp; Evaluation</h2>
        {attempts.length === 0 ? (
          <p className="text-sm text-slate-500">No student test submissions yet.</p>
        ) : (
          <div className="space-y-3">
            {attempts.map((att) => (
              <AttemptEvaluatorRow key={att.id} attempt={att} onEvaluate={evaluateAttempt} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AttemptEvaluatorRow({
  attempt,
  onEvaluate,
}: {
  attempt: ExamAttempt;
  onEvaluate: (att: ExamAttempt, marks: number, remarks: string) => Promise<void>;
}) {
  const [marks, setMarks] = useState(attempt.obtainedMarks);
  const [remarks, setRemarks] = useState(attempt.facultyRemarks || '');
  const [saving, setSaving] = useState(false);

  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-[#F4F7FC] flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-xs text-[#2457B2] font-medium">
          {attempt.examTitle} · {attempt.classLevel} · {attempt.status}
        </p>
        <p className="font-semibold text-sm text-[#102A56]">{attempt.studentName}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="number"
          min={0}
          max={attempt.maxMarks}
          value={marks}
          onChange={(e) => setMarks(Number(e.target.value))}
          className="w-20 px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white font-mono"
        />
        <span className="text-xs text-slate-500">/ {attempt.maxMarks}</span>
        <input
          type="text"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Faculty remarks"
          className="px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white"
        />
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            await onEvaluate(attempt, marks, remarks);
            setSaving(false);
          }}
          className="px-3 py-1.5 rounded-lg bg-[#102A56] text-white text-xs font-semibold"
        >
          {saving ? 'Saving...' : 'Save Evaluation'}
        </button>
      </div>
    </div>
  );
}

function FacultyMaterialsView({
  materials,
  assignedClasses,
  assignedSubjects,
  facultyUid,
  facultyName,
  onReload,
}: {
  materials: StudyMaterial[];
  assignedClasses: string[];
  assignedSubjects: string[];
  facultyUid: string;
  facultyName: string;
  onReload: () => Promise<void>;
}) {
  const { firebaseUser } = useAuth();
  const [form, setForm] = useState({
    title: '',
    description: '',
    classLevel: assignedClasses[0] || 'Class 10',
    board: 'GSEB',
    subject: assignedSubjects[0] || 'Mathematics',
    category: 'PDF Notes' as StudyMaterial['category'],
    fileUrl: '',
    fileName: '',
  });
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !firebaseUser) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const token = await firebaseUser.getIdToken();
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ fileName: file.name, mimeType: file.type, base64Data: reader.result }),
        });
        const data = await res.json();
        if (res.ok) {
          setForm((p) => ({ ...p, fileUrl: data.url, fileName: data.fileName }));
        }
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const submitMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fileUrl) return;
    await addDoc(collection(db, 'study_materials'), {
      ...form,
      fileName: form.fileName || 'study_material.pdf',
      uploadedByUid: facultyUid,
      uploadedByName: facultyName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setForm((p) => ({ ...p, title: '', description: '', fileUrl: '', fileName: '' }));
    await onReload();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submitMaterial} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h1 className="font-display text-xl font-bold text-[#102A56]">Upload Study Materials</h1>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Material Title"
            className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as StudyMaterial['category'] })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
            <option>PDF Notes</option>
            <option>Chapter Notes</option>
            <option>Worksheet</option>
            <option>Previous Year Paper</option>
            <option>Practice Questions</option>
            <option>Important Questions</option>
          </select>
          <select value={form.classLevel} onChange={(e) => setForm({ ...form, classLevel: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
            {assignedClasses.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
            {assignedSubjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={form.board} onChange={(e) => setForm({ ...form, board: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
            <option value="CBSE">CBSE</option>
            <option value="GSEB">GSEB</option>
            <option value="CBSE & GSEB">CBSE &amp; GSEB</option>
          </select>
          <div className="sm:col-span-2">
            <input
              type="text"
              required
              value={form.fileUrl}
              onChange={(e) => setForm({ ...form, fileUrl: e.target.value, fileName: 'resource.pdf' })}
              placeholder="Upload file below or paste document URL..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <input type="file" accept="application/pdf,image/jpeg,image/png" onChange={handleUpload} className="text-xs" />
            {uploading && <span className="text-xs text-[#2457B2]">Uploading...</span>}
          </div>
        </div>
        <button type="submit" className="px-5 py-2.5 rounded-lg bg-[#102A56] text-white text-xs font-semibold">
          Publish Material
        </button>
      </form>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
        <h2 className="font-display text-lg font-semibold text-[#102A56]">Uploaded Materials</h2>
        {materials.length === 0 ? (
          <p className="text-sm text-slate-500">No materials uploaded yet.</p>
        ) : (
          materials.map((m) => (
            <div key={m.id} className="p-3.5 rounded-lg border border-slate-200 flex items-center justify-between gap-4 text-sm">
              <div>
                <p className="text-xs text-[#2457B2]">{m.classLevel} · {m.subject} · {m.category}</p>
                <p className="font-semibold text-[#102A56]">{m.title}</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await deleteDoc(doc(db, 'study_materials', m.id));
                  await onReload();
                }}
                className="text-red-600 p-1.5"
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

function FacultyDoubtsView({
  doubts,
  facultyUid,
  facultyName,
  onReload,
}: {
  doubts: DoubtRequest[];
  facultyUid: string;
  facultyName: string;
  onReload: () => Promise<void>;
}) {
  const [selected, setSelected] = useState<DoubtRequest | null>(null);
  const [responses, setResponses] = useState<DoubtResponse[]>([]);
  const [reply, setReply] = useState('');

  const openThread = async (d: DoubtRequest) => {
    setSelected(d);
    const snap = await getDocs(query(collection(db, 'doubt_requests', d.id, 'responses'), orderBy('createdAt', 'asc')));
    setResponses(snap.docs.map((r) => ({ id: r.id, ...(r.data() as object) })) as DoubtResponse[]);
  };

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !reply.trim()) return;
    await addDoc(collection(db, 'doubt_requests', selected.id, 'responses'), {
      responderUid: facultyUid,
      responderName: facultyName,
      responderRole: 'faculty',
      message: reply.trim(),
      createdAt: serverTimestamp(),
    });
    setReply('');
    await openThread(selected);
  };

  const markResolved = async (d: DoubtRequest) => {
    await updateDoc(doc(db, 'doubt_requests', d.id), { status: 'Resolved', updatedAt: serverTimestamp() });
    await onReload();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-3">
        <h1 className="font-display text-xl font-bold text-[#102A56]">Student Doubt Queue</h1>
        {doubts.length === 0 ? (
          <p className="text-sm text-slate-500">No student doubts assigned.</p>
        ) : (
          doubts.map((d) => (
            <div key={d.id} className="p-4 rounded-xl border border-slate-200 bg-[#F4F7FC] space-y-2">
              <div className="flex items-center justify-between text-xs text-[#2457B2] font-medium">
                <span>{d.studentName} · {d.classLevel} · {d.subject}</span>
                <span>{d.status}</span>
              </div>
              <p className="text-sm text-[#102A56]">{d.question}</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => openThread(d)} className="px-3 py-1.5 rounded-lg bg-[#102A56] text-white text-xs font-semibold">
                  Respond
                </button>
                {d.status !== 'Resolved' && (
                  <button type="button" onClick={() => markResolved(d)} className="px-3 py-1.5 rounded-lg border border-emerald-600 text-emerald-700 text-xs font-semibold">
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6">
        {!selected ? (
          <p className="text-sm text-slate-500">Select a doubt from the queue to view details and reply.</p>
        ) : (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-bold text-[#102A56]">{selected.chapter}</h2>
            <p className="text-sm text-slate-700">{selected.question}</p>
            {selected.attachmentUrl && (
              <img src={selected.attachmentUrl} alt="Attachment" className="max-h-56 rounded-lg border border-slate-200" />
            )}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {responses.map((r) => (
                <div key={r.id} className="p-3 rounded-lg bg-[#F4F7FC] text-xs">
                  <p className="font-semibold text-[#102A56]">{r.responderName}</p>
                  <p className="mt-1 text-slate-700">{r.message}</p>
                </div>
              ))}
            </div>
            {selected.status !== 'Resolved' && (
              <form onSubmit={sendReply} className="flex gap-2">
                <input
                  type="text"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Write clear explanation..."
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
                <button type="submit" className="px-4 py-2 rounded-lg bg-[#102A56] text-white text-xs font-semibold inline-flex items-center gap-1">
                  <Send className="w-3.5 h-3.5" /> Send
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FacultyTimetableLeaveView({
  timetable,
  leaves,
  announcements,
  assignedClasses,
  facultyUid,
  facultyName,
  onReload,
}: {
  timetable: TimetableSlot[];
  leaves: LeaveApplication[];
  announcements: FacultyAnnouncement[];
  assignedClasses: string[];
  facultyUid: string;
  facultyName: string;
  onReload: () => Promise<void>;
}) {
  const [annTitle, setAnnTitle] = useState('');
  const [annClass, setAnnClass] = useState(assignedClasses[0] || 'Class 10');
  const [annContent, setAnnContent] = useState('');

  const submitAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'announcements'), {
      title: annTitle.trim(),
      classLevel: annClass,
      content: annContent.trim(),
      submittedByUid: facultyUid,
      submittedByName: facultyName,
      status: 'Pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setAnnTitle('');
    setAnnContent('');
    await onReload();
  };

  const reviewLeave = async (l: LeaveApplication, status: 'Approved' | 'Rejected') => {
    await updateDoc(doc(db, 'leave_applications', l.id), {
      status,
      reviewedBy: facultyName,
      updatedAt: serverTimestamp(),
    });
    await onReload();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h1 className="font-display text-xl font-bold text-[#102A56] mb-4">My Teaching Timetable</h1>
        {timetable.length === 0 ? (
          <p className="text-sm text-slate-500">No timetable slots assigned yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="py-2 pr-4">Day</th>
                  <th className="py-2 pr-4">Time</th>
                  <th className="py-2 pr-4">Class</th>
                  <th className="py-2 pr-4">Subject</th>
                  <th className="py-2">Classroom</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {timetable.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2.5 pr-4 font-semibold text-[#102A56]">{t.dayOfWeek}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs tabular-nums">{t.startTime} – {t.endTime}</td>
                    <td className="py-2.5 pr-4">{t.classLevel}</td>
                    <td className="py-2.5 pr-4">{t.subject}</td>
                    <td className="py-2.5">{t.classroom}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-[#102A56]">Student Leave Applications</h2>
          {leaves.length === 0 ? (
            <p className="text-sm text-slate-500">No leave requests from assigned classes.</p>
          ) : (
            leaves.map((l) => (
              <div key={l.id} className="p-3.5 rounded-lg border border-slate-200 bg-[#F4F7FC] flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-[#2457B2]">{l.classLevel} · {l.leaveDate} · {l.status}</p>
                  <p className="text-sm font-semibold text-[#102A56]">{l.studentName}: {l.reason}</p>
                </div>
                {l.status === 'Pending' && (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => reviewLeave(l, 'Approved')} className="px-2.5 py-1 rounded bg-emerald-600 text-white text-xs font-semibold">Approve</button>
                    <button type="button" onClick={() => reviewLeave(l, 'Rejected')} className="px-2.5 py-1 rounded bg-red-600 text-white text-xs font-semibold">Reject</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-[#102A56]">Submit Announcement for Admin Approval</h2>
          <form onSubmit={submitAnnouncement} className="space-y-3">
            <input
              type="text"
              required
              value={annTitle}
              onChange={(e) => setAnnTitle(e.target.value)}
              placeholder="Announcement title"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
            <select value={annClass} onChange={(e) => setAnnClass(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
              {assignedClasses.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <textarea
              rows={3}
              required
              value={annContent}
              onChange={(e) => setAnnContent(e.target.value)}
              placeholder="Details..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#102A56] text-white text-xs font-semibold">
              Submit for Approval
            </button>
          </form>
          {announcements.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
              {announcements.map((a) => (
                <div key={a.id} className="flex justify-between">
                  <span className="font-medium text-[#102A56]">{a.title}</span>
                  <span className="font-semibold text-[#2457B2]">{a.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
