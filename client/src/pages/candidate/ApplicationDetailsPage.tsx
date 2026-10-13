import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ApplicationItem } from '../../types';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { ProgressBar } from '../../components/common/ProgressBar';
import {
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileText,
  Building2,
  Calendar,
  Info,
} from 'lucide-react';

export const ApplicationDetailsPage: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();

  const [application, setApplication] = useState<ApplicationItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (applicationId) {
      fetchApplication();
    }
  }, [applicationId]);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/applications/my-applications/${applicationId}`);
      if (res.data.success) {
        setApplication(res.data.application);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load application details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Fetching application alignment details..." />;
  }

  if (error || !application) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Application Details Unavailable</h3>
        <p className="text-sm text-slate-500 mb-6">{error}</p>
        <button
          onClick={() => navigate('/my-applications')}
          className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-medium text-xs"
        >
          Return to My Applications
        </button>
      </div>
    );
  }

  const job = application.jobId as any;
  const resume = application.resumeId as any;
  const breakdown = application.matchBreakdown;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Top Navigation */}
      <button
        onClick={() => navigate('/my-applications')}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Applications</span>
      </button>

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ai-50 text-ai-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Submitted Application</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {job?.title || 'Job Position'}
          </h1>
          <p className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-1">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span>{job?.companyName || 'Company'}</span>
            <span>•</span>
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>
              Applied on{' '}
              {new Date(application.appliedAt).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="brand" size="md">
            Status: {application.status}
          </Badge>
        </div>
      </div>

      {/* Attached Resume Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">
              {resume?.originalFileName || 'Attached Resume'}
            </span>
            <span className="text-[11px] text-slate-400">Attached to application</span>
          </div>
        </div>

        {resume?.id && (
          <button
            onClick={() => navigate(`/analysis/${resume.id}`)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
          >
            View Resume Analysis
          </button>
        )}
      </div>

      {/* AI Resume-JD Alignment Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">AI Resume-JD Alignment</h3>
            <p className="text-xs text-slate-500">
              Informational score comparing submitted resume content with target job description
            </p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black text-ai-600 font-mono">
              {application.matchScore}%
            </span>
            <span className="text-xs font-bold text-slate-500 block">Overall Alignment</span>
          </div>
        </div>

        {breakdown && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <ProgressBar
                  percentage={breakdown.skillAlignment}
                  label="Skills Alignment"
                  subText={`${breakdown.skillAlignment}%`}
                  color="ai"
                />
              </div>
              <div>
                <ProgressBar
                  percentage={breakdown.experienceAlignment}
                  label="Experience Alignment"
                  subText={`${breakdown.experienceAlignment}%`}
                  color="brand"
                />
              </div>
              <div>
                <ProgressBar
                  percentage={breakdown.educationAlignment}
                  label="Education Alignment"
                  subText={`${breakdown.educationAlignment}%`}
                  color="emerald"
                />
              </div>
              <div>
                <ProgressBar
                  percentage={breakdown.projectRelevance}
                  label="Project Relevance"
                  subText={`${breakdown.projectRelevance}%`}
                  color="ai"
                />
              </div>
            </div>
          </div>
        )}

        {/* Matching Skills */}
        {application.matchingSkills && application.matchingSkills.length > 0 && (
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Matching Skills Detected</span>
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {application.matchingSkills.map((sk, i) => (
                <Badge key={i} variant="success" size="sm">
                  {sk}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Skills Mentioned in JD Not Detected */}
        {application.missingRequiredSkills && application.missingRequiredSkills.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-slate-400" />
              <span>Skills Mentioned in JD Not Detected in Resume</span>
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {application.missingRequiredSkills.map((sk, i) => (
                <Badge key={i} variant="default" size="sm">
                  {sk}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Important Neutral Disclaimer */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs text-slate-600 flex items-start gap-3">
          <Info className="w-4 h-4 text-ai-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-slate-900">Informational Alignment Notice</span>
            <span>
              These results indicate areas where your submitted resume aligns with the job description. This analysis is an informational comparison between your submitted resume and the job description. It does not predict hiring outcomes.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
