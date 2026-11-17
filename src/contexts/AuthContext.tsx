import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { auth, db, googleAuthProvider } from '../lib/firebase';
import type { AdminUser, FacultyMember, Student, UserRole } from '../types/domain';
import { ensureAdminDefaultsSeeded, logAudit } from '../lib/firestoreDb';

const BOOTSTRAPPED_ADMIN_EMAIL = 'harshitshuklacc@gmail.com';

interface AuthContextValue {
  firebaseUser: User | null;
  loading: boolean;
  role: UserRole | null;
  adminProfile: AdminUser | null;
  facultyProfile: FacultyMember | null;
  studentProfile: Student | null;
  authError: string | null;
  signInWithGoogle: () => Promise<UserRole | null>;
  signInWithEmailPassword: (emailOrId: string, password: string, portal: 'student' | 'faculty' | 'admin') => Promise<UserRole | null>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminUser | null>(null);
  const [facultyProfile, setFacultyProfile] = useState<FacultyMember | null>(null);
  const [studentProfile, setStudentProfile] = useState<Student | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const resolveUserRole = useCallback(async (user: User): Promise<UserRole | null> => {
    setAuthError(null);
    const emailLower = (user.email || '').toLowerCase();

    try {
      const idToken = await user.getIdToken();
      fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }).catch(() => {});

      // 1. Check Super Admin / Admin
      const adminSnap = await getDoc(doc(db, 'admins', user.uid)).catch(() => null);
      if (emailLower === BOOTSTRAPPED_ADMIN_EMAIL || adminSnap?.exists()) {
        const adm: AdminUser = adminSnap?.exists()
          ? ({ id: adminSnap.id, ...adminSnap.data() } as AdminUser)
          : {
              id: user.uid,
              uid: user.uid,
              email: emailLower,
              name: user.displayName || 'Institute Administrator',
              role: 'super_admin',
              permissions: ['all'],
            };
        setAdminProfile(adm);
        setFacultyProfile(null);
        setStudentProfile(null);
        setRole(adm.role);
        await ensureAdminDefaultsSeeded().catch(() => {});
        return adm.role;
      }

      // 2. Check Faculty
      if (emailLower) {
        const facEmailSnap = await getDoc(doc(db, 'faculty_emails', emailLower)).catch(() => null);
        if (facEmailSnap?.exists()) {
          const facId = (facEmailSnap.data() as { facultyId: string }).facultyId;
          const facSnap = await getDoc(doc(db, 'faculty', facId)).catch(() => null);
          if (facSnap?.exists()) {
            const fac = { id: facSnap.id, ...facSnap.data() } as FacultyMember;
            setFacultyProfile(fac);
            setAdminProfile(null);
            setStudentProfile(null);
            setRole('faculty');
            return 'faculty';
          }
        }
      }

      // 3. Check Student
      if (emailLower) {
        const studQ = query(collection(db, 'students'), where('email', '==', emailLower));
        const studSnap = await getDocs(studQ).catch(() => null);
        if (studSnap && !studSnap.empty) {
          const d = studSnap.docs[0];
          const stud = { id: d.id, ...d.data() } as Student;
          setStudentProfile(stud);
          setAdminProfile(null);
          setFacultyProfile(null);
          setRole('student');
          return 'student';
        }
      }

      setAdminProfile(null);
      setFacultyProfile(null);
      setStudentProfile(null);
      setRole(null);
      return null;
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to resolve portal role');
      return null;
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await resolveUserRole(user);
      } else {
        setRole(null);
        setAdminProfile(null);
        setFacultyProfile(null);
        setStudentProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [resolveUserRole]);

  const signInWithGoogle = async (): Promise<UserRole | null> => {
    setAuthError(null);
    const result = await signInWithPopup(auth, googleAuthProvider);
    const resolved = await resolveUserRole(result.user);
    if (resolved) {
      await logAudit(resolved, 'LOGIN_GOOGLE', 'auth', `Signed in via Google (${result.user.email})`);
    }
    return resolved;
  };

  const signInWithEmailPassword = async (
    emailOrId: string,
    password: string,
    portal: 'student' | 'faculty' | 'admin'
  ): Promise<UserRole | null> => {
    setAuthError(null);
    const trimmed = emailOrId.trim().toLowerCase();
    const resolvedEmail = trimmed.includes('@')
      ? trimmed
      : portal === 'student'
      ? `${trimmed}@students.vinayaktutorial.in`
      : portal === 'faculty'
      ? `${trimmed}@faculty.vinayaktutorial.in`
      : `${trimmed}@admin.vinayaktutorial.in`;

    const cred = await signInWithEmailAndPassword(auth, resolvedEmail, password);
    const resolved = await resolveUserRole(cred.user);
    if (resolved) {
      await logAudit(resolved, 'LOGIN_PASSWORD', 'auth', `Signed in via credentials (${resolvedEmail})`);
    }
    return resolved;
  };

  const logout = async () => {
    if (role) {
      await logAudit(role, 'LOGOUT', 'auth', 'User signed out');
    }
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    await signOut(auth);
    setRole(null);
    setAdminProfile(null);
    setFacultyProfile(null);
    setStudentProfile(null);
  };

  const refreshProfile = async () => {
    if (auth.currentUser) {
      await resolveUserRole(auth.currentUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        loading,
        role,
        adminProfile,
        facultyProfile,
        studentProfile,
        authError,
        signInWithGoogle,
        signInWithEmailPassword,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
