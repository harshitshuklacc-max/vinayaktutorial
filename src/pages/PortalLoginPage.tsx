import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types/domain';

interface PortalLoginPageProps {
  portal: 'student' | 'faculty' | 'admin';
}

const PORTAL_META = {
  student: {
    title: 'Student Portal Login',
    subtitle: 'Access study materials, online tests, results, attendance, timetable, and fee receipts.',
    idLabel: 'Admission Number or Registered Email',
    idPlaceholder: 'e.g., VT-2026-001 or student@gmail.com',
    dashboard: '/student/dashboard',
    allowedRoles: ['student'] as UserRole[],
  },
  faculty: {
    title: 'Faculty Portal Login',
    subtitle: 'Manage assigned classes, attendance logs, online tests, study materials, and student doubts.',
    idLabel: 'Faculty Code or Registered Email',
    idPlaceholder: 'e.g., FAC-01 or faculty@gmail.com',
    dashboard: '/faculty/dashboard',
    allowedRoles: ['faculty', 'admin', 'super_admin'] as UserRole[],
  },
  admin: {
    title: 'Admin ERP Portal Login',
    subtitle: 'Full institute management for Vinayak Tutorial, Anand — students, faculty, fees, exams, and website CMS.',
    idLabel: 'Administrator Email',
    idPlaceholder: 'admin@vinayaktutorial.in',
    dashboard: '/admin/dashboard',
    allowedRoles: ['super_admin', 'admin'] as UserRole[],
  },
};

export function PortalLoginPage({ portal }: PortalLoginPageProps) {
  const meta = PORTAL_META[portal];
  const { firebaseUser, role, loading, signInWithGoogle, signInWithEmailPassword, logout } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && firebaseUser && role && meta.allowedRoles.includes(role)) {
      navigate(meta.dashboard, { replace: true });
    }
  }, [loading, firebaseUser, role, meta.allowedRoles, meta.dashboard, navigate]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setBusy(true);
    try {
      const resolved = await signInWithGoogle();
      if (resolved && meta.allowedRoles.includes(resolved)) {
        navigate(meta.dashboard, { replace: true });
      } else if (resolved) {
        setError(
          `Your Google account is registered with the "${resolved.replace('_', ' ')}" role, which does not match this portal.`
        );
      } else {
        setError(
          portal === 'admin'
            ? 'This Google account is not authorized as an Institute Administrator.'
            : `No active ${portal} record was found for this Google email. Please contact the Vinayak Tutorial Admin Office to register your email.`
        );
      }
    } catch (err: any) {
      setError(err?.message || 'Google Sign-In failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const resolved = await signInWithEmailPassword(identifier, password, portal);
      if (resolved && meta.allowedRoles.includes(resolved)) {
        navigate(meta.dashboard, { replace: true });
      } else {
        setError(`Account authenticated, but no active ${portal} profile is linked to this account.`);
      }
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setError(
          'Email/Password Sign-In is currently disabled in the Firebase project console. Please sign in with Google below, or enable Email/Password under Firebase Console → Authentication → Sign-in method.'
        );
      } else if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        setError('Invalid ID/Email or password. Verify your credentials issued by the institute.');
      } else {
        setError(err?.message || 'Login failed.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FC] flex flex-col justify-center py-12 px-4 sm:px-6">
      <div className="max-w-md w-full mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2457B2] hover:text-[#102A56]">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Vinayak Tutorial
        </Link>

        <div className="mt-4 bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
          <div className="flex items-center gap-2.5 text-[#102A56]">
            <ShieldCheck className="w-6 h-6 text-[#FF8A24]" />
            <span className="font-display text-sm font-bold tracking-wide">VINAYAK TUTORIAL</span>
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-[#102A56]">{meta.title}</h1>
          <p className="mt-1.5 text-sm text-slate-600">{meta.subtitle}</p>

          {firebaseUser && (!role || !meta.allowedRoles.includes(role)) && (
            <div className="mt-5 p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
              <p>
                Signed in as <span className="font-semibold">{firebaseUser.email}</span>
                {role ? ` (Role: ${role.replace('_', ' ')})` : ' (Unassigned)'}.
              </p>
              <button
                type="button"
                onClick={logout}
                className="underline font-semibold hover:text-amber-950"
              >
                Sign out and switch account
              </button>
            </div>
          )}

          {/* Google Sign-In */}
          <button
            type="button"
            disabled={busy}
            onClick={handleGoogleSignIn}
            className="mt-6 w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg bg-[#102A56] hover:bg-[#2457B2] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
          >
            <UserCheck className="w-4 h-4" />
            {busy ? 'Authenticating...' : 'Sign in with Google'}
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
            <div className="flex-1 h-px bg-slate-200" />
            <span>OR USE ISSUED CREDENTIALS</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <form onSubmit={handleCredentialLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#17243A] mb-1.5">
                {meta.idLabel}
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={meta.idPlaceholder}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#2457B2]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17243A] mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#2457B2]"
              />
            </div>

            {error && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#102A56] text-[#102A56] hover:bg-[#F4F7FC] disabled:opacity-60 text-sm font-semibold transition-colors"
            >
              <Lock className="w-4 h-4" />
              Sign In with Credentials
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link to="/student/login" className="hover:text-[#102A56]">Student</Link>
            <Link to="/faculty/login" className="hover:text-[#102A56]">Faculty</Link>
            <Link to="/admin/login" className="hover:text-[#102A56]">Admin ERP</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
