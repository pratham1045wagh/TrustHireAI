import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { LoadingState } from '../../components/common/LoadingState';
import { Badge } from '../../components/common/Badge';
import { Briefcase, MapPin } from 'lucide-react';

export const AdminJobsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/jobs');
      if (res.data.success) {
        setJobs(res.data.jobs || []);
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading jobs repository..." />;
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Job Descriptions Repository</h1>
        <p className="text-xs text-slate-500">Global list of all job postings across recruiters</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <th className="py-3.5 px-6">Job Title</th>
                <th className="py-3.5 px-6">Company</th>
                <th className="py-3.5 px-6">Recruiter</th>
                <th className="py-3.5 px-6">Location</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {jobs.map((job) => (
                <tr key={job._id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-900">{job.title}</td>
                  <td className="py-4 px-6 text-slate-600">{job.companyName}</td>
                  <td className="py-4 px-6 text-slate-500">
                    {job.recruiterId?.name || 'Recruiter'} ({job.recruiterId?.email})
                  </td>
                  <td className="py-4 px-6">{job.location}</td>
                  <td className="py-4 px-6">
                    <Badge variant={job.status === 'PUBLISHED' ? 'success' : 'default'} size="sm">
                      {job.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-slate-400 font-mono text-[11px]">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
