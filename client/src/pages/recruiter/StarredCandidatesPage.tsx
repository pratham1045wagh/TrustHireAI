import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ApplicationItem } from '../../types';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { Star, ArrowRight, Sparkles } from 'lucide-react';

export const StarredCandidatesPage: React.FC = () => {
  const navigate = useNavigate();

  const [starred, setStarred] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchStarred();
  }, []);

  const fetchStarred = async () => {
    try {
      setLoading(true);
      const res = await api.get('/applications/recruiter/starred');
      if (res.data.success) {
        setStarred(res.data.starred);
      }
    } catch (err) {
      console.error('Failed to fetch starred candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStar = async (appId: string) => {
    try {
      const res = await api.patch(`/applications/recruiter/${appId}/star`);
      if (res.data.success) {
        setStarred((prev) => prev.filter((a) => a.id !== appId));
      }
    } catch (err) {
      alert('Failed to update star state.');
    }
  };

  if (loading) {
    return <LoadingState message="Fetching starred candidates..." />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold mb-2">
          <Star className="w-3.5 h-3.5 fill-amber-500" />
          <span>Recruiter Bookmarks</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Starred Candidates</h1>
        <p className="text-sm text-slate-500 mt-1">
          Candidate applications manually starred by you for quick organization and review.
        </p>
      </div>

      {starred.length === 0 ? (
        <EmptyState
          title="No starred candidates"
          description="Click the star icon next to candidate applications in your Applicants list to save candidates here."
          icon={<Star className="w-8 h-8 text-amber-500 fill-amber-500" />}
          actionText="View Applicants"
          onAction={() => navigate('/recruiter/applicants')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {starred.map((app) => {
            const candidateObj = app.candidate as any;
            const jobObj = app.job as any;

            return (
              <div
                key={app.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-200 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-extrabold text-slate-900">
                      {candidateObj?.name || 'Candidate'}
                    </h3>
                    <button
                      onClick={() => handleToggleStar(app.id)}
                      className="p-1 rounded hover:bg-slate-100"
                      title="Remove star"
                    >
                      <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 mb-3">{candidateObj?.email}</p>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1 mb-3">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">
                      Applied For Position:
                    </span>
                    <span className="font-bold text-slate-800">{jobObj?.title || 'Job'}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <Badge variant="brand" size="sm">{app.status}</Badge>
                    <span className="font-mono font-bold text-ai-700">
                      {app.matchScore}% Match
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() =>
                      navigate(`/recruiter/candidates/${candidateObj?._id || candidateObj?.id}`)
                    }
                    className="px-4 py-2 rounded-xl bg-ai-50 text-ai-700 hover:bg-ai-100 font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
                  >
                    <span>View Full Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
