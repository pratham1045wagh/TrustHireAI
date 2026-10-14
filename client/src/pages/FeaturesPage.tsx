import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LandingNavbar } from '../components/layout/LandingNavbar';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  BrainCircuit,
  Cpu,
  Search,
  Layers,
  FileCheck2,
  FileText,
  Clock,
  Video,
  Eye,
  CheckCircle2,
  Lock,
  UserCheck,
  Briefcase,
  GraduationCap,
  Sparkles,
  BarChart3,
  Database,
  Sliders,
  ShieldAlert,
  FolderGit2,
  Filter,
  TrendingUp,
} from 'lucide-react';

interface FeatureItem {
  id: string;
  icon: React.ReactNode;
  category: 'Verification' | 'Proctoring' | 'Search & Matching' | 'Workflows & Admin';
  title: string;
  shortDesc: string;
  detailedExplanation: string;
  howItWorks: string;
  candidateBenefit: string;
  recruiterBenefit: string;
}

export const FeaturesPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const features: FeatureItem[] = [
    {
      id: 'resume-analysis',
      icon: <FileText className="w-6 h-6 text-[#0284C7]" />,
      category: 'Verification',
      title: 'AI-Powered Resume Analysis',
      shortDesc: 'Deep structured parsing of PDF and DOCX documents via Google Gemini.',
      detailedExplanation:
        'Converts unstructured resume documents into structured schemas covering work experience, projects, certifications, education, and technical competencies without losing context.',
      howItWorks:
        'Uploaded resumes are parsed, normalized, and extracted into JSON schemas. Text is chunked with strict candidate isolation.',
      candidateBenefit:
        'Instant multi-section resume breakdown and visibility into how AI perceives your skills.',
      recruiterBenefit:
        'Eliminates manual resume screening with structured, comparable candidate profiles.',
    },
    {
      id: 'credrag-engine',
      icon: <BrainCircuit className="w-6 h-6 text-[#072969]" />,
      category: 'Verification',
      title: 'CredRAG AI Skill Verification',
      shortDesc: 'Credibility-Aware Retrieval-Augmented Generation designed specifically for skill proof.',
      detailedExplanation:
        'Solves the fatal flaw of generic RAG where simple keyword stuffing scores as high as real engineering work. Uses deterministic verification queries and strict isolation.',
      howItWorks:
        'Expands skills into evidence-seeking queries, retrieves chunks using hybrid 768-D cosine vectors and lexical matches, and re-ranks evidence based on practical rigor.',
      candidateBenefit:
        'Guarantees your actual projects and workplace impact are rewarded over passive buzzwords.',
      recruiterBenefit:
        'Empirical 1.000 F1-score precision so you only see genuine, corroborated claims.',
    },
    {
      id: 'evidence-extraction',
      icon: <Layers className="w-6 h-6 text-teal-600" />,
      category: 'Verification',
      title: 'Skill-Aware Evidence Extraction',
      shortDesc: 'Logical section segmentation tagged with source entities and technologies.',
      detailedExplanation:
        'Chunks are not treated as flat text. Each chunk is tagged with its source type (work experience, project, certification), company or entity name, and related skills.',
      howItWorks:
        'Intelligent chunking respects sentence boundaries and section boundaries, preventing fragmented or decontextualized evidence.',
      candidateBenefit:
        'Ensures evidence snippets retain full context and attribution to specific companies or projects.',
      recruiterBenefit:
        'Recruiters can directly trace which company or project provided evidence for each skill.',
    },
    {
      id: 'source-hierarchy',
      icon: <Sliders className="w-6 h-6 text-[#0284C7]" />,
      category: 'Verification',
      title: 'Source Hierarchy Weighting',
      shortDesc: 'Practical rigor weighting from Work Experience (1.00) down to Skills-only (0.30).',
      detailedExplanation:
        'A formal credibility ladder ensures claims backed by production employment are weighted highest: Work Experience (1.00) > Projects (0.95) > Certifications (0.80) > Education (0.65) > Summary (0.50) > Skills Only (0.30).',
      howItWorks:
        'Multi-factor re-ranking applies mathematical multipliers to retrieval scores based on source rigor.',
      candidateBenefit:
        'Experienced engineers receive mathematical recognition for hard-earned professional experience.',
      recruiterBenefit:
        'Automatically filters out candidates who merely list technologies without practical application.',
    },
    {
      id: 'vector-search',
      icon: <Database className="w-6 h-6 text-[#072969]" />,
      category: 'Search & Matching',
      title: '768-D Hybrid Vector Search',
      shortDesc: 'Fused semantic cosine vector search (α=0.70) with controlled lexical matching (β=0.30).',
      detailedExplanation:
        'Combines dense semantic embeddings with bounded keyword synonyms to avoid both vocabulary mismatch and semantic drift.',
      howItWorks:
        'Normalized 768-dimensional embeddings generated with Google text embedding models, indexed in MongoDB vector collections.',
      candidateBenefit:
        'Matches concepts and synonyms (e.g., TSX, React Hooks) even if the exact keyword was omitted.',
      recruiterBenefit:
        'Instant natural-language search with high semantic recall and strict lexical precision.',
    },
    {
      id: 'metadata-isolation',
      icon: <Lock className="w-6 h-6 text-emerald-600" />,
      category: 'Verification',
      title: 'Strict Candidate & Resume Isolation',
      shortDesc: 'Zero cross-contamination between candidate documents and historical resumes.',
      detailedExplanation:
        'Queries are unconditionally partitioned by userId and resumeId at the database retrieval layer, guaranteeing strict boundary protection.',
      howItWorks:
        'Every vector search query executes with mandatory metadata filter predicates enforcing tenant and candidate isolation.',
      candidateBenefit:
        'Complete privacy: your resume data is isolated and protected at all times.',
      recruiterBenefit:
        'Zero false matches or data leakage between competing applicant submissions.',
    },
    {
      id: 'trustscore-formula',
      icon: <BarChart3 className="w-6 h-6 text-[#0284C7]" />,
      category: 'Verification',
      title: 'Transparent TrustScore Calculation',
      shortDesc: 'Explainable credibility synthesis: 30% Evidence + 50% Assessment + 20% Alignment.',
      detailedExplanation:
        'Replaces black-box hiring scores with a transparent mathematical formula that balances past resume evidence with live proctored technical performance.',
      howItWorks:
        'TrustScore = (Resume Evidence × 30%) + (Assessment Performance × 50%) + (Consistency Alignment × 20%). Calibrated to 0–100 scale.',
      candidateBenefit:
        'Clear, actionable feedback on exactly how your credibility score was computed.',
      recruiterBenefit:
        'A single defensible metric that combines proven work history with real-time test execution.',
    },
    {
      id: 'confidence-thresholds',
      icon: <ShieldCheck className="w-6 h-6 text-teal-600" />,
      category: 'Verification',
      title: 'Credibility Confidence Thresholds',
      shortDesc: 'Four-tier classification: Strong (80–100), Moderate (60–79), Review (40–59), Unverified (0–39).',
      detailedExplanation:
        'Every skill receives a discrete credibility classification based on combined semantic relevance, keyword frequency, source weight, and evidence diversity.',
      howItWorks:
        'Confidence score is calculated across top-ranked unique chunks and mapped to clear visual tiers.',
      candidateBenefit:
        'Instantly identify which skills have strong supporting evidence and which need more detail.',
      recruiterBenefit:
        'Quickly distinguish between verified core strengths and unverified claims.',
    },
    {
      id: 'adaptive-assessments',
      icon: <Cpu className="w-6 h-6 text-[#072969]" />,
      category: 'Proctoring',
      title: 'Dynamic Adaptive Assessments',
      shortDesc: 'Technical exams that adapt in real time across Easy, Medium, and Hard difficulty.',
      detailedExplanation:
        'Questions are generated dynamically to evaluate the specific skills identified in the candidate’s resume, adjusting difficulty based on response accuracy.',
      howItWorks:
        'Adaptive engine evaluates sequential question responses. Correct answers advance candidates to higher-tier questions; mistakes adjust difficulty downwards.',
      candidateBenefit:
        'Engaging exams that accurately calibrate to your skill level without generic multiple-choice busywork.',
      recruiterBenefit:
        'Differentiates top-tier talent from mid-level engineers through calibrated high-difficulty testing.',
    },
    {
      id: 'screening-rooms',
      icon: <FolderGit2 className="w-6 h-6 text-[#0284C7]" />,
      category: 'Proctoring',
      title: 'Proctored Assessment Rooms (RAI-XXXXX)',
      shortDesc: 'Dedicated screening rooms with custom access codes, candidate limits, and expirations.',
      detailedExplanation:
        'Recruiters generate branded screening rooms with specific skill focus areas, question counts, and duration limits for cohort testing.',
      howItWorks:
        'Candidates enter room codes (e.g. RAI-DEMO1) in their Assessment Hub to review rules and launch testing.',
      candidateBenefit:
        'Smooth pre-test briefing with clear requirements, allowed tools, and hardware checks.',
      recruiterBenefit:
        'Centralized testing rooms to assess entire cohorts with uniform standards.',
    },
    {
      id: 'server-timer',
      icon: <Clock className="w-6 h-6 text-emerald-600" />,
      category: 'Proctoring',
      title: 'Server-Authoritative Timer',
      shortDesc: 'Tamper-proof backend countdown preventing client-side clock manipulation.',
      detailedExplanation:
        'Assessment expiration is strictly calculated on the server (startedAt + durationMs = expiresAt). The server auto-submits responses when time runs out.',
      howItWorks:
        'The backend validates every submission timestamp against the server-stored session deadline.',
      candidateBenefit:
        'Fair playing field where no test taker can unfairly extend testing time.',
      recruiterBenefit:
        'Absolute integrity: guarantees all candidates operated within exact time constraints.',
    },
    {
      id: 'neutral-proctoring',
      icon: <Eye className="w-6 h-6 text-teal-600" />,
      category: 'Proctoring',
      title: 'Non-Accusatory Integrity Monitoring',
      shortDesc: 'Objective telemetry tracking tab switches, fullscreen status, and periodic webcam snapshots.',
      detailedExplanation:
        'Avoids biased algorithmic accusations. Instead, captures objective observations (e.g. "Window focus changed") in a clear timeline for human review.',
      howItWorks:
        'Client-side listeners detect tab switching and fullscreen exit. Webcams capture snapshots (~every 40s) uploaded to secure session storage.',
      candidateBenefit:
        'Protected against false AI disqualifications; observations are non-accusatory and reviewed contextually.',
      recruiterBenefit:
        'Clear audit timeline with timestamped snapshots and event badges to verify exam integrity.',
    },
    {
      id: 'zero-downtime-fallback',
      icon: <ShieldAlert className="w-6 h-6 text-[#072969]" />,
      category: 'Proctoring',
      title: 'Zero-Downtime Question Bank Fallback',
      shortDesc: 'Curated technical question bank ensures exams never freeze if LLM quotas throttle.',
      detailedExplanation:
        'If third-party AI APIs experience rate limits or network latency, the platform seamlessly falls back to vetted internal question repositories.',
      howItWorks:
        'Algorithmic circuit breaker checks API health. On timeout or quota error, curated technical questions serve instantaneously.',
      candidateBenefit:
        'Zero test interruptions, lag, or lost exam progress during proctored sessions.',
      recruiterBenefit:
        'Reliable 99.9% testing uptime regardless of third-party AI service status.',
    },
    {
      id: 'recruiter-semantic-search',
      icon: <Search className="w-6 h-6 text-[#0284C7]" />,
      category: 'Search & Matching',
      title: 'Recruiter Semantic Candidate Search',
      shortDesc: 'Natural-language queries like "Senior React engineer with GraphQL and microservices".',
      detailedExplanation:
        'Enables recruiters to query candidates using conversational job descriptions rather than rigid boolean filters.',
      howItWorks:
        'Queries are embedded into the 768-D space and matched against candidate resume vector chunks with cosine similarity ranking.',
      candidateBenefit:
        'Qualified candidates are found based on actual expertise even without exact buzzword matching.',
      recruiterBenefit:
        'Saves hours of search time by finding the best conceptual matches across thousands of resumes.',
    },
    {
      id: 'alignment-scoring',
      icon: <TrendingUp className="w-6 h-6 text-teal-600" />,
      category: 'Search & Matching',
      title: 'Semantic Alignment / Match Score',
      shortDesc: 'Percentage fit between candidate evidence and specific job descriptions.',
      detailedExplanation:
        'Calculates mathematical alignment between a candidate’s verified skill evidence and the core requirements of an active job opening.',
      howItWorks:
        'Vector similarity between job description requirements and candidate chunks produces a 0–100% semantic alignment score.',
      candidateBenefit:
        'See your percentage match before applying to know which positions fit your strengths best.',
      recruiterBenefit:
        'Instant candidate ranking by job relevance, highlighting top applicants automatically.',
    },
    {
      id: 'candidate-profile-deep-dive',
      icon: <UserCheck className="w-6 h-6 text-[#072969]" />,
      category: 'Workflows & Admin',
      title: 'Deep Candidate Profiles & Evidence Inspection',
      shortDesc: 'Comprehensive recruiter view with full evidence snippets, test reports, and audit trails.',
      detailedExplanation:
        'Recruiters can inspect each verified skill, the exact resume sentence it came from, exam score breakdowns, and proctoring logs.',
      howItWorks:
        'Candidate profile links resume download, CredRAG report, assessment history, and proctoring timeline into one dashboard.',
      candidateBenefit:
        'Your profile showcases complete, unassailable proof of competence to hiring managers.',
      recruiterBenefit:
        'Total transparency: verify any claim with one click before extending an interview offer.',
    },
    {
      id: 'verification-directory',
      icon: <FileCheck2 className="w-6 h-6 text-[#0284C7]" />,
      category: 'Workflows & Admin',
      title: 'Verification Reports Directory',
      shortDesc: 'Centralized repository of verified candidate credentials and TrustScore reports.',
      detailedExplanation:
        'Filterable directory displaying credibility scores, verification dates, and assessment milestones for all processed candidates.',
      howItWorks:
        'Database aggregates candidate verification records with instant search, role filtering, and export capabilities.',
      candidateBenefit:
        'Permanent shareable verification report you can present to any prospective employer.',
      recruiterBenefit:
        'Pre-vetted talent pool ready for immediate shortlisting and outreach.',
    },
    {
      id: 'candidate-workflows',
      icon: <GraduationCap className="w-6 h-6 text-teal-600" />,
      category: 'Workflows & Admin',
      title: 'Candidate Applications & Verification Hub',
      shortDesc: 'Streamlined workspace for resume uploads, skill verification, and 1-click job applications.',
      detailedExplanation:
        'Empowers candidates to manage resumes, review CredRAG evidence mappings, take proctored tests, and track application statuses.',
      howItWorks:
        'Dedicated candidate portal with real-time progress indicators, exam launchpads, and score summaries.',
      candidateBenefit:
        'All your career evidence, assessments, and applications organized in one unified workspace.',
      recruiterBenefit:
        'Receive fully verified job applications with pre-computed TrustScores.',
    },
    {
      id: 'recruiter-workflows',
      icon: <Briefcase className="w-6 h-6 text-[#072969]" />,
      category: 'Workflows & Admin',
      title: 'Recruiter Workspace & Job Management',
      shortDesc: 'End-to-end recruitment lifecycle: job posting, applicant tracking, and assessment rooms.',
      detailedExplanation:
        'Recruiters can post jobs, auto-parse job descriptions via AI, track applicants, create screening rooms, and star top performers.',
      howItWorks:
        'Role-guarded recruiter dashboard with direct shortcuts to jobs, applicants, rooms, and reports.',
      candidateBenefit:
        'Faster feedback and review cycles from recruiters using streamlined evaluation tools.',
      recruiterBenefit:
        'Complete hiring command center replacing fragmented spreadsheets and ATS tools.',
    },
    {
      id: 'admin-governance',
      icon: <ShieldCheck className="w-6 h-6 text-emerald-600" />,
      category: 'Workflows & Admin',
      title: 'Enterprise Admin Governance & Vector Health',
      shortDesc: 'System health monitoring, vector DB diagnostics, AI token usage, and immutable audit logs.',
      detailedExplanation:
        'Provides administrators with real-time oversight of vector collections, Gemini API token consumption, active users, and system security.',
      howItWorks:
        'Admin routes display real-time statistics, vector count, model latency, and system audit trails.',
      candidateBenefit:
        'Guarantees system reliability, strict data compliance, and high platform availability.',
      recruiterBenefit:
        'Enterprise-grade security, transparency, and auditability for organizational hiring compliance.',
    },
  ];

  const categories = ['ALL', 'Verification', 'Proctoring', 'Search & Matching', 'Workflows & Admin'];

  const filteredFeatures =
    selectedCategory === 'ALL'
      ? features
      : features.filter((f) => f.category === selectedCategory);

  return (
    <div className="blueprint-grid min-h-screen text-[#0F172A] relative overflow-x-hidden flex flex-col justify-between">
      {/* Background Accent Glows */}
      <div className="fixed -top-24 left-1/4 w-96 h-96 bg-sky-200/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-teal-200/40 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Navbar */}
      <LandingNavbar />

      <main className="flex-1 relative z-10 px-4 sm:px-6 lg:px-8 py-8 md:py-12 max-w-7xl mx-auto w-full space-y-10">
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

        {/* PAGE HERO HEADER */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-sky-50 border border-sky-200 text-[#0284C7] shadow-xs">
            Comprehensive Platform Architecture
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-[#0A192F] tracking-tight">
            TrustHireAI{' '}
            <span className="bg-gradient-to-r from-[#072969] via-[#0284C7] to-[#0D9488] bg-clip-text text-transparent">
              Features
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            Everything needed to move from unverified resume claims to mathematically verified candidate credibility.
          </p>
        </div>

        {/* CATEGORY FILTER PILLS */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-[#072969] to-[#0284C7] text-white shadow-sm shadow-sky-600/20'
                  : 'bg-white/80 border border-slate-200 text-slate-600 hover:text-[#0A192F] hover:bg-white'
              }`}
            >
              {cat === 'ALL' ? 'All Features (20+)' : cat}
            </button>
          ))}
        </div>

        {/* FEATURE CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {filteredFeatures.map((f) => (
            <div
              key={f.id}
              className="bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-3xl p-6 flex flex-col justify-between shadow-xs hover:shadow-md hover:border-sky-300 transition-all group"
            >
              <div>
                {/* Card Top: Icon & Category Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                    {f.icon}
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                    {f.category}
                  </span>
                </div>

                <h3 className="text-lg font-extrabold text-[#0A192F] mb-1.5 group-hover:text-[#0284C7] transition-colors">
                  {f.title}
                </h3>
                <p className="text-xs font-semibold text-slate-500 mb-3">
                  {f.shortDesc}
                </p>
                <p className="text-xs text-slate-600 leading-relaxed font-normal mb-4">
                  {f.detailedExplanation}
                </p>

                {/* How It Works High Level */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] text-slate-700 mb-4 space-y-1">
                  <span className="font-black text-[#072969] uppercase tracking-wider block text-[10px]">
                    How it works
                  </span>
                  <p className="font-medium text-slate-600 leading-relaxed">{f.howItWorks}</p>
                </div>
              </div>

              {/* Benefits Split */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px]">
                <div className="flex items-start gap-1.5 text-slate-600">
                  <span className="font-bold text-[#0284C7] shrink-0">🎓 Candidate:</span>
                  <span className="font-medium">{f.candidateBenefit}</span>
                </div>
                <div className="flex items-start gap-1.5 text-slate-600">
                  <span className="font-bold text-teal-700 shrink-0">💼 Recruiter:</span>
                  <span className="font-medium">{f.recruiterBenefit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* BOTTOM ACTION BAR & BACK BUTTON */}
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
              to="/how-it-works"
              className="px-5 py-2.5 rounded-xl border border-sky-300 bg-sky-50 text-[#0284C7] font-bold text-xs hover:bg-sky-100 transition"
            >
              See How It Works →
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#072969] via-[#0284C7] to-[#0D9488] text-white font-extrabold text-xs shadow-sm hover:brightness-105 transition"
            >
              Start Free Today →
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
