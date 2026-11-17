import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone, MapPin, Instagram, Facebook, ArrowUpRight } from 'lucide-react';
import type { PublicSettings } from '../types/domain';
import { DEFAULT_PUBLIC_SETTINGS } from '../lib/firestoreDb';

interface PublicLayoutProps {
  children: React.ReactNode;
  settings?: PublicSettings;
}

const NAV_ITEMS = [
  { label: 'Home', to: '/' },
  { label: 'About Us', to: '/about' },
  { label: 'Courses', to: '/courses' },
  { label: 'Faculty', to: '/faculty' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Notices', to: '/notices' },
  { label: 'Contact', to: '/contact' },
];

export function PublicLayout({ children, settings = DEFAULT_PUBLIC_SETTINGS }: PublicLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#17243A]">
      {/* Sticky 3-Zone Top Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          {/* Zone 1: Brand Wordmark */}
          <Link
            to="/"
            className="font-display text-lg font-bold tracking-tight text-[#102A56] whitespace-nowrap shrink-0"
          >
            {settings.instituteName || 'VINAYAK TUTORIAL'}
          </Link>

          {/* Zone 2: Clean Single-Line Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
            {NAV_ITEMS.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`whitespace-nowrap shrink-0 py-1 transition-colors border-b-2 ${
                    active
                      ? 'text-[#102A56] border-[#FF8A24] font-semibold'
                      : 'border-transparent hover:text-[#102A56] hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Zone 3: Portal Access & Primary CTA */}
          <div className="hidden lg:flex items-center gap-4 shrink-0">
            <Link
              to="/student/login"
              className="text-sm font-medium text-[#2457B2] hover:text-[#102A56] whitespace-nowrap shrink-0 transition-colors"
            >
              Student Portal
            </Link>
            <Link
              to="/admission"
              className="px-4 py-2 rounded-lg bg-[#FF8A24] hover:bg-[#e67817] text-white text-sm font-semibold whitespace-nowrap shrink-0 transition-colors"
            >
              Admission Enquiry
            </Link>
          </div>

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation menu"
            className="lg:hidden p-2.5 rounded-lg text-[#102A56] hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#102A56]/40 backdrop-blur-xs"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="relative ml-auto w-80 max-w-[85vw] bg-white h-full border-l border-slate-200 flex flex-col p-6 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <span className="font-display font-bold text-[#102A56]">
                {settings.instituteName}
              </span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation menu"
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 py-4">
              {NAV_ITEMS.map((item) => {
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setDrawerOpen(false)}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-[#F4F7FC] text-[#102A56] font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col gap-2.5">
              <Link
                to="/admission"
                onClick={() => setDrawerOpen(false)}
                className="w-full text-center px-4 py-2.5 rounded-lg bg-[#FF8A24] text-white text-sm font-semibold"
              >
                Admission Enquiry
              </Link>
              <Link
                to="/student/login"
                onClick={() => setDrawerOpen(false)}
                className="w-full text-center px-4 py-2.5 rounded-lg border border-[#102A56] text-[#102A56] text-sm font-semibold"
              >
                Student Portal
              </Link>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/faculty/login"
                  onClick={() => setDrawerOpen(false)}
                  className="text-center px-3 py-2 rounded-lg bg-[#F4F7FC] text-xs font-medium text-[#102A56]"
                >
                  Faculty Login
                </Link>
                <Link
                  to="/admin/login"
                  onClick={() => setDrawerOpen(false)}
                  className="text-center px-3 py-2 rounded-lg bg-[#F4F7FC] text-xs font-medium text-[#102A56]"
                >
                  Admin Login
                </Link>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Viewport */}
      <main className="flex-1">{children}</main>

      {/* Quiet, Structured Footer */}
      <footer className="bg-[#102A56] text-slate-200 border-t border-[#1e3f78]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <p className="font-display text-lg font-bold text-white tracking-tight">
              {settings.instituteName}
            </p>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              {settings.tagline}
            </p>
            <p className="mt-3 text-xs text-slate-400 leading-relaxed">
              Trusted Class 7–12 CBSE &amp; GSEB English Medium coaching in Anand, Gujarat with{' '}
              {settings.yearsExperience} of academic guidance.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href={settings.instagramUrl || 'https://www.instagram.com/'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Vinayak Tutorial Instagram"
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={settings.facebookUrl || 'https://www.facebook.com/'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Vinayak Tutorial Facebook"
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li><Link to="/about" className="hover:text-white transition-colors">About Institute</Link></li>
              <li><Link to="/courses" className="hover:text-white transition-colors">Courses &amp; Batches</Link></li>
              <li><Link to="/faculty" className="hover:text-white transition-colors">Our Faculty</Link></li>
              <li><Link to="/gallery" className="hover:text-white transition-colors">Campus Gallery</Link></li>
              <li><Link to="/notices" className="hover:text-white transition-colors">Notices &amp; Updates</Link></li>
              <li><Link to="/admission" className="hover:text-white transition-colors">Admission Enquiry</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Academic Portals</h3>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li>
                <Link to="/student/login" className="inline-flex items-center gap-1 hover:text-white transition-colors">
                  Student Portal <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </li>
              <li>
                <Link to="/faculty/login" className="inline-flex items-center gap-1 hover:text-white transition-colors">
                  Faculty Portal <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="inline-flex items-center gap-1 hover:text-white transition-colors">
                  Admin ERP Portal <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </li>
              <li className="pt-2 text-xs text-slate-400">
                Class 7–10 Foundation &amp; Board · Class 11–12 Science (CBSE &amp; GSEB)
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Contact Anand Campus</h3>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#FF8A24] shrink-0 mt-1" />
                <p className="leading-relaxed text-xs sm:text-sm">{settings.address}</p>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#FF8A24] shrink-0" />
                <a href={`tel:${settings.phone.replace(/\s+/g, '')}`} className="hover:text-white tabular-nums">
                  {settings.phone}
                </a>
              </div>
              <p className="text-xs text-slate-400">{settings.businessHours}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>&copy; {new Date().getFullYear()} {settings.instituteName}, Anand, Gujarat. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms &amp; Conditions</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
