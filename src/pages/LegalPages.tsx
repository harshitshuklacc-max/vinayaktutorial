import { PublicLayout } from '../components/PublicLayout';
import { usePublicSiteData } from '../components/PublicSiteDataHook';

export function PrivacyPolicyPage() {
  const { settings } = usePublicSiteData();
  return (
    <PublicLayout settings={settings}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-6">
        <h1 className="font-display text-3xl font-bold text-[#102A56]">Privacy Policy</h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          {settings.instituteName} (RADHA SWAMI SUMIT, Gopi Cinema Road, Anand, Gujarat – 388001) respects the privacy of students, parents, and faculty. Information submitted via admission enquiries, student enrollment, attendance logs, and fee records is used strictly for academic administration, examination management, and guardian communication.
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          All portal accounts are protected by role-based access control and server-verified authentication. Student personal records are never shared publicly or sold to third parties.
        </p>
      </div>
    </PublicLayout>
  );
}

export function TermsPage() {
  const { settings } = usePublicSiteData();
  return (
    <PublicLayout settings={settings}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-6">
        <h1 className="font-display text-3xl font-bold text-[#102A56]">Terms &amp; Conditions</h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Enrollment at {settings.instituteName} requires adherence to classroom discipline, regular attendance, and scheduled test participation. Study materials, worksheets, and online test papers provided inside the Student Portal are solely for enrolled learners and must not be redistributed commercially.
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          Fee installments are governed by the schedule assigned at admission. Official receipts are issued for every verified transaction recorded in the institute ledger.
        </p>
      </div>
    </PublicLayout>
  );
}
