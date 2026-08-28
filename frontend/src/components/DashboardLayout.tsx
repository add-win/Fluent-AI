'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu, X, Sparkles } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-950/40 backdrop-blur-sm">
          <div className="relative">
            <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 -right-12 p-2 bg-slate-900 text-white rounded-r-lg"
              title="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Ambient background glows */}
        <div className="glow-orb bg-blue-600 w-96 h-96 top-10 left-10" />
        <div className="glow-orb bg-indigo-600 w-96 h-96 bottom-10 right-10" />

        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 z-10">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            title="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Right Status Badge */}
          <div className="ml-auto flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 fill-current" />
              <span>Personal Coach</span>
            </div>
          </div>
        </header>

        {/* Content View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10 relative z-1">
          {children}
        </main>
      </div>
    </div>
  );
};
export default DashboardLayout;
