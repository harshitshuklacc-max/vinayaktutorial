import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
  Users,
  X,
} from 'lucide-react';
import { PublicLayout } from '../components/PublicLayout';
import { usePublicSiteData } from '../components/PublicSiteDataHook';
import { createDocument, formatFirestoreDate } from '../lib/firestoreDb';
import type { Course, GalleryItem } from '../types/domain';

const WHY_CHOOSE_ITEMS = [
  {
    num: '01',
    title: '20+ Years of Teaching Experience',
    desc: 'Two decades of dedicated classroom instruction in Anand shaping strong board and science foundations.',
  },
  {
    num: '02',
    title: 'Experienced Faculty',
    desc: 'Subject specialists committed to clear explanations, structured notes, and exam-oriented mentoring.',
  },
  {
    num: '03',
    title: 'Personal Attention',
    desc: 'Focused batch sizes ensuring every learner is heard, monitored, and supported individually.',
  },
  {
    num: '04',
    title: 'Concept-Based Learning',
    desc: 'Deep emphasis on core principles in Science and Mathematics rather than rote memorization.',
  },
  {
    num: '05',
    title: 'Regular Tests & Assessments',
    desc: 'Scheduled chapter-wise evaluations and full-syllabus mock exams with parent progress visibility.',
  },
  {
    num: '06',
    title: 'Previous Year Question Papers',
    desc: 'Systematic practice with CBSE and GSEB past board papers and marking scheme analysis.',
  },
  {
    num: '07',
    title: 'Dedicated Doubt Solving',
    desc: 'Structured doubt clinics and digital doubt-submission support so no question stays unresolved.',
  },
  {
    num: '08',
    title: 'Disciplined Learning Environment',
    desc: 'Safe, attentive, and respectful classroom culture with life-skill guidance that builds confidence.',
  },
];

const CAMPUS_DEFAULT_GALLERY: GalleryItem[] = [
  {
    id: 'campus-lecture',
    title: 'Lecture Hall & Smart Classroom',
    category: 'Classrooms',
    imageUrl: '/src/assets/images/gallery_lecture_hall_1794896108273.jpg',
    caption: 'Bright, spacious lecture room designed for focused Class 7–12 board and science batches.',
  },
  {
    id: 'campus-study',
    title: 'Study & Doubt-Solving Room',
    category: 'Infrastructure',
    imageUrl: '/src/assets/images/gallery_library_study_1794896108697.jpg',
    caption: 'Quiet academic reference and one-on-one doubt-solving room at Anand campus.',
  },
];

