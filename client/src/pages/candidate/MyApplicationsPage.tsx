import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ApplicationItem } from '../../types';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { UserCheck, Eye, Sparkles, ArrowRight } from 'lucide-react';

export const MyApplicationsPage: React.FC = () => {
  const navigate = useNavigate();

  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/applications/my-applications');
      if (res.data.success) {
        setApplications(res.data.applications);
      }
    } catch (err) {
      console.error('Failed to fetch candidate applications:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Fetching your job applications..." />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ai-50 text-ai-700 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Application Tracker</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Applications</h1>
        <p className="text-sm text-slate-500 mt-1">
          Track the progress of your submitted job applications and review AI alignment insights.
        </p>
      </div>

      {applications.length === 0 ? (
        <EmptyState
          title="No applications submitted yet"
          description="Browse available published job opportunities and apply using your analyzed resume."
          actionText="Browse Jobs"
          onAction={() => navigate('/jobs')}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <th className="py-3.5 px-6">Job Title</th>
                  <th className="py-3.5 px-6">Company</th>
                  <th className="py-3.5 px-6">Applied Date</th>
                  <th className="py-3.5 px-6">Application Status</th>
                  <th className="py-3.5 px-6">AI Match Score</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                {applications.map((app) => {
                  const jobObj = app.job as any;

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {jobObj?.title || 'Job Position'}
                      </td>

                      <td className="py-4 px-6 text-slate-600">
                        {jobObj?.companyName || 'Company'}
                      </td>

                      <td className="py-4 px-6 text-slate-500 font-normal">
                        {new Date(app.appliedAt).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-4 px-6">
                        <Badge variant="brand" size="sm">{app.status}</Badge>
                      </td>

                      <td className="py-4 px-6 font-mono font-bold text-ai-700">
                        {app.matchScore}% Resume-JD Alignment
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => navigate(`/my-applications/${app.id}`)}
                          className="px-3.5 py-1.5 rounded-xl bg-ai-50 text-ai-700 hover:bg-ai-100 font-bold transition-colors inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
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
