import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { LoadingState } from '../../components/common/LoadingState';
import { Badge } from '../../components/common/Badge';
import { Database, CheckCircle2, Layers, Cpu, Hash } from 'lucide-react';

export const AdminVectorDbPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/vector-db');
      if (res.data.success) {
        setStatus(res.data.status);
      }
    } catch (err) {
      console.error('Failed to load vector DB status:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Polling vector database status..." />;
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Vector Database & Embeddings</h1>
        <p className="text-xs text-slate-500">Vector store health, chunking telemetry, and cosine similarity indexing</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Status</p>
            <p className="text-xl font-black text-slate-900">{status?.status || 'HEALTHY'}</p>
            <p className="text-[11px] text-emerald-600 font-medium">Cosine Similarity Online</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-ai-50 text-ai-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Chunks</p>
            <p className="text-2xl font-black font-mono text-ai-700">{status?.totalDocuments || 0}</p>
            <p className="text-[11px] text-slate-500 font-medium">Vectorized Documents</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Embedding Model</p>
            <p className="text-sm font-black text-slate-900 font-mono">text-embedding-004</p>
            <p className="text-[11px] text-slate-500 font-medium">{status?.embeddingDimension || 768}-dim normalized</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Storage Layer</p>
            <p className="text-sm font-black text-slate-900">{status?.provider || 'MongoDB Vector'}</p>
            <p className="text-[11px] text-slate-500 font-medium">Indexed top-K search</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-extrabold text-slate-900">RAG Chunk Distribution</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 text-sm block">Resume Section Chunks</span>
              <span className="text-xs text-slate-500">Summary, skills, experience, projects, and certifications</span>
            </div>
            <span className="text-2xl font-black font-mono text-ai-700">{status?.resumeChunks || 0}</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 text-sm block">Job Requirement Chunks</span>
              <span className="text-xs text-slate-500">Overview, required competencies, and responsibilities</span>
            </div>
            <span className="text-2xl font-black font-mono text-brand-700">{status?.jobChunks || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
