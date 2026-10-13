import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ISemanticCandidateMatch } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import { Badge } from '../../components/common/Badge';
import {
  Search,
  Sparkles,
  TrendingUp,
  FolderGit2,
  ArrowRight,
  Database,
  User,
} from 'lucide-react';

export const SemanticSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState<string>('Find candidates with strong React and Node.js experience');
  const [loading, setLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [candidates, setCandidates] = useState<ISemanticCandidateMatch[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      setHasSearched(true);
      const res = await api.post('/jobs/semantic-search', { query: query.trim() });
      if (res.data.success) {
        setCandidates(res.data.candidates || []);
      }
    } catch (err) {
      console.error('Semantic search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-ai-950 to-brand-950 p-6 sm:p-8 border border-slate-800 text-white shadow-xl">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ai-500/10 border border-ai-500/20 text-ai-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ResumeAI V2.0 Vector RAG Semantic Search</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Semantic Candidate Search
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Search candidates across technical resumes using natural language queries, multi-section embeddings, and vector similarity ranking.
          </p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Find candidates with React, TypeScript and MongoDB experience..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white text-slate-900 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-ai-400 shadow-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-ai-600 to-brand-600 hover:from-ai-500 hover:to-brand-500 text-white font-bold text-sm shadow-lg shadow-ai-600/30 transition-all shrink-0"
            >
              {loading ? 'Searching Vector DB...' : 'Semantic Search'}
            </button>
          </form>
        </div>
      </div>

      {/* Suggested Search Prompts */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Example Queries:</span>
        {[
          'Find candidates with strong React and Node.js experience',
          'Full stack developer with AWS and microservices architecture',
          'Data analyst proficient in SQL, Python and dashboard visualization',
        ].map((prompt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setQuery(prompt)}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:border-ai-300 hover:text-ai-700 transition-colors"
          >
            "{prompt}"
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState message="Querying vector database embeddings and matching candidates..." />
      ) : hasSearched && candidates.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
          <Database className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No candidate matches found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your query phrasing or keywords to expand semantic retrieval.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {candidates.map((c, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:border-ai-200 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
                    {c.candidateName?.slice(0, 2).toUpperCase() || 'CA'}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">{c.candidateName}</h3>
                    <p className="text-xs text-slate-400 font-medium">{c.candidateEmail}</p>
                  </div>
                </div>

                {/* Evidence Chunks */}
                {c.topEvidence?.length > 0 && (
                  <div className="pt-2 space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Top Retrieved Resume Evidence:
                    </p>
                    {c.topEvidence.slice(0, 2).map((ev, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-700 flex items-start gap-2"
                      >
                        <FolderGit2 className="w-3.5 h-3.5 text-brand-600 mt-0.5 shrink-0" />
                        <span className="line-clamp-2 leading-relaxed text-[11px]">{ev.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Match Score & Action */}
              <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-4 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                <div className="text-left md:text-right">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Semantic Alignment
                  </span>
                  <span className="text-2xl font-black font-mono text-ai-700">
                    {c.semanticSimilarity}% Match
                  </span>
                </div>

                <button
                  onClick={() => navigate(`/recruiter/candidates/${c.candidateId}`)}
                  className="px-4 py-2.5 rounded-xl bg-ai-600 hover:bg-ai-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>View Candidate Profile</span>
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
