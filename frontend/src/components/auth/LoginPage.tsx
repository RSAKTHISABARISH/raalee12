import React, { useState } from 'react';
import { login } from '../../lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);
      const role = data.user.role;
      if (role === 'TECHNICIAN') {
        window.location.href = '/technician/dashboard';
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('password123');
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 lg:p-8 bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: "linear-gradient(rgba(10, 10, 12, 0.82), rgba(10, 10, 12, 0.90)), url('/background.jpg')",
      }}
    >
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-white/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
        {/* Left Side: Brand & Hero Showcase */}
        <div
          className="lg:col-span-5 p-8 lg:p-10 flex flex-col justify-between text-white relative bg-cover bg-center"
          style={{
            backgroundImage: "linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(20,20,25,0.92) 100%), url('/background.jpg')",
          }}
        >
          <div>
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-medium tracking-wide mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Enterprise IT Operations 360
            </div>
            <h1 className="text-3xl font-bold tracking-tight">HelpDesk 360</h1>
            <p className="text-xs text-white/70 mt-2 leading-relaxed">
              Real-time incident management, SLA tracking, priority routing, and technician assignment for mission-critical operations.
            </p>
          </div>

          <div className="my-8 space-y-3">
            <div className="flex items-center gap-3 text-xs text-white/80 bg-white/5 p-2.5 rounded-lg border border-white/10">
              <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Automated SLA Response & Escalation</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/80 bg-white/5 p-2.5 rounded-lg border border-white/10">
              <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Immutable Audit Trail & Status History</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/80 bg-white/5 p-2.5 rounded-lg border border-white/10">
              <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Role-Based Access (Employee / Tech)</span>
            </div>
          </div>

          <div className="text-[11px] text-white/50 pt-4 border-t border-white/10">
            Powered by Java Spring Boot 3 & Astro React
          </div>
        </div>

        {/* Right Side: Sign-In Form */}
        <div className="lg:col-span-7 p-8 lg:p-10 flex flex-col justify-center bg-white">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#111111]">Sign In to Portal</h2>
            <p className="text-xs text-[#666666] mt-1">Enter your corporate credentials to continue</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[#111111] mb-1.5">
                Corporate Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="alice@company.com"
                className="w-full px-3.5 py-2.5 bg-white border border-[#E5E5E5] rounded-lg text-sm text-[#111111] placeholder-[#999999] focus:outline-hidden focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-default"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-[#111111] mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-white border border-[#E5E5E5] rounded-lg text-sm text-[#111111] placeholder-[#999999] focus:outline-hidden focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-default"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#111111] text-white text-sm font-semibold rounded-lg hover:bg-[#2b2b2b] focus:outline-hidden disabled:bg-[#888888] transition-default cursor-pointer mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-[#EBEBEB]">
            <span className="text-[11px] font-semibold text-[#888888] uppercase tracking-wider block mb-2.5">
              Quick One-Click Demo Access
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('alice@company.com')}
                className="p-2.5 text-left border border-[#E5E5E5] hover:border-[#111111] bg-[#FAFAFA] rounded-lg transition-default cursor-pointer"
              >
                <div className="text-xs font-semibold text-[#111111]">Employee</div>
                <div className="text-[11px] text-[#666666] truncate">alice@company.com</div>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('dave@company.com')}
                className="p-2.5 text-left border border-[#E5E5E5] hover:border-[#111111] bg-[#FAFAFA] rounded-lg transition-default cursor-pointer"
              >
                <div className="text-xs font-semibold text-[#111111]">Technician</div>
                <div className="text-[11px] text-[#666666] truncate">dave@company.com</div>
              </button>
            </div>
            <p className="text-[11px] text-[#888888] mt-2 text-center">Default Password: <code className="bg-[#F0F0F0] px-1.5 py-0.5 rounded text-[#111111]">password123</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}
