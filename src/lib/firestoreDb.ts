import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from './firebase';
import type { PublicSettings, Course } from '../types/domain';

export const DEFAULT_PUBLIC_SETTINGS: PublicSettings = {
  id: 'main',
  instituteName: 'VINAYAK TUTORIAL',
  tagline: 'Building Strong Concepts. Creating Bright Futures.',
  aboutSummary:
    'VINAYAK TUITION CLASSES offers trusted tuition classes in Anand for Class 7 to 12 students following CBSE and GSEB English Medium curricula. With more than 20 years of teaching expertise, the institute provides concept-focused coaching for Class 11 and 12 Science, Mathematics, and strong examination preparation for Class 10 and 12 GSEB.',
  address:
    'RADHA SWAMI SUMIT, Gopi Cinema Road, Raghuvir Nagar, Vivekanand Wadi, Anand, Gujarat – 388001, India',
  phone: '+91 98252 57153',
  whatsappNumber: '919825257153',
  email: 'admissions@vinayaktutorial.in',
  businessHours: 'Mon – Sat: 7:00 AM – 8:30 PM | Sunday: Test & Doubt Sessions',
  instagramUrl: 'https://www.instagram.com/',
  facebookUrl: 'https://www.facebook.com/',
  googleRating: '5.0',
  googleReviewCount: 77,
  yearsExperience: '20+ Years',
  heroHeadline: 'Your Success Begins With The Right Guidance.',
  heroSubheadline:
    '20+ Years of Educational Excellence | Class 7–12 | CBSE & GSEB | Concept-Based Learning.',
  razorpayEnabled: false,
  whatsappEnabled: false,
  seoTitle: 'Vinayak Tutorial – Best Coaching Classes in Anand (CBSE & GSEB)',
  seoDescription:
    'Trusted tuition classes in Anand, Gujarat for Class 7–12 CBSE & GSEB English Medium Science and Mathematics with 20+ years of teaching expertise.',
};

export const INITIAL_INSTITUTE_COURSES: Omit<Course, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'course_class_7',
    name: 'Foundation Batch — Class 7',
    classLevel: 'Class 7',
    board: 'CBSE & GSEB',
    medium: 'English',
    subjects: ['Mathematics', 'Science', 'English'],
    description:
      'Strong conceptual foundation in middle-school Mathematics and Science with weekly practice worksheets and individual doubt resolution.',
    duration: 'Academic Year (10 Months)',
    feeAmount: 18000,
    facultyName: 'Assigned by Administration',
    imageUrl: '/src/assets/images/course_mathematics_desk_1794896108160.jpg',
    isActive: true,
  },
  {
    id: 'course_class_8',
    name: 'Foundation Batch — Class 8',
    classLevel: 'Class 8',
    board: 'CBSE & GSEB',
    medium: 'English',
    subjects: ['Mathematics', 'Science', 'English'],
    description:
      'Structured pre-secondary preparation focusing on algebraic reasoning, scientific inquiry, and analytical problem-solving.',
    duration: 'Academic Year (10 Months)',
    feeAmount: 20000,
    facultyName: 'Assigned by Administration',
    imageUrl: '/src/assets/images/course_mathematics_desk_1794896108160.jpg',
    isActive: true,
  },
  {
    id: 'course_class_9',
    name: 'Pre-Board Excellence — Class 9',
    classLevel: 'Class 9',
    board: 'CBSE & GSEB',
    medium: 'English',
    subjects: ['Mathematics', 'Science', 'Social Science'],
    description:
      'Rigorous NCERT and GSEB concept mastery preparing students seamlessly for Class 10 Board examinations with regular chapter tests.',
    duration: 'Academic Year (11 Months)',
    feeAmount: 24000,
    facultyName: 'Assigned by Administration',
    imageUrl: '/src/assets/images/course_science_lab_1794896107316.jpg',
    isActive: true,
  },
  {
    id: 'course_class_10',
    name: 'Board Rankers Batch — Class 10',
    classLevel: 'Class 10',
    board: 'CBSE & GSEB',
    medium: 'English',
    subjects: ['Mathematics', 'Science', 'English', 'Social Science'],
    description:
      'Intensive Class 10 Board examination coaching featuring complete syllabus coverage, previous-year question papers, and full-length mock series.',
    duration: 'Academic Year (11 Months)',
    feeAmount: 28000,
    facultyName: 'Assigned by Administration',
    imageUrl: '/src/assets/images/course_mathematics_desk_1794896108160.jpg',
    isActive: true,
  },
  {
    id: 'course_class_11_science',
    name: 'Senior Secondary Science — Class 11',
    classLevel: 'Class 11 Science',
    board: 'CBSE & GSEB',
    medium: 'English',
    subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
    description:
      'Deep concept-based coaching for Class 11 Science (Group A & Group B) building mastery across mechanics, organic chemistry, calculus, and biology.',
    duration: 'Academic Year (11 Months)',
    feeAmount: 42000,
    facultyName: 'Assigned by Administration',
    imageUrl: '/src/assets/images/course_science_lab_1794896107316.jpg',
    isActive: true,
  },
  {
    id: 'course_class_12_science',
    name: 'Board & Entrance Mastery — Class 12 Science',
    classLevel: 'Class 12 Science',
    board: 'CBSE & GSEB',
    medium: 'English',
    subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
    description:
      'Focused Class 12 Board preparation with weekly cumulative tests, previous-year paper analysis, practical revision, and dedicated doubt clinics.',
    duration: 'Academic Year (11 Months)',
    feeAmount: 46000,
    facultyName: 'Assigned by Administration',
    imageUrl: '/src/assets/images/course_science_lab_1794896107316.jpg',
    isActive: true,
  },
];

