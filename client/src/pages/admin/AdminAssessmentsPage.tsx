import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { LoadingState } from '../../components/common/LoadingState';
import { Badge } from '../../components/common/Badge';
import { Award, RefreshCw, KeyRound, Clock, HelpCircle } from 'lucide-react';

export const AdminAssessmentsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [generatingId, setGeneratingId] = useState<string>('');

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/assessments');
      if (res.data.success) {
        setAssessments(res.data.assessments || []);
        setRooms(res.data.rooms || []);
      }
    } catch (err) {
      console.error('Failed to load assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (id: string) => {
    try {
      setGeneratingId(id);
      const res = await api.post(`/assessments/${id}/generate`);
      if (res.data.success) {
        alert(res.data.message);
        fetchAssessments();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Generation failed.');
    } finally {
      setGeneratingId('');
    }
  };

  if (loading) {
    return <LoadingState message="Loading assessments and rooms..." />;
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Assessments & Screening Rooms</h1>
        <p className="text-xs text-slate-500">Configure technical question banks and manage room codes</p>
      </div>

      {/* Assessments Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900">Assessment Templates & Banks</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <th className="py-3.5 px-6">Title</th>
                <th className="py-3.5 px-6">Skills</th>
                <th className="py-3.5 px-6">Questions</th>
                <th className="py-3.5 px-6">Duration</th>
                <th className="py-3.5 px-6">Generation Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {assessments.map((a) => (
                <tr key={a._id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-900">{a.title}</td>
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap gap-1">
                      {a.skills?.map((s: string, i: number) => (
                        <Badge key={i} variant="brand" size="sm">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-6 font-mono text-slate-700">{a.totalQuestions} questions</td>
                  <td className="py-4 px-6 text-slate-500">{a.durationMinutes} mins</td>
                  <td className="py-4 px-6">
                    <Badge variant={a.generationStatus === 'READY' ? 'success' : 'warning'} size="sm">
                      {a.generationStatus}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => handleRegenerate(a._id)}
                      disabled={generatingId === a._id}
                      className="px-3 py-1.5 rounded-xl bg-ai-50 text-ai-700 hover:bg-ai-100 font-bold text-xs inline-flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${generatingId === a._id ? 'animate-spin' : ''}`} />
                      <span>{generatingId === a._id ? 'Generating...' : 'Regenerate'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assessment Rooms Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900">Active Assessment Rooms</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <th className="py-3.5 px-6">Room Code</th>
                <th className="py-3.5 px-6">Room Title</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Candidates</th>
                <th className="py-3.5 px-6">Expires Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {rooms.map((r) => (
                <tr key={r._id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-ai-700 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{r.roomCode}</span>
                  </td>
                  <td className="py-4 px-6 font-semibold text-slate-800">{r.title}</td>
                  <td className="py-4 px-6">
                    <Badge variant={r.status === 'ACTIVE' ? 'success' : 'default'} size="sm">
                      {r.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-slate-700">{r.candidates?.length || 0} enrolled</td>
                  <td className="py-4 px-6 text-slate-400 font-mono text-[11px]">
                    {new Date(r.expiresAt).toLocaleDateString()}
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
