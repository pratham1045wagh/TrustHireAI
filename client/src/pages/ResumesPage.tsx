import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ResumeItem } from '../types';
import { Badge } from '../components/common/Badge';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import {
  FileText,
  Search,
  Eye,
  Trash2,
  UploadCloud,
  Sparkles,
  Award,
  CheckCircle2,
  RotateCcw,
  Loader2,
} from 'lucide-react';

export const ResumesPage: React.FC = () => {
  const navigate = useNavigate();

  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [resumeAssessmentMap, setResumeAssessmentMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Modal delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const [res, assessRes] = await Promise.all([
        api.get('/resumes'),
        api.get('/assessments/my-resume-assessments').catch(() => ({ data: { success: false } })),
      ]);
      if (res.data.success) {
        setResumes(res.data.resumes);
      }
      if (assessRes.data?.success && Array.isArray(assessRes.data.resumeAssessments)) {
        const map: Record<string, any> = {};
        for (const item of assessRes.data.resumeAssessments) {
          map[String(item.resumeId)] = item;
        }
        setResumeAssessmentMap(map);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load resumes list.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResume = async () => {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      await api.delete(`/resumes/${deleteId}`);
      setResumes((prev) => prev.filter((r) => r.id !== deleteId));
      setDeleteId(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete resume.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredResumes = resumes.filter((r) =>
    r.originalFileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingState message="Fetching uploaded resumes..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ai-50 text-ai-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Resume Repository</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Resumes</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your uploaded resumes, view Gemini AI analysis reports, and take your 20-question AI verification assessment.
          </p>
        </div>

        <button
          onClick={() => navigate('/upload')}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-ai-600 hover:bg-ai-700 text-white font-bold text-xs shadow-md transition-all shrink-0"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Resume</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search resumes by filename..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-ai-500 transition"
          />
        </div>
        <span className="text-xs font-medium text-slate-500">
          Showing {filteredResumes.length} of {resumes.length} resumes
        </span>
      </div>

      {/* Resumes Table */}
      {filteredResumes.length === 0 ? (
        <EmptyState
          title={searchTerm ? 'No matching resumes found' : 'No resumes analyzed yet'}
          description={
            searchTerm
              ? `No resumes found matching "${searchTerm}". Try clearing your search filter.`
              : 'Upload your first PDF resume to get started.'
          }
          onAction={() => navigate('/upload')}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <th className="py-3.5 px-6">Resume Name</th>
                  <th className="py-3.5 px-6">Status & Skills</th>
                  <th className="py-3.5 px-6">Assessment Status</th>
                  <th className="py-3.5 px-6">Evidence (30%)</th>
                  <th className="py-3.5 px-6">Performance (50%)</th>
                  <th className="py-3.5 px-6">Consistency (20%)</th>
                  <th className="py-3.5 px-6">TrustScore</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                {filteredResumes.map((resume) => {
                  const assessInfo = resumeAssessmentMap[resume.id];
                  const completedSession = assessInfo?.completedSession;
                  const genStatus = assessInfo?.assessment?.generationStatus;
                  const isCompleted =
                    resume.assessmentStatus === 'COMPLETED' || !!completedSession;
                  const isInProgress =
                    resume.assessmentStatus === 'IN_PROGRESS' || assessInfo?.activeSession;

                  const skillsCount = resume.analysis?.skills
                    ? Object.values(resume.analysis.skills).reduce(
                        (acc: number, arr: any) => acc + (Array.isArray(arr) ? arr.length : 0),
                        0
                      )
                    : 0;

                  const evidenceScore = resume.resumeEvidenceScore ?? 60;
                  const assessmentScore =
                    resume.assessmentPerformanceScore ??
                    (completedSession ? completedSession.percentage : null);
                  const consistencyScore = resume.consistencyAlignmentScore ?? 80;
                  const trustScore = resume.trustScore;

                  return (
                    <tr key={resume.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block truncate max-w-xs">
                              {resume.originalFileName}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Uploaded {new Date(resume.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          {resume.status === 'ANALYZED' && (
                            <Badge variant="success" size="sm">Parsed</Badge>
                          )}
                          {resume.status === 'PROCESSING' && (
                            <Badge variant="warning" size="sm">Processing</Badge>
                          )}
                          {resume.status === 'FAILED' && (
                            <Badge variant="danger" size="sm">Failed</Badge>
                          )}
                          {skillsCount > 0 && (
                            <span className="block text-[11px] text-slate-500 font-bold">
                              {skillsCount} Skills
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        {isCompleted ? (
                          <Badge variant="success" size="sm">Completed</Badge>
                        ) : isInProgress ? (
                          <Badge variant="warning" size="sm">In Progress</Badge>
                        ) : (
                          <Badge variant="default" size="sm">Not Taken</Badge>
                        )}
                      </td>

                      <td className="py-4 px-6 font-mono font-bold text-slate-700">
                        {evidenceScore !== null && evidenceScore !== undefined ? `${evidenceScore}%` : '--'}
                      </td>

                      <td className="py-4 px-6 font-mono font-bold text-brand-700">
                        {isCompleted && assessmentScore !== null && assessmentScore !== undefined
                          ? `${assessmentScore}%`
                          : 'Not Taken'}
                      </td>

                      <td className="py-4 px-6 font-mono font-bold text-slate-700">
                        {isCompleted && consistencyScore !== null && consistencyScore !== undefined
                          ? `${consistencyScore}%`
                          : '--'}
                      </td>

                      <td className="py-4 px-6">
                        {isCompleted && trustScore !== null && trustScore !== undefined ? (
                          <span className="text-sm font-black font-mono text-emerald-700">
                            {trustScore}%
                          </span>
                        ) : (
                          <Badge variant="warning" size="sm">Assessment Required</Badge>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {resume.status === 'ANALYZED' && (
                            <button
                              onClick={() => navigate(`/analysis/${resume.id}`)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold transition-colors inline-flex items-center gap-1.5"
                              title="View Extracted Resume Insights"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Analysis</span>
                            </button>
                          )}

                          {resume.status === 'ANALYZED' && (
                            <button
                              onClick={() => navigate(`/candidate/resumes/${resume.id}/skill-evidence`)}
                              className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold transition-colors inline-flex items-center gap-1.5"
                              title="View Resume-Specific Skill Evidence"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Skill Evidence</span>
                            </button>
                          )}

                          {resume.status === 'ANALYZED' && (
                            <>
                              {isCompleted ? (
                                <button
                                  onClick={() => navigate(`/candidate/resumes/${resume.id}/trustscore`)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold transition-colors inline-flex items-center gap-1.5"
                                  title="View Detailed TrustScore Report"
                                >
                                  <Award className="w-3.5 h-3.5" />
                                  <span>View TrustScore</span>
                                </button>
                              ) : genStatus === 'GENERATING' ? (
                                <button
                                  disabled
                                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 font-bold inline-flex items-center gap-1.5 cursor-not-allowed"
                                >
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Generating...</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    navigate(`/candidate/assessments?resumeId=${resume.id}&prepare=true`)
                                  }
                                  className="px-3 py-1.5 rounded-xl bg-ai-600 text-white hover:bg-ai-700 font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs"
                                >
                                  <Award className="w-3.5 h-3.5" />
                                  <span>Take Assessment</span>
                                </button>
                              )}
                            </>
                          )}

                          <button
                            onClick={() => setDeleteId(resume.id)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Resume"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Resume Document"
        footer={
          <>
            <button
              onClick={() => setDeleteId(null)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteResume}
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </>
        }
      >
        <p>
          Are you sure you want to delete this resume analysis record? This will permanently erase the extracted insights from your repository.
        </p>
      </Modal>
    </div>
  );
};