export function formatFirestoreDate(val: unknown): string {
  if (!val) return '—';
  if (val instanceof Timestamp) {
    return val.toDate().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
  if (typeof val === 'object' && val !== null && 'seconds' in val) {
    const sec = Number((val as { seconds: number }).seconds);
    return new Date(sec * 1000).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
  if (typeof val === 'string') return val;
  return '—';
}

export async function logAudit(
  actorRole: string,
  action: string,
  targetCollection: string,
  details: string,
  targetId?: string
) {
  if (!auth.currentUser) return;
  try {
    await addDoc(collection(db, 'audit_logs'), {
      actorUid: auth.currentUser.uid,
      actorEmail: auth.currentUser.email || 'unknown',
      actorRole,
      action: action.slice(0, 120),
      targetCollection: targetCollection.slice(0, 80),
      ...(targetId ? { targetId: targetId.slice(0, 128) } : {}),
      details: details.slice(0, 1000),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Audit log skipped:', err);
  }
}

export async function listCollection<T>(
  collectionName: string,
  constraints: any[] = []
): Promise<T[]> {
  try {
    const ref = collection(db, collectionName);
    const q = constraints.length ? query(ref, ...constraints) : ref;
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as T[];
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, collectionName);
  }
}

export async function getDocument<T>(
  collectionName: string,
  id: string
): Promise<T | null> {
  try {
    const snap = await getDoc(doc(db, collectionName, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as object) } as T;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `${collectionName}/${id}`);
  }
}

export async function createDocument(
  collectionName: string,
  data: Record<string, any>,
  customId?: string
): Promise<string> {
  try {
    const payload = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (customId) {
      await setDoc(doc(db, collectionName, customId), payload);
      return customId;
    }
    const ref = await addDoc(collection(db, collectionName), payload);
    return ref.id;
  } catch (err) {
    handleFirestoreError(
      err,
      OperationType.CREATE,
      customId ? `${collectionName}/${customId}` : collectionName
    );
  }
}

export async function setDocumentWithTimestamp(
  collectionName: string,
  id: string,
  data: Record<string, any>,
  includeCreatedAt = false
): Promise<void> {
  try {
    await setDoc(doc(db, collectionName, id), {
      ...data,
      ...(includeCreatedAt ? { createdAt: serverTimestamp() } : {}),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${id}`);
  }
}

export async function updateDocument(
  collectionName: string,
  id: string,
  data: Record<string, any>
): Promise<void> {
  try {
    await updateDoc(doc(db, collectionName, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${collectionName}/${id}`);
  }
}

export async function removeDocument(collectionName: string, id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${id}`);
  }
}

export async function ensureAdminDefaultsSeeded(): Promise<void> {
  const settingsSnap = await getDoc(doc(db, 'public_settings', 'main'));
  if (!settingsSnap.exists()) {
    const { id: _id, ...settingsPayload } = DEFAULT_PUBLIC_SETTINGS;
    await setDoc(doc(db, 'public_settings', 'main'), {
      ...settingsPayload,
      updatedAt: serverTimestamp(),
    });
  }
  const coursesSnap = await getDocs(collection(db, 'public_courses'));
  if (coursesSnap.empty) {
    for (const c of INITIAL_INSTITUTE_COURSES) {
      const { id, ...coursePayload } = c;
      await setDoc(doc(db, 'public_courses', id), {
        ...coursePayload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }
}

export function exportToCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const str = Array.isArray(v) ? v.join('; ') : String(v ?? '');
    return `"${str.replace(/"/g, '""')}"`;
  };
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function printHtmlReport(title: string, bodyHtml: string) {
  const container = document.createElement('div');
  container.className = 'fixed inset-0 z-[9999] bg-white p-8 overflow-auto print:static';
  container.innerHTML = `
    <div style="max-width: 820px; margin: 0 auto; font-family: 'Plus Jakarta Sans', sans-serif; color: #17243A;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom: 2px solid #102A56; padding-bottom: 16px; margin-bottom: 20px;">
        <div>
          <h1 style="margin:0; font-size:22px; color:#102A56; font-weight:700;">VINAYAK TUTORIAL</h1>
          <p style="margin:4px 0 0; font-size:12px; color:#475569;">RADHA SWAMI SUMIT, Gopi Cinema Road, Anand, Gujarat – 388001 | +91 98252 57153</p>
        </div>
        <div style="text-align:right;">
          <p style="margin:0; font-size:14px; font-weight:700; color:#2457B2;">${title}</p>
          <p style="margin:4px 0 0; font-size:11px; color:#64748B;">Generated ${new Date().toLocaleDateString('en-IN')}</p>
        </div>
      </div>
      ${bodyHtml}
    </div>
  `;
  document.body.appendChild(container);
  window.print();
  setTimeout(() => {
    document.body.removeChild(container);
  }, 500);
}

export { where, orderBy, query, collection, doc, serverTimestamp, getDocs, getDoc, addDoc, setDoc, updateDoc, deleteDoc };
