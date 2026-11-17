import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, MessageCircle, ArrowLeft } from 'lucide-react';
import { PublicLayout } from '../components/PublicLayout';
import { usePublicSiteData } from '../components/PublicSiteDataHook';
import { createDocument } from '../lib/firestoreDb';

const CLASS_OPTIONS = ['Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11 Science', 'Class 12 Science'];
const SUBJECT_OPTIONS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Science', 'English', 'Social Science'];

export function AdmissionPage() {
  const { settings } = usePublicSiteData();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    studentFullName: '',
    fatherName: '',
    motherName: '',
    mobile: '',
    whatsapp: '',
    email: '',
    dob: '',
    currentClass: '',
    applyingForClass: searchParams.get('class') || 'Class 10',
    board: (searchParams.get('board') === 'CBSE' ? 'CBSE' : 'GSEB') as 'CBSE' | 'GSEB',
    medium: 'English',
    subjects: ['Mathematics', 'Science'] as string[],
    previousSchool: '',
    address: '',
    message: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);

  const toggleSubject = (sub: string) => {
    setForm((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(sub)
        ? prev.subjects.filter((s) => s !== sub)
        : [...prev.subjects, sub],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const mobileDigits = form.mobile.replace(/\D/g, '');
    if (mobileDigits.length < 10 || mobileDigits.length > 13) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (form.subjects.length === 0) {
      setError('Please select at least one subject.');
      return;
    }

    setSubmitting(true);
    try {
      const enquiryCode = `VT-ENQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await createDocument('admissions', {
        enquiryCode,
        studentFullName: form.studentFullName.trim(),
        fatherName: form.fatherName.trim(),
        motherName: form.motherName.trim(),
        mobile: form.mobile.trim(),
        whatsapp: (form.whatsapp || form.mobile).trim(),
        email: form.email.trim(),
        dob: form.dob,
        currentClass: form.currentClass.trim(),
        applyingForClass: form.applyingForClass,
        board: form.board,
        medium: form.medium,
        subjects: form.subjects,
        previousSchool: form.previousSchool.trim(),
        address: form.address.trim(),
        message: form.message.trim(),
        status: 'New',
        internalNotes: '',
      });
      setSubmittedCode(enquiryCode);
    } catch (err: any) {
      setError(err?.message || 'Unable to submit enquiry. Please verify all fields or call +91 98252 57153.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout settings={settings}>
      <section className="py-12 lg:py-16 bg-[#F4F7FC] min-h-[80vh]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2457B2] hover:text-[#102A56]">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Homepage
          </Link>

          <div className="mt-4">
            <p className="text-xs font-semibold tracking-wide text-[#2457B2]">ONLINE ADMISSION ENQUIRY</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-[#102A56]">
              Apply for Admission at Vinayak Tutorial
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Complete the form below for Class 7–12 (CBSE &amp; GSEB English Medium). Our academic coordinator will contact you promptly.
            </p>
          </div>

          {submittedCode ? (
            <div className="mt-8 bg-white border border-emerald-200 rounded-xl p-8">
              <div className="flex items-center gap-3 text-emerald-700">
                <CheckCircle2 className="w-7 h-7 shrink-0" />
                <h2 className="font-display text-2xl font-bold text-[#102A56]">Enquiry Submitted Successfully</h2>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Thank you, <span className="font-semibold text-[#17243A]">{form.studentFullName}</span>. Your admission enquiry has been recorded in our system.
              </p>
              <div className="mt-5 p-4 rounded-lg bg-[#F4F7FC] border border-slate-200 inline-block">
                <p className="text-xs text-slate-500">Unique Enquiry Reference ID</p>
                <p className="mt-1 font-mono text-lg font-bold text-[#102A56] tabular-nums">{submittedCode}</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={`https://wa.me/${settings.whatsappNumber || '919825257153'}?text=${encodeURIComponent(
                    `Hello Vinayak Tutorial, I submitted an admission enquiry (${submittedCode}) for ${form.studentFullName} (${form.applyingForClass}, ${form.board}).`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#16A34A] text-white text-sm font-semibold"
                >
                  <MessageCircle className="w-4 h-4" /> Connect on WhatsApp
                </a>
                <button
                  type="button"
                  onClick={() => setSubmittedCode(null)}
                  className="px-5 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-[#102A56]"
                >
                  Submit Another Enquiry
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#17243A] mb-1.5">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.studentFullName}
                    onChange={(e) => setForm({ ...form, studentFullName: e.target.value })}
                    placeholder="Enter student full name"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#2457B2]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#17243A] mb-1.5">Father&apos;s Name *</label>
                  <input
                    type="text"
                    required
                    value={form.fatherName}
                    onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#2457B2]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#17243A] mb-1.5">Mother&apos;s Name</label>
                  <input
                    type="text"
                    value={form.motherName}
                    onChange={(e) => setForm({ ...form, motherName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#2457B2]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#17243A] mb-1.5">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    placeholder="10-digit mobile number"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#2457B2]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#17243A] mb-1.5">WhatsApp Number</label>
                  <input
                    type="tel"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    placeholder="Same as mobile if blank"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#2457B2]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#17243A] mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="student@example.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#2457B2]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#17243A] mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    value={form.dob}
                    onChange={(e) => setForm({ ...form, dob: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#2457B2]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#17243A] mb-1.5">Current Class</label>
                  <input
                    type="text"
                    value={form.currentClass}
                    onChange={(e) => setForm({ ...form, currentClass: e.target.value })}
                    placeholder="e.g., Class 9"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#2457B2]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#17243A] mb-1.5">Applying For Class *</label>
                  <select
                    value={form.applyingForClass}
                    onChange={(e) => setForm({ ...form, applyingForClass: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:border-[#2457B2]"
                  >
                    {CLASS_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#17243A] mb-1.5">Board *</label>
                  <select
                    value={form.board}
                    onChange={(e) => setForm({ ...form, board: e.target.value as 'CBSE' | 'GSEB' })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:border-[#2457B2]"
                  >
                    <option value="CBSE">CBSE</option>
                    <option value="GSEB">GSEB</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#17243A] mb-1.5">Medium *</label>
                  <select
                    value={form.medium}
                    onChange={(e) => setForm({ ...form, medium: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:border-[#2457B2]"
                  >
                    <option value="English">English Medium</option>
                    <option value="Gujarati">Gujarati Medium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#17243A] mb-1.5">Previous School</label>
                  <input
                    type="text"
                    value={form.previousSchool}
                    onChange={(e) => setForm({ ...form, previousSchool: e.target.value })}
                    placeholder="School name in Anand"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#2457B2]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17243A] mb-2">Subjects Interested In *</label>
                <div className="flex flex-wrap gap-2">
                  {SUBJECT_OPTIONS.map((sub) => {
                    const active = form.subjects.includes(sub);
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => toggleSubject(sub)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          active
                            ? 'bg-[#102A56] text-white border-[#102A56]'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-[#2457B2]'
                        }`}
                      >
                        {sub}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17243A] mb-1.5">Residential Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Area / Society in Anand"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#2457B2]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17243A] mb-1.5">Additional Message</label>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Preferred batch timing or questions for faculty..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#2457B2]"
                />
              </div>

              {error && (
                <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-8 py-3 rounded-lg bg-[#FF8A24] hover:bg-[#e67817] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
              >
                {submitting ? 'Submitting Enquiry...' : 'Submit Admission Enquiry'}
              </button>
            </form>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
