import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LandingNavbar } from '../components/layout/LandingNavbar';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Zap,
  Building2,
  User,
  HelpCircle,
} from 'lucide-react';

export const PricingPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const plans = [
    {
      name: 'Candidate Free',
      tagline: 'For engineers seeking mathematically verified skill credibility.',
      price: '$0',
      period: 'forever',
      badge: 'Free Forever',
      badgeColor: 'bg-sky-50 text-[#0284C7] border-sky-200',
      features: [
        'Structured resume parsing via Google Gemini',
        'CredRAG skill evidence retrieval & source mapping',
        'Practice adaptive technical assessments',
        'Shareable TrustScore report card (30/50/20 split)',
        'One-click job applications to active postings',
        'Standard candidate dashboard access',
      ],
      buttonText: 'Start Free Verification',
      buttonLink: '/register?role=candidate',
      isPopular: false,
      buttonStyle: 'bg-slate-900 text-white hover:bg-slate-800',
    },
    {
      name: 'Candidate Pro',
      tagline: 'Stand out to top tech teams with priority credibility verification.',
      price: '$15',
      period: 'per month',
      badge: 'For Job Seekers',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
      features: [
        'Unlimited proctored technical assessments',
        'Adaptive difficulty calibration (Easy / Medium / Hard)',
        'Deep evidence citations with exact resume snippets',
        'Full compliance timeline & webcam snapshot audit',
        'Priority talent placement in recruiter semantic search',
        'Downloadable verified competence report PDF',
      ],
      buttonText: 'Upgrade to Candidate Pro',
      buttonLink: '/register?role=candidate',
      isPopular: false,
      buttonStyle: 'bg-[#0284C7] text-white hover:bg-sky-600',
    },
    {
      name: 'Recruiter Pro',
      tagline: 'Discover, evaluate, and hire verified engineers with zero fluff.',
      price: '$199',
      period: 'per month',
      badge: 'Most Popular',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      features: [
        '768-D natural-language semantic candidate search',
        'Custom screening rooms (RAI-XXXXX) with custom skills',
        'Server-authoritative timers & anti-tamper auto-submit',
        'Objective compliance timeline (tab switches, webcam check)',
        'Deep candidate profiles with original evidence review',
        'Semantic alignment / match score for all job applicants',
      ],
      buttonText: 'Start Recruiter Trial',
      buttonLink: '/register?role=recruiter',
      isPopular: true,
      buttonStyle: 'bg-gradient-to-r from-[#072969] via-[#0284C7] to-[#0D9488] text-white hover:brightness-105 shadow-md shadow-sky-600/20',
    },
    {
      name: 'Enterprise Scale',
      tagline: 'Custom infrastructure for high-volume engineering recruitment.',
      price: 'Custom',
      period: 'tailored volume',
      badge: 'Enterprise',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
      features: [
        'Dedicated vector namespace with strict tenant isolation',
        'Custom technical question bank curation & rubric builder',
        'ATS webhooks & automated applicant synchronization',
        'System-wide immutable audit logs & vector health metrics',
        'Custom candidate evaluation workflows & proctor rules',
        'Dedicated account manager & 99.9% testing uptime SLA',
      ],
      buttonText: 'Contact Enterprise Sales',
      buttonLink: '/register?role=recruiter',
      isPopular: false,
      buttonStyle: 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-50',
    },
  ];

  const faqs = [
    {
      q: 'How is the TrustScore computed?',
      a: 'The TrustScore uses an explainable, transparent formula: 30% Resume Evidence (CredRAG source-weighted extraction), 50% Proctored Technical Assessment (server-timed adaptive test), and 20% Consistency/Alignment (overlap between verified background and active job specifications).',
    },
    {
      q: 'What is CredRAG and how does it prevent resume exaggeration?',
      a: 'CredRAG (Credibility-Aware Retrieval-Augmented Generation) uses hierarchical source weighting: Work Experience (1.00) and Projects (0.95) are scored significantly higher than keyword listings (0.30). Claims are verified through 768-D hybrid vector retrieval with bounded lexical matching.',
    },
    {
      q: 'Are proctored timers secure against client clock manipulation?',
      a: 'Yes. All assessment sessions utilize server-authoritative timers. The countdown deadline is stored and validated directly on the backend server. When the server deadline passes, the test auto-submits regardless of client-side clock alterations.',
    },
    {
      q: 'Can candidates practice before taking proctored exams?',
      a: 'Yes, all registered candidates can take adaptive practice questions to familiarize themselves with the testing environment, webcam pre-check, and question formats before taking a recruiter-sponsored screening room test.',
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
          <span className="px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-sky-50 border border-sky-200 text-[#0284C7] shadow-xs">
            Transparent, Evidence-Based Hiring
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-[#0A192F] tracking-tight">
            Simple plans for{' '}
            <span className="bg-gradient-to-r from-[#072969] via-[#0284C7] to-[#0D9488] bg-clip-text text-transparent">
              verified hiring.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            Choose the right plan to verify engineering credentials, conduct server-proctored technical assessments, and eliminate resume inflation.
          </p>
        </div>

        {/* PRICING CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`bg-white/95 backdrop-blur-sm border rounded-3xl p-6 flex flex-col justify-between shadow-xs transition-all relative ${
                p.isPopular
                  ? 'border-[#0284C7] ring-2 ring-sky-500/20 shadow-lg shadow-sky-500/10'
                  : 'border-slate-200/90 hover:border-sky-300 hover:shadow-md'
              }`}
            >
              <div>
                {/* Plan Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${p.badgeColor}`}>
                    {p.badge}
                  </span>
                  {p.isPopular && (
                    <span className="flex items-center gap-1 text-[11px] font-black text-[#0284C7]">
                      <Sparkles className="w-3.5 h-3.5 text-[#0284C7]" />
                      Popular
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-extrabold text-[#0A192F] mb-1">
                  {p.name}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium mb-5">
                  {p.tagline}
                </p>

                {/* Price Display */}
                <div className="pb-5 mb-5 border-b border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-[#0A192F]">{p.price}</span>
                    <span className="text-xs font-bold text-slate-500">/ {p.period}</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-3 mb-6">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    What's included:
                  </span>
                  {p.features.map((f) => (
                    <div key={f} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
                      <span className="font-medium leading-tight">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <Link
                to={p.buttonLink}
                className={`w-full py-3 px-4 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] ${p.buttonStyle}`}
              >
                <span>{p.buttonText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ SECTION */}
        <div className="pt-10 max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">
              Frequently Asked Questions
            </span>
            <h2 className="text-2xl font-black text-[#0A192F]">
              Everything you need to know about TrustHireAI plans
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3">
            {faqs.map((f) => (
              <div
                key={f.q}
                className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2"
              >
                <div className="flex items-center gap-2 text-sm font-bold text-[#0A192F]">
                  <HelpCircle className="w-4 h-4 text-[#0284C7] shrink-0" />
                  <h4>{f.q}</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium pl-6">
                  {f.a}
                </p>
              </div>
            ))}
          </div>
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
              to="/features"
              className="px-5 py-2.5 rounded-xl border border-sky-300 bg-sky-50 text-[#0284C7] font-bold text-xs hover:bg-sky-100 transition"
            >
              Explore Features →
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-xl bg-[#0B1528] text-white font-extrabold text-xs shadow-sm hover:brightness-110 transition"
            >
              Get Started Now →
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
