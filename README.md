# Vinayak Tutorial — Institute Website & Three-Portal ERP

Full-stack educational platform and institute management system for **Vinayak Tutorial (Anand, Gujarat)** covering Class 7–12 CBSE & GSEB English Medium coaching.

## Architecture & Tech Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7, Lucide Icons
- **Backend Server**: Express (`server.ts` on port `3000`) serving Vite middleware in dev, static `dist/` in production, HTTP-only signed session cookies (`vt_session`), rate-limited APIs, `/api/upload` (4 MB MIME-validated local uploads), `/api/payments/razorpay/*`, `/api/notifications/whatsapp`, `/robots.txt`, and `/sitemap.xml`
- **Database & Authentication**: Cloud Firestore + Firebase Authentication (`firebase-applet-config.json`), protected by `firestore.rules` with role-based access control (`super_admin`, `admin`, `faculty`, `student`)
- **Relational SQL Reference Schema**: `migrations/001_initial_schema.sql` (27 normalized tables & indexes for MySQL/TiDB portability)

## Portals & Routes
- **Public Website**: `/`, `/about`, `/courses`, `/faculty`, `/gallery`, `/notices`, `/contact`, `/admission`, `/privacy`, `/terms`
- **Student Portal**: `/student/login` → `/student/dashboard`, `/student/profile`, `/student/attendance`, `/student/materials`, `/student/tests`, `/student/results`, `/student/fees`, `/student/notices`, `/student/timetable`, `/student/doubts`
- **Faculty Portal**: `/faculty/login` → `/faculty/dashboard`, `/faculty/students`, `/faculty/attendance`, `/faculty/tests`, `/faculty/materials`, `/faculty/doubts`, `/faculty/timetable`
- **Admin ERP Portal**: `/admin/login` → `/admin/dashboard`, `/admin/students`, `/admin/faculty`, `/admin/courses`, `/admin/admissions`, `/admin/fees`, `/admin/examinations`, `/admin/results`, `/admin/notices`, `/admin/gallery`, `/admin/testimonials`, `/admin/timetable`, `/admin/reports`, `/admin/settings`, `/admin/audit-logs`

## Setup & First-Time Admin Sign-In
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables based on `.env.example`:
   - `APP_URL`, `SESSION_SECRET` (optional override)
   - Optional Razorpay fee payments: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
   - Optional WhatsApp Cloud API notifications: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`
3. In Firebase Console → Authentication → Sign-in method:
   - Ensure **Google** provider is enabled.
   - Enable **Email/Password** provider if you want Admin-created students and faculty to log in using Admission Number / Faculty Code / Email + Password.
4. Visit `/admin/login` and sign in with the bootstrapped Super Admin Google account (`harshitshuklacc@gmail.com`). Initial Class 7–12 courses and institute settings are seeded on first admin sign-in. Faculty profiles and testimonials remain empty until added or approved by Admin.

## Commands
- Development server: `npm run dev`
- Type check: `npm run lint`
- Security rules lint: `npx eslint firestore.rules`
- Production build & start:
  ```bash
  npm run build
  npm start
  ```
