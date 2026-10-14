import React from 'react';
import { Link } from 'react-router-dom';
import { LandingNavbar } from '../components/layout/LandingNavbar';
import {
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  BrainCircuit,
  Lock,
  Layers,
  FileCheck2,
  TrendingUp,
  Cpu,
  Award,
  Users,
  Compass,
  FileSearch,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="blueprint-grid min-h-screen text-[#0F172A] relative overflow-x-hidden flex flex-col justify-between">
      {/* Background Ambient Glows */}
      <div className="fixed -top-24 left-1/4 w-96 h-96 bg-sky-200/45 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-teal-200/45 rounded-full blur-[120px] pointer-events-none" />

      {/* TrustHireAI Landing Navbar */}
      <LandingNavbar />

      <main className="flex-1 relative z-10 px-4 sm:px-6 lg:px-8 py-8 md:py-14 space-y-16 md:space-y-24 max-w-7xl mx-auto w-full">
        {/* HERO SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Hero Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-sky-50 border border-sky-200 text-[#0284C7] shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#0284C7]" />
              <span>Unified CredRAG & Proctored Assessment Engine</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0A192F] tracking-tight leading-[1.12]">
              Understand resumes. <br />
              <span className="bg-gradient-to-r from-[#072969] via-[#0284C7] to-[#0D9488] bg-clip-text text-transparent">
                Verify real credibility.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-medium max-w-2xl">
              Move beyond keyword-stuffed resumes. TrustHireAI combines multi-factor CredRAG evidence retrieval with adaptive, server-authoritative proctored technical assessments.
            </p>

            {/* Hero Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                to="/register"
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#072969] via-[#0284C7] to-[#0D9488] text-white font-extrabold text-sm shadow-md shadow-sky-600/20 hover:shadow-lg hover:brightness-105 active:scale-[0.98] transition-all inline-flex items-center gap-2"
              >
                <span>Verify Your Skills</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/login"
                className="px-6 py-3.5 rounded-xl bg-white border border-slate-300 text-slate-800 font-extrabold text-sm hover:bg-slate-50 hover:border-slate-400 active:scale-[0.98] transition-all shadow-xs"
              >
                Recruiter Access
              </Link>

              <Link
                to="/how-it-works"
                className="px-5 py-3.5 rounded-xl text-slate-600 hover:text-[#0284C7] font-bold text-sm transition-colors inline-flex items-center gap-1.5"
              >
                <Compass className="w-4 h-4 text-[#0284C7]" />
                <span>How It Works</span>
              </Link>
            </div>

            {/* Quick Trust Highlights */}
            <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-500 font-semibold border-t border-slate-200/80">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Grounded Gemini Verification</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0284C7] shrink-0" />
                <span>Anti-Tamper Timers</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Transparent 30/50/20 Formula</span>
              </div>
            </div>
          </div>

          {/* Right Hero Column: CredRAG Live Report Card Preview */}
          <div className="lg:col-span-5 relative">
            <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xl shadow-slate-200/60 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-100/60 rounded-full blur-2xl pointer-events-none" />
              
              {/* Card Header */}
              <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#072969]">
                    LIVE CREDRAG REPORT
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-teal-50 border border-teal-200 text-teal-700">
                  Demo Preview
                </span>
              </div>

              {/* TrustScore Summary */}
              <div className="py-5">
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Candidate Credibility Breakdown
                    </h4>
                    <div className="text-3xl font-black text-[#0A192F] mt-0.5">
                      90<span className="text-base font-bold text-slate-400">/100</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-emerald-50 border border-emerald-200 text-emerald-700">
                    Strong Evidence
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                  <div className="bg-[#0284C7] h-full" style={{ width: '30%' }} title="30% Evidence" />
                  <div className="bg-[#072969] h-full" style={{ width: '45%' }} title="50% Exam" />
                  <div className="bg-teal-500 h-full" style={{ width: '15%' }} title="20% Align" />
                </div>
              </div>

              {/* Verified Skill Evidence Snippets */}
              <div className="space-y-3 pt-2">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between text-xs font-bold text-[#0A192F]">
                    <span>React & TypeScript</span>
                    <span className="text-[#0284C7] font-black">92% Verified</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>Work Experience Chunk #4</span>
                    <span className="font-semibold text-slate-600">1.00 Weight</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between text-xs font-bold text-[#0A192F]">
                    <span>Node.js & MongoDB Vector DB</span>
                    <span className="text-teal-700 font-black">95% Verified</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>Project Chunk #2</span>
                    <span className="font-semibold text-slate-600">0.95 Weight</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between text-xs font-bold text-[#0A192F]">
                    <span>System Architecture & Microservices</span>
                    <span className="text-[#072969] font-black">88% Verified</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>Work Experience Chunk #1</span>
                    <span className="font-semibold text-slate-600">1.00 Weight</span>
                  </div>
                </div>
              </div>

              {/* TrustScore Formula Breakdown Pill */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between bg-sky-50/60 p-3 rounded-2xl border border-sky-100 text-xs font-bold">
                <span className="text-[#072969]">TrustScore Formula:</span>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-[#0284C7]">30% Resume</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[#072969]">50% Exam</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-teal-700">20% Align</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HERO METRIC STRIP */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 transform -translate-y-8">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs text-center">
            <div className="text-2xl md:text-3xl font-black text-[#072969]">1.000</div>
            <div className="text-xs font-bold text-slate-800 mt-1">F1-Score</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Full CredRAG Precision@K</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs text-center">
            <div className="text-2xl md:text-3xl font-black text-[#0284C7]">768-D</div>
            <div className="text-xs font-bold text-slate-800 mt-1">Normalized Vectors</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Semantic (0.7) + Lexical (0.3)</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs text-center">
            <div className="text-2xl md:text-3xl font-black text-[#0D9488]">RAI-XXXXX</div>
            <div className="text-xs font-bold text-slate-800 mt-1">Server Exam Rooms</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Server-authoritative timers</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs text-center">
            <div className="text-2xl md:text-3xl font-black text-slate-800">Zero-Bias</div>
            <div className="text-xs font-bold text-slate-800 mt-1">Compliance Audits</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Non-accusatory timeline</div>
          </div>
        </section>

        {/* 3-STEP PIPELINE SECTION */}
        <section className="bg-white/80 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-sm">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">
              Deterministic Verification Architecture
            </span>
            <h3 className="text-xl md:text-2xl font-black text-[#0A192F] mt-1">
              Three-Stage Evidence & Assessment Pipeline
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 01 */}
            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:border-sky-300 transition-colors">
              <div className="text-xs font-black text-[#0284C7] tracking-wider uppercase mb-2">
                01. RESUME CHUNKING
              </div>
              <h4 className="text-base font-extrabold text-[#0A192F] mb-1">
                768-D CredRAG Engine
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Skill-aware segmentation tagged by source type. Work experience (1.00) and projects (0.95) weighted higher than keyword claims.
              </p>
            </div>

            {/* Step 02 */}
            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:border-teal-300 transition-colors">
              <div className="text-xs font-black text-[#0D9488] tracking-wider uppercase mb-2">
                02. ADAPTIVE EXAM
              </div>
              <h4 className="text-base font-extrabold text-[#0A192F] mb-1">
                Room RAI-XXXXX Proctoring
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Server-authoritative timers, neutral integrity telemetry (tab switches, webcam snapshots), and adaptive difficulty (Easy / Medium / Hard).
              </p>
            </div>

            {/* Step 03 */}
            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:border-blue-300 transition-colors">
              <div className="text-xs font-black text-[#072969] tracking-wider uppercase mb-2">
                03. TRUSTSCORE
              </div>
              <h4 className="text-base font-extrabold text-[#0A192F] mb-1">
                30 / 50 / 20 Synthesized Score
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Explainable, grounded audit report: 30% Resume Evidence, 50% Proctored Exam, and 20% Semantic Job Alignment.
              </p>
            </div>
          </div>
        </section>

        {/* FOLLOW-UP SECTION: BUILT FOR BOTH SIDES OF THE TABLE */}
        <section className="space-y-10">
          <div className="text-center max-w-2xl mx-auto">
            <span className="px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-teal-50 border border-teal-200 text-teal-700 shadow-xs">
              Unified Hiring Ecosystem
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0A192F] mt-3 tracking-tight">
              Built for{' '}
              <span className="bg-gradient-to-r from-[#0284C7] to-[#0D9488] bg-clip-text text-transparent">
                both sides
              </span>{' '}
              of the table.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Candidate Card */}
            <div className="candidate-light-card rounded-3xl p-7 md:p-8 flex flex-col justify-between relative overflow-hidden">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-11 h-11 rounded-2xl bg-sky-100 border border-sky-200 flex items-center justify-center text-[#0284C7] shadow-xs text-lg">
                    🛡️
                  </div>
                  <div className="bg-white/90 backdrop-blur-md border border-sky-200/90 rounded-full px-3.5 py-1.5 flex items-center gap-2 text-xs shadow-xs">
                    <span className="text-[#0284C7] font-extrabold">
                      30% <span className="text-[10px] font-medium text-slate-500">Evd</span>
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-[#072969] font-extrabold">
                      50% <span className="text-[10px] font-medium text-slate-500">Test</span>
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-teal-600 font-extrabold">
                      20% <span className="text-[10px] font-medium text-slate-500">Align</span>
                    </span>
                  </div>
                </div>

                <h3 className="text-2xl font-extrabold text-[#0A192F]">For Candidates</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                  Stand out with mathematically proven competence. Turn real project and work experience into verified credibility scores.
                </p>

                <ul className="space-y-2.5 mt-5 text-xs text-slate-700 font-semibold">
                  <li className="flex items-center gap-2">
                    <span className="text-[#0284C7] font-bold">✓</span>
                    <span>CredRAG source-weighted resume evidence mapping</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#0284C7] font-bold">✓</span>
                    <span>Adaptive proctored assessments (Easy / Medium / Hard)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#0284C7] font-bold">✓</span>
                    <span>Transparent 30/50/20 TrustScore report card</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/register?role=candidate"
                className="mt-7 w-fit px-5 py-2.5 rounded-xl bg-[#0284C7] hover:bg-sky-600 text-white font-bold text-xs shadow-sm hover:shadow transition-all inline-flex items-center gap-2"
              >
                <span>Verify Your Resume</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Recruiter Card */}
            <div className="recruiter-light-card rounded-3xl p-7 md:p-8 flex flex-col justify-between relative overflow-hidden">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-11 h-11 rounded-2xl bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-700 shadow-xs text-lg">
                    💼
                  </div>
                  <div className="bg-white/90 backdrop-blur-md border border-teal-200/90 rounded-full px-3.5 py-1.5 text-[11px] font-extrabold text-teal-700 shadow-xs">
                    LIVE ROOM: RAI-DEMO1
                  </div>
                </div>

                <h3 className="text-2xl font-extrabold text-[#0A192F]">For Recruiters</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                  Skip keyword-stuffed resumes. Discover candidates with grounded Gemini evidence and server-authoritative exam scores.
                </p>

                <ul className="space-y-2.5 mt-5 text-xs text-slate-700 font-semibold">
                  <li className="flex items-center gap-2">
                    <span className="text-teal-600 font-bold">✓</span>
                    <span>768-D semantic talent search across all resumes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-teal-600 font-bold">✓</span>
                    <span>Custom screening rooms (RAI-XXXXX) with server timers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-teal-600 font-bold">✓</span>
                    <span>Non-accusatory compliance & proctoring timeline</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/register?role=recruiter"
                className="mt-7 w-fit px-5 py-2.5 rounded-xl bg-[#0D9488] hover:bg-teal-700 text-white font-bold text-xs shadow-sm hover:shadow transition-all inline-flex items-center gap-2"
              >
                <span>Hire Verified Talent</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* CTA LIGHT BANNER */}
        <section className="max-w-5xl mx-auto rounded-3xl p-8 md:p-12 text-center relative overflow-hidden cta-light-banner">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/85 border border-sky-200 text-[10px] font-extrabold tracking-widest uppercase text-[#072969] mb-3 shadow-xs">
            ✨ Start Today — Zero Setup Friction
          </div>

          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-[#0A192F]">
            START BUILDING{' '}
            <span className="bg-gradient-to-r from-[#072969] via-[#0284C7] to-[#0D9488] bg-clip-text text-transparent">
              TRUST.
            </span>
          </h2>

          <p className="text-xs md:text-sm text-slate-600 font-medium max-w-md mx-auto mt-2 leading-relaxed">
            Join candidates and engineering teams using CredRAG to make hiring transparent, explainable, and evidence-based.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/register"
              className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#072969] via-[#0284C7] to-[#0D9488] text-white font-extrabold text-xs shadow-md hover:brightness-105 active:scale-[0.98] transition-all"
            >
              Create Free Account →
            </Link>
            <Link
              to="/how-it-works"
              className="px-6 py-3.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
            >
              Explore How It Works
            </Link>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="mt-16 border-t border-slate-200/80 bg-white/80 backdrop-blur-md py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#072969] to-[#0284C7] flex items-center justify-center text-white font-black text-xs">
              TH
            </div>
            <div>
              <span className="font-extrabold text-[#0A192F] text-sm">TrustHireAI</span>
              <span className="block text-[10px] text-slate-400">Verified Skills. Smarter Hiring.</span>
            </div>
          </div>

          <div className="flex items-center gap-6 font-bold text-slate-600">
            <Link to="/features" className="hover:text-[#0284C7] transition">Features</Link>
            <Link to="/how-it-works" className="hover:text-[#0284C7] transition">How It Works</Link>
            <Link to="/pricing" className="hover:text-[#0284C7] transition">Pricing</Link>
            <Link to="/security" className="hover:text-[#0284C7] transition">Security</Link>
            <Link to="/resources" className="hover:text-[#0284C7] transition">Resources</Link>
          </div>

          <div className="flex items-center gap-2">
            <span>© 2026 TrustHireAI</span>
            <span>•</span>
            <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 text-[10px] font-bold">
              V2.5 CredRAG Release
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
