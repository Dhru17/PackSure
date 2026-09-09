import { useEffect } from 'react';
import { useAuthStore } from './state/authStore';
import { LoginView } from './portals/auth/LoginView';
import { AppHeader } from './components/layout/AppHeader';
import { InspectorPortal } from './portals/inspector/InspectorPortal';
import { SeniorOfficerPortal } from './portals/senior_officer/SeniorOfficerPortal';
import { AdminPortal } from './portals/admin/AdminPortal';
import { CompanyPortal } from './portals/company/CompanyPortal';
import { Scale } from 'lucide-react';

export function App() {
  const { user, isLoading, activeRole, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex flex-col items-center justify-center text-[#475569] space-y-4">
        <div className="p-4 bg-[#EBF3FA] text-[#174A7E] rounded-2xl border border-[#CBD5E1] shadow-xs">
          <Scale className="w-9 h-9 animate-spin text-[#174A7E]" />
        </div>
        <div className="text-xs font-bold tracking-wider text-[#64748B] uppercase">
          Initializing Packsure Legal Metrology Engine...
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-[#1E293B] flex flex-col font-sans">
      <AppHeader />
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeRole === 'INSPECTOR' && <InspectorPortal />}
        {activeRole === 'SENIOR_OFFICER' && <SeniorOfficerPortal />}
        {activeRole === 'ADMIN' && <AdminPortal />}
        {activeRole === 'COMPANY' && <CompanyPortal />}
      </main>
      <footer className="border-t border-[#D8DDE3] bg-white py-4 text-center text-xs text-[#64748B]">
        <div className="max-w-[1600px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Packsure &bull; Legal Metrology (Packaged Commodities) Rules, 2011 and applicable amendments</span>
          <span className="text-[11px] text-[#94A3B8]">Department of Consumer Affairs &bull; Legal Metrology Division</span>
        </div>
      </footer>
    </div>
  );
}

export default App;

