import React, { useEffect, useState } from 'react';
import { Trash2, Download, Printer, Plus, CheckCircle2 } from 'lucide-react';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  formatFirestoreDate,
  logAudit,
  exportToCsv,
  printHtmlReport,
} from '../lib/firestoreDb';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import type {
  AdmissionEnquiry,
  AttendanceRecord,
  AuditLog,
  ExamAttempt,
  Examination,
  FacultyAnnouncement,
  FacultyMember,
  FeeAccount,
  GalleryItem,
  Notice,
  Payment,
  PublicSettings,
  Student,
  Testimonial,
  TimetableSlot,
} from '../types/domain';

export function AdminExamsView({
  exams,
  attempts,
  adminUid,
  role,
  onReload,
  focusResults = false,
}: {
  exams: Examination[];
  attempts: ExamAttempt[];
  adminUid: string;
  role: string;
  onReload: () => Promise<void>;
  focusResults?: boolean;
}) {
  const [form, setForm] = useState({
    title: '',
    classLevel: 'Class 10',
    board: 'GSEB',
    subject: 'Mathematics',
    durationMinutes: 60,
    maxMarks: 50,
    scheduledDate: new Date().toISOString().slice(0, 10),
  });

  const createExam = async (e: React.FormEvent) => {
    e.preventDefault();
    const ref = await addDoc(collection(db, 'examinations'), {
      ...form,
      durationMinutes: Number(form.durationMinutes),
      maxMarks: Number(form.maxMarks),
      status: 'Published',
      resultsPublished: false,
      showRank: false,
      createdByUid: adminUid,
      createdByName: 'Administration',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await logAudit(role, 'CREATE_EXAM', 'examinations', form.title, ref.id);
    setForm((p) => ({ ...p, title: '' }));
    await onReload();
  };

  return (
    <div className="space-y-6">
      {!focusResults && (
        <form onSubmit={createExam} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h1 className="font-display text-xl font-bold text-[#102A56]">Examination Management</h1>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Exam Title *" className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            <select value={form.classLevel} onChange={(e) => setForm({ ...form, classLevel: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
              <option>Class 7</option><option>Class 8</option><option>Class 9</option><option>Class 10</option><option>Class 11 Science</option><option>Class 12 Science</option>
            </select>
            <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject" className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            <input type="date" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            <input type="number" value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: Number(e.target.value) })} placeholder="Max Marks" className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          </div>
          <button type="submit" className="px-5 py-2 rounded-lg bg-[#102A56] text-white text-xs font-semibold inline-flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Create Examination
          </button>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-[#102A56]">
            {focusResults ? 'Results & Publication Control' : `All Examinations (${exams.length})`}
          </h2>
          <button
            type="button"
            onClick={() => exportToCsv('exam_results.csv', attempts as unknown as Record<string, unknown>[])}
            className="text-xs font-semibold text-[#2457B2]"
          >
            Export Results CSV
          </button>
        </div>
        {exams.length === 0 ? (
          <p className="text-sm text-slate-500">No examinations created yet.</p>
        ) : (
          exams.map((ex) => (
            <div key={ex.id} className="p-4 rounded-xl border border-slate-200 bg-[#F4F7FC] flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs text-[#2457B2]">{ex.classLevel} · {ex.subject} · {ex.status}</p>
                <p className="font-semibold text-[#102A56]">{ex.title}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await updateDoc(doc(db, 'examinations', ex.id), {
                      resultsPublished: !ex.resultsPublished,
                      updatedAt: serverTimestamp(),
                    });
                    await logAudit(role, 'TOGGLE_RESULTS', 'examinations', `${ex.title}: ${!ex.resultsPublished}`, ex.id);
                    await onReload();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#102A56] text-white text-xs font-semibold"
                >
                  {ex.resultsPublished ? 'Unpublish Results' : 'Publish Results'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await deleteDoc(doc(db, 'examinations', ex.id));
                    await onReload();
                  }}
                  className="text-red-600 p-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function AdminNoticesView({
  notices,
  announcements,
  role,
  onReload,
}: {
  notices: Notice[];
  announcements: FacultyAnnouncement[];
  role: string;
  onReload: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    title: '',
    category: 'Admission' as Notice['category'],
    targetClass: 'All Classes',
    audience: 'All' as Notice['audience'],
    content: '',
  });

  const createNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    const ref = await addDoc(collection(db, 'public_notices'), {
      ...form,
      isPinned: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await logAudit(role, 'PUBLISH_NOTICE', 'public_notices', form.title, ref.id);
    setForm((p) => ({ ...p, title: '', content: '' }));
    await onReload();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={createNotice} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h1 className="font-display text-xl font-bold text-[#102A56]">Publish Notice / Announcement</h1>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Notice Title *" className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Notice['category'] })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
            <option>Admission</option><option>Examination</option><option>Holiday</option><option>Test Schedule</option><option>Fee Reminder</option><option>General</option>
          </select>
          <select value={form.targetClass} onChange={(e) => setForm({ ...form, targetClass: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
            <option>All Classes</option><option>Class 7</option><option>Class 8</option><option>Class 9</option><option>Class 10</option><option>Class 11 Science</option><option>Class 12 Science</option>
          </select>
          <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value as Notice['audience'] })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
            <option value="All">All (Public &amp; Portals)</option>
            <option value="Public">Public Website</option>
            <option value="Students">Students Only</option>
            <option value="Faculty">Faculty Only</option>
          </select>
          <textarea rows={3} required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Notice content..." className="sm:col-span-3 px-3 py-2 rounded-lg border border-slate-300 text-sm" />
        </div>
        <button type="submit" className="px-5 py-2 rounded-lg bg-[#102A56] text-white text-xs font-semibold">Publish Notice</button>
      </form>

      {announcements.filter((a) => a.status === 'Pending').length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <h2 className="font-display text-lg font-semibold text-[#102A56]">Faculty Announcement Approvals</h2>
          {announcements
            .filter((a) => a.status === 'Pending')
            .map((a) => (
              <div key={a.id} className="p-4 rounded-xl border border-slate-200 bg-[#F4F7FC] flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-[#2457B2]">Submitted by {a.submittedByName} · {a.classLevel}</p>
                  <p className="font-semibold text-[#102A56]">{a.title}</p>
                  <p className="text-xs text-slate-600">{a.content}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await updateDoc(doc(db, 'announcements', a.id), { status: 'Approved', updatedAt: serverTimestamp() });
                      await addDoc(collection(db, 'public_notices'), {
                        title: a.title,
                        category: 'General',
                        content: a.content,
                        targetClass: a.classLevel,
                        audience: 'Students',
                        isPinned: false,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                      });
                      await onReload();
                    }}
                    className="px-3 py-1.5 rounded bg-emerald-600 text-white text-xs font-semibold"
                  >
                    Approve &amp; Publish
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await updateDoc(doc(db, 'announcements', a.id), { status: 'Rejected', updatedAt: serverTimestamp() });
                      await onReload();
                    }}
                    className="px-3 py-1.5 rounded bg-red-600 text-white text-xs font-semibold"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
        <h2 className="font-display text-lg font-semibold text-[#102A56]">Published Notices ({notices.length})</h2>
        {notices.map((n) => (
          <div key={n.id} className="p-3.5 rounded-lg border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-[#2457B2]">{n.category} · {n.targetClass} · {n.audience}</p>
              <p className="font-semibold text-sm text-[#102A56]">{n.title}</p>
            </div>
            <button
              type="button"
              onClick={async () => {
                await deleteDoc(doc(db, 'public_notices', n.id));
                await onReload();
              }}
              className="text-red-600 p-1.5"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminGalleryView({
  gallery,
  role,
  onReload,
}: {
  gallery: GalleryItem[];
  role: string;
  onReload: () => Promise<void>;
}) {
  const { firebaseUser } = useAuth();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<GalleryItem['category']>('Classrooms');
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
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
        if (res.ok) setImageUrl(data.url);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const submitPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return;
    const ref = await addDoc(collection(db, 'public_gallery'), {
      title: title.trim(),
      category,
      imageUrl: imageUrl.trim(),
      caption: caption.trim(),
      createdAt: serverTimestamp(),
    });
    await logAudit(role, 'UPLOAD_GALLERY', 'public_gallery', title, ref.id);
    setTitle('');
    setImageUrl('');
    setCaption('');
    await onReload();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submitPhoto} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h1 className="font-display text-xl font-bold text-[#102A56]">Manage Photo Gallery</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Photo Title *" className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <select value={category} onChange={(e) => setCategory(e.target.value as GalleryItem['category'])} className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
            <option>Classrooms</option><option>Faculty</option><option>Students</option><option>Events</option><option>Celebrations</option><option>Infrastructure</option>
          </select>
          <input required value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL or upload file below *" className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <div>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} className="text-xs" />
            {uploading && <span className="text-xs text-[#2457B2]">Uploading...</span>}
          </div>
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption (optional)" className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-300 text-sm" />
        </div>
        <button type="submit" className="px-5 py-2 rounded-lg bg-[#102A56] text-white text-xs font-semibold">Add to Gallery</button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {gallery.map((g) => (
          <div key={g.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <img src={g.imageUrl} alt={g.title} className="aspect-[4/3] w-full object-cover" />
            <div className="p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-[#2457B2]">{g.category}</p>
                <p className="text-sm font-semibold text-[#102A56]">{g.title}</p>
              </div>
              <button type="button" onClick={async () => { await deleteDoc(doc(db, 'public_gallery', g.id)); await onReload(); }} className="text-red-600 p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminTestimonialsView({
  testimonials,
  role,
  onReload,
}: {
  testimonials: Testimonial[];
  role: string;
  onReload: () => Promise<void>;
}) {
  const [form, setForm] = useState({ authorName: '', authorRole: 'Parent', classInfo: 'Class 12 Science', rating: 5, content: '' });

  const addTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    const ref = await addDoc(collection(db, 'public_testimonials'), {
      ...form,
      rating: Number(form.rating),
      isApproved: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await logAudit(role, 'ADD_TESTIMONIAL', 'public_testimonials', form.authorName, ref.id);
    setForm({ authorName: '', authorRole: 'Parent', classInfo: 'Class 12 Science', rating: 5, content: '' });
    await onReload();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={addTestimonial} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h1 className="font-display text-xl font-bold text-[#102A56]">Verified Testimonials Management</h1>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <input required value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} placeholder="Reviewer Name *" className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <input required value={form.authorRole} onChange={(e) => setForm({ ...form, authorRole: e.target.value })} placeholder="Role (Parent / Alumni)" className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <input value={form.classInfo} onChange={(e) => setForm({ ...form, classInfo: e.target.value })} placeholder="Batch / Class" className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <select value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
            <option value={5}>5 Stars</option><option value={4}>4 Stars</option>
          </select>
          <textarea rows={3} required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Verified review text..." className="sm:col-span-4 px-3 py-2 rounded-lg border border-slate-300 text-sm" />
        </div>
        <button type="submit" className="px-5 py-2 rounded-lg bg-[#102A56] text-white text-xs font-semibold">Add &amp; Approve Review</button>
      </form>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
        {testimonials.length === 0 ? (
          <p className="text-sm text-slate-500">No verified testimonials added yet.</p>
        ) : (
          testimonials.map((t) => (
            <div key={t.id} className="p-4 rounded-xl border border-slate-200 bg-[#F4F7FC] flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-[#2457B2]">{t.authorRole} · {t.classInfo} · {t.rating}/5</p>
                <p className="font-semibold text-sm text-[#102A56]">{t.authorName}</p>
                <p className="text-xs text-slate-600 mt-1">{t.content}</p>
              </div>
              <button type="button" onClick={async () => { await deleteDoc(doc(db, 'public_testimonials', t.id)); await onReload(); }} className="text-red-600 p-1.5">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function AdminTimetableView({
  timetable,
  faculty,
  role,
  onReload,
}: {
  timetable: TimetableSlot[];
  faculty: FacultyMember[];
  role: string;
  onReload: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    classLevel: 'Class 10',
    board: 'GSEB',
    subject: 'Mathematics',
    facultyId: faculty[0]?.id || '',
    dayOfWeek: 'Monday' as TimetableSlot['dayOfWeek'],
    startTime: '16:00',
    endTime: '17:00',
    classroom: 'Room 101',
  });
  const [conflictErr, setConflictErr] = useState<string | null>(null);

  const addSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictErr(null);
    const selectedFaculty = faculty.find((f) => f.id === form.facultyId);

    // Conflict detection: prevent double-booking faculty or classroom in overlapping time
    const conflict = timetable.find(
      (slot) =>
        slot.dayOfWeek === form.dayOfWeek &&
        !(form.endTime <= slot.startTime || form.startTime >= slot.endTime) &&
        (slot.classroom.toLowerCase() === form.classroom.trim().toLowerCase() ||
          (form.facultyId && slot.facultyId === form.facultyId) ||
          slot.classLevel === form.classLevel)
    );

    if (conflict) {
      setConflictErr(
        `Schedule conflict detected on ${conflict.dayOfWeek} (${conflict.startTime}–${conflict.endTime}) with ${conflict.classLevel} / ${conflict.classroom} / ${conflict.facultyName}.`
      );
      return;
    }

    const ref = await addDoc(collection(db, 'timetables'), {
      ...form,
      facultyId: form.facultyId || 'unassigned',
      facultyName: selectedFaculty?.fullName || 'Institute Faculty',
      facultyEmail: selectedFaculty?.email || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await logAudit(role, 'CREATE_TIMETABLE_SLOT', 'timetables', `${form.classLevel} ${form.dayOfWeek} ${form.startTime}`, ref.id);
    await onReload();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={addSlot} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h1 className="font-display text-xl font-bold text-[#102A56]">Timetable Management (Conflict Protected)</h1>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <select value={form.classLevel} onChange={(e) => setForm({ ...form, classLevel: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
            <option>Class 7</option><option>Class 8</option><option>Class 9</option><option>Class 10</option><option>Class 11 Science</option><option>Class 12 Science</option>
          </select>
          <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject" className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <select value={form.facultyId} onChange={(e) => setForm({ ...form, facultyId: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
            <option value="">Select Faculty</option>
            {faculty.map((f) => <option key={f.id} value={f.id}>{f.fullName}</option>)}
          </select>
          <select value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value as TimetableSlot['dayOfWeek'] })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => <option key={d}>{d}</option>)}
          </select>
          <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <input required value={form.classroom} onChange={(e) => setForm({ ...form, classroom: e.target.value })} placeholder="Classroom" className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <button type="submit" className="px-4 py-2 rounded-lg bg-[#102A56] text-white text-xs font-semibold">Add Slot</button>
        </div>
        {conflictErr && <p className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">{conflictErr}</p>}
      </form>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-2">
        {timetable.map((t) => (
          <div key={t.id} className="p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
            <span>
              <strong>{t.dayOfWeek}</strong> · {t.startTime}–{t.endTime} · {t.classLevel} · {t.subject} · {t.facultyName} · {t.classroom}
            </span>
            <button type="button" onClick={async () => { await deleteDoc(doc(db, 'timetables', t.id)); await onReload(); }} className="text-red-600 p-1">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminReportsView({
  students,
  faculty,
  attendance,
  fees,
  payments,
  admissions,
  attempts,
}: {
  students: Student[];
  faculty: FacultyMember[];
  attendance: AttendanceRecord[];
  fees: FeeAccount[];
  payments: Payment[];
  admissions: AdmissionEnquiry[];
  attempts: ExamAttempt[];
}) {
  const reports = [
    { name: 'Student Directory Report', count: students.length, csv: () => exportToCsv('students_report.csv', students as unknown as Record<string, unknown>[]), printTitle: 'STUDENT DIRECTORY REPORT' },
    { name: 'Attendance Register Report', count: attendance.length, csv: () => exportToCsv('attendance_report.csv', attendance as unknown as Record<string, unknown>[]), printTitle: 'ATTENDANCE SUMMARY REPORT' },
    { name: 'Fee Ledger & Collection Report', count: payments.length, csv: () => exportToCsv('fee_payments_report.csv', payments as unknown as Record<string, unknown>[]), printTitle: 'FEE COLLECTION REPORT' },
    { name: 'Admission Enquiries Report', count: admissions.length, csv: () => exportToCsv('admissions_report.csv', admissions as unknown as Record<string, unknown>[]), printTitle: 'ADMISSION ENQUIRIES REPORT' },
    { name: 'Examination Results Report', count: attempts.length, csv: () => exportToCsv('exam_results_report.csv', attempts as unknown as Record<string, unknown>[]), printTitle: 'EXAMINATION RESULTS REPORT' },
    { name: 'Faculty Workload Report', count: faculty.length, csv: () => exportToCsv('faculty_report.csv', faculty as unknown as Record<string, unknown>[]), printTitle: 'FACULTY REPORT' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
      <h1 className="font-display text-xl font-bold text-[#102A56]">Institute Reports &amp; Exports (CSV &amp; PDF)</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((r) => (
          <div key={r.name} className="p-4 rounded-xl border border-slate-200 bg-[#F4F7FC] flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-sm text-[#102A56]">{r.name}</p>
              <p className="text-xs text-slate-500 tabular-nums">{r.count} database records</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={r.csv}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#102A56] text-white text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
              <button
                type="button"
                onClick={() =>
                  printHtmlReport(
                    r.printTitle,
                    `<p>Total Records: <strong>${r.count}</strong></p><p>Outstanding Fees Total: ₹${fees.reduce((s, f) => s + f.remainingFee, 0).toLocaleString('en-IN')}</p>`
                  )
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-[#102A56] text-xs font-semibold"
              >
                <Printer className="w-3.5 h-3.5" /> PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminSettingsView({
  settings,
  role,
  onReload,
}: {
  settings: PublicSettings;
  role: string;
  onReload: () => Promise<void>;
}) {
  const [form, setForm] = useState(settings);
  const [integrations, setIntegrations] = useState({
    razorpayConfigured: false,
    whatsappConfigured: false,
    cloudinaryConfigured: false,
    smtpConfigured: false,
  });
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => {
        if (d.integrations) setIntegrations(d.integrations);
      })
      .catch(() => {});
  }, []);

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const { id: _id, ...payload } = form;
    await setDoc(doc(db, 'public_settings', 'main'), {
      ...payload,
      googleReviewCount: Number(payload.googleReviewCount),
      updatedAt: serverTimestamp(),
    });
    await logAudit(role, 'UPDATE_WEBSITE_SETTINGS', 'public_settings', 'Updated public institute settings & CMS', 'main');
    setSavedMsg('Website CMS & institute settings saved.');
    await onReload();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={saveSettings} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h1 className="font-display text-xl font-bold text-[#102A56]">Website Content Management &amp; Institute Settings</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input value={form.instituteName} onChange={(e) => setForm({ ...form, instituteName: e.target.value })} placeholder="Institute Name" className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="Tagline" className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <input value={form.heroHeadline} onChange={(e) => setForm({ ...form, heroHeadline: e.target.value })} placeholder="Hero Headline" className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <input value={form.heroSubheadline} onChange={(e) => setForm({ ...form, heroSubheadline: e.target.value })} placeholder="Hero Subheadline" className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <input value={form.whatsappNumber} onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })} placeholder="WhatsApp Number" className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <input value={form.businessHours} onChange={(e) => setForm({ ...form, businessHours: e.target.value })} placeholder="Business Hours" className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <textarea rows={3} value={form.aboutSummary} onChange={(e) => setForm({ ...form, aboutSummary: e.target.value })} placeholder="About Institute" className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <input value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} placeholder="SEO Title" className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <input value={form.seoDescription} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} placeholder="SEO Description" className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
        </div>

        <div className="flex flex-wrap gap-6 pt-2 text-sm">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={form.razorpayEnabled} onChange={(e) => setForm({ ...form, razorpayEnabled: e.target.checked })} />
            <span>Enable Razorpay Online Fee Payments</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={form.whatsappEnabled} onChange={(e) => setForm({ ...form, whatsappEnabled: e.target.checked })} />
            <span>Enable Automated WhatsApp Cloud API Alerts</span>
          </label>
        </div>

        <div className="flex items-center gap-4">
          <button type="submit" className="px-5 py-2.5 rounded-lg bg-[#102A56] text-white text-xs font-semibold">Save Settings</button>
          {savedMsg && <span className="text-xs font-medium text-emerald-700 inline-flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> {savedMsg}</span>}
        </div>
      </form>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
        <h2 className="font-display text-lg font-semibold text-[#102A56]">Server Environment Integrations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-[#F4F7FC] border border-slate-200 flex justify-between">
            <span>Razorpay Keys (`RAZORPAY_KEY_ID` / `SECRET`)</span>
            <span className="font-semibold">{integrations.razorpayConfigured ? 'Configured' : 'Not Configured'}</span>
          </div>
          <div className="p-3 rounded-lg bg-[#F4F7FC] border border-slate-200 flex justify-between">
            <span>WhatsApp Cloud API (`WHATSAPP_ACCESS_TOKEN`)</span>
            <span className="font-semibold">{integrations.whatsappConfigured ? 'Configured' : 'Not Configured'}</span>
          </div>
          <div className="p-3 rounded-lg bg-[#F4F7FC] border border-slate-200 flex justify-between">
            <span>Cloudinary Storage (`CLOUDINARY_CLOUD_NAME`)</span>
            <span className="font-semibold">{integrations.cloudinaryConfigured ? 'Configured' : 'Local Validated Upload'}</span>
          </div>
          <div className="p-3 rounded-lg bg-[#F4F7FC] border border-slate-200 flex justify-between">
            <span>SMTP Email (`SMTP_HOST` / `USER` / `PASS`)</span>
            <span className="font-semibold">{integrations.smtpConfigured ? 'Configured' : 'Not Configured'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminAuditLogsView({ logs }: { logs: AuditLog[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-[#102A56]">Security &amp; Administrative Audit Logs</h1>
        <button
          type="button"
          onClick={() => exportToCsv('audit_logs.csv', logs as unknown as Record<string, unknown>[])}
          className="text-xs font-semibold text-[#2457B2]"
        >
          Export CSV
        </button>
      </div>
      {logs.length === 0 ? (
        <p className="text-sm text-slate-500">No audit events recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">User</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Action</th>
                <th className="py-2">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="py-2.5 pr-4 font-mono tabular-nums">{formatFirestoreDate(l.createdAt)}</td>
                  <td className="py-2.5 pr-4">{l.actorEmail}</td>
                  <td className="py-2.5 pr-4 capitalize">{l.actorRole}</td>
                  <td className="py-2.5 pr-4 font-mono font-semibold text-[#102A56]">{l.action}</td>
                  <td className="py-2.5 text-slate-600">{l.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