export function CourseCard({ course }: { course: Course }) {
  return (
    <article className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col transition-colors hover:border-[#2457B2]/50">
      <div className="aspect-[4/3] bg-[#F4F7FC] overflow-hidden">
        {course.imageUrl ? (
          <img
            src={course.imageUrl}
            alt={course.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#102A56] to-[#2457B2] text-white">
            <BookOpen className="w-8 h-8 mb-2 opacity-80" />
            <span className="font-display font-semibold">{course.classLevel}</span>
          </div>
        )}
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <p className="text-xs font-medium text-[#2457B2]">
          {course.classLevel} <span aria-hidden="true">·</span> {course.board} <span aria-hidden="true">·</span> {course.medium} Medium
        </p>
        <h3 className="mt-2 font-display text-lg font-semibold text-[#102A56] leading-snug">
          {course.name}
        </h3>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed flex-1">
          {course.description}
        </p>
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
          <p>
            <span className="font-semibold text-[#17243A]">Subjects:</span> {course.subjects.join(' · ')}
          </p>
          <p>
            <span className="font-semibold text-[#17243A]">Duration:</span> {course.duration}
          </p>
          <p>
            <span className="font-semibold text-[#17243A]">Faculty:</span> {course.facultyName || 'Institute Subject Specialist'}
          </p>
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="font-mono text-sm font-semibold text-[#102A56] tabular-nums">
            ₹{Number(course.feeAmount || 0).toLocaleString('en-IN')} / yr
          </span>
          <Link
            to={`/admission?class=${encodeURIComponent(course.classLevel)}&board=${encodeURIComponent(course.board === 'CBSE' ? 'CBSE' : 'GSEB')}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#102A56] hover:bg-[#2457B2] text-white text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
          >
            Enquire <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function HomePage({ initialSection }: { initialSection?: 'about' | 'courses' | 'faculty' | 'gallery' | 'notices' | 'contact' }) {
  const { settings, courses, faculty, notices, gallery, testimonials } = usePublicSiteData();
  const [boardFilter, setBoardFilter] = useState<'All' | 'CBSE' | 'GSEB'>('All');
  const [galleryFilter, setGalleryFilter] = useState<string>('All');
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);
  const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '', subject: '', message: '' });
  const [contactStatus, setContactStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submittingContact, setSubmittingContact] = useState(false);

  const filteredCourses = courses.filter((c) => {
    if (boardFilter === 'All') return true;
    return c.board === boardFilter || c.board === 'CBSE & GSEB';
  });

  const activeGallery = gallery.length > 0 ? gallery : CAMPUS_DEFAULT_GALLERY;
  const filteredGallery = activeGallery.filter((g) => galleryFilter === 'All' || g.category === galleryFilter);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactStatus(null);
    const cleanPhone = contactForm.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setContactStatus({ type: 'error', text: 'Please enter a valid 10-digit mobile number.' });
      return;
    }
    setSubmittingContact(true);
    try {
      await createDocument('contact_messages', {
        name: contactForm.name.trim(),
        phone: contactForm.phone.trim(),
        email: contactForm.email.trim(),
        subject: contactForm.subject.trim(),
        message: contactForm.message.trim(),
        status: 'Unread',
      });
      setContactStatus({ type: 'success', text: 'Thank you! Your message has been received by Vinayak Tutorial.' });
      setContactForm({ name: '', phone: '', email: '', subject: '', message: '' });
    } catch {
      setContactStatus({ type: 'error', text: 'Unable to send message right now. Please call +91 98252 57153.' });
    } finally {
      setSubmittingContact(false);
    }
  };

  const showOnly = (section: typeof initialSection) => !initialSection || initialSection === section;

  return (
    <PublicLayout settings={settings}>
      {/* Hero Section (Full Homepage only, or compact banner on subpages) */}
      {!initialSection && (
        <section className="bg-[#F4F7FC] border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              <div className="lg:col-span-6 flex flex-col justify-center">
                <p className="text-xs font-semibold tracking-wide text-[#2457B2]">
                  VINAYAK TUITION CLASSES <span aria-hidden="true">·</span> ANAND, GUJARAT
                </p>
                <h1
                  className="mt-3 font-display font-bold text-[#102A56] tracking-tight leading-[1.12]"
                  style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)', textWrap: 'balance' }}
                >
                  {settings.heroHeadline}
                </h1>
                <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                  {settings.heroSubheadline}
                </p>
                <p className="mt-3 text-sm text-slate-500 font-medium">
                  &ldquo;{settings.tagline}&rdquo;
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    to="/admission"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#FF8A24] hover:bg-[#e67817] text-white text-sm font-semibold whitespace-nowrap transition-colors"
                  >
                    Enquire Now <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/courses"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white border border-slate-300 hover:border-[#102A56] text-[#102A56] text-sm font-semibold whitespace-nowrap transition-colors"
                  >
                    Explore Our Courses
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="h-full min-h-[280px] rounded-xl overflow-hidden border border-slate-200 bg-white">
                  <img
                    src="/src/assets/images/hero_classroom_anand_1794896106963.jpg"
                    alt="Students studying at Vinayak Tutorial classroom in Anand"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* 4-Column Factual Proof Strip */}
            <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-8 border-t border-slate-200/80">
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <p className="font-mono text-2xl font-bold text-[#102A56] tabular-nums">{settings.yearsExperience}</p>
                <p className="mt-1 text-xs font-medium text-slate-600">Teaching Excellence in Anand</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <p className="font-mono text-2xl font-bold text-[#102A56] tabular-nums">
                  {settings.googleRating} / 5.0
                </p>
                <p className="mt-1 text-xs font-medium text-slate-600">
                  Across {settings.googleReviewCount} Client-Reported Google Reviews
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <p className="font-mono text-2xl font-bold text-[#102A56] tabular-nums">Class 7 – 12</p>
                <p className="mt-1 text-xs font-medium text-slate-600">CBSE &amp; GSEB English Medium</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <p className="font-mono text-2xl font-bold text-[#102A56]">Science &amp; Maths</p>
                <p className="mt-1 text-xs font-medium text-slate-600">Board Exam &amp; Concept Mastery</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* About / Why Choose Us Section */}
      {showOnly('about') && (
        <section id="about" className="py-16 lg:py-20 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold tracking-wide text-[#2457B2]">ABOUT VINAYAK TUTORIAL</p>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-[#102A56]" style={{ textWrap: 'balance' }}>
                Why Parents &amp; Students in Anand Trust Our Guidance
              </h2>
              <p className="mt-4 text-base text-slate-600 leading-relaxed">
                {settings.aboutSummary}
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {WHY_CHOOSE_ITEMS.map((item) => (
                <div
                  key={item.num}
                  className="p-6 rounded-xl bg-[#F4F7FC] border border-slate-200/80 flex flex-col"
                >
                  <span className="font-mono text-xs font-semibold text-[#FF8A24] tabular-nums">{item.num}.</span>
                  <h3 className="mt-2 font-display text-base font-semibold text-[#102A56]">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Courses Section */}
      {showOnly('courses') && (
        <section id="courses" className="py-16 lg:py-20 bg-[#F4F7FC] border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <p className="text-xs font-semibold tracking-wide text-[#2457B2]">ACADEMIC PROGRAMS</p>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-[#102A56]">
                  Courses for Class 7 to 12 (CBSE &amp; GSEB)
                </h2>
              </div>

              <div className="inline-flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg self-start">
                {(['All', 'CBSE', 'GSEB'] as const).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBoardFilter(b)}
                    className={`px-3.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                      boardFilter === b
                        ? 'bg-[#102A56] text-white'
                        : 'text-slate-600 hover:text-[#102A56]'
                    }`}
                  >
                    {b === 'All' ? 'All Boards' : b}
                  </button>
                ))}
              </div>
            </div>

            {filteredCourses.length === 0 ? (
              <div className="mt-10 bg-white border border-slate-200 rounded-xl p-10 text-center">
                <p className="text-sm text-slate-600">No active courses match this filter yet.</p>
              </div>
            ) : (
              <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Faculty Section (Strictly Admin-Managed, Zero Invented Profiles) */}
      {showOnly('faculty') && (
        <section id="faculty" className="py-16 lg:py-20 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-wide text-[#2457B2]">ACADEMIC LEADERSHIP</p>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-[#102A56]">
                  Dedicated Teaching Faculty
                </h2>
              </div>
              <Link
                to="/faculty/login"
                className="text-sm font-medium text-[#2457B2] hover:text-[#102A56] whitespace-nowrap"
              >
                Faculty Portal Login &rarr;
              </Link>
            </div>

            {faculty.length === 0 ? (
              <div className="mt-8 bg-[#F4F7FC] border border-slate-200 rounded-xl p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-white border border-slate-200 text-[#102A56]">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold text-[#102A56]">
                      Verified Faculty Directory
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 max-w-xl">
                      Faculty profiles, qualifications, and subject assignments are published directly from the Institute Admin Portal to ensure every credential displayed is authentic and verified.
                    </p>
                  </div>
                </div>
                <Link
                  to="/admin/login"
                  className="px-4 py-2 rounded-lg bg-[#102A56] text-white text-xs font-semibold whitespace-nowrap shrink-0 hover:bg-[#2457B2] transition-colors"
                >
                  Manage in Admin Portal
                </Link>
              </div>
            ) : (
              <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {faculty.map((member) => (
                  <article
                    key={member.id}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col"
                  >
                    <div className="p-6 flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl bg-[#F4F7FC] border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-[#102A56]">
                        {member.photoUrl ? (
                          <img
                            src={member.photoUrl}
                            alt={member.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <GraduationCap className="w-7 h-7" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display text-lg font-semibold text-[#102A56] truncate">
                          {member.name}
                        </h3>
                        <p className="text-xs font-medium text-[#2457B2]">{member.qualification}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {member.specialization} <span aria-hidden="true">·</span>{' '}
                          <span className="tabular-nums">{member.experienceYears} yrs exp.</span>
                        </p>
                      </div>
                    </div>
                    <div className="px-6 pb-6 text-sm text-slate-600 leading-relaxed">
                      {member.bio}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Notices & Announcements */}
      {showOnly('notices') && (
        <section id="notices" className="py-16 lg:py-20 bg-[#F4F7FC] border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-wide text-[#2457B2]">INSTITUTE UPDATES</p>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-[#102A56]">
                  Notices &amp; Announcements
                </h2>
              </div>
              <Link to="/student/login" className="text-sm font-medium text-[#2457B2] hover:text-[#102A56]">
                Student Notices &rarr;
              </Link>
            </div>

            {notices.length === 0 ? (
              <div className="mt-8 bg-white border border-slate-200 rounded-xl p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[#2457B2] shrink-0" />
                  <p className="text-sm text-slate-600">
                    Admissions are open for Academic Session Class 7–12 (CBSE &amp; GSEB). New batch schedules and exam notices published by the administration will appear here.
                  </p>
                </div>
                <Link
                  to="/admission"
                  className="px-4 py-2 rounded-lg bg-[#FF8A24] text-white text-xs font-semibold whitespace-nowrap shrink-0"
                >
                  Apply for Admission
                </Link>
              </div>
            ) : (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
                {notices.map((notice) => (
                  <article key={notice.id} className="bg-white border border-slate-200 rounded-xl p-6">
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-[#2457B2]">
                        {notice.category} <span aria-hidden="true">·</span> {notice.targetClass}
                      </span>
                      <span className="tabular-nums">{formatFirestoreDate(notice.createdAt)}</span>
                    </div>
                    <h3 className="mt-2 font-display text-lg font-semibold text-[#102A56]">
                      {notice.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                      {notice.content}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Photo Gallery with Lightbox */}
      {showOnly('gallery') && (
        <section id="gallery" className="py-16 lg:py-20 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <p className="text-xs font-semibold tracking-wide text-[#2457B2]">CAMPUS LIFE</p>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-[#102A56]">
                  Classrooms &amp; Institute Gallery
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F4F7FC] border border-slate-200 rounded-lg self-start">
                {['All', 'Classrooms', 'Infrastructure', 'Events', 'Students', 'Faculty'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setGalleryFilter(cat)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                      galleryFilter === cat
                        ? 'bg-white text-[#102A56] shadow-xs'
                        : 'text-slate-600 hover:text-[#102A56]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {filteredGallery.length === 0 ? (
              <div className="mt-8 bg-[#F4F7FC] border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-600">
                No photographs in this category yet. Administrators can upload images from the Admin Portal.
              </div>
            ) : (
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGallery.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLightboxItem(item)}
                    className="group text-left bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-[#2457B2]/60 transition-colors"
                  >
                    <div className="aspect-[4/3] bg-[#F4F7FC] overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-xs font-medium text-[#2457B2]">{item.category}</p>
                      <h3 className="mt-1 font-display text-sm font-semibold text-[#102A56]">{item.title}</h3>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Verified Testimonials (Strictly Admin-Approved) */}
      {!initialSection && (
        <section id="testimonials" className="py-16 lg:py-20 bg-[#F4F7FC] border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-wide text-[#2457B2]">STUDENT &amp; PARENT FEEDBACK</p>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-[#102A56]">
                  Verified Reviews &amp; Testimonials
                </h2>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                <Star className="w-4 h-4 fill-[#FF8A24] text-[#FF8A24]" />
                <span className="tabular-nums font-semibold text-[#102A56]">{settings.googleRating} Rating</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{settings.googleReviewCount} Google Reviews</span>
              </div>
            </div>

            {testimonials.length === 0 ? (
              <div className="mt-8 bg-white border border-slate-200 rounded-xl p-8 flex items-center gap-4">
                <ShieldCheck className="w-6 h-6 text-[#2457B2] shrink-0" />
                <p className="text-sm text-slate-600">
                  Only verified parent and student testimonials approved by the Vinayak Tutorial administration are displayed here.
                </p>
              </div>
            ) : (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonials.map((t) => (
                  <article key={t.id} className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1 text-[#FF8A24]">
                        {Array.from({ length: t.rating }).map((_, idx) => (
                          <Star key={idx} className="w-4 h-4 fill-[#FF8A24]" />
                        ))}
                      </div>
                      <p className="mt-4 text-sm text-slate-700 leading-relaxed">&ldquo;{t.content}&rdquo;</p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <p className="font-display text-sm font-semibold text-[#102A56]">{t.authorName}</p>
                      <p className="text-xs text-slate-500">
                        {t.authorRole}
                        {t.classInfo ? ` · ${t.classInfo}` : ''}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Contact & Campus Location Section */}
      {showOnly('contact') && (
        <section id="contact" className="py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-wide text-[#2457B2]">VISIT OR REACH OUT</p>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-[#102A56]">
                Contact Vinayak Tutorial, Anand
              </h2>
            </div>

            <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-[#F4F7FC] border border-slate-200 rounded-xl p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#FF8A24] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#102A56]">Institute Address</p>
                      <p className="mt-1 text-sm text-slate-600 leading-relaxed">{settings.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-[#2457B2] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#102A56]">Direct Phone</p>
                      <p className="mt-1 text-sm text-slate-600 tabular-nums">{settings.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-[#2457B2] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#102A56]">Business Hours</p>
                      <p className="mt-1 text-sm text-slate-600">{settings.businessHours}</p>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-3">
                    <a
                      href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#102A56] hover:bg-[#2457B2] text-white text-xs font-semibold transition-colors"
                    >
                      <Phone className="w-4 h-4" /> Call Now
                    </a>
                    <a
                      href={`https://wa.me/${settings.whatsappNumber || '919825257153'}?text=${encodeURIComponent(
                        'Hello Vinayak Tutorial, I would like information about admissions.'
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#16A34A] hover:bg-[#15803d] text-white text-xs font-semibold transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" /> WhatsApp Enquiry
                    </a>
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=RADHA+SWAMI+SUMIT+Gopi+Cinema+Road+Raghuvir+Nagar+Vivekanand+Wadi+Anand+Gujarat+388001"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-slate-300 text-[#102A56] text-xs font-semibold hover:border-[#102A56] transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" /> Google Maps Directions
                    </a>
                  </div>
                </div>

                {/* Embedded Map */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-[#F4F7FC] h-64">
                  <iframe
                    title="Vinayak Tutorial Location Map - Anand, Gujarat"
                    src="https://maps.google.com/maps?q=Gopi+Cinema+Road,+Vivekanand+Wadi,+Anand,+Gujarat+388001&t=&z=15&ie=UTF8&iwloc=&output=embed"
                    className="w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>

              <div className="lg:col-span-7 bg-[#F4F7FC] border border-slate-200 rounded-xl p-6 sm:p-8">
                <h3 className="font-display text-xl font-bold text-[#102A56]">Send a Message</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Have a question about batch timings or syllabus? Send us a quick message.
                </p>

                <form onSubmit={handleContactSubmit} className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#17243A] mb-1.5">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        placeholder="Parent or Student Name"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-sm focus:outline-none focus:border-[#2457B2]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#17243A] mb-1.5">Mobile Number *</label>
                      <input
                        type="tel"
                        required
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        placeholder="+91 98252 XXXXX"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-sm focus:outline-none focus:border-[#2457B2]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#17243A] mb-1.5">Email Address</label>
                      <input
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        placeholder="name@example.com"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-sm focus:outline-none focus:border-[#2457B2]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#17243A] mb-1.5">Subject *</label>
                      <input
                        type="text"
                        required
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                        placeholder="e.g., Class 11 Science Batch Inquiry"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-sm focus:outline-none focus:border-[#2457B2]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#17243A] mb-1.5">Message *</label>
                    <textarea
                      rows={4}
                      required
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Write your query..."
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-sm focus:outline-none focus:border-[#2457B2]"
                    />
                  </div>

                  {contactStatus && (
                    <div
                      className={`p-3.5 rounded-lg text-sm flex items-center gap-2 ${
                        contactStatus.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}
                    >
                      {contactStatus.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                      <span>{contactStatus.text}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingContact}
                    className="px-6 py-3 rounded-lg bg-[#102A56] hover:bg-[#2457B2] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                  >
                    {submittingContact ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Gallery Lightbox Modal */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxItem(null)}
        >
          <div
            className="max-w-4xl w-full bg-white rounded-xl overflow-hidden border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
              <div>
                <p className="text-xs font-medium text-[#2457B2]">{lightboxItem.category}</p>
                <h3 className="font-display text-base font-semibold text-[#102A56]">{lightboxItem.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setLightboxItem(null)}
                aria-label="Close lightbox"
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-950 max-h-[70vh] flex items-center justify-center overflow-hidden">
              <img
                src={lightboxItem.imageUrl}
                alt={lightboxItem.title}
                referrerPolicy="no-referrer"
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
            {lightboxItem.caption && (
              <p className="px-5 py-3 text-sm text-slate-600">{lightboxItem.caption}</p>
            )}
          </div>
        </div>
      )}
    </PublicLayout>
  );
}
