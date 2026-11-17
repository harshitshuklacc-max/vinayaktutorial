import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, ExternalLink, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types/domain';

export interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

interface PortalShellProps {
  portalName: string;
  portalSubtitle: string;
  navItems: NavItem[];
  children: React.ReactNode;
}

export function RequireRole({
  allowed,
  loginPath,
  children,
}: {
  allowed: UserRole[];
  loginPath: string;
  children: React.ReactNode;
}) {
  const { loading, firebaseUser, role } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7FC] flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-xl px-6 py-4 text-sm text-slate-600">
          Verifying portal session...
        </div>
      </div>
    );
  }

  if (!firebaseUser || !role || !allowed.includes(role)) {
    return <Navigate to={loginPath} state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}

export function PortalShell({ portalName, portalSubtitle, navItems, children }: PortalShellProps) {
  const { firebaseUser, role, adminProfile, facultyProfile, studentProfile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const displayName =
    adminProfile?.name ||
    facultyProfile?.fullName ||
    studentProfile?.fullName ||
    firebaseUser?.displayName ||
    firebaseUser?.email ||
    'User';

  const currentNav = navItems.find((n) => location.pathname === n.to) || navItems[0];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#102A56] text-slate-200">
      <div className="px-5 py-5 border-b border-white/10">
        <Link to="/" className="font-display text-base font-bold text-white tracking-tight block">
          VINAYAK TUTORIAL
        </Link>
        <p className="mt-1 text-xs text-slate-300">{portalName}</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                active
                  ? 'bg-[#2457B2] text-white'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-2">
        <Link
          to="/"
          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
        >
          <span>Public Website</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-amber-200 hover:bg-white/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F7FC] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 max-w-[82vw] h-full z-10">
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
              className="absolute top-4 right-4 text-white p-1.5 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 h-16 px-4 sm:px-6 flex items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="lg:hidden p-2 rounded-lg text-[#102A56] hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 truncate">
                {portalSubtitle} / <span className="text-[#102A56] font-medium">{currentNav?.label}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-[#102A56] leading-tight">{displayName}</p>
              <p className="text-xs text-slate-500 capitalize">{role?.replace('_', ' ')}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#F4F7FC] border border-slate-200 flex items-center justify-center text-[#102A56]">
              <Shield className="w-4 h-4" />
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
