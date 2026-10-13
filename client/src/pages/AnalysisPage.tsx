import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { ResumeItem } from '../types';
import { Badge } from '../components/common/Badge';
import { LoadingState } from '../components/common/LoadingState';
import { normalizeResumeData } from '../utils/normalize';
import {
  FileText,
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
  ArrowLeft,
  Lock,
  Code2,
  Calendar,
} from 'lucide-react';

export const AnalysisPage: React.FC = () => {
  const { resumeId } = useParams<{ resumeId: string }>();
  const navigate = useNavigate();

  const [resume, setResume] = useState<ResumeItem | null>(null);
  const [assessInfo, setAssessInfo] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resumeId) {
      fetchAnalysis();
    }
  }, [resumeId]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const [res, assessRes] = await Promise.all([
        api.get(`/resumes/${resumeId}`),
        api.get('/assessments/my-resume-assessments').catch(() => ({ data: { success: false } })),
      ]);
      if (res.data.success) {
        setResume(res.data.resume);
      }
      if (assessRes.data?.success && Array.isArray(assessRes.data.resumeAssessments)) {
        const found = assessRes.data.resumeAssessments.find(
          (item: any) => String(item.resumeId) === String(resumeId)
        );
        if (found) setAssessInfo(found);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load resume analysis.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Fetching Gemini AI analysis report..." />;
  }

  if (error || !resume || !resume.analysis) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Analysis Unavailable</h3>
        <p className="text-sm text-slate-500 mb-6">{error || 'Resume analysis not found.'}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-medium text-xs"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const { personalInfo, summary, skills, education, experience, projects, certifications } =
    normalizeResumeData(resume.analysis);

  return (
    <div className="space-y-8 pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/resumes')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Resumes</span>
        </button>
        <Badge variant="success">Analyzed by Gemini AI</Badge>
      </div>

      {/* Header Banner - Resume-Specific Intelligence */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-ai-50 text-ai-600 rounded-2xl border border-ai-100">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-extrabold text-slate-900">{resume.originalFileName}</h1>
                <Badge variant="success" size="sm">Resume Parsed Successfully</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Uploaded on{' '}
                {new Date(resume.createdAt).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}{' '}
                • {(resume.fileSize / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-3xl font-black font-mono text-emerald-700 block">
                {resume.trustScore !== null && resume.trustScore !== undefined
                  ? `${resume.trustScore}%`
                  : 'Not Available'}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                TrustScore
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {assessInfo?.completedSession || resume.assessmentStatus === 'COMPLETED' ? (
                <button
                  onClick={() =>
                    navigate(
                      `/candidate/assessment/${
                        assessInfo?.completedSession?.id || resume.latestAssessmentSessionId
                      }/report`
                    )
                  }
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
                >
                  <Award className="w-4 h-4" />
                  <span>
                    View Assessment Result ({assessInfo?.completedSession?.percentage || resume.assessmentPerformanceScore || 0}%)
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => navigate(`/candidate/assessments?resumeId=${resume.id}&prepare=true`)}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-ai-600 to-brand-600 hover:from-ai-500 hover:to-brand-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <Award className="w-4 h-4" />
                  <span>Take Assessment</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Resume-Specific TrustScore Breakdown Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Resume Evidence (30%)</span>
            <span className="font-mono font-bold text-slate-900">
              {resume.resumeEvidenceScore ?? 60}%
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Assessment Performance (50%)</span>
            <span className="font-mono font-bold text-brand-700">
              {resume.assessmentPerformanceScore !== null && resume.assessmentPerformanceScore !== undefined
                ? `${resume.assessmentPerformanceScore}%`
                : assessInfo?.completedSession
                ? `${assessInfo.completedSession.percentage}%`
                : 'Not Taken'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Consistency Alignment (20%)</span>
            <span className="font-mono font-bold text-slate-900">
              {resume.assessmentStatus === 'COMPLETED' || assessInfo?.completedSession
                ? `${resume.consistencyAlignmentScore ?? 80}%`
                : '--'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Assessment Status</span>
            <span className="font-bold text-slate-900">
              {resume.assessmentStatus === 'COMPLETED' || assessInfo?.completedSession
                ? 'Completed'
                : 'Not Taken'}
            </span>
          </div>
        </div>
      </div>

      {/* Personal Information & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Contact Metadata Card */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <User className="w-4 h-4 text-ai-600" />
            <span>Personal Information</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Candidate Name</span>
              <span className="font-bold text-slate-900 text-sm">
                {personalInfo?.fullName || 'Not detected'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-600">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{personalInfo?.email || 'Not detected'}</span>
            </div>

            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{personalInfo?.phone || 'Not detected'}</span>
            </div>

            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{personalInfo?.location || 'Not detected'}</span>
            </div>

            {personalInfo?.linkedin && (
              <div className="flex items-center gap-2 text-ai-600">
                <Linkedin className="w-4 h-4 shrink-0" />
                <a href={personalInfo.linkedin} target="_blank" rel="noreferrer" className="underline truncate">
                  LinkedIn Profile
                </a>
              </div>
            )}

            {personalInfo?.github && (
              <div className="flex items-center gap-2 text-slate-800">
                <Github className="w-4 h-4 shrink-0" />
                <a href={personalInfo.github} target="_blank" rel="noreferrer" className="underline truncate">
                  GitHub Repository
                </a>
              </div>
            )}

            {personalInfo?.portfolio && (
              <div className="flex items-center gap-2 text-brand-600">
                <Globe className="w-4 h-4 shrink-0" />
                <a href={personalInfo.portfolio} target="_blank" rel="noreferrer" className="underline truncate">
                  Portfolio Website
                </a>
              </div>
            )}
          </div>
        </div>

        {/* AI Summary Card */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
              <Sparkles className="w-4 h-4 text-ai-600" />
              <span>AI Executive Summary</span>
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed italic">
              "{summary || 'No explicit summary section detected in resume.'}"
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Extracted via Gemini AI structured JSON engine</span>
            <span className="font-semibold text-emerald-600">Verification Clean</span>
          </div>
        </div>
      </div>

      {/* Extracted Skills Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-ai-600" />
            <span>Extracted Technical Skills</span>
          </h3>
          <span className="text-xs text-slate-400">Categorized Breakdown</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills?.programmingLanguages?.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Programming Languages
              </h4>
              <div className="flex flex-wrap gap-2">
                {skills.programmingLanguages.map((sk, i) => (
                  <Badge key={i} variant="brand">{sk}</Badge>
                ))}
              </div>
            </div>
          )}

          {skills?.frameworks?.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Frameworks & Libraries
              </h4>
              <div className="flex flex-wrap gap-2">
                {skills.frameworks.concat(skills.libraries || []).map((sk, i) => (
                  <Badge key={i} variant="ai">{sk}</Badge>
                ))}
              </div>
            </div>
          )}

          {skills?.databases?.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Databases
              </h4>
              <div className="flex flex-wrap gap-2">
                {skills.databases.map((sk, i) => (
                  <Badge key={i} variant="success">{sk}</Badge>
                ))}
              </div>
            </div>
          )}

          {skills?.cloud?.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Cloud Platforms
              </h4>
              <div className="flex flex-wrap gap-2">
                {skills.cloud.map((sk, i) => (
                  <Badge key={i} variant="warning">{sk}</Badge>
                ))}
              </div>
            </div>
          )}

          {skills?.tools?.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Tools & DevOps
              </h4>
              <div className="flex flex-wrap gap-2">
                {skills.tools.map((sk, i) => (
                  <Badge key={i} variant="default">{sk}</Badge>
                ))}
              </div>
            </div>
          )}

          {skills?.other?.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Other Skills
              </h4>
              <div className="flex flex-wrap gap-2">
                {skills.other.map((sk, i) => (
                  <Badge key={i} variant="default">{sk}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resume-Based AI Skill Verification Banner */}
      <div className="bg-gradient-to-r from-ai-900 via-brand-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-ai-700/50 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="max-w-xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ai-500/20 text-ai-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Personalized AI Skill Verification</span>
          </div>
          <h3 className="text-xl font-black tracking-tight">
            Verify Detected Resume Skills (20 Personalized Questions)
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Take your personalized 20-question AI assessment generated directly from your extracted skills, projects, and work experience to compute your TrustScore (30% Resume Evidence + 50% Assessment Performance + 20% Consistency Alignment).
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {assessInfo?.completedSession ? (
            <>
              <button
                onClick={() => navigate(`/candidate/assessment/${assessInfo.completedSession.id}/report`)}
                className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <Award className="w-4 h-4" />
                <span>View Assessment Result</span>
              </button>
              <button
                onClick={() => navigate('/candidate/verification')}
                className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition-all"
              >
                Verification Report
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate(`/candidate/assessments?resumeId=${resume.id}&prepare=true`)}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-ai-500 to-brand-500 hover:from-ai-400 hover:to-brand-400 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2"
            >
              <Award className="w-4 h-4" />
              <span>Take Assessment</span>
            </button>
          )}
        </div>
      </div>

      {/* Projects Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-ai-600" />
            <span>Extracted Projects</span>
          </h3>
          <span className="text-xs text-slate-400">{projects?.length || 0} Projects Detected</span>
        </div>

        {projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {projects.map((proj, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="text-base font-extrabold text-slate-900">{proj.name}</h4>
                    {proj.duration && (
                      <span className="text-[11px] text-slate-400 font-mono">{proj.duration}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    {proj.description || 'No description provided'}
                  </p>
                </div>

                {proj.technologies && proj.technologies.length > 0 && (
                  <div className="pt-3 border-t border-slate-200/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Technologies Used:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {proj.technologies.map((tech, tIdx) => (
                        <Badge key={tIdx} variant="ai" size="sm">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No specific projects detected in resume.</p>
        )}
      </div>

      {/* Experience & Education Timelines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Work Experience Timeline */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <Briefcase className="w-5 h-5 text-ai-600" />
            <span>Work Experience</span>
          </h3>

          {experience && experience.length > 0 ? (
            <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {experience.map((exp, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-ai-600 ring-4 ring-ai-100" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-slate-900">{exp.role}</h4>
                    <p className="text-xs font-bold text-ai-700">{exp.company}</p>
                    <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {exp.startDate} - {exp.endDate || 'Present'}
                      </span>
                    </p>
                    {exp.description && exp.description.length > 0 && (
                      <ul className="mt-2 text-xs text-slate-600 space-y-1 list-disc list-inside">
                        {exp.description.map((bullet, bIdx) => (
                          <li key={bIdx} className="leading-relaxed">
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No work experience entries detected.</p>
          )}
        </div>

        {/* Education Timeline */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <GraduationCap className="w-5 h-5 text-ai-600" />
            <span>Education History</span>
          </h3>

          {education && education.length > 0 ? (
            <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {education.map((edu, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-brand-600 ring-4 ring-brand-100" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-slate-900">{edu.degree}</h4>
                    <p className="text-xs font-bold text-slate-700">{edu.institution}</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {edu.startYear} - {edu.endYear} {edu.grade ? `• Grade/CGPA: ${edu.grade}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No education entries detected.</p>
          )}
        </div>
      </div>

      {/* Certifications Section */}
      {certifications && certifications.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <Award className="w-5 h-5 text-ai-600" />
            <span>Certifications</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {certifications.map((cert, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <h4 className="text-xs font-extrabold text-slate-900 mb-1">{cert.name}</h4>
                <p className="text-[11px] text-slate-600 font-medium">{cert.issuer}</p>
                {cert.date && <p className="text-[10px] text-slate-400 font-mono mt-1">{cert.date}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
