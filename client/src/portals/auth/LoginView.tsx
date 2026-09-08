import React, { useState } from 'react';
import { useAuthStore } from '../../state/authStore';
import { Shield, Lock, Mail, Scale, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your official email and password.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (roleEmail: string) => {
    setEmail(roleEmail);
    if (roleEmail.includes('inspector')) setPassword('Inspector#2026');
    else if (roleEmail.includes('senior')) setPassword('Senior#2026');
    else if (roleEmail.includes('admin')) setPassword('Admin#2026');
    else setPassword('Inspector#2026');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-[#1E293B]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center p-3.5 bg-[#174A7E] text-white rounded-2xl shadow-sm mb-4">
          <Scale className="w-9 h-9" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-[#1E293B] flex items-center justify-center gap-2">
          PACKSURE
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EBF3FA] text-[#174A7E] border border-[#CBD5E1]">
            COMPLIANCE PLATFORM
          </span>
        </h2>
        <p className="mt-1.5 text-xs text-[#64748B] font-medium">
          Legal Metrology (Packaged Commodities) Rules, 2011 and applicable amendments
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm rounded-xl border border-[#D8DDE3]">
          {error && (
            <div className="mb-5 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] px-4 py-3 rounded-lg flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 text-[#B91C1C] flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">
                Official Inspector / Officer Email
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                  <Mail className="h-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@legalmetrology.gov.in"
                  className="block w-full pl-10 pr-3 py-2.5 bg-white border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#174A7E] focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">
                Security Password
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                  <Lock className="h-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 bg-white border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#174A7E] focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg shadow-xs text-xs font-bold text-white bg-[#174A7E] hover:bg-[#0F3B66] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#174A7E] disabled:opacity-50 transition cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Compliance Workstation</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-[#E2E8F0]">
            <div className="flex items-center gap-1.5 mb-2.5 text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              <UserCheck className="w-3.5 h-3.5 text-[#174A7E]" />
              <span>Select Authorized Role for Testing</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('inspector@legalmetrology.gov.in')}
                className="px-2 py-2 text-xs font-semibold rounded-lg bg-[#F0FDF4] hover:bg-[#DCFCE7] border border-[#BBF7D0] text-[#166534] transition text-center cursor-pointer"
              >
                👮 Inspector
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('senior@legalmetrology.gov.in')}
                className="px-2 py-2 text-xs font-semibold rounded-lg bg-[#FFFBEB] hover:bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] transition text-center cursor-pointer"
              >
                ⚖️ Senior Officer
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@legalmetrology.gov.in')}
                className="px-2 py-2 text-xs font-semibold rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#334155] transition text-center cursor-pointer"
              >
                🛡️ Admin
              </button>
            </div>
            <p className="mt-2 text-[11px] text-[#64748B] text-center">
              Testing password configured automatically.
            </p>
          </div>
        </div>

        {/* Security Notice Footer */}
        <div className="mt-6 text-center text-xs text-[#64748B] flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-[#64748B]" />
          <span>Department of Consumer Affairs &bull; Legal Metrology Division</span>
        </div>
      </div>
    </div>
  );
};

