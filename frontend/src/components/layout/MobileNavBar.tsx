import React, { useState, useEffect } from 'react';
import { getUser } from '../../lib/api';

export default function MobileNavBar() {
  const [user, setUser] = useState<any>(null);
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    setUser(getUser());
    if (typeof window !== 'undefined') {
      setCurrentPath(window.location.pathname);
    }
  }, []);

  if (!user) return null;

  const isTech = user.role === 'TECHNICIAN';
  const homeHref = isTech ? '/technician/dashboard' : '/dashboard';
  const queueHref = isTech ? '/technician/queue' : '/tickets/my';

  const isHomeActive = currentPath === '/dashboard' || currentPath === '/technician/dashboard';
  const isQueueActive = currentPath === '/tickets/my' || currentPath === '/technician/queue';
  const isCreateActive = currentPath === '/tickets/create';

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0F172A]/95 backdrop-blur-xl border-t border-white/10 px-4 py-2 pb-safe shadow-2xl flex items-center justify-around text-[10px] font-medium text-white/70">
      {/* Home / Dashboard */}
      <a
        href={homeHref}
        className={`flex flex-col items-center gap-1 transition-all ${
          isHomeActive ? 'text-emerald-400 font-bold scale-105' : 'hover:text-white'
        }`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isHomeActive ? 2.5 : 1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
        <span>Home</span>
      </a>

      {/* Incidents / Queue */}
      <a
        href={queueHref}
        className={`flex flex-col items-center gap-1 transition-all ${
          isQueueActive ? 'text-emerald-400 font-bold scale-105' : 'hover:text-white'
        }`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isQueueActive ? 2.5 : 1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
        </svg>
        <span>{isTech ? 'Queue' : 'My Tickets'}</span>
      </a>

      {/* Center Floating Plus Action */}
      <a
        href="/tickets/create"
        className={`-mt-5 w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-transform active:scale-95 border-2 border-[#0F172A] ${
          isCreateActive ? 'ring-2 ring-emerald-400' : ''
        }`}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </a>

      {/* Search / Triage */}
      <a
        href={isTech ? '/technician/queue' : '/tickets/my'}
        className="flex flex-col items-center gap-1 hover:text-white transition-all"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <span>Search</span>
      </a>

      {/* User Role */}
      <div className="flex flex-col items-center gap-1 text-white/50">
        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold text-white uppercase">
          {user.role?.[0] || 'U'}
        </div>
        <span className="capitalize">{user.role?.toLowerCase() || 'User'}</span>
      </div>
    </nav>
  );
}
