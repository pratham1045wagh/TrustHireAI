import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  Globe,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Award,
  Sparkles,
  Star,
  FileText,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Save,
  Download,
  ShieldCheck,
  TrendingUp,
  FileCheck2,
  Scale,
  Video,
} from 'lucide-react';

export const CandidateProfilePage: React.FC = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get('applicationId');

  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Private recruiter notes state
  const [notes, setNotes] = useState<string>('');
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);
  const [notesSavedToast, setNotesSavedToast] = useState<boolean>(false);

  useEffect(() => {
    if (candidateId) {
      fetchCandidateProfile();
    }
  }, [candidateId, applicationId]);

  const fetchCandidateProfile = async () => {
    try {
      setLoading(true);
      const url = applicationId
        ? `/applications/recruiter/candidates/${candidateId}?applicationId=${applicationId}`
        : `/applications/recruiter/candidates/${candidateId}`;
      const res = await api.get(url);
      if (res.data.success) {
        setData(res.data);
        setNotes(res.data.currentApplication?.recruiterNotes || '');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'You are not authorized to view this candidate profile. Profile access requires an active application to your posted jobs.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStar = async () => {
    if (!data?.currentApplication?.id) return;
    try {
      const res = await api.patch(`/applications/recruiter/${data.currentApplication.id}/star`);
      if (res.data.success) {
        setData({
          ...data,
          currentApplication: {
            ...data.currentApplication,
            isStarred: res.data.isStarred,
          },
        });
      }
    } catch (err) {
      alert('Failed to update star state.');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!data?.currentApplication?.id) return;
    try {
      const res = await api.patch(`/applications/recruiter/${data.currentApplication.id}/status`, {
        status: newStatus,
      });
      if (res.data.success) {
        setData({
          ...data,
          currentApplication: {
            ...data.currentApplication,
            status: newStatus,
          },
        });
      }
    } catch (err) {
      alert('Failed to update application status.');
    }
  };

  const handleSaveNotes = async () => {
    if (!data?.currentApplication?.id) return;
    try {
      setIsSavingNotes(true);
      await api.patch(`/applications/recruiter/${data.currentApplication.id}/notes`, {
        notes,
      });
      setNotesSavedToast(true);
      setTimeout(() => setNotesSavedToast(false), 3000);
    } catch (err) {
      alert('Failed to save private recruiter notes.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading candidate profile intelligence..." />;
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center max-w-xl mx-auto my-12 space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <XCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Restricted Profile Access</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{error}</p>
        <button
          onClick={() => navigate('/recruiter/applicants')}
          className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
        >
          Return to Applicants
        </button>
      </div>
    );
  }

  const { candidate, currentApplication, selectedResume, skillEvidence, verificationReport, assessmentSessions } = data;
  const resume = selectedResume || currentApplication?.resumeId;
  const rawSkills = data?.categorizedSkills || selectedResume?.analysis?.skills || resume?.analysis?.skills || {};
  const categorizedSkills = {
    programmingLanguages: rawSkills.programmingLanguages || [],
    frameworks: rawSkills.frameworks || [],
    libraries: rawSkills.libraries || [],
    databases: rawSkills.databases || [],
    cloud: rawSkills.cloud || [],
    tools: rawSkills.tools || [],
    other: rawSkills.other || [],
  };
  const projects = selectedResume?.projects || resume?.analysis?.projects || [];
  const experience = selectedResume?.experience || resume?.analysis?.experience || [];
  const education = selectedResume?.education || resume?.analysis?.education || [];
  const certifications = selectedResume?.certifications || resume?.analysis?.certifications || [];
  const job = currentApplication?.jobId;

  const isAssessmentCompleted =
    selectedResume?.assessmentStatus === 'COMPLETED' ||
    selectedResume?.assessmentPerformanceScore !== null ||
    data?.assessmentStatus === 'COMPLETED';

  const trustScoreValue = isAssessmentCompleted
    ? (selectedResume?.trustScore ?? data?.trustScore ?? null)
    : null;
  const evidenceScoreValue = selectedResume?.resumeEvidenceScore ?? data?.resumeEvidence ?? 60;
  const assessmentScoreValue = isAssessmentCompleted
    ? (selectedResume?.assessmentPerformanceScore ?? data?.assessmentPerformance ?? null)
    : null;
  const consistencyScoreValue = isAssessmentCompleted
    ? (selectedResume?.consistencyAlignmentScore ?? data?.consistencyAlignment ?? null)
    : null;

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-3">
          {resume?._id && (
            <a
              href={`http://localhost:3000/api/resumes/${resume._id}/download`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all"
            >
              <Download className="w-4 h-4 text-ai-600" />
              <span>Download Original Resume</span>
            </a>
          )}

          <button
            onClick={handleToggleStar}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
              currentApplication?.isStarred
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Star
              className={`w-4 h-4 ${
                currentApplication?.isStarred ? 'text-amber-500 fill-amber-500' : 'text-slate-400'
              }`}
            />
            <span>{currentApplication?.isStarred ? 'Starred' : 'Star Candidate'}</span>
          </button>
        </div>
      </div>

      {/* Candidate Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-ai-600 text-white flex items-center justify-center font-black text-2xl shadow-sm">
            {candidate?.name ? candidate.name.charAt(0).toUpperCase() : 'C'}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{candidate?.name}</h1>
              {selectedResume?.originalFileName && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-ai-50 text-ai-700 border border-ai-200">
                  {selectedResume.originalFileName}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{candidate?.email}</p>
            {job && (
              <p className="text-xs text-ai-600 font-bold mt-1">
                Applied for: {job.title} ({job.companyName})
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-500 pl-2">Status:</span>
            <select
              value={currentApplication?.status || 'APPLIED'}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:outline-hidden"
            >
              <option value="APPLIED">Applied</option>
              <option value="REVIEWING">Reviewing</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="REJECTED">Rejected</option>
              <option value="SELECTED">Selected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Selected Application Resume Info Banner */}
      {selectedResume && (
        <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-ai-600" />
            <span className="text-slate-500">Selected Application Resume:</span>
            <strong className="text-slate-900">{selectedResume.originalFileName}</strong>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Assessment Status: <strong className="text-slate-800">{selectedResume.assessmentStatus || 'NOT_TAKEN'}</strong></span>
            {selectedResume.createdAt && (
              <span>Uploaded: <strong className="text-slate-800">{new Date(selectedResume.createdAt).toLocaleDateString()}</strong></span>
            )}
          </div>
        </div>
      )}

      {/* Top Intelligence Metrics Row: TrustScore + Job Match Score */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TrustScore Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>AI-Assisted Candidate Verification</span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900">TrustScore</h3>
            </div>
            <div className="text-right">
              {trustScoreValue !== null && trustScoreValue !== undefined ? (
                <span className="text-3xl font-black font-mono text-emerald-700">
                  {trustScoreValue}%
                </span>
              ) : (
                <span className="text-sm font-black text-amber-600 block">
                  Assessment Pending
                </span>
              )}
              <span className="text-[10px] font-bold text-slate-400 block uppercase">TrustScore</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold block">Resume Evidence (30%)</span>
              <span className="font-mono font-bold text-slate-800">{evidenceScoreValue}%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold block">Assessment Performance (50%)</span>
              <span className="font-mono font-bold text-slate-800">
                {assessmentScoreValue !== null ? `${assessmentScoreValue}%` : 'Pending'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold block">Consistency Alignment (20%)</span>
              <span className="font-mono font-bold text-slate-800">
                {consistencyScoreValue !== null ? `${consistencyScoreValue}%` : '--'}
              </span>
            </div>
          </div>

          {verificationReport?.summary && (
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100 italic">
              "{verificationReport.summary}"
            </p>
          )}
        </div>

        {/* Job Match Score */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-ai-600 mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Job Description Fit</span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Semantic Job Alignment</h3>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black font-mono text-ai-600">
                {currentApplication?.matchScore ?? 75}%
              </span>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Match Score</span>
            </div>
          </div>

          {currentApplication?.matchBreakdown && (
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-semibold block">Skills</span>
                <span className="font-mono font-bold text-slate-800">{currentApplication.matchBreakdown.skillAlignment}%</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-semibold block">Experience</span>
                <span className="font-mono font-bold text-slate-800">{currentApplication.matchBreakdown.experienceAlignment}%</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-semibold block">Projects</span>
                <span className="font-mono font-bold text-slate-800">{currentApplication.matchBreakdown.projectRelevance}%</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-semibold block">Education</span>
                <span className="font-mono font-bold text-slate-800">{currentApplication.matchBreakdown.educationAlignment}%</span>
              </div>
            </div>
          )}

          {currentApplication?.matchExplanation && (
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100 line-clamp-2">
              {currentApplication.matchExplanation}
            </p>
          )}
        </div>
      </div>

      {/* Categorized Extracted Resume Skills (Requirement 24) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900">Extracted Technical Skills</h3>
          <p className="text-xs text-slate-500">
            Skills extracted specifically from the submitted application resume ({selectedResume?.originalFileName || 'Resume'})
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Programming Languages */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-brand-700">Programming Languages</h4>
            <div className="flex flex-wrap gap-1.5">
              {categorizedSkills.programmingLanguages?.length > 0 ? (
                categorizedSkills.programmingLanguages.map((sk: string, i: number) => (
                  <Badge key={i} variant="brand" size="sm">{sk}</Badge>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">None detected</span>
              )}
            </div>
          </div>

          {/* Frameworks & Libraries */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-ai-700">Frameworks & Libraries</h4>
            <div className="flex flex-wrap gap-1.5">
              {categorizedSkills.frameworks?.length > 0 ? (
                categorizedSkills.frameworks.map((sk: string, i: number) => (
                  <Badge key={i} variant="ai" size="sm">{sk}</Badge>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">None detected</span>
              )}
            </div>
          </div>

          {/* Databases */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-700">Databases</h4>
            <div className="flex flex-wrap gap-1.5">
              {categorizedSkills.databases?.length > 0 ? (
                categorizedSkills.databases.map((sk: string, i: number) => (
                  <Badge key={i} variant="success" size="sm">{sk}</Badge>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">None detected</span>
              )}
            </div>
          </div>

          {/* Cloud */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-sky-700">Cloud & DevOps</h4>
            <div className="flex flex-wrap gap-1.5">
              {categorizedSkills.cloud?.length > 0 ? (
                categorizedSkills.cloud.map((sk: string, i: number) => (
                  <Badge key={i} variant="brand" size="sm">{sk}</Badge>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">None detected</span>
              )}
            </div>
          </div>

          {/* Tools & Platforms */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-violet-700">Tools & Utilities</h4>
            <div className="flex flex-wrap gap-1.5">
              {categorizedSkills.tools?.length > 0 ? (
                categorizedSkills.tools.map((sk: string, i: number) => (
                  <Badge key={i} variant="default" size="sm">{sk}</Badge>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">None detected</span>
              )}
            </div>
          </div>

          {/* Other Skills */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">Other Skills</h4>
            <div className="flex flex-wrap gap-1.5">
              {categorizedSkills.other?.length > 0 ? (
                categorizedSkills.other.map((sk: string, i: number) => (
                  <Badge key={i} variant="default" size="sm">{sk}</Badge>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">None detected</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Projects & Work Experience */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-base font-extrabold text-slate-900">Submitted Resume Projects</h3>
          {projects.length > 0 ? (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {projects.map((proj: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <p className="font-bold text-slate-900">{proj.name}</p>
                  <p className="text-slate-600 leading-relaxed">{proj.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No structured projects extracted.</p>
          )}
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-base font-extrabold text-slate-900">Work Experience</h3>
          {experience.length > 0 ? (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {experience.map((exp: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <p className="font-bold text-slate-900">{exp.role || exp.title} • {exp.company}</p>
                  <p className="text-slate-500 text-[11px]">{exp.duration || exp.dates}</p>
                  <p className="text-slate-600 leading-relaxed">{exp.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No work experience extracted.</p>
          )}
        </div>
      </div>

      {/* Assessment Performance (Resume-Based & Recruiter Rooms) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Assessment Performance</h3>
            <p className="text-xs text-slate-500">Resume-Based AI Assessments and Proctored Recruiter Rooms</p>
          </div>
          <Award className="w-5 h-5 text-ai-600" />
        </div>

        {assessmentSessions?.length === 0 ? (
          <p className="text-xs text-slate-400 italic p-4 text-center bg-slate-50 rounded-2xl">
            Candidate has not completed any technical screening assessments yet.
          </p>
        ) : (
          <div className="space-y-4">
            {assessmentSessions.map((session: any) => (
              <div
                key={session._id}
                className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <h4 className="text-sm font-extrabold text-slate-900">
                      {session.assessmentId?.title || 'Screening Assessment'}
                    </h4>
                    <Badge variant={session.assessmentType === 'RESUME_BASED' ? 'brand' : 'default'} size="sm">
                      {session.assessmentType === 'RESUME_BASED' ? 'Resume-Based AI Assessment' : 'Recruiter Room'}
                    </Badge>
                    <Badge variant={session.status === 'SUBMITTED' || session.status === 'AUTO_SUBMITTED' ? 'success' : 'brand'} size="sm">
                      {session.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-600 mt-2 font-medium">
                    <span className="font-mono font-bold text-ai-700">{session.percentage}% Score</span>
                    <span>•</span>
                    <span>{session.correctAnswers} / {session.totalQuestions} Correct</span>
                    <span>•</span>
                    <span>
                      Integrity Signal:{' '}
                      <span className="font-bold text-slate-800">
                        {session.proctoringSummary?.integrityIndicator || 'High'}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/candidate/assessment/${session._id}/report`)}
                    className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-100 font-bold text-xs transition-colors inline-flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Detailed Report</span>
                  </button>
                  <button
                    onClick={() => navigate(`/candidate/assessment/${session._id}/proctoring`)}
                    className="px-3.5 py-1.5 rounded-xl bg-ai-50 text-ai-700 hover:bg-ai-100 font-bold text-xs transition-colors inline-flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Proctoring Report</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Skill Evidence Mapping Section (V2.0) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900">Skill Evidence Mapping</h3>
          <p className="text-xs text-slate-500">
            Concrete evidence found across projects, work experiences, and certifications for each claimed competency.
          </p>
        </div>

        {skillEvidence?.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No skill evidence mapped.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skillEvidence.map((sk: any, i: number) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/60 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{sk.skill}</h4>
                    <p className="text-[11px] text-slate-500">
                      Claimed: <span className="font-bold text-slate-700">{sk.claimedLevel}</span> • Confidence: <span className="font-mono font-bold text-ai-700">{sk.confidence}%</span>
                    </p>
                  </div>
                  <Badge variant={sk.verificationLevel === 'Strong' ? 'success' : 'brand'} size="sm">
                    {sk.verificationLevel || 'Unverified'}
                  </Badge>
                </div>

                <div className="space-y-1.5 pt-1">
                  {sk.evidence?.slice(0, 2).map((ev: any, j: number) => (
                    <div key={j} className="p-2 rounded-xl bg-white border border-slate-100 text-[11px] space-y-0.5">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <FolderGit2 className="w-3 h-3 text-brand-600" />
                        {ev.sourceTitle}
                      </span>
                      <p className="text-slate-600 line-clamp-1 italic">"{ev.snippet}"</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recruiter Private Notes */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Private Recruiter Notes</h3>
            <p className="text-xs text-slate-500">Internal notes visible only to you and your hiring team</p>
          </div>
          {notesSavedToast && (
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Notes Saved
            </span>
          )}
        </div>

        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Record notes on candidate performance, interview questions, or follow-up feedback..."
          className="w-full p-4 rounded-2xl border border-slate-200 text-xs text-slate-800 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-ai-400"
        />

        <div className="flex justify-end">
          <button
            onClick={handleSaveNotes}
            disabled={isSavingNotes}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSavingNotes ? 'Saving...' : 'Save Private Notes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
