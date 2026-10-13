import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { LoadingState } from '../../components/common/LoadingState';
import { Badge } from '../../components/common/Badge';
import {
  ShieldCheck,
  Award,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  Scale,
  BarChart3,
  Layers,
  XCircle,
  HelpCircle,
  FileText,
  Briefcase,
  FolderGit2,
  GraduationCap,
  RotateCcw,
} from 'lucide-react';

export const VerificationReportPage: React.FC = () => {
  const navigate = useNavigate();
  const { resumeId: paramResumeId } = useParams<{ resumeId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryResumeId = searchParams.get('resumeId');
  const targetResumeId = paramResumeId || queryResumeId || '';

  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>(targetResumeId);
  const [resumeAssessments, setResumeAssessments] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVerificationReport(targetResumeId);
  }, [paramResumeId, queryResumeId]);

  const fetchVerificationReport = async (resId?: string) => {
    try {
      setLoading(true);
      setError(null);

      const [resumesRes, myAssessRes] = await Promise.all([
        api.get('/resumes').catch(() => ({ data: { success: false } })),
        api.get('/assessments/my-resume-assessments').catch(() => ({ data: { success: false } })),
      ]);

      const allResumes = resumesRes.data?.resumes || [];
      setResumes(allResumes);

      if (myAssessRes.data?.success) {
        setResumeAssessments(myAssessRes.data.resumeAssessments || []);
      }

      let activeId = resId;
      if (!activeId && allResumes.length > 0) {
        activeId = allResumes[0].id || allResumes[0]._id;
      }
      setSelectedResumeId(activeId || '');

      const reportUrl = activeId
        ? `/verification/my-report?resumeId=${activeId}`
        : '/verification/my-report';

      const res = await api.get(reportUrl);
      if (res.data.success) {
        setData(res.data);
      } else {
        setError(res.data.message || 'Unable to load TrustScore for this resume.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Unable to load TrustScore for this resume.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResume = (newResumeId: string) => {
    setSelectedResumeId(newResumeId);
    navigate(`/candidate/resumes/${newResumeId}/trustscore`);
  };

  if (loading) {
    return <LoadingState message="Loading candidate TrustScore intelligence and resume breakdowns..." />;
  }

  if (error) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center max-w-xl mx-auto my-12 space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <XCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Verification Report Error</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{error}</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => fetchVerificationReport(selectedResumeId)}
            className="px-5 py-2.5 rounded-xl bg-ai-600 hover:bg-ai-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
          <button
            onClick={() => navigate('/candidate/resumes')}
            className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs transition-colors"
          >
            Back to Resumes
          </button>
        </div>
      </div>
    );
  }

  const report = data?.report;
  const latestSession = data?.latestSession;
  const skills = data?.skills || [];

  const currentResume = resumes.find(
    (r) => String(r.id || r._id) === String(selectedResumeId)
  );

  const isAssessmentCompleted =
    currentResume?.assessmentStatus === 'COMPLETED' ||
    report?.assessmentScore !== null ||
    (latestSession && (latestSession.percentage !== null && latestSession.percentage !== undefined));

  const resumeEvidenceScore = currentResume?.resumeEvidenceScore ?? report?.evidenceScore ?? 60;
  const assessmentPerformanceScore = isAssessmentCompleted
    ? (currentResume?.assessmentPerformanceScore ?? report?.assessmentScore ?? latestSession?.percentage ?? null)
    : null;
  const consistencyAlignmentScore = isAssessmentCompleted
    ? (currentResume?.consistencyAlignmentScore ?? report?.consistencyScore ?? 80)
    : null;

  const trustScoreValue = isAssessmentCompleted
    ? (currentResume?.trustScore ?? report?.trustScore ?? (
        assessmentPerformanceScore !== null
          ? Math.round(resumeEvidenceScore * 0.3 + assessmentPerformanceScore * 0.5 + (consistencyAlignmentScore || 80) * 0.2)
          : null
      ))
    : null;

  return (
    <div className="space-y-8 pb-12">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-ai-950 to-brand-950 p-6 sm:p-8 border border-slate-800 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ai-500/10 border border-ai-500/20 text-ai-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Candidate Verification Report</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Candidate TrustScore Report
            </h1>
            <p className="text-sm text-slate-300 mt-1 leading-relaxed">
              Resume: <span className="font-bold text-white">{currentResume?.originalFileName || 'Selected Resume'}</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Resume Evidence (30%) + Assessment Performance (50%) + Consistency Alignment (20%)
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center shrink-0 min-w-[220px]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ai-200">
              TRUSTSCORE
            </p>
            {isAssessmentCompleted && trustScoreValue !== null ? (
              <>
                <p className="text-4xl font-black font-mono text-white mt-1">
                  {trustScoreValue}%
                </p>
                <Badge variant="success" size="sm" className="mt-2">
                  Verified Candidate
                </Badge>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-amber-300 mt-2">
                  Assessment Required
                </p>
                <button
                  onClick={() =>
                    navigate(`/candidate/assessments?resumeId=${selectedResumeId}&prepare=true`)
                  }
                  className="mt-3 px-4 py-2 rounded-xl bg-ai-600 hover:bg-ai-500 text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Take Assessment</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Resume Switcher Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <label htmlFor="report-resume-select" className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Active Verified Resume
          </label>
          <div className="flex items-center gap-2">
            <select
              id="report-resume-select"
              value={selectedResumeId}
              onChange={(e) => handleSelectResume(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-ai-500"
            >
              {resumes.map((r) => (
                <option key={r.id || r._id} value={r.id || r._id}>
                  {r.originalFileName}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-400 font-medium">
              (ID: {selectedResumeId?.slice(-6)})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/candidate/resumes/${selectedResumeId}/skill-evidence`)}
            className="px-4 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-xs transition-colors inline-flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Skill Evidence</span>
          </button>
          {!isAssessmentCompleted && (
            <button
              onClick={() => navigate(`/candidate/assessments?resumeId=${selectedResumeId}&prepare=true`)}
              className="px-4 py-2 rounded-xl bg-ai-600 hover:bg-ai-700 text-white font-bold text-xs transition-colors inline-flex items-center gap-1.5 shadow-xs"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Take Assessment</span>
            </button>
          )}
        </div>
      </div>

      {/* 3 TrustScore Component Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Component 1: Resume Evidence (30%) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Component 1
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
              Weight 30%
            </span>
          </div>
          <h3 className="text-base font-extrabold text-slate-900">Resume Evidence</h3>
          <p className="text-3xl font-black font-mono text-slate-800">
            {resumeEvidenceScore}%
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Evaluates concrete evidence across projects, work experiences, certifications, and technical proficiencies for this resume.
          </p>
        </div>

        {/* Component 2: Assessment Performance (50%) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-brand-500">
              Component 2
            </span>
            <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[10px] font-bold">
              Weight 50%
            </span>
          </div>
          <h3 className="text-base font-extrabold text-slate-900">Assessment Performance</h3>
          {isAssessmentCompleted && assessmentPerformanceScore !== null ? (
            <p className="text-3xl font-black font-mono text-brand-700">
              {assessmentPerformanceScore}%
            </p>
          ) : (
            <div className="space-y-1">
              <p className="text-xl font-black text-amber-600">
                Assessment Required
              </p>
              <p className="text-[11px] text-slate-400">Score unlocked after proctored exam</p>
            </div>
          )}
          <p className="text-xs text-slate-500 leading-relaxed">
            Objective performance across 20 proctored technical questions tailored strictly to this resume's claimed competencies.
          </p>
        </div>

        {/* Component 3: Consistency Alignment (20%) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-500">
              Component 3
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
              Weight 20%
            </span>
          </div>
          <h3 className="text-base font-extrabold text-slate-900">Consistency Alignment</h3>
          {isAssessmentCompleted && consistencyAlignmentScore !== null ? (
            <p className="text-3xl font-black font-mono text-emerald-700">
              {consistencyAlignmentScore}%
            </p>
          ) : (
            <div className="space-y-1">
              <p className="text-xl font-black text-slate-400">--</p>
              <p className="text-[11px] text-slate-400">Pending assessment completion</p>
            </div>
          )}
          <p className="text-xs text-slate-500 leading-relaxed">
            Mathematical congruence between self-reported resume claims and demonstrated assessment accuracy.
          </p>
        </div>
      </div>

      {/* Unassessed Prompt Banner */}
      {!isAssessmentCompleted && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl p-6 sm:p-7 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Assessment Required for TrustScore</span>
            </div>
            <h4 className="text-base font-extrabold text-amber-950">
              Your resume has been analyzed. Complete the assessment to generate your TrustScore.
            </h4>
            <p className="text-xs text-amber-800">
              Take the 20-question proctored AI evaluation to verify your skills and unlock your official TrustScore for recruiters.
            </p>
          </div>
          <button
            onClick={() => navigate(`/candidate/assessments?resumeId=${selectedResumeId}&prepare=true`)}
            className="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all shrink-0 inline-flex items-center gap-2"
          >
            <Award className="w-4 h-4" />
            <span>Take Assessment</span>
          </button>
        </div>
      )}

      {/* Assessment Performance Details (if completed) */}
      {latestSession && isAssessmentCompleted && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 mb-1">
                <Award className="w-4 h-4" />
                <span>
                  {latestSession.assessmentType === 'RESUME_BASED'
                    ? 'Resume-Based AI Assessment'
                    : 'Proctored Screening Assessment'}
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900">
                Assessment Performance Details
              </h2>
            </div>
            <button
              onClick={() => navigate(`/candidate/assessment/${latestSession.id}/report`)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 self-start sm:self-auto"
            >
              <span>Full Assessment Report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 5 Summary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Assessment Score</p>
              <p className="text-2xl font-black font-mono text-brand-600 mt-1">
                {latestSession.percentage}%
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Attempted</p>
              <p className="text-2xl font-black font-mono text-slate-900 mt-1">
                {latestSession.attemptedCount ??
                  latestSession.totalQuestions - (latestSession.unansweredCount || 0)}{' '}
                / {latestSession.totalQuestions}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-center">
              <p className="text-[11px] font-bold text-emerald-700 uppercase">Correct Answers</p>
              <p className="text-2xl font-black font-mono text-emerald-600 mt-1">
                {latestSession.correctAnswers}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 text-center">
              <p className="text-[11px] font-bold text-rose-700 uppercase">Incorrect Answers</p>
              <p className="text-2xl font-black font-mono text-rose-600 mt-1">
                {latestSession.incorrectAnswers}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 text-center col-span-2 sm:col-span-1">
              <p className="text-[11px] font-bold text-amber-700 uppercase">Unanswered</p>
              <p className="text-2xl font-black font-mono text-amber-600 mt-1">
                {latestSession.unansweredCount}
              </p>
            </div>
          </div>

          {/* Skill-wise & Difficulty-wise Performance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Skill-wise Performance */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-ai-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Skill-wise Performance</h3>
              </div>
              {latestSession.skillScores?.length > 0 ? (
                <div className="space-y-2.5">
                  {latestSession.skillScores.map((sk: any, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-700">{sk.skill}</span>
                        <span className="font-mono text-ai-700">
                          {sk.percentage}% ({sk.correct}/{sk.total})
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-ai-600 rounded-full"
                          style={{ width: `${sk.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No skill breakdown recorded.</p>
              )}
            </div>

            {/* Difficulty-wise Performance */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Difficulty-wise Performance
                </h3>
              </div>
              {latestSession.difficultyBreakdown?.length > 0 ? (
                <div className="space-y-2.5">
                  {latestSession.difficultyBreakdown.map((diff: any, idx: number) => {
                    const pct =
                      diff.percentage !== undefined
                        ? diff.percentage
                        : diff.total > 0
                        ? Math.round((diff.correct / diff.total) * 100)
                        : 0;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-700 uppercase">{diff.difficulty}</span>
                          <span className="font-mono text-brand-700">
                            {pct}% ({diff.correct}/{diff.total})
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-600 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No difficulty breakdown recorded.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resume Evidence Details & Skill Mapping */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Resume Evidence Details</h3>
            <p className="text-xs text-slate-500">
              Evidence mapping and verification status for skills extracted from {currentResume?.originalFileName || 'this resume'}
            </p>
          </div>
          <button
            onClick={() => navigate(`/candidate/resumes/${selectedResumeId}/skill-evidence`)}
            className="px-4 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-xs transition-colors inline-flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Full Evidence Mapping</span>
          </button>
        </div>

        {skills.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No skill evidence records generated for this resume yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.slice(0, 9).map((item: any, idx: number) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-slate-900">{item.skill}</h4>
                  <Badge
                    variant={
                      item.status === 'VERIFIED'
                        ? 'success'
                        : item.status === 'EVIDENCE_FOUND'
                        ? 'brand'
                        : 'warning'
                    }
                    size="sm"
                  >
                    {item.status === 'VERIFIED'
                      ? 'Verified'
                      : item.status === 'EVIDENCE_FOUND'
                      ? 'Evidence Found'
                      : 'Needs Assessment'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">
                  Claimed: <span className="font-semibold text-slate-700">{item.claimedLevel || 'Intermediate'}</span> • Evidence Sources: <span className="font-semibold text-slate-700">{item.evidence?.length || 0}</span>
                </p>
                {item.evidence?.[0] && (
                  <p className="text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200/60 line-clamp-2">
                    <span className="font-bold text-slate-700">{item.evidence[0].sourceType}:</span> {item.evidence[0].snippet}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Supporting Evidence & Limitations Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Positive Supporting Factors */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-extrabold text-slate-900">Supporting Verification Factors</h3>
          </div>
          {report?.positiveFactors?.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No strong factors registered yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {report?.positiveFactors?.map((f: string, i: number) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Limitations & Verification Cautions */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-extrabold text-slate-900">Limitations & Review Indicators</h3>
          </div>
          {report?.limitations?.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No critical limitations noted.</p>
          ) : (
            <ul className="space-y-2.5">
              {report?.limitations?.map((l: string, i: number) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span>{l}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* TrustScore Calculation Transparency Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Scale className="w-5 h-5 text-ai-600" />
          <h3 className="text-base font-extrabold text-slate-900">TrustScore Calculation Formula</h3>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 font-mono text-xs text-slate-800 space-y-2">
          <p className="font-bold text-ai-700">
            TrustScore = (Resume Evidence × 30%) + (Assessment Performance × 50%) + (Consistency Alignment × 20%)
          </p>
          {isAssessmentCompleted && trustScoreValue !== null ? (
            <p className="text-slate-600">
              = ({resumeEvidenceScore} × 0.30) + ({assessmentPerformanceScore} × 0.50) + ({consistencyAlignmentScore} × 0.20)
              = {Math.round(resumeEvidenceScore * 0.3)} + {Math.round((assessmentPerformanceScore || 0) * 0.5)} + {Math.round((consistencyAlignmentScore || 0) * 0.2)}
              = <strong className="text-emerald-700 font-black">{trustScoreValue}%</strong>
            </p>
          ) : (
            <p className="text-amber-700 font-sans text-xs">
              Assessment not completed yet for this resume. TrustScore will be calculated once you complete the proctored assessment.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
