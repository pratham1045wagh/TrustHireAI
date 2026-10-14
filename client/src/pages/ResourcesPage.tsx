import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LandingNavbar } from '../components/layout/LandingNavbar';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  FileCheck2,
  Cpu,
  ShieldCheck,
  Search,
  CheckCircle2,
  Layers,
  GraduationCap,
  Briefcase,
  HelpCircle,
  Clock,
  Sparkles,
  ChevronRight,
  FileText,
  Video,
  ExternalLink,
} from 'lucide-react';

export const ResourcesPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [activeTab, setActiveTab] = useState<'all' | 'candidates' | 'recruiters' | 'architecture'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const resourceCategories = [
    {
      id: 'architecture',
      badge: 'Core Technology',
      title: 'CredRAG Architecture & Skill Extraction',
      description:
        'A comprehensive look at our Retrieval-Augmented Generation pipeline. Learn how candidate resumes are tokenized, embedded into 768-dimensional vector spaces, and verified against ground-truth rubrics.',
      icon: <Cpu className="w-5 h-5 text-[#0284C7]" />,
      highlights: [
        'Deterministic chunking isolating work experiences from education',
        'Strict tenant & user metadata isolation in MongoDB Vector store',
        'Cosine similarity metrics combined with exact lexical matching',
        'Source-grounded citation generation with zero hallucinations',
      ],
      tag: 'Technical Spec',
      role: 'architecture',
    },
    {
      id: 'trustscore',
      badge: 'Evaluation Engine',
      title: 'The TrustScore 30/50/20 Formula Guide',
      description:
        'Understand the mathematical weighting that produces TrustHireAI’s definitive credibility score for every technical candidate.',
      icon: <FileCheck2 className="w-5 h-5 text-teal-600" />,
      highlights: [
        '30% Resume Evidence: Proven impact, tenure, and verifiable context',
        '50% Technical Assessment: Proctored live coding and MCQ performance',
        '20% Consistency & Alignment: Claimed seniority vs actual assessment mastery',
        'Transparent breakdown displayed directly on every applicant profile',
      ],
      tag: 'Scoring Model',
      role: 'all',
    },
    {
      id: 'candidate-guide',
      badge: 'Job Seekers',
      title: 'Candidate Guide: From Resume to Verified TrustScore',
      description:
        'Step-by-step walkthrough for job seekers. How to upload your resume, review extracted evidence, take adaptive assessments, and share verified credential badges with employers.',
      icon: <GraduationCap className="w-5 h-5 text-[#072969]" />,
      highlights: [
        'Formatting resumes for optimal CredRAG extraction (PDF & DOCX)',
        'Understanding High, Medium, and Low evidence confidence levels',
        'Preparing for proctored sessions in clean browser environments',
        'Sharing your tamper-evident verification report URL with hiring teams',
      ],
      tag: 'Candidate Walkthrough',
      role: 'candidates',
    },
    {
      id: 'recruiter-guide',
      badge: 'Talent Acquisition',
      title: 'Recruiter Guide: Semantic Search & Assessment Rooms',
      description:
        'Maximize candidate sourcing efficiency. Use natural language to query verified talent pools, create custom assessment rooms, and review objective integrity timelines.',
      icon: <Briefcase className="w-5 h-5 text-[#0284C7]" />,
      highlights: [
        'Natural-language semantic search ("Senior React engineer with Docker")',
        'Generating shareable RAI-XXXXX proctored assessment room codes',
        'Reviewing candidate profiles with live resume citation inspection',
        'Evaluating objective violation timelines with zero algorithmic bias',
      ],
      tag: 'Recruiter Manual',
      role: 'recruiters',
    },
    {
      id: 'proctoring-integrity',
      badge: 'Fairness & Compliance',
      title: 'Proctoring Integrity & Server-Authoritative Timers',
      description:
        'How TrustHireAI maintains uncompromised testing integrity without intrusive spyware or biased facial recognition algorithms.',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
      highlights: [
        'Server-enforced session deadlines immune to client clock tampering',
        'Non-accusatory telemetry: Tab blur, copy/paste, and fullscreen logs',
        'Periodic low-bandwidth webcam snapshots for human audit',
        'Instant fallback question bank preventing network dropouts',
      ],
      tag: 'Security & Integrity',
      role: 'all',
    },
    {
      id: 'evidence-hierarchy',
      badge: 'Verification Standards',
      title: 'Evidence Hierarchy & Source Grounding Rubrics',
      description:
        'Detailed standards used by CredRAG to differentiate substantiated hands-on accomplishments from superficial buzzword packing.',
      icon: <Layers className="w-5 h-5 text-[#0A192F]" />,
      highlights: [
        'Tier 1 (High): Production deployments, architectural metrics, and tenure',
        'Tier 2 (Medium): Academic capstones, personal repositories, certifications',
        'Tier 3 (Low): Unsubstantiated skill tag lists without contextual proof',
        'Direct mapping between resume text snippets and assessment difficulty',
      ],
      tag: 'Rubric Standards',
      role: 'architecture',
    },
  ];

  const faqs = [
    {
      q: 'What makes CredRAG different from standard ATS keyword parsers?',
      a: 'Traditional ATS systems simply count how many times a keyword appears. CredRAG uses Gemini LLM embeddings and vector search to inspect the actual narrative context of where and how you applied each skill, rating evidence confidence based on real engineering impact.',
    },
    {
      q: 'Can candidates retake assessments if they had technical difficulties?',
      a: 'Yes. Recruiters or administrators can regenerate an assessment invitation or generate a new unique RAI-XXXXX assessment room code whenever necessary.',
    },
    {
      q: 'How does the proctoring system ensure candidates are treated fairly?',
      a: 'Unlike algorithmic proctors that falsely flag candidates for looking sideways or blinking, TrustHireAI uses non-accusatory telemetry. It objectively records factual events (such as window focus shifts or copy-paste shortcuts) for human review, eliminating automated disqualification errors.',
    },
    {
      q: 'How can recruiters verify the authenticity of a candidate’s TrustScore?',
      a: 'Every verified candidate profile features an interactive verification breakdown showing the exact resume evidence citations, assessment score results, and proctoring telemetry timestamps.',
    },
    {
      q: 'Is candidate resume data protected against unauthorized scraping?',
      a: 'Yes. All candidate profiles, vector chunks, and parsed resumes are protected behind JWT authentication and role-based access control. Cross-tenant retrieval is strictly prohibited by our metadata query filters.',
    },
  ];

  const filteredResources = resourceCategories.filter((r) => {
    const matchesTab = activeTab === 'all' || r.role === activeTab || r.role === 'all';
    const matchesQuery =
      searchQuery.trim() === '' ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.highlights.some((h) => h.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans relative selection:bg-sky-100 selection:text-sky-900 pb-20">
      {/* Blueprint background grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-40 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, #E2E8F0 1px, transparent 1px),
            linear-gradient(to bottom, #E2E8F0 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Modern floating navbar */}
      <LandingNavbar />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        {/* Back link */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#0284C7] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Back to Home</span>
          </Link>
        </div>

        {/* HERO SECTION */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-[#0284C7] text-xs font-bold mb-4 shadow-2xs">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Documentation, Guides & Reference</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-[#0A192F] tracking-tight leading-tight">
            TrustHireAI <span className="text-[#0284C7]">Resource Hub</span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-600 font-medium leading-relaxed">
            Everything you need to master verified hiring. Explore comprehensive guides on CredRAG skill evidence extraction, TrustScore math, proctored assessments, and semantic talent discovery.
          </p>

          {/* Quick Search & Filter Controls */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search topics, CredRAG, TrustScore, proctoring..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284C7] focus:border-transparent shadow-2xs"
              />
            </div>

            <div className="flex items-center p-1 bg-white border border-slate-200 rounded-xl shadow-2xs overflow-x-auto max-w-full">
              {(
                [
                  { id: 'all', label: 'All Guides' },
                  { id: 'candidates', label: 'Candidates' },
                  { id: 'recruiters', label: 'Recruiters' },
                  { id: 'architecture', label: 'Architecture' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-[#0A192F] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RESOURCE CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {filteredResources.map((item) => (
            <div
              key={item.id}
              className="group p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-[#0284C7]/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {item.badge}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-[#0A192F] group-hover:text-[#0284C7] transition-colors leading-snug">
                  {item.title}
                </h3>

                <p className="mt-2 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  {item.description}
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  {item.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0284C7] shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-3 flex items-center justify-between border-t border-slate-100/80">
                <span className="text-[11px] font-semibold text-slate-400">
                  {item.tag}
                </span>
                <Link
                  to={item.role === 'candidates' ? '/how-it-works' : item.role === 'recruiters' ? '/how-it-works' : '/features'}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#0284C7] hover:underline"
                >
                  <span>Learn More</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* FEATURED TECHNICAL DEEP DIVE: TRUSTSCORE FORMULA */}
        <div className="mb-16 p-8 rounded-3xl bg-gradient-to-br from-[#0A192F] via-[#092244] to-[#07172B] text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-gradient-to-br from-[#0284C7]/20 to-teal-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sky-300 text-xs font-bold mb-4 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Core Algorithm Deep-Dive</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              The 30 / 50 / 20 TrustScore Mathematical Framework
            </h2>

            <p className="mt-3 text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
              TrustHireAI solves the fundamental flaw of hiring platforms: resumes that exaggerate skills, and technical quizzes that are disconnected from real-world engineering work.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="text-3xl font-black text-sky-400">30%</div>
                <div className="font-bold text-sm text-white mt-1">Resume Evidence</div>
                <p className="text-xs text-slate-300 mt-2 font-normal leading-relaxed">
                  Extracted via CredRAG. Evaluates verified employment tenure, architectural contributions, and documented real-world production metrics.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="text-3xl font-black text-teal-400">50%</div>
                <div className="font-bold text-sm text-white mt-1">Technical Assessment</div>
                <p className="text-xs text-slate-300 mt-2 font-normal leading-relaxed">
                  Proctored live evaluation with server-authoritative timers. Calibrates adaptive difficulty based on candidate claims.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="text-3xl font-black text-amber-400">20%</div>
                <div className="font-bold text-sm text-white mt-1">Consistency & Alignment</div>
                <p className="text-xs text-slate-300 mt-2 font-normal leading-relaxed">
                  Cross-checks assessment performance against claimed seniority, flagging discrepancies between resume bullet points and actual problem-solving.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/features"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0284C7] hover:bg-sky-600 text-white font-bold text-xs shadow-sm transition"
              >
                <span>Read Features Specification</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/how-it-works"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 transition"
              >
                <span>View Full Workflows</span>
              </Link>
            </div>
          </div>
        </div>

        {/* FREQUENTLY ASKED QUESTIONS */}
        <div className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-[#0A192F]">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-sm text-slate-600 font-medium">
              Common questions about TrustHireAI’s verification workflows, scoring math, and proctoring policies.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
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
              to="/pricing"
              className="px-5 py-2.5 rounded-xl border border-sky-300 bg-sky-50 text-[#0284C7] font-bold text-xs hover:bg-sky-100 transition"
            >
              View Pricing →
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
