import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import {
  Briefcase,
  Users,
  UserCheck,
  Star,
  FileText,
  CheckCircle2,
  PlusCircle,
  Search,
  ArrowRight,
  Eye,
  Sparkles,
  MapPin,
  Code2,
  Award,
  ShieldCheck,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isRecruiter = user?.role === 'RECRUITER';

  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      navigate('/admin/dashboard', { replace: true });
      return;
    }
    fetchDashboard();
  }, [user]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStar = async (appId: string) => {
    try {
      const res = await api.patch(`/applications/recruiter/${appId}/star`);
      if (res.data.success) {
        setData((prev: any) => ({
          ...prev,
          recentApplicants: prev.recentApplicants.map((app: any) =>
            app.id === appId ? { ...app, isStarred: res.data.isStarred } : app
          ),
        }));
      }
    } catch (err) {
      alert('Failed to update star state');
    }
  };

  if (loading) {
    return <LoadingState message="Loading dashboard intelligence metrics..." />;
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Recruiter Dashboard */}
      {isRecruiter ? (
        <>
          {/* Welcome Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-ai-950 to-brand-950 p-6 sm:p-8 border border-slate-800 text-white shadow-xl">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ai-500/10 border border-ai-500/20 text-ai-300 text-xs font-semibold mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ResumeAI V2.5 Recruiter Workspace</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Welcome back, {user?.name}!
                </h1>
                <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                  Manage jobs, conduct proctored assessments in dedicated rooms, and evaluate candidate TrustScore with RAG semantic verification.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => navigate('/recruiter/assessment-rooms')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 backdrop-blur-md transition-all shrink-0"
                >
                  <Award className="w-4 h-4 text-ai-400" />
                  <span>Assessment Rooms</span>
                </button>
                <button
                  onClick={() => navigate('/recruiter/jobs/create')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-ai-600 to-brand-600 hover:from-ai-500 hover:to-brand-500 text-white font-bold text-xs shadow-lg shadow-ai-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Job</span>
                </button>
              </div>
            </div>
          </div>

          {/* V2.0 / V2.5 Quick Feature Launchpad */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => navigate('/recruiter/assessment-rooms')}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-ai-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-ai-50 text-ai-600 rounded-xl group-hover:scale-105 transition-transform">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Proctored Rooms</h4>
                  <p className="text-xs text-slate-500">Create & manage screening rooms (RAI-XXXXX)</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-ai-600 group-hover:translate-x-0.5 transition-all" />
            </div>

            <div
              onClick={() => navigate('/recruiter/candidates')}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-brand-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-brand-50 text-brand-600 rounded-xl group-hover:scale-105 transition-transform">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Semantic Talent Search</h4>
                  <p className="text-xs text-slate-500">Vector cosine retrieval against job descriptions</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
            </div>

            <div
              onClick={() => navigate('/recruiter/reports')}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Verification Reports</h4>
                  <p className="text-xs text-slate-500">TrustScores & proctoring integrity audits</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Active Jobs"
              value={data?.stats?.activeJobs ?? 0}
              icon={<Briefcase className="w-6 h-6" />}
              description="Published job descriptions"
              color="brand"
            />
            <StatCard
              title="Total Applicants"
              value={data?.stats?.totalApplicants ?? 0}
              icon={<Users className="w-6 h-6" />}
              description="Candidate applications received"
              color="ai"
            />
            <StatCard
              title="Reviewed"
              value={data?.stats?.candidatesReviewed ?? 0}
              icon={<UserCheck className="w-6 h-6" />}
              description="Applications processed by team"
              color="emerald"
            />
            <StatCard
              title="Starred Candidates"
              value={data?.stats?.starredCandidates ?? 0}
              icon={<Star className="w-6 h-6 text-amber-500 fill-amber-500" />}
              description="Manually starred candidate profiles"
              color="amber"
            />
          </div>

          {/* Active Job Descriptions */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Active Job Descriptions</h3>
                <p className="text-xs text-slate-500">Overview of your published open positions</p>
              </div>
              <Link
                to="/recruiter/jobs"
                className="text-xs font-bold text-ai-600 hover:text-ai-700 flex items-center gap-1"
              >
                <span>View All Jobs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {data?.activeJobDescriptions?.length === 0 ? (
              <EmptyState
                title="No active job descriptions"
                description="Create your first job description or upload a JD PDF to start receiving candidate applications."
                actionText="Create Job"
                onAction={() => navigate('/recruiter/jobs/create')}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data?.activeJobDescriptions?.map((job: any) => (
                  <div
                    key={job.id}
                    className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between space-y-4 hover:border-ai-200 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-base font-extrabold text-slate-900 truncate">
                          {job.title}
                        </h4>
                        <Badge variant={job.status === 'PUBLISHED' ? 'success' : 'warning'} size="sm">
                          {job.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{job.companyName} • {job.location}</span>
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">
                        {job.applicantsCount} Applicants
                      </span>
                      <button
                        onClick={() => navigate(`/recruiter/jobs/${job.id}`)}
                        className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold text-xs transition-colors"
                      >
                        View Job
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Applicants */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Recent Applicants</h3>
                <p className="text-xs text-slate-500">Default chronological order of candidate submissions</p>
              </div>
              <Link
                to="/recruiter/applicants"
                className="text-xs font-bold text-ai-600 hover:text-ai-700 flex items-center gap-1"
              >
                <span>View All Applicants</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {data?.recentApplicants?.length === 0 ? (
              <p className="p-8 text-center text-xs text-slate-400 italic">No applications received yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                      <th className="py-3.5 px-6">Candidate</th>
                      <th className="py-3.5 px-6">Job Title</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6">Match Score</th>
                      <th className="py-3.5 px-6">Star</th>
                      <th className="py-3.5 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                    {data?.recentApplicants?.map((app: any) => (
                      <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-6">
                          <div>
                            <span className="font-bold text-slate-900 block">{app.candidateName}</span>
                            <span className="text-[11px] text-slate-400">{app.candidateEmail}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-800">{app.jobTitle}</td>
                        <td className="py-4 px-6">
                          <Badge variant="brand" size="sm">{app.status}</Badge>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-mono font-bold text-ai-700">{app.matchScore}% Alignment</span>
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => handleToggleStar(app.id)}
                            className="p-1 rounded hover:bg-slate-100 transition-colors"
                            title={app.isStarred ? 'Unstar candidate' : 'Star candidate'}
                          >
                            <Star
                              className={`w-4 h-4 ${
                                app.isStarred ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                              }`}
                            />
                          </button>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => navigate(`/recruiter/candidates/${app.candidateId}`)}
                            className="px-3.5 py-1.5 rounded-xl bg-ai-50 text-ai-700 hover:bg-ai-100 font-bold transition-colors inline-flex items-center gap-1"
                          >
                            <span>View Profile</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Candidate Dashboard */
        <>
          {/* Welcome Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-ai-950 to-brand-950 p-6 sm:p-8 border border-slate-800 text-white shadow-xl">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ai-500/10 border border-ai-500/20 text-ai-300 text-xs font-semibold mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ResumeAI V2.5 Candidate Portal</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Welcome back, {user?.name}!
                </h1>
                <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                  Verify your resume skills with semantic evidence mapping, join proctored assessment rooms, and track your transparent TrustScore.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => navigate('/candidate/assessments')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 backdrop-blur-md transition-all shrink-0"
                >
                  <Award className="w-4 h-4 text-ai-400" />
                  <span>Take Assessment</span>
                </button>
                <button
                  onClick={() => navigate('/jobs')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-ai-600 to-brand-600 hover:from-ai-500 hover:to-brand-500 text-white font-bold text-xs shadow-lg shadow-ai-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
                >
                  <Search className="w-5 h-5" />
                  <span>Browse Jobs</span>
                </button>
              </div>
            </div>
          </div>

          {/* V2.0 / V2.5 Candidate Feature Launchpad */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => navigate('/candidate/skill-verification')}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-brand-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-brand-50 text-brand-600 rounded-xl group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Skill Evidence Map</h4>
                  <p className="text-xs text-slate-500">Extracted resume evidence & project validation</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
            </div>

            <div
              onClick={() => navigate('/candidate/assessments')}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-ai-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-ai-50 text-ai-600 rounded-xl group-hover:scale-105 transition-transform">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Proctored Assessments</h4>
                  <p className="text-xs text-slate-500">Resume AI & Recruiter Screening Invitations</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-ai-600 group-hover:translate-x-0.5 transition-all" />
            </div>

            <div
              onClick={() => navigate('/candidate/verification')}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">TrustScore Report</h4>
                  <p className="text-xs text-slate-500">30% Evidence + 50% Test + 20% Consistency</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Resumes Uploaded"
              value={data?.stats?.totalUploaded ?? 0}
              icon={<FileText className="w-6 h-6" />}
              description="PDF documents in your repository"
              color="brand"
            />
            <StatCard
              title="Resumes Analyzed"
              value={data?.stats?.totalAnalyzed ?? 0}
              icon={<CheckCircle2 className="w-6 h-6" />}
              description="Analyzed by Gemini AI"
              color="ai"
            />
            <StatCard
              title="Applications"
              value={data?.stats?.totalApplications ?? 0}
              icon={<UserCheck className="w-6 h-6" />}
              description="Job applications submitted"
              color="emerald"
            />
            <StatCard
              title="Active Applications"
              value={data?.stats?.activeApplications ?? 0}
              icon={<Briefcase className="w-6 h-6" />}
              description="Applications currently under review"
              color="amber"
            />
          </div>

          {/* Recommended Opportunities */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Recommended Opportunities</h3>
                <p className="text-xs text-slate-500">Informational matches based on published job descriptions</p>
              </div>
              <Link
                to="/jobs"
                className="text-xs font-bold text-ai-600 hover:text-ai-700 flex items-center gap-1"
              >
                <span>Browse All Opportunities</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {data?.recommendedJobs?.length === 0 ? (
              <EmptyState
                title="No open opportunities available"
                description="Check back soon for new job postings published by recruiters."
                actionText="Upload Resume"
                onAction={() => navigate('/upload')}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data?.recommendedJobs?.map((job: any) => (
                  <div
                    key={job.id}
                    className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between space-y-4 hover:border-ai-200 transition-colors"
                  >
                    <div>
                      <h4 className="text-base font-extrabold text-slate-900 mb-1">{job.title}</h4>
                      <p className="text-xs text-slate-500 font-medium mb-3">
                        {job.companyName} • {job.location} • {job.employmentType}
                      </p>

                      {job.requiredSkills?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {job.requiredSkills.slice(0, 4).map((sk: string, i: number) => (
                            <Badge key={i} variant="brand" size="sm">
                              {sk}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-mono">Exp: {job.experienceLevel}</span>
                      <button
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        className="px-4 py-1.5 rounded-xl bg-ai-600 hover:bg-ai-700 text-white font-bold text-xs shadow-xs transition-colors"
                      >
                        View Job
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Recent Applications */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">My Applications</h3>
                <p className="text-xs text-slate-500">Track your job applications and AI alignment scores</p>
              </div>
              <Link
                to="/my-applications"
                className="text-xs font-bold text-ai-600 hover:text-ai-700 flex items-center gap-1"
              >
                <span>View All Applications</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {data?.recentApplications?.length === 0 ? (
              <p className="p-8 text-center text-xs text-slate-400 italic">No job applications submitted yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                      <th className="py-3.5 px-6">Job Position</th>
                      <th className="py-3.5 px-6">Company</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6">AI Match Score</th>
                      <th className="py-3.5 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                    {data?.recentApplications?.map((app: any) => (
                      <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-900">{app.jobTitle}</td>
                        <td className="py-4 px-6 text-slate-600">{app.companyName}</td>
                        <td className="py-4 px-6">
                          <Badge variant="brand" size="sm">{app.status}</Badge>
                        </td>
                        <td className="py-4 px-6 font-mono font-bold text-ai-700">
                          {app.matchScore}% Resume-JD Alignment
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => navigate(`/my-applications/${app.id}`)}
                            className="px-3.5 py-1.5 rounded-xl bg-ai-50 text-ai-700 hover:bg-ai-100 font-bold transition-colors inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
