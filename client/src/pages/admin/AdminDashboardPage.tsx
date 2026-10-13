import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { LoadingState } from '../../components/common/LoadingState';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import {
  Users,
  Briefcase,
  FileText,
  Award,
  ShieldCheck,
  Database,
  Activity,
  Server,
  Sparkles,
  ArrowRight,
  Clock,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/dashboard');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Connecting to system administration panel..." />;
  }

  const stats = data?.stats;
  const vectorDb = data?.vectorDbStatus;
  const health = data?.systemHealth;

  return (
    <div className="space-y-8 pb-12">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-ai-950 to-brand-950 p-6 sm:p-8 border border-slate-800 text-white shadow-xl">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ai-500/10 border border-ai-500/20 text-ai-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ResumeAI Core Administration Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">System Control & Telemetry</h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Monitor platform health, vector embeddings, Gemini AI usage, proctored examinations, and user access controls.
          </p>
        </div>
      </div>

      {/* System Health Status Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
            <Server className="w-4 h-4 text-emerald-600" />
            API Backend
          </span>
          <Badge variant="success" size="sm">ONLINE</Badge>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
            <Database className="w-4 h-4 text-ai-600" />
            MongoDB
          </span>
          <Badge variant="success" size="sm">CONNECTED</Badge>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
            <Database className="w-4 h-4 text-brand-600" />
            Vector DB
          </span>
          <Badge variant="success" size="sm">HEALTHY</Badge>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-amber-600" />
            Gemini AI
          </span>
          <Badge variant="success" size="sm">ACTIVE</Badge>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers ?? 0}
          icon={<Users className="w-6 h-6" />}
          description={`${stats?.candidatesCount ?? 0} candidates • ${stats?.recruitersCount ?? 0} recruiters`}
          color="brand"
        />
        <StatCard
          title="Published Jobs"
          value={stats?.jobsCount ?? 0}
          icon={<Briefcase className="w-6 h-6" />}
          description="Active and closed job positions"
          color="ai"
        />
        <StatCard
          title="Resumes Indexed"
          value={stats?.resumesCount ?? 0}
          icon={<FileText className="w-6 h-6" />}
          description="Vectorized documents in repository"
          color="emerald"
        />
        <StatCard
          title="Screening Sessions"
          value={stats?.sessionsCount ?? 0}
          icon={<Award className="w-6 h-6" />}
          description={`${stats?.proctoringEventsCount ?? 0} proctoring events recorded`}
          color="amber"
        />
      </div>

      {/* Vector DB Quick Summary & Audit Logs Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vector DB Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900">Vector Store Status</h3>
            <Database className="w-5 h-5 text-ai-600" />
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Provider</span>
              <span className="font-bold text-slate-900">{vectorDb?.provider}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Total Chunks</span>
              <span className="font-mono font-bold text-ai-700">{vectorDb?.totalDocuments}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Resume Section Chunks</span>
              <span className="font-mono font-bold text-slate-800">{vectorDb?.resumeChunks}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Job Requirement Chunks</span>
              <span className="font-mono font-bold text-slate-800">{vectorDb?.jobChunks}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Embedding Dimensions</span>
              <span className="font-mono font-bold text-slate-800">{vectorDb?.embeddingDimension}D</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/vector-db')}
            className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
          >
            Manage Vector Store
          </button>
        </div>

        {/* Recent Audit Logs Feed */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Recent Audit Activity</h3>
              <p className="text-xs text-slate-500">Live system audit trail events</p>
            </div>
            <button
              onClick={() => navigate('/admin/audit-logs')}
              className="text-xs font-bold text-ai-600 hover:text-ai-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {data?.recentLogs?.map((log: any) => (
              <div
                key={log._id}
                className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <Badge variant="brand" size="sm">{log.action}</Badge>
                  <span className="font-medium text-slate-800">
                    {log.userEmail || 'System'} • {log.resource}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 shrink-0 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
