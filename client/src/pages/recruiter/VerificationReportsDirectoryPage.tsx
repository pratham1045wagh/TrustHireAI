import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { LoadingState } from '../../components/common/LoadingState';
import { Badge } from '../../components/common/Badge';
import {
  ShieldCheck,
  Search,
  ArrowRight,
  Sparkles,
  Award,
  Star,
} from 'lucide-react';

export const VerificationReportsDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [applicants, setApplicants] = useState<any[]>([]);

  useEffect(() => {
    fetchApplicants();
  }, []);

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const res = await api.get('/applications/recruiter');
      if (res.data.success) {
        setApplicants(res.data.applications || []);
      }
    } catch (err) {
      console.error('Failed to load verification reports:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading candidate verification intelligence..." />;
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-ai-950 to-brand-950 p-6 sm:p-8 border border-slate-800 text-white shadow-xl">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ai-500/10 border border-ai-500/20 text-ai-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ResumeAI V2.0 & V2.5 Verification Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Candidate Verification & Proctoring Reports
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Examine verified candidate qualifications, objective proctored screening scores, and full compliance timelines.
          </p>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Verified Candidate Roster</h3>
            <p className="text-xs text-slate-500">Chronological list of candidate applications with verification metrics</p>
          </div>
        </div>

        {applicants.length === 0 ? (
          <p className="p-12 text-center text-xs text-slate-400 italic">No candidates available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <th className="py-3.5 px-6">Candidate</th>
                  <th className="py-3.5 px-6">Job Position</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Match Score</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                {applicants.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-900 block">{app.candidateName}</span>
                      <span className="text-[11px] text-slate-400">{app.candidateEmail}</span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-800">{app.jobTitle}</td>
                    <td className="py-4 px-6">
                      <Badge variant="brand" size="sm">
                        {app.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-ai-700">
                      {app.matchScore}% Match
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => navigate(`/recruiter/candidates/${app.candidateId}`)}
                        className="px-3.5 py-1.5 rounded-xl bg-ai-50 text-ai-700 hover:bg-ai-100 font-bold transition-colors inline-flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>View Verification</span>
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
    </div>
  );
};
