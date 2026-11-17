import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { RequireRole } from './components/PortalShell';
import { PublicLayout } from './components/PublicLayout';
import { usePublicSiteData } from './components/PublicSiteDataHook';
import { HomePage } from './pages/HomePage';
import { AdmissionPage } from './pages/AdmissionPage';
import { PrivacyPolicyPage, TermsPage } from './pages/LegalPages';
import { PortalLoginPage } from './pages/PortalLoginPage';
import { StudentPortal } from './pages/StudentPortal';
import { FacultyPortal } from './pages/FacultyPortal';
import { AdminPortal } from './pages/AdminPortal';
import { Link } from 'react-router-dom';

function NotFoundPage() {
  const { settings } = usePublicSiteData();
  return (
    <PublicLayout settings={settings}>
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <p className="font-mono text-sm font-semibold text-[#2457B2]">404</p>
        <h1 className="font-display text-3xl font-bold text-[#102A56]">Page Not Found</h1>
        <p className="text-sm text-slate-600">
          The page you requested could not be found on Vinayak Tutorial.
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            to="/"
            className="px-5 py-2.5 rounded-lg bg-[#102A56] text-white text-sm font-medium hover:bg-[#2457B2] transition-colors"
          >
            Back to Home
          </Link>
          <Link
            to="/admission"
            className="px-5 py-2.5 rounded-lg bg-[#FF8A24] text-white text-sm font-medium hover:bg-[#e67817] transition-colors"
          >
            Admission Enquiry
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Website Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<HomePage initialSection="about" />} />
            <Route path="/courses" element={<HomePage initialSection="courses" />} />
            <Route path="/faculty" element={<HomePage initialSection="faculty" />} />
            <Route path="/gallery" element={<HomePage initialSection="gallery" />} />
            <Route path="/notices" element={<HomePage initialSection="notices" />} />
            <Route path="/contact" element={<HomePage initialSection="contact" />} />
            <Route path="/admission" element={<AdmissionPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />

            {/* Portal Login Routes */}
            <Route path="/student/login" element={<PortalLoginPage portal="student" />} />
            <Route path="/faculty/login" element={<PortalLoginPage portal="faculty" />} />
            <Route path="/admin/login" element={<PortalLoginPage portal="admin" />} />

            {/* Student Portal */}
            <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
            <Route
              path="/student/*"
              element={
                <RequireRole allowed={['student']} loginPath="/student/login">
                  <StudentPortal />
                </RequireRole>
              }
            />

            {/* Faculty Portal */}
            <Route path="/faculty" element={<Navigate to="/faculty/dashboard" replace />} />
            <Route
              path="/faculty/*"
              element={
                <RequireRole allowed={['faculty', 'admin', 'super_admin']} loginPath="/faculty/login">
                  <FacultyPortal />
                </RequireRole>
              }
            />

            {/* Admin Portal */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route
              path="/admin/*"
              element={
                <RequireRole allowed={['admin', 'super_admin']} loginPath="/admin/login">
                  <AdminPortal />
                </RequireRole>
              }
            />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
