import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { ISkillEvidence } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import { Badge } from '../../components/common/Badge';
import {
  ShieldCheck,
  Award,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FolderGit2,
  Briefcase,
  ChevronRight,
  TrendingUp,
  FileText,
  RotateCcw,
  XCircle,
} from 'lucide-react';

export const SkillVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { resumeId: paramResumeId } = useParams<{ resumeId?: string }>();
  const [searchParams] = useSearchParams();
  const queryResumeId = searchParams.get('resumeId');
  const targetResumeId = paramResumeId || queryResumeId || '';

  const [loading, setLoading] = useState<boolean>(true);
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>(targetResumeId);
  const [skills, setSkills] = useState<ISkillEvidence[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResumesAndInitialSkills(targetResumeId);
  }, [paramResumeId, queryResumeId]);

  const fetchResumesAndInitialSkills = async (resId?: string) => {
    try {
      setLoading(true);
      setError(null);

      const resRes = await api.get('/resumes');
      const resumeList = resRes.data?.resumes || [];
      setResumes(resumeList);

      let activeId = resId;
      if (!activeId && resumeList.length > 0) {
        activeId = resumeList[0]?.id || resumeList[0]?._id || '';
      }
      setSelectedResumeId(activeId || '');

      if (activeId) {
        const skillsRes = await api.get(`/verification/skills?resumeId=${activeId}`);
        if (skillsRes.data?.success) {
          setSkills(skillsRes.data.skills || []);
        } else {
          setError(skillsRes.data?.message || 'Unable to load skill evidence for this resume.');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Unable to load skill evidence for this resume.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResume = async (resumeId: string) => {
    setSelectedResumeId(resumeId);
    navigate(`/candidate/resumes/${resumeId}/skill-evidence`);
  };

  const filteredSkills = skills.filter((item) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'VERIFIED') return item.status === 'VERIFIED';
    if (selectedFilter === 'EVIDENCE_FOUND') return item.status === 'EVIDENCE_FOUND';
    if (selectedFilter === 'NEEDS_ASSESSMENT') return item.status === 'NEEDS_ASSESSMENT';
    return true;
  });

  if (loading) {
    return <LoadingState message="Loading Skill Evidence Mapping & Verification data..." />;
  }

  if (error) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center max-w-xl mx-auto my-12 space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <XCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Skill Evidence Error</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{error}</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => fetchResumesAndInitialSkills(selectedResumeId)}
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

  const currentResume = resumes.find(
    (r) => String(r.id || r._id) === String(selectedResumeId)
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-ai-950 to-brand-950 p-6 sm:p-8 border border-slate-800 text-white shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ai-500/10 border border-ai-500/20 text-ai-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ResumeAI AI Skill Verification</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Skill Evidence Mapping
            </h1>
            <p className="text-sm text-slate-300 mt-1 leading-relaxed">
              Every claimed skill is cross-referenced with concrete projects, work experiences, and certifications before assessment validation.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {selectedResumeId && (
              <button
                onClick={() => navigate(`/candidate/resumes/${selectedResumeId}/trustscore`)}
                className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all inline-flex items-center gap-1.5"
              >
                <Award className="w-4 h-4" />
                <span>View TrustScore</span>
              </button>
            )}
            <button
              onClick={() => navigate(`/candidate/assessments?resumeId=${selectedResumeId}&prepare=true`)}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-ai-600 to-brand-600 hover:from-ai-500 hover:to-brand-500 text-white font-bold text-sm shadow-lg shadow-ai-600/30 transition-all hover:scale-[1.02]"
            >
              <Award className="w-5 h-5" />
              <span>Take Assessment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Resume Selector Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <label htmlFor="resume-select" className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Select Resume
          </label>
          <div className="flex items-center gap-2">
            <select
              id="resume-select"
              value={selectedResumeId}
              onChange={(e) => handleSelectResume(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-ai-500"
            >
              {resumes.map((r) => (
                <option key={r.id || r._id} value={r.id || r._id}>
                  {r.originalFileName}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-400 font-medium">
              ({skills.length} skills mapped)
            </span>
          </div>
        </div>

        <span className="text-xs text-slate-500 italic">
          Evidence and verification status are isolated strictly to {currentResume?.originalFileName || 'the selected resume'}.
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
        {[
          { key: 'ALL', label: 'All Skills' },
          { key: 'VERIFIED', label: 'Verified via Assessment' },
          { key: 'EVIDENCE_FOUND', label: 'Evidence Found' },
          { key: 'NEEDS_ASSESSMENT', label: 'Needs Assessment' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedFilter === tab.key
                ? 'bg-ai-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Skills Grid */}
      {filteredSkills.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
          <FolderGit2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            {resumes.length === 0
              ? 'No resumes uploaded yet'
              : 'No skill evidence mapped for this resume'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {resumes.length === 0
              ? 'Upload your first resume to automatically generate concrete skill-evidence relationships.'
              : 'This resume has no extracted technical competencies matching the selected filter.'}
          </p>
          {resumes.length === 0 ? (
            <button
              onClick={() => navigate('/upload')}
              className="mt-4 px-5 py-2.5 rounded-xl bg-ai-600 hover:bg-ai-700 text-white text-xs font-bold transition-colors"
            >
              Upload Resume
            </button>
          ) : (
            <button
              onClick={() => navigate(`/analysis/${selectedResumeId}`)}
              className="mt-4 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
            >
              View Resume Analysis
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredSkills.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-5 hover:border-ai-200 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{item.skill}</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Claimed Level: <span className="font-bold text-slate-700">{item.claimedLevel}</span>
                    </p>
                  </div>

                  <Badge
                    variant={
                      item.status === 'VERIFIED'
                        ? 'success'
                        : item.verificationLevel === 'Strong'
                        ? 'success'
                        : item.verificationLevel === 'Moderate'
                        ? 'brand'
                        : 'warning'
                    }
                    size="sm"
                  >
                    {item.status === 'VERIFIED' ? 'Verified via Assessment' : item.verificationLevel}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                  <span>Confidence: <strong className="text-slate-800">{item.confidence}%</strong></span>
                  <span>•</span>
                  <span>
                    Status:{' '}
                    <strong className="text-slate-800">
                      {item.status === 'VERIFIED'
                        ? 'Verified'
                        : item.status === 'EVIDENCE_FOUND'
                        ? 'Evidence Found'
                        : 'Needs Assessment'}
                    </strong>
                  </span>
                </div>

                {/* Evidence items */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Concrete Resume Evidence ({item.evidence?.length || 0})
                  </h4>
                  {item.evidence && item.evidence.length > 0 ? (
                    <div className="space-y-2">
                      {item.evidence.map((ev: any, evIdx: number) => (
                        <div
                          key={evIdx}
                          className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-ai-700 uppercase flex items-center gap-1">
                              {ev.sourceType === 'PROJECT' && <FolderGit2 className="w-3 h-3" />}
                              {ev.sourceType === 'EXPERIENCE' && <Briefcase className="w-3 h-3" />}
                              <span>{ev.sourceType}</span>
                            </span>
                            <span className="text-slate-400 font-mono">Relevance: {ev.relevanceScore}%</span>
                          </div>
                          {ev.sourceTitle && (
                            <p className="font-bold text-slate-800">{ev.sourceTitle}</p>
                          )}
                          <p className="text-slate-600 text-[11px] line-clamp-2">{ev.snippet}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      No direct project or experience snippet matched. Take assessment to verify this skill.
                    </p>
                  )}
                </div>
              </div>

              {item.notes && (
                <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                  {item.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
