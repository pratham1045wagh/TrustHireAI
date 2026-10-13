import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { ApplicationItem } from '../../types';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Star,
  Search,
  Sparkles,
  Filter,
  FileText,
  ShieldCheck,
  Award,
  UserCheck,
  Send,
} from 'lucide-react';

export const ApplicantsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobIdFilter = searchParams.get('jobId');

  const [applicants, setApplicants] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchApplicants();
  }, [jobIdFilter]);

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const url = jobIdFilter
        ? `/applications/recruiter/applicants?jobId=${jobIdFilter}`
        : '/applications/recruiter/applicants';
      const res = await api.get(url);
      if (res.data.success) {
        setApplicants(res.data.applicants);
      }
    } catch (err) {
      console.error('Failed to fetch applicants:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStar = async (appId: string) => {
    try {
      const res = await api.patch(`/applications/recruiter/${appId}/star`);
      if (res.data.success) {
        setApplicants((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, isStarred: res.data.isStarred } : a))
        );
      }
    } catch (err) {
      alert('Failed to update star state.');
    }
  };

  const handleToggleShortlist = async (appId: string) => {
    try {
      const res = await api.patch(`/applications/recruiter/${appId}/shortlist`);
      if (res.data.success) {
        setApplicants((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, isShortlisted: res.data.isShortlisted, status: res.data.status || a.status } : a))
        );
      }
    } catch (err) {
      alert('Failed to update shortlist state.');
    }
  };

  const handleUpdateStatus = async (appId: string, newStatus: string) => {
    try {
      const res = await api.patch(`/applications/recruiter/${appId}/status`, { status: newStatus });
      if (res.data.success) {
        setApplicants((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, status: newStatus as any } : a))
        );
      }
    } catch (err) {
      alert('Failed to update application status.');
    }
  };

  const handleInviteApplicant = async (app: ApplicationItem) => {
    try {
      const jobObj = app.job as any;
      const roomId = jobObj?.assessmentRoomId;
      if (!roomId) {
        alert('No assessment room is directly linked to this job yet. You can create one in the Assessment Rooms section.');
        return;
      }
      const res = await api.post(`/assessment-rooms/${roomId}/invite`, {
        applicationIds: [app.id],
      });
      if (res.data.success) {
        alert(res.data.message || 'Assessment invitation sent successfully!');
        fetchApplicants();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send invitation.');
    }
  };

  const filteredApplicants = applicants.filter((a) => {
    const candidateObj = a.candidate as any;
    const jobObj = a.job as any;
    const candidateName = candidateObj?.name || '';
    const candidateEmail = candidateObj?.email || '';
    const jobTitle = jobObj?.title || '';

    const matchesSearch =
      candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidateEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jobTitle.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <LoadingState message="Fetching candidate applications..." />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ai-50 text-ai-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Recruiter Candidate Review</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Applicants</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review candidate applications, TrustScore (30% Resume Evidence + 50% Assessment Performance + 20% Consistency Alignment), and detailed reports.
          </p>
        </div>
      </div>

      {/* Search & Status Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by candidate name, email, or job title..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-ai-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-ai-500 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPLIED">Applied</option>
            <option value="REVIEWING">Reviewing</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="REJECTED">Rejected</option>
            <option value="SELECTED">Selected</option>
          </select>
        </div>
      </div>

      {/* Applicants Table */}
      {filteredApplicants.length === 0 ? (
        <EmptyState
          title="No candidate applicants found"
          description={
            searchTerm
              ? `No applicants found matching "${searchTerm}".`
              : 'Candidates will appear here once they apply to your published jobs.'
          }
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <th className="py-3.5 px-5">Candidate & Resume</th>
                  <th className="py-3.5 px-4">Job Position</th>
                  <th className="py-3.5 px-4">TrustScore</th>
                  <th className="py-3.5 px-4">Score Breakdown</th>
                  <th className="py-3.5 px-4">Status & Shortlist</th>
                  <th className="py-3.5 px-3 text-center">Star</th>
                  <th className="py-3.5 px-4">Assessment Invitation</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                {filteredApplicants.map((app) => {
                  const candidateObj = app.candidate as any;
                  const jobObj = app.job as any;
                  const resumeObj = app.resume as any;
                  const candidateId = candidateObj?._id || candidateObj?.id;

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-5">
                        <div>
                          <span className="font-bold text-slate-900 block">
                            {candidateObj?.name || 'Candidate'}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            {candidateObj?.email || ''}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-ai-600 font-semibold mt-0.5">
                            <FileText className="w-3 h-3" />
                            {resumeObj?.originalFileName || resumeObj?.fileName || 'Selected Resume'}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-bold text-slate-800">
                        {jobObj?.title || 'Job Position'}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          {app.trustScore != null ? (
                            <>
                              <span className="font-mono font-black text-emerald-700 text-sm">
                                {app.trustScore}%
                              </span>
                              <span className="text-[10px] text-slate-400">
                                TrustScore
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-xs text-slate-500 font-medium">
                                Not Available
                              </span>
                              <span className="text-[10px] font-bold text-amber-600">
                                Assessment: Pending
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="space-y-0.5 text-[11px] font-mono">
                          <div className="text-slate-600">
                            Evidence (30%): <strong className="text-slate-900">{app.resumeEvidence ?? app.evidenceScore ?? '—'}%</strong>
                          </div>
                          <div className="text-slate-600">
                            Assessment (50%): <strong className="text-slate-900">{app.assessmentPerformance ?? app.assessmentScore ?? 'Pending'}{app.assessmentPerformance ? '%' : ''}</strong>
                          </div>
                          <div className="text-slate-600">
                            Consistency (20%): <strong className="text-slate-900">{app.consistencyAlignment ?? app.consistencyScore ?? '—'}%</strong>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="space-y-1.5">
                          <select
                            value={app.status}
                            onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-ai-500"
                          >
                            <option value="APPLIED">Applied</option>
                            <option value="REVIEWING">Reviewing</option>
                            <option value="SHORTLISTED">Shortlisted</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="SELECTED">Selected</option>
                          </select>
                          <div>
                            <button
                              type="button"
                              onClick={() => handleToggleShortlist(app.id)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors inline-flex items-center gap-1 ${
                                app.isShortlisted || app.status === 'SHORTLISTED'
                                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>{app.isShortlisted || app.status === 'SHORTLISTED' ? 'Shortlisted' : 'Shortlist'}</span>
                            </button>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStar(app.id)}
                          className="p-1.5 rounded hover:bg-slate-100 transition-colors"
                          title={app.isStarred ? 'Unstar candidate' : 'Star candidate'}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              app.isStarred ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                            }`}
                          />
                        </button>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <Badge
                            variant={
                              app.invitationStatus === 'COMPLETED'
                                ? 'success'
                                : app.invitationStatus === 'STARTED'
                                ? 'warning'
                                : app.invitationStatus === 'INVITED'
                                ? 'brand'
                                : 'default'
                            }
                            size="sm"
                          >
                            {app.invitationStatus ? app.invitationStatus.replace('_', ' ') : 'NOT INVITED'}
                          </Badge>
                          {app.invitationStatus !== 'COMPLETED' && (
                            <button
                              type="button"
                              onClick={() => handleInviteApplicant(app)}
                              className="text-[10px] text-ai-600 hover:text-ai-800 font-bold inline-flex items-center gap-1 mt-0.5"
                            >
                              <Send className="w-2.5 h-2.5" />
                              <span>{app.invitationStatus === 'INVITED' ? 'Resend' : 'Invite'}</span>
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => navigate(`/recruiter/candidates/${candidateId}?applicationId=${app.id}`)}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors inline-flex items-center gap-1"
                            title="View Candidate Profile & Resume Skills"
                          >
                            <FileText className="w-3 h-3" />
                            <span>View Profile</span>
                          </button>
                          {app.latestSessionId && (
                            <button
                              type="button"
                              onClick={() => navigate(`/candidate/assessment/${app.latestSessionId}/report`)}
                              className="px-2.5 py-1.5 rounded-xl bg-ai-50 hover:bg-ai-100 text-ai-700 font-bold text-[11px] transition-colors inline-flex items-center gap-1"
                              title="View Assessment Report"
                            >
                              <Award className="w-3 h-3" />
                              <span>Assessment</span>
                            </button>
                          )}
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
    </div>
  );
};
