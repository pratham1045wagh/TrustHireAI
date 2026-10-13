import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { JobItem } from '../../types';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import {
  Briefcase,
  PlusCircle,
  Search,
  Users,
  Eye,
  Trash2,
  Sparkles,
  MapPin,
  Calendar,
} from 'lucide-react';

export const JobsListPage: React.FC = () => {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/jobs/recruiter');
      if (res.data.success) {
        setJobs(res.data.jobs);
      }
    } catch (err) {
      console.error('Failed to fetch recruiter jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (job: JobItem) => {
    const nextStatus = job.status === 'PUBLISHED' ? 'CLOSED' : 'PUBLISHED';
    try {
      const res = await api.patch(`/jobs/${job.id}`, { status: nextStatus });
      if (res.data.success) {
        setJobs((prev) =>
          prev.map((j) => (j.id === job.id ? { ...j, status: nextStatus } : j))
        );
      }
    } catch (err) {
      alert('Failed to update job status.');
    }
  };

  const handleDeleteJob = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/jobs/${deleteId}`);
      setJobs((prev) => prev.filter((j) => j.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      alert('Failed to delete job.');
    }
  };

  const filteredJobs = jobs.filter(
    (j) =>
      j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingState message="Fetching posted job descriptions..." />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ai-50 text-ai-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Recruiter Job Management</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Job Descriptions</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your created job descriptions, track applicant volume, and update availability.
          </p>
        </div>

        <button
          onClick={() => navigate('/recruiter/jobs/create')}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-ai-600 hover:bg-ai-700 text-white font-bold text-xs shadow-md transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Job</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search jobs by title, company, or location..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-ai-500"
          />
        </div>
        <span className="text-xs font-medium text-slate-500">
          {filteredJobs.length} Jobs Total
        </span>
      </div>

      {/* Jobs Grid/Table */}
      {filteredJobs.length === 0 ? (
        <EmptyState
          title="No job descriptions found"
          description="Create your first job posting to start receiving candidate applications."
          actionText="Create Job"
          onAction={() => navigate('/recruiter/jobs/create')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 hover:border-ai-200 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-extrabold text-slate-900">{job.title}</h3>
                  <Badge
                    variant={
                      job.status === 'PUBLISHED'
                        ? 'success'
                        : job.status === 'DRAFT'
                        ? 'warning'
                        : 'danger'
                    }
                  >
                    {job.status}
                  </Badge>
                </div>

                <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-3 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{job.companyName} • {job.location} • {job.employmentType}</span>
                </p>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                  {job.description}
                </p>

                {job.requiredSkills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {job.requiredSkills.slice(0, 4).map((sk, i) => (
                      <Badge key={i} variant="brand" size="sm">
                        {sk}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-extrabold text-slate-900 flex items-center gap-1">
                    <Users className="w-4 h-4 text-ai-600" />
                    <span>{job.applicantsCount || 0} Applicants</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(job)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                  >
                    {job.status === 'PUBLISHED' ? 'Close' : 'Publish'}
                  </button>
                  <button
                    onClick={() => navigate(`/recruiter/jobs/${job.id}`)}
                    className="px-3.5 py-1.5 rounded-xl bg-ai-50 text-ai-700 hover:bg-ai-100 font-bold text-xs transition-colors inline-flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => setDeleteId(job.id)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Job Description"
        footer={
          <>
            <button
              onClick={() => setDeleteId(null)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteJob}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
            >
              Confirm Delete
            </button>
          </>
        }
      >
        <p>
          Are you sure you want to delete this job description and all associated candidate applications?
        </p>
      </Modal>
    </div>
  );
};
