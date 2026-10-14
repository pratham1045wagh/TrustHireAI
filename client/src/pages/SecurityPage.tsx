import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LandingNavbar } from '../components/layout/LandingNavbar';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Lock,
  Eye,
  Clock,
  Database,
  FileCheck2,
  CheckCircle2,
  KeyRound,
  ShieldAlert,
  Server,
} from 'lucide-react';

export const SecurityPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const securityPillars = [
    {
      icon: <Lock className="w-6 h-6 text-[#0284C7]" />,
      title: 'Authentication & Session Integrity',
      desc: 'Industry-standard JWT authentication and salted bcrypt password hashing.',
      details: [
        'Bcrypt password encryption with cryptographic salt rounds',
        'Signed stateless JSON Web Tokens with calibrated expiry',
        'Strict role-based authorization guards (Candidate / Recruiter / Admin)',
        'Automatic token revocation and secure cookie session storage',
      ],
    },
    {
      icon: <Database className="w-6 h-6 text-teal-600" />,
      title: 'Strict Candidate Metadata Isolation',
      desc: 'Mandatory tenant and candidate boundary isolation across all vector queries.',
      details: [
        'Queries are unconditionally partitioned by userId and resumeId',
        'Zero cross-contamination between different applicants in vector search',
        'Logical chunking isolates work experience from external documents',
        'Raw resume documents are stored in secure, permissioned storage',
      ],
    },
    {
      icon: <Clock className="w-6 h-6 text-[#072969]" />,
      title: 'Server-Authoritative Assessment Timers',
      desc: 'Tamper-proof countdowns enforced directly by backend server processes.',
      details: [
        'Test duration locked on server: startedAt + durationMs = expiresAt',
        'Prevents client-side devtools clock manipulation or browser pausing',
        'Automated backend auto-submission when session deadline expires',
        'Instant fallback question bank prevents exam freezes during network blips',
      ],
    },
    {
      icon: <Eye className="w-6 h-6 text-[#0284C7]" />,
      title: 'Non-Accusatory Integrity Monitoring',
      desc: 'Objective telemetry tracking without biased algorithmic accusations.',
      details: [
        'Detects tab-switching events (window blur/focus changes)',
        'Full-screen exit and copy/paste monitoring during live testing',
        'Periodic candidate webcam snapshot verification (~every 40s)',
        'Factual, non-accusatory compliance timeline presented for human recruiter review',
      ],
    },
    {
      icon: <Server className="w-6 h-6 text-teal-600" />,
      title: 'API Security & Protected Endpoints',
      desc: 'Hardened Express endpoints with input sanitization and authorization middleware.',
      details: [
        'Every API endpoint validates authentication tokens before controller execution',
        'Schema-level payload validation prevents injection and malformed inputs',
        'Rate-limiting safeguards protect against brute-force query attacks',
        'Protected environment variables shield all third-party AI credentials',
      ],
    },
    {
      icon: <FileCheck2 className="w-6 h-6 text-[#072969]" />,
      title: 'Immutable Audit Trails & Governance',
      desc: 'System-wide audit logging for administrative compliance and review.',
      details: [
        'Filterable audit logs recording all account actions, tests, and room creations',
        'Vector DB diagnostic tracking with dimension verification (768-D)',
        'Real-time token usage telemetry and fallback event logging',
        'Zero-bias compliance reports available for recruitment auditing',
      ],
    },
  ];

  return (
    <div className="blueprint-grid min-h-screen text-[#0F172A] relative overflow-x-hidden flex flex-col justify-between">
      {/* Background Accent Glows */}
      <div className="fixed -top-24 left-1/4 w-96 h-96 bg-sky-200/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-teal-200/40 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Navbar */}
      <LandingNavbar />

      <main className="flex-1 relative z-10 px-4 sm:px-6 lg:px-8 py-8 md:py-12 max-w-7xl mx-auto w-full space-y-12">
        {/* TOP BACK BUTTON */}
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-[#0284C7] hover:border-sky-300 font-bold text-xs shadow-xs transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Back to Home</span>
          </Link>
        </div>

        {/* HERO HEADER */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-teal-50 border border-teal-200 text-teal-700 shadow-xs">
            Platform Security & Integrity Architecture
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-[#0A192F] tracking-tight">
            Security, privacy &{' '}
            <span className="bg-gradient-to-r from-[#072969] via-[#0284C7] to-[#0D9488] bg-clip-text text-transparent">
              exam integrity.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            TrustHireAI is architected from the ground up to protect candidate privacy, ensure exam fairness with server-authoritative timers, and prevent resume exaggeration.
          </p>
        </div>

        {/* SECURITY PILLARS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {securityPillars.map((p) => (
            <div
              key={p.title}
              className="bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-3xl p-6 flex flex-col justify-between shadow-xs hover:border-sky-300 hover:shadow-md transition-all group"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-2xs">
                  {p.icon}
                </div>
                <h3 className="text-lg font-extrabold text-[#0A192F] mb-1.5 group-hover:text-[#0284C7] transition-colors">
                  {p.title}
                </h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4">
                  {p.desc}
                </p>

                <div className="space-y-2.5 pt-3 border-t border-slate-100">
                  {p.details.map((d) => (
                    <div key={d} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                      <span className="font-medium leading-tight">{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* PROCTORING INTEGRITY HIGHLIGHT CARD */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-7 md:p-9 border border-sky-200/80 shadow-sm max-w-5xl mx-auto space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#0284C7]">
            <ShieldCheck className="w-4 h-4 text-[#0284C7]" />
            <span>Zero-Bias Proctoring Philosophy</span>
          </div>
          <h3 className="text-2xl font-black text-[#0A192F]">
            Neutral observations instead of opaque algorithmic bans.
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
            Traditional automated proctoring systems often use fragile AI algorithms that make false accusations when candidates look away or blink. TrustHireAI captures factual, non-accusatory events (e.g. "Tab switch event recorded: window focus changed") alongside periodic snapshots, giving human recruiters complete contextual transparency without unfair automated disqualifications.
          </p>
        </div>

        {/* BOTTOM NAVIGATION & CTA */}
        <div className="pt-8 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 font-extrabold text-xs hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Back to Home</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/how-it-works"
              className="px-5 py-2.5 rounded-xl border border-sky-300 bg-sky-50 text-[#0284C7] font-bold text-xs hover:bg-sky-100 transition"
            >
              See How It Works →
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-xl bg-[#0B1528] text-white font-extrabold text-xs shadow-sm hover:brightness-110 transition"
            >
              Start Free Verification →
            </Link>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="mt-16 border-t border-slate-200/80 bg-white/80 py-8 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#072969] to-[#0284C7] flex items-center justify-center text-white font-black text-xs">
              TH
            </div>
            <span className="font-bold text-[#0A192F]">TrustHireAI — Verified Skills. Smarter Hiring.</span>
          </div>

          <div className="flex items-center gap-6 font-bold text-slate-600">
            <Link to="/features" className="hover:text-[#0284C7] transition">Features</Link>
            <Link to="/how-it-works" className="hover:text-[#0284C7] transition">How It Works</Link>
            <Link to="/pricing" className="hover:text-[#0284C7] transition">Pricing</Link>
            <Link to="/security" className="hover:text-[#0284C7] transition">Security</Link>
            <Link to="/resources" className="hover:text-[#0284C7] transition">Resources</Link>
          </div>

          <span>© 2026 TrustHireAI • V2.5 CredRAG Release</span>
        </div>
      </footer>
    </div>
  );
};
