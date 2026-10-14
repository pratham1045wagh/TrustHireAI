import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, CheckCircle2, ChevronDown, Menu, X, ArrowRight, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LandingNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Features', path: '/features' },
    { name: 'How It Works', path: '/how-it-works' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Security', path: '/security' },
    { name: 'Resources', path: '/resources' },
  ];

  return (
    <div className="sticky top-4 sm:top-6 z-50 px-3 sm:px-6 w-full max-w-[1360px] mx-auto transition-all">
      <header className="bg-white border border-[#E2E8F0] rounded-[22px] shadow-[0_4px_25px_-4px_rgba(15,23,42,0.06)] px-6 sm:px-8 h-[84px] flex items-center justify-between">
        
        {/* LEFT: TrustHireAI Logo & Brand */}
        <Link to="/" className="flex items-center gap-3.5 shrink-0 group">
          {/* Logo badge with document icon & verified checkmark badge */}
          <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-b from-[#094c8b] to-[#023e73] flex items-center justify-center text-white shadow-sm shrink-0 group-hover:scale-102 transition-transform">
            <FileText className="w-5 h-5 text-white stroke-[2.2]" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#0284c7] fill-white" />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="text-[20px] font-black tracking-tight leading-none text-[#0A192F]">
              TrustHire<span className="text-[#0284C7]">AI</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1 tracking-tight">
              Verified Skills. Smarter Hiring.
            </div>
          </div>
        </Link>

        {/* CENTER NAVIGATION (Desktop) */}
        {/* Route-aware active states: Features | How It Works | Pricing | Security | Resources */}
        <nav className="hidden lg:flex items-center gap-1.5 sm:gap-2 text-[15px]">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3.5 py-1.5 rounded-xl transition-all duration-150 ${
                  isActive
                    ? 'bg-[#F0F5FA] text-[#0A192F] font-bold shadow-2xs'
                    : 'text-slate-700 hover:text-[#0284C7] hover:bg-slate-50/80 font-semibold'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* RIGHT NAVIGATION: Login & Start Now */}
        <div className="hidden lg:flex items-center gap-6 shrink-0">
          {user ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#0284C7]" />
              <span>Go to Dashboard</span>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-[15px] font-bold text-[#0A192F] hover:text-[#0284C7] transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#0B1528] hover:bg-[#111f38] text-white text-[14px] font-bold shadow-md shadow-slate-900/10 active:scale-[0.98] transition-all"
              >
                <span>Start Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <div className="flex items-center gap-2 lg:hidden">
          {user && (
            <Link
              to="/dashboard"
              className="px-3 py-1.5 rounded-lg bg-sky-50 text-[#0284C7] text-xs font-bold border border-sky-200"
            >
              Dashboard
            </Link>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-2 border border-slate-200/90 rounded-2xl bg-white/98 backdrop-blur-md px-5 pt-3 pb-6 space-y-2 shadow-xl animate-in slide-in-from-top-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-xl text-sm font-bold transition ${
                  isActive ? 'bg-[#F0F5FA] text-[#0284C7]' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.name}
              </Link>
            );
          })}

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            {user ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 px-4 rounded-xl bg-[#0B1528] text-white font-bold text-xs"
              >
                Go to Workspace Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 px-4 rounded-xl bg-[#0B1528] text-white font-extrabold text-xs shadow-sm"
                >
                  Start Now →
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
