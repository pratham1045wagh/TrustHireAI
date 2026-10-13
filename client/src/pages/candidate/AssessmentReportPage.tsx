import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { LoadingState } from '../../components/common/LoadingState';
import { Badge } from '../../components/common/Badge';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Sparkles,
} from 'lucide-react';

export const AssessmentReportPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    fetchReport();
  }, [sessionId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/assessment-sessions/${sessionId}/report`);
      if (res.data.success) {
        setReport(res.data.report);
      }
    } catch (err) {
      console.error('Failed to load assessment report:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  if (loading) {
    return <LoadingState message="Compiling verified assessment report..." />;
  }

  if (!report) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
        <p className="text-slate-500 text-sm">Assessment report not found.</p>
        <button
          onClick={() => navigate('/candidate/assessments')}
          className="mt-4 px-4 py-2 bg-ai-600 text-white rounded-xl text-xs font-bold"
        >
          Back to Assessments
        </button>
      </div>
    );
  }

  const skillScores = report.skillScores || {};
  const difficultyScores = report.difficultyPerformance || {};

  return (
    <div className="space-y-8 pb-12">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-ai-950 to-brand-950 p-6 sm:p-8 border border-slate-800 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ai-500/10 border border-ai-500/20 text-ai-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Assessment Verification Report</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {report.assessment?.title || 'Technical Assessment'}
            </h1>
            <p className="text-sm text-slate-300 mt-1 leading-relaxed">
              Objective skill evaluation completed. Results have been integrated into your Skill Evidence Map and TrustScore.
            </p>
          </div>

          <button
            onClick={() => navigate(`/candidate/assessment/${sessionId}/proctoring`)}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm backdrop-blur-md transition-all shrink-0"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>View Proctoring Report</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-ai-50 text-ai-600 flex items-center justify-center shrink-0">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Overall Score</p>
            <p className="text-3xl font-black text-slate-900 font-mono">{report.percentage}%</p>
            <p className="text-[11px] text-slate-500 font-medium">
              {report.score} of {report.totalQuestions} correct
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Correct Answers</p>
            <p className="text-3xl font-black text-slate-900 font-mono">{report.correctAnswers}</p>
            <p className="text-[11px] text-emerald-600 font-medium">Validated server-side</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Incorrect</p>
            <p className="text-3xl font-black text-slate-900 font-mono">{report.incorrectAnswers}</p>
            <p className="text-[11px] text-slate-400 font-medium">{report.skippedAnswers} skipped</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center shrink-0">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Time Taken</p>
            <p className="text-3xl font-black text-slate-900 font-mono">
              {formatDuration(report.timeTakenSeconds)}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">Server timer tracked</p>
          </div>
        </div>
      </div>

      {/* Skill-Level Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Skill-Level Performance</h3>
              <p className="text-xs text-slate-500">Individual performance metrics per evaluated competency</p>
            </div>
            <TrendingUp className="w-5 h-5 text-ai-600" />
          </div>

          <div className="space-y-4">
            {Object.keys(skillScores).length === 0 ? (
              <p className="text-xs text-slate-400 italic">No skill breakdown recorded.</p>
            ) : (
              Object.entries(skillScores).map(([skill, stats]: any) => (
                <div key={skill} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{skill}</span>
                    <span className="font-mono font-bold text-ai-700">
                      {stats.percentage}% ({stats.correct}/{stats.total})
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        stats.percentage >= 75
                          ? 'bg-emerald-500'
                          : stats.percentage >= 50
                          ? 'bg-ai-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Adaptive Difficulty Breakdown */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Dynamic Difficulty Performance</h3>
              <p className="text-xs text-slate-500">How you performed across adaptive difficulty ladders</p>
            </div>
            <BarChart3 className="w-5 h-5 text-brand-600" />
          </div>

          <div className="space-y-4">
            {['EASY', 'MEDIUM', 'HARD'].map((level) => {
              const stats = difficultyScores[level] || { total: 0, correct: 0, percentage: 0 };
              return (
                <div key={level} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Badge
                        variant={level === 'HARD' ? 'danger' : level === 'MEDIUM' ? 'warning' : 'success'}
                        size="sm"
                      >
                        {level}
                      </Badge>
                    </span>
                    <span className="font-mono font-bold text-slate-700">
                      {stats.percentage}% ({stats.correct}/{stats.total})
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-900 rounded-full transition-all duration-500"
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Verification mapping synchronized</span>
            <button
              onClick={() => navigate('/candidate/skill-verification')}
              className="text-xs font-bold text-ai-600 hover:text-ai-700 inline-flex items-center gap-1"
            >
              <span>View Skill Evidence Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
