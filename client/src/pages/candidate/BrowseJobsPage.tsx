import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { JobItem } from '../../types';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Search,
  MapPin,
  Briefcase,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';

export const BrowseJobsPage: React.FC = () => {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/jobs/published');
      if (res.data.success) {
        setJobs(res.data.jobs);
      }
    } catch (err) {
      console.error('Failed to fetch published jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.companyName.toLowerCase().includes(search.toLowerCase()) ||
      j.requiredSkills.some((s) => s.toLowerCase().includes(search.toLowerCase()));

    const matchesLocation = !locationFilter || j.location.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesType = !typeFilter || j.employmentType === typeFilter;

    return matchesSearch && matchesLocation && matchesType;
  });

  if (loading) {
    return <LoadingState message="Searching published job opportunities..." />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ai-50 text-ai-700 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Job Discovery Portal</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Find Your Next Opportunity</h1>
        <p className="text-sm text-slate-500 mt-1">
          Explore open positions and apply using your AI-analyzed resume profile.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by job title, company, or required skill..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-ai-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="Location..."
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-ai-500 w-32"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-ai-500 font-medium"
            >
              <option value="">All Types</option>
              <option value="Full Time">Full Time</option>
              <option value="Part Time">Part Time</option>
              <option value="Contract">Contract</option>
              <option value="Remote">Remote</option>
              <option value="Internship">Internship</option>
            </select>
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      {filteredJobs.length === 0 ? (
        <EmptyState
          title="No opportunities found"
          description={
            search || locationFilter || typeFilter
              ? 'No open jobs match your current search filters.'
              : 'Check back soon for new job postings published by recruiters.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 hover:border-ai-200 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-extrabold text-slate-900">{job.title}</h3>
                  <Badge variant="brand" size="sm">{job.employmentType}</Badge>
                </div>

                <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mb-3">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{job.companyName} • {job.location}</span>
                </p>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                  {job.description}
                </p>

                {job.requiredSkills?.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Required Skills:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {job.requiredSkills.map((sk, i) => (
                        <Badge key={i} variant="ai" size="sm">
                          {sk}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  Exp: {job.experienceLevel}
                </span>
                <button
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  className="px-4 py-2 rounded-xl bg-ai-600 hover:bg-ai-700 text-white font-bold text-xs shadow-xs inline-flex items-center gap-1.5 transition-colors"
                >
                  <span>View Job</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
