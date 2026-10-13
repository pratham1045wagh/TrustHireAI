import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { LoadingState } from '../../components/common/LoadingState';
import { Badge } from '../../components/common/Badge';
import { Video, ShieldAlert, Clock, Eye, AlertTriangle } from 'lucide-react';

export const AdminProctoringPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    fetchProctoringData();
  }, []);

  const fetchProctoringData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/proctoring');
      if (res.data.success) {
        setSessions(res.data.sessions || []);
        setEvents(res.data.recentEvents || []);
      }
    } catch (err) {
      console.error('Failed to load proctoring data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Connecting to live proctoring telemetry..." />;
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Proctoring Telemetry & Monitoring</h1>
        <p className="text-xs text-slate-500">Live examination sessions and integrity violation signals</p>
      </div>

      {/* Proctored Sessions */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900">Proctored Assessment Sessions</h3>
          <span className="text-xs font-bold text-slate-500">{sessions.length} Sessions Logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <th className="py-3.5 px-6">Candidate</th>
                <th className="py-3.5 px-6">Assessment</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Integrity Rating</th>
                <th className="py-3.5 px-6">Score</th>
                <th className="py-3.5 px-6 text-right">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {sessions.map((s) => (
                <tr key={s._id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-6">
                    <span className="font-bold text-slate-900 block">{s.candidateId?.name || 'Candidate'}</span>
                    <span className="text-[11px] text-slate-400">{s.candidateId?.email}</span>
                  </td>
                  <td className="py-4 px-6 font-semibold text-slate-800">{s.assessmentId?.title || 'Screening'}</td>
                  <td className="py-4 px-6">
                    <Badge variant={s.status === 'SUBMITTED' ? 'success' : 'warning'} size="sm">
                      {s.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`font-bold inline-flex items-center gap-1 ${
                        s.proctoringSummary?.integrityIndicator === 'High'
                          ? 'text-emerald-600'
                          : s.proctoringSummary?.integrityIndicator === 'Moderate'
                          ? 'text-amber-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {s.proctoringSummary?.integrityIndicator || 'High'}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-mono font-bold text-ai-700">
                    {s.percentage !== undefined ? `${s.percentage}%` : '--'}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => navigate(`/candidate/assessment/${s._id}/proctoring`)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs inline-flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Timeline</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Recent Events Log */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-base font-extrabold text-slate-900">Recent Integrity Event Signals</h3>
          <p className="text-xs text-slate-500">Live monitoring of window focus, tab transitions, and clipboard attempts</p>
        </div>

        <div className="divide-y divide-slate-100 text-xs font-medium">
          {events.length === 0 ? (
            <p className="p-8 text-center text-slate-400 italic">No integrity events recorded.</p>
          ) : (
            events.slice(0, 20).map((ev) => (
              <div key={ev._id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/60">
                <div className="flex items-center gap-3">
                  <Badge
                    variant={ev.severity === 'HIGH' ? 'danger' : ev.severity === 'WARNING' ? 'warning' : 'brand'}
                    size="sm"
                  >
                    {ev.eventType}
                  </Badge>
                  <span className="font-bold text-slate-900">
                    {ev.candidateId?.name || 'Candidate'} ({ev.candidateId?.email})
                  </span>
                  <span className="text-slate-600 font-normal">{ev.description}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400 shrink-0">
                  {new Date(ev.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
