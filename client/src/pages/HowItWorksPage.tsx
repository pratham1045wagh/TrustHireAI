import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LandingNavbar } from '../components/layout/LandingNavbar';
import {
  ArrowLeft,
  ArrowRight,
  UserCheck,
  Briefcase,
  FileUp,
  BrainCircuit,
  Layers,
  Sparkles,
  Clock,
  Eye,
  CheckCircle2,
  BarChart3,
  ShieldCheck,
  Search,
  Sliders,
  FolderGit2,
  Cpu,
  GraduationCap,
  TrendingUp,
  FileCheck2,
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'BOTH' | 'CANDIDATE' | 'RECRUITER'>('BOTH');

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const candidateSteps = [
    {
      step: '01',
      title: 'Create Account / Sign In',
      subtitle: 'Candidate Onboarding',
      desc: 'Sign up as a Candidate to access your unified career intelligence hub with secure authentication.',
      details: 'Instant access to resume uploading, skill maps, proctored exams, and job applications.',
      icon: <GraduationCap className="w-5 h-5 text-[#0284C7]" />,
      pill: 'Onboarding',
    },
    {
      step: '02',
      title: 'Upload Resume (PDF / DOCX)',
      subtitle: 'Document Ingestion',
      desc: 'Upload your latest resume in PDF or DOCX format. The system automatically preserves document structure.',
      details: 'Fast upload pipeline with progress tracking, format validation, and safe storage.',
      icon: <FileUp className="w-5 h-5 text-teal-600" />,
      pill: 'Ingestion',
    },
    {
      step: '03',
      title: 'Structured AI Resume Processing',
      subtitle: 'Gemini Information Extraction',
      desc: 'Google Gemini extracts structured schemas for work experience, projects, education, certifications, and technical proficiencies.',
      details: 'Eliminates flat text limitations by segmenting each role, date range, company, and achievement into structured data.',
      icon: <BrainCircuit className="w-5 h-5 text-[#072969]" />,
      pill: 'Extraction',
    },
    {
      step: '04',
      title: 'Skill and Evidence Identification',
      subtitle: 'Competency Discovery',
      desc: 'The engine identifies explicit and implicit technical skills mentioned across real work history and project descriptions.',
      details: 'Distinguishes between practical applied skills and isolated keyword listings.',
      icon: <Layers className="w-5 h-5 text-[#0284C7]" />,
      pill: 'Identification',
    },
    {
      step: '05',
      title: 'CredRAG Evidence Verification',
      subtitle: 'Isolated Hybrid Vector Retrieval',
      desc: 'CredRAG expands skills into verification queries, retrieving contextual evidence chunks with strict candidate boundary isolation.',
      details: 'Fuses 768-D normalized cosine vector search (α=0.70) with controlled lexical matching (β=0.30).',
      icon: <Search className="w-5 h-5 text-teal-600" />,
      pill: 'CredRAG Engine',
    },
    {
      step: '06',
      title: 'Source Hierarchy Weighting & Mapping',
      subtitle: 'Practical Rigor Calibration',
      desc: 'Associates verified proof to each claimed skill according to source weight: Work Experience (1.00) > Projects (0.95) > Certifications (0.80) > Skills-only (0.30).',
      details: 'Prevents single-source inflation and produces a discrete evidence confidence score (Strong, Moderate, Needs Review).',
      icon: <Sliders className="w-5 h-5 text-[#072969]" />,
      pill: 'Evidence Mapping',
    },
    {
      step: '07',
      title: 'Personalized Technical Assessment Generation',
      subtitle: 'Tailored Exam Creation',
      desc: 'Generates a custom technical exam tailored strictly to the verified skills and technologies present in your profile.',
      details: 'No generic, irrelevant questions: testing focuses specifically on the technologies you claim to know.',
      icon: <Cpu className="w-5 h-5 text-[#0284C7]" />,
      pill: 'Assessment Engine',
    },
    {
      step: '08',
      title: 'Adaptive Difficulty Progression',
      subtitle: 'Real-Time Calibration',
      desc: 'Questions dynamically adapt across Easy, Medium, and Hard difficulty levels based on your answers.',
      details: 'Consecutive correct responses unlock higher-complexity challenges, showcasing advanced engineering capability.',
      icon: <TrendingUp className="w-5 h-5 text-teal-600" />,
      pill: 'Adaptive AI',
    },
    {
      step: '09',
      title: 'Proctored Assessment Room (RAI-XXXXX)',
      subtitle: 'Secure Testing Environment',
      desc: 'Enter your dedicated assessment session with hardware pre-checks (webcam, mic, fullscreen consent) and live preview.',
      details: 'Includes continuous floating webcam feed, mirroring, and friendly non-intrusive environment check.',
      icon: <Eye className="w-5 h-5 text-[#072969]" />,
      pill: 'Proctored Room',
    },
    {
      step: '10',
      title: 'Server-Authoritative Timer & Completion',
      subtitle: 'Anti-Tampering Enforcement',
      desc: 'Timers run securely on the backend. When time elapses, tests automatically auto-submit with zero possibility of client-side clock tampering.',
      details: 'Curated fallback question banks guarantee zero freezes or loading delays even under network blips.',
      icon: <Clock className="w-5 h-5 text-[#0284C7]" />,
      pill: 'Server Authoritative',
    },
    {
      step: '11',
      title: 'Assessment Scoring & Integrity Timeline',
      subtitle: 'Objective Evaluation',
      desc: 'Generates an objective score per skill and an unbiased compliance timeline of events (tab focus shifts, snapshot captures).',
      details: 'Non-accusatory timeline records factual events with neutral status badges for fair evaluation.',
      icon: <ShieldCheck className="w-5 h-5 text-teal-600" />,
      pill: 'Scoring & Audit',
    },
    {
      step: '12',
      title: 'TrustScore Synthesis (30 / 50 / 20 Split)',
      subtitle: 'Unified Credibility Score',
      desc: 'Your final TrustScore is computed mathematically: 30% Resume Evidence + 50% Proctored Assessment + 20% Job Consistency Alignment.',
      details: 'A transparent 0–100 score that combines past verified achievements with real-time technical test execution.',
      icon: <BarChart3 className="w-5 h-5 text-[#072969]" />,
      pill: 'TrustScore Formula',
    },
    {
      step: '13',
      title: 'Credibility Report Generation',
      subtitle: 'Explainable Verification Card',
      desc: 'Inspect your complete report card showing verified skill evidence badges, test score breakdowns, and TrustScore rating.',
      details: 'Downloadable, reviewable proof that provides concrete credibility to hiring managers.',
      icon: <FileCheck2 className="w-5 h-5 text-[#0284C7]" />,
      pill: 'Report Card',
    },
    {
      step: '14',
      title: 'Recruiter Visibility & 1-Click Applications',
      subtitle: 'Hiring Pipeline Discovery',
      desc: 'Apply directly to open jobs with your verified credibility profile, enabling recruiters to fast-track your application.',
      details: 'Recruiters can discover your profile through semantic search and review pre-verified skill proof.',
      icon: <UserCheck className="w-5 h-5 text-teal-600" />,
      pill: 'Hiring Acceleration',
    },
  ];

  const recruiterSteps = [
    {
      step: '01',
      title: 'Recruiter Login & Workspace Access',
      subtitle: 'Authentication & Organization Setup',
      desc: 'Sign in to the dedicated Recruiter Workspace with your company credentials.',
      details: 'Access job postings, applicant pipelines, screening rooms, and talent discovery tools.',
      icon: <Briefcase className="w-5 h-5 text-teal-700" />,
      pill: 'Recruiter Auth',
    },
    {
      step: '02',
      title: 'Access Recruiter Dashboard',
      subtitle: 'Hiring Command Center',
      desc: 'View real-time recruitment metrics: active job openings, total applicants, active screening rooms, and starred candidates.',
      details: 'Quick-action shortcuts to create new jobs, launch assessment rooms, or search the talent pool.',
      icon: <BarChart3 className="w-5 h-5 text-[#072969]" />,
      pill: 'Command Center',
    },
    {
      step: '03',
      title: 'Natural-Language Semantic Candidate Search',
      subtitle: 'Conversational Talent Discovery',
      desc: 'Search for candidates using natural phrases like "Full stack engineer experienced in React, Node microservices, and MongoDB vector indexing".',
      details: 'Move beyond rigid boolean keywords to capture true semantic intent and technological synonyms.',
      icon: <Search className="w-5 h-5 text-[#0284C7]" />,
      pill: 'Semantic Search',
    },
    {
      step: '04',
      title: '768-D Vector Retrieval Across Resume Pool',
      subtitle: 'Dense Vector Matching',
      desc: 'Queries are converted into normalized 768-dimensional embeddings and matched against indexed candidate resume vectors.',
      details: 'Searches across thousands of segmented resume chunks in milliseconds with cosine similarity ranking.',
      icon: <BrainCircuit className="w-5 h-5 text-teal-700" />,
      pill: 'Vector DB',
    },
    {
      step: '05',
      title: 'Vector Similarity & Alignment Score',
      subtitle: 'Match Percentage Calculation',
      desc: 'Candidates are ranked with an explicit Semantic Alignment Percentage showing how well their background fits the role.',
      details: 'Evaluates multi-factor overlap between job requirements and verified candidate accomplishments.',
      icon: <TrendingUp className="w-5 h-5 text-[#072969]" />,
      pill: 'Match Ranking',
    },
    {
      step: '06',
      title: 'Inspect Retrieved Resume Evidence',
      subtitle: 'Grounded Evidence Citations',
      desc: 'Review exact sentences and source chunks retrieved for each candidate without opening raw PDFs.',
      details: 'Instantly view whether evidence originates from production work experience, personal projects, or certifications.',
      icon: <Layers className="w-5 h-5 text-[#0284C7]" />,
      pill: 'Evidence Review',
    },
    {
      step: '07',
      title: 'Create Screening Rooms (RAI-XXXXX)',
      subtitle: 'Cohort Assessment Management',
      desc: 'Generate custom screening rooms (e.g. RAI-DEMO1) with tailored skill requirements, question quotas, and time limits.',
      details: 'Distribute room codes to applicants for synchronized or asynchronous proctored testing.',
      icon: <FolderGit2 className="w-5 h-5 text-teal-700" />,
      pill: 'Screening Rooms',
    },
    {
      step: '08',
      title: 'Candidate Profile & Deep Verification Inspection',
      subtitle: '360° Candidate Intelligence',
      desc: 'Navigate to full candidate profiles to inspect resume downloads, CredRAG verification ratings, test results, and TrustScores.',
      details: 'Trace individual skill ratings back to the exact project or job where the candidate demonstrated competence.',
      icon: <UserCheck className="w-5 h-5 text-[#072969]" />,
      pill: 'Candidate Profile',
    },
    {
      step: '09',
      title: 'Proctoring & Compliance Audit Review',
      subtitle: 'Objective Verification Timeline',
      desc: 'Inspect timestamped webcam snapshots, tab focus changes, and full-screen compliance logs.',
      details: 'Non-accusatory timeline provides transparent evidence of testing integrity without opaque black-box flags.',
      icon: <Eye className="w-5 h-5 text-[#0284C7]" />,
      pill: 'Integrity Timeline',
    },
    {
      step: '10',
      title: 'Evidence-Based Hiring Decisions',
      subtitle: 'Confident Talent Selection',
      desc: 'Compare candidates using unified TrustScores (30% Evidence, 50% Test, 20% Alignment) to make fast, defensible offers.',
      details: 'Eliminate resume inflation and interview fatigue with verified proof of practical ability.',
      icon: <ShieldCheck className="w-5 h-5 text-teal-700" />,
      pill: 'Confident Hiring',
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
            <span>← Back to TrustHireAI</span>
          </Link>
        </div>

        {/* HERO HEADER */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-teal-50 border border-teal-200 text-teal-700 shadow-xs">
            Step-by-Step Architecture
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-[#0A192F] tracking-tight">
            How TrustHireAI{' '}
            <span className="bg-gradient-to-r from-[#072969] via-[#0284C7] to-[#0D9488] bg-clip-text text-transparent">
              Works
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            From resume evidence to verified technical credibility. A complete, explainable workflow built for candidates and recruiters.
          </p>
        </div>

        {/* INTERACTIVE TAB TOGGLE */}
        <div className="flex justify-center">
          <div className="inline-flex p-1.5 rounded-2xl bg-white/90 border border-slate-200 shadow-xs">
            <button
              onClick={() => setActiveTab('BOTH')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'BOTH'
                  ? 'bg-gradient-to-r from-[#072969] to-[#0284C7] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Full Overview (Both)
            </button>
            <button
              onClick={() => setActiveTab('CANDIDATE')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'CANDIDATE'
                  ? 'bg-[#0284C7] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🎓</span>
              <span>Candidate Journey</span>
            </button>
            <button
              onClick={() => setActiveTab('RECRUITER')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'RECRUITER'
                  ? 'bg-[#0D9488] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>💼</span>
              <span>Recruiter Journey</span>
            </button>
          </div>
        </div>

        {/* WORKFLOW A: CANDIDATE JOURNEY */}
        {(activeTab === 'BOTH' || activeTab === 'CANDIDATE') && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-6 rounded-3xl bg-gradient-to-r from-sky-50 via-white to-sky-50/50 border border-sky-200/80 shadow-xs">
              <div>
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-sky-100 text-[#0284C7] border border-sky-200">
                  Section A
                </span>
                <h2 className="text-2xl font-black text-[#0A192F] mt-2">
                  How It Works for Candidates
                </h2>
                <p className="text-xs text-slate-600 font-medium mt-1">
                  Step-by-step path from resume upload to verified TrustScore and recruiter shortlisting.
                </p>
              </div>
              <Link
                to="/register"
                className="w-fit px-4 py-2 rounded-xl bg-[#0284C7] hover:bg-sky-600 text-white font-bold text-xs transition inline-flex items-center gap-1.5"
              >
                <span>Start Candidate Verification</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {candidateSteps.map((s) => (
                <div
                  key={s.step}
                  className="bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-3xl p-6 flex flex-col justify-between shadow-xs hover:border-sky-300 transition-all hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="w-9 h-9 rounded-xl bg-sky-100/80 border border-sky-200 flex items-center justify-center font-black text-xs text-[#0284C7]">
                        {s.step}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                        {s.pill}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1 rounded-lg bg-slate-100 text-[#0284C7]">
                        {s.icon}
                      </div>
                      <h3 className="text-base font-extrabold text-[#0A192F]">
                        {s.title}
                      </h3>
                    </div>

                    <div className="text-[11px] font-bold text-[#0284C7] uppercase tracking-wider mb-2">
                      {s.subtitle}
                    </div>

                    <p className="text-xs text-slate-600 font-medium leading-relaxed mb-3">
                      {s.desc}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-normal leading-relaxed">
                    <span className="font-bold text-slate-700">Under the hood: </span>
                    {s.details}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* WORKFLOW B: RECRUITER JOURNEY */}
        {(activeTab === 'BOTH' || activeTab === 'RECRUITER') && (
          <section className="space-y-6 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-6 rounded-3xl bg-gradient-to-r from-teal-50 via-white to-teal-50/50 border border-teal-200/80 shadow-xs">
              <div>
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-100 text-teal-800 border border-teal-200">
                  Section B
                </span>
                <h2 className="text-2xl font-black text-[#0A192F] mt-2">
                  How It Works for Recruiters
                </h2>
                <p className="text-xs text-slate-600 font-medium mt-1">
                  Discover, rank, and verify candidates using 768-D semantic retrieval and proctored screening rooms.
                </p>
              </div>
              <Link
                to="/login"
                className="w-fit px-4 py-2 rounded-xl bg-[#0D9488] hover:bg-teal-700 text-white font-bold text-xs transition inline-flex items-center gap-1.5"
              >
                <span>Recruiter Portal Access</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {recruiterSteps.map((s) => (
                <div
                  key={s.step}
                  className="bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-3xl p-6 flex flex-col justify-between shadow-xs hover:border-teal-300 transition-all hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="w-9 h-9 rounded-xl bg-teal-100/80 border border-teal-200 flex items-center justify-center font-black text-xs text-teal-800">
                        {s.step}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                        {s.pill}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1 rounded-lg bg-slate-100 text-teal-700">
                        {s.icon}
                      </div>
                      <h3 className="text-base font-extrabold text-[#0A192F]">
                        {s.title}
                      </h3>
                    </div>

                    <div className="text-[11px] font-bold text-teal-700 uppercase tracking-wider mb-2">
                      {s.subtitle}
                    </div>

                    <p className="text-xs text-slate-600 font-medium leading-relaxed mb-3">
                      {s.desc}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-normal leading-relaxed">
                    <span className="font-bold text-slate-700">Recruiter impact: </span>
                    {s.details}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* BOTTOM NAVIGATION & CTA */}
        <div className="pt-8 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 font-extrabold text-xs hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Back to TrustHireAI</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/features"
              className="px-5 py-2.5 rounded-xl border border-sky-300 bg-sky-50 text-[#0284C7] font-bold text-xs hover:bg-sky-100 transition"
            >
              Explore All Features →
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#072969] via-[#0284C7] to-[#0D9488] text-white font-extrabold text-xs shadow-sm hover:brightness-105 transition"
            >
              Start Building Trust →
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
