import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { LoadingState } from '../../components/common/LoadingState';
import { Badge } from '../../components/common/Badge';
import { FileText, Download } from 'lucide-react';

export const AdminResumesPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [resumes, setResumes] = useState<any[]>([]);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/resumes');
      if (res.data.success) {
        setResumes(res.data.resumes || []);
      }
    } catch (err) {
      console.error('Failed to load resumes:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading resumes repository..." />;
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Resume Documents Repository</h1>
        <p className="text-xs text-slate-500">All candidate uploaded and parsed resumes</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <th className="py-3.5 px-6">File Name</th>
                <th className="py-3.5 px-6">Candidate</th>
                <th className="py-3.5 px-6">Size</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Uploaded Date</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {resumes.map((r) => (
                <tr key={r._id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-ai-600 shrink-0" />
                    <span>{r.originalFileName}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-semibold text-slate-800 block">{r.userId?.name || 'Candidate'}</span>
                    <span className="text-[11px] text-slate-400">{r.userId?.email}</span>
                  </td>
                  <td className="py-4 px-6 font-mono text-slate-500">
                    {(r.fileSize / 1024).toFixed(1)} KB
                  </td>
                  <td className="py-4 px-6">
                    <Badge variant={r.status === 'ANALYZED' ? 'success' : 'warning'} size="sm">
                      {r.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-slate-400 font-mono text-[11px]">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <a
                      href={`http://localhost:3000/api/resumes/${r._id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs inline-flex items-center gap-1 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>Download</span>
                    </a>
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
