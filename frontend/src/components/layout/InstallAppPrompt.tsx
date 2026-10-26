import React, { useState, useEffect } from 'react';

export default function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already running in standalone App mode
    const isRunningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(isRunningStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      setIsStandalone(true);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('To install this app on your device:\n• On Windows / Chrome / Edge: Click the Install icon in the browser address bar (top-right).\n• On iPhone / iPad: Tap the Share button in Safari, then select "Add to Home Screen".');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  // If already running inside standalone app, show subtle "App Mode" status
  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* Floating App Install Banner for First-Time Desktop & Mobile Visitors */}
      {isInstallable && !dismissed && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-lg bg-gradient-to-r from-[#0F172A] to-[#1E293B] border border-sky-500/30 text-white rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-md">
              <img src="/icons/app-icon.svg" alt="App Icon" className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                Install HelpDesk 360 App
                <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[9px] font-bold rounded">PWA</span>
              </h4>
              <p className="text-[11px] text-white/70">Install for faster desktop & offline access with no browser address bar</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-[#0F172A] text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              Install App
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1.5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Floating Corner Quick Install Button (Always available for users who want to install) */}
      {!isStandalone && (
        <button
          onClick={handleInstallClick}
          title="Install HelpDesk 360 as Desktop / Mobile App"
          className="fixed bottom-6 left-6 z-40 hidden sm:flex items-center gap-2 px-3 py-2 bg-[#0F172A]/90 hover:bg-[#1E293B] border border-white/15 text-white/90 hover:text-white text-xs font-semibold rounded-full shadow-xl backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
        >
          <img src="/icons/app-icon.svg" alt="App Icon" className="w-4 h-4" />
          <span>Install App</span>
        </button>
      )}
    </>
  );
}
