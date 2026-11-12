export const metadata = { title: 'الإعدادات' };
import { Settings, Building2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/lib/auth';

export default async function SettingsPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';

  return (
    <div className="space-y-6 mt-4 animate-fade-in-up">
      <div className="labo-page-title mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="w-6 h-6 text-red-600" />
            الإعدادات العامة
          </h1>
          <p className="text-slate-500 text-sm mt-1">تخصيص النظام وإدارة الموارد والأمان</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Security & Password Hub */}
        <Link
          href="/dashboard/security"
          className="labo-card p-6 flex flex-col items-center justify-center text-center hover:border-emerald-500 transition-all group cursor-pointer border-2 border-emerald-500/30 bg-emerald-50/20 hover:shadow-lg"
        >
          <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-600 group-hover:scale-110 mb-4 transition-transform">
            <ShieldCheck className="w-12 h-12" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">مركز الأمان وفحص كلمات المرور 🛡️</h2>
          <p className="text-slate-500 text-sm">
            كشف التسريبات، حساب الإنتروبيا، توليد كلمات مرور CSPRNG، والمصادقة الثنائية 2FA.
          </p>
          <span className="mt-4 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white">
            متصل بـ Microservice الحي
          </span>
        </Link>

        {isAdmin && (
          <Link href="/dashboard/settings/centers" className="labo-card p-6 flex flex-col items-center justify-center text-center hover:border-blue-500 transition-colors group cursor-pointer">
            <Building2 className="w-16 h-16 text-blue-100 group-hover:text-blue-500 mb-4 transition-colors" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">إدارة المراكز الطبية</h2>
            <p className="text-slate-500 text-sm">أضف وتحكم في المستشفيات ومراكز التبرع في النظام.</p>
          </Link>
        )}

        <div className="labo-card p-6 flex flex-col items-center justify-center text-center opacity-70">
          <Settings className="w-16 h-16 text-slate-200 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">إعدادات النظام العامة</h2>
          <p className="text-slate-500 text-sm">تخصيص إشعارات النظام وتفضيلات المنصة.</p>
        </div>
      </div>
    </div>
  );
}
