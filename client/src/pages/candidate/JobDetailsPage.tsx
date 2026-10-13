import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { JobItem, ResumeItem } from '../../types';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { Modal } from '../../components/common/Modal';
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle2,
  FileText,
  Sparkles,
  ArrowLeft,
  AlertCircle,
  Building2,
} from 'lucide-react';

export const JobDetailsPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const { user } = useAuth();
  const userRole = String(user?.role || '').trim().toUpperCase();
  const isRecruiter = userRole === 'RECRUITER' || userRole === 'ADMIN';
  const isCandidate = userRole === 'CANDIDATE';

  const [job, setJob] = useState<JobItem | null>(null);
  const [userResumes, setUserResumes] = useState<ResumeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [alreadyAppliedAppId, setAlreadyAppliedAppId] = useState<string | null>(null);

  // Apply Modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState<boolean>(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
      fetchUserResumes();
      checkExistingApplication();
    }
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/jobs/${jobId}`);
      if (res.data.success) {
        setJob(res.data.job);
      }
    } catch (err) {
      console.error('Failed to fetch job details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserResumes = async () => {
    try {
      const res = await api.get('/resumes');
      if (res.data.success) {
        const analyzed = res.data.resumes.filter((r: ResumeItem) => r.status === 'ANALYZED');
        setUserResumes(analyzed);
        if (analyzed.length > 0) {
          setSelectedResumeId(analyzed[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch user resumes:', err);
    }
  };

  const checkExistingApplication = async () => {
    try {
      const res = await api.get('/applications/my-applications');
      if (res.data.success) {
        const existing = res.data.applications.find(
          (app: any) => (app.job?.id || app.job?._id || app.job) === jobId
        );
        if (existing) {
          setAlreadyAppliedAppId(existing.id);
        }
      }
    } catch (err) {
      console.error('Failed to check existing application:', err);
    }
  };

  const handleApplySubmit = async () => {
    if (!selectedResumeId) {
      setApplyError('Please select an analyzed resume before applying.');
      return;
    }

    setApplyError(null);
    setIsSubmitting(true);

    try {
      const res = await api.post('/applications/apply', {
        jobId,
        resumeId: selectedResumeId,
      });

      if (res.data.success) {
        setIsApplyModalOpen(false);
        navigate(`/my-applications/${res.data.application.id}`);
      }
    } catch (err: any) {
      setApplyError(err.response?.data?.message || err.message || 'Failed to submit application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState message="Fetching position details..." />;
  }

  if (!job) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Job Position Not Found</h3>
        <button
          onClick={() => navigate('/jobs')}
          className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-medium text-xs"
        >
          Return to Browse Jobs
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Top Navigation */}
      <button
        onClick={() => navigate('/jobs')}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Browse Jobs</span>
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{job.title}</h1>
            <Badge variant={job.status === 'PUBLISHED' ? 'success' : 'danger'}>
              {job.status}
            </Badge>
          </div>
          <p className="text-sm font-semibold text-slate-600 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span>{job.companyName}</span>
            <span>•</span>
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>{job.location}</span>
          </p>
        </div>

        <div>
          {isRecruiter ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => navigate(`/recruiter/applicants?jobId=${job.id || (job as any)._id}`)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
              >
                View Applicants
              </button>
              {job.assessmentRoomId ? (
                <button
                  onClick={() => navigate(`/recruiter/assessment-rooms/${job.assessmentRoomId}`)}
                  className="px-4 py-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 font-bold text-xs hover:bg-purple-100 transition-colors"
                >
                  View Assessment Room
                </button>
              ) : (
                <button
                  onClick={() => navigate(`/recruiter/assessment-rooms/create?jobId=${job.id || (job as any)._id}`)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-ai-600 to-brand-600 text-white font-bold text-xs hover:opacity-90 transition-opacity"
                >
                  Create Assessment Room
                </button>
              )}
            </div>
          ) : !isCandidate ? null : job.status === 'CLOSED' ? (
            <span className="px-5 py-2.5 rounded-2xl bg-slate-100 text-slate-500 font-bold text-xs cursor-not-allowed">
              Applications are closed
            </span>
          ) : alreadyAppliedAppId ? (
            <button
              onClick={() => navigate(`/my-applications/${alreadyAppliedAppId}`)}
              className="px-6 py-3 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs inline-flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Application Submitted — View Match</span>
            </button>
          ) : (
            <button
              onClick={() => setIsApplyModalOpen(true)}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-ai-600 to-brand-600 hover:from-ai-500 hover:to-brand-500 text-white font-bold text-sm shadow-lg shadow-ai-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Apply Now
            </button>
          )}
        </div>
      </div>

      {/* Quick Specs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 text-xs">
          <span className="text-slate-400 block mb-0.5">Employment Type</span>
          <span className="font-bold text-slate-900">{job.employmentType}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 text-xs">
          <span className="text-slate-400 block mb-0.5">Experience Level</span>
          <span className="font-bold text-slate-900">{job.experienceLevel}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 text-xs">
          <span className="text-slate-400 block mb-0.5">Salary Range</span>
          <span className="font-bold text-slate-900">{job.salaryRange || 'Not disclosed'}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 text-xs">
          <span className="text-slate-400 block mb-0.5">Location</span>
          <span className="font-bold text-slate-900">{job.location}</span>
        </div>
      </div>

      {/* Detailed Description */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 mb-4">
            About the Role
          </h3>
          <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
            {job.description}
          </p>
        </div>

        {/* Required Skills */}
        {job.requiredSkills?.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Required Technical Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {job.requiredSkills.map((sk, i) => (
                <Badge key={i} variant="brand">
                  {sk}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Preferred Skills */}
        {job.preferredSkills && job.preferredSkills.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Preferred Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {job.preferredSkills.map((sk, i) => (
                <Badge key={i} variant="ai">
                  {sk}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Responsibilities */}
        {job.responsibilities && job.responsibilities.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Key Responsibilities
            </h4>
            <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
              {job.responsibilities.map((res, i) => (
                <li key={i} className="leading-relaxed">
                  {res}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Apply Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title={`Apply for ${job.title}`}
        footer={
          <>
            <button
              onClick={() => setIsApplyModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleApplySubmit}
              disabled={isSubmitting || userResumes.length === 0}
              className="px-6 py-2.5 rounded-xl bg-ai-600 hover:bg-ai-700 text-white font-bold text-xs shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Select one of your analyzed PDF resumes to attach to this job application. Gemini AI will analyze informational alignment between your resume and the job description.
          </p>

          {applyError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{applyError}</span>
            </div>
          )}

          {userResumes.length === 0 ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-2">
              <p className="font-bold">No analyzed resumes found in your account.</p>
              <p>Please upload and analyze a PDF resume first before applying to positions.</p>
              <button
                type="button"
                onClick={() => {
                  setIsApplyModalOpen(false);
                  navigate('/upload');
                }}
                className="px-3.5 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-xs"
              >
                Upload Resume Now
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Resume Document:
              </label>
              <div className="space-y-2">
                {userResumes.map((res) => (
                  <label
                    key={res.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-colors ${
                      selectedResumeId === res.id
                        ? 'border-ai-500 bg-ai-50/50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="selectedResume"
                        checked={selectedResumeId === res.id}
                        onChange={() => setSelectedResumeId(res.id)}
                        className="text-ai-600 focus:ring-ai-500"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">
                          {res.originalFileName}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-400 font-mono">
                            Analyzed on{' '}
                            {new Date(res.createdAt).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="text-[11px] font-semibold text-ai-600">
                            • TrustScore: {res.trustScore != null ? `${res.trustScore}%` : 'Pending Assessment'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
