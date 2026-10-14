import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { LoadingState } from '../../components/common/LoadingState';
import { Badge } from '../../components/common/Badge';
import {
  ShieldCheck,
  Video,
  AlertTriangle,
  Clock,
  Eye,
  Camera,
  Maximize2,
  Copy,
  ChevronLeft,
} from 'lucide-react';

export const ProctoringReportPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchProctoringData();
  }, [sessionId]);

  const fetchProctoringData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/proctoring/session/${sessionId}`);
      if (res.data.success) {
        setData(res.data.proctoring);
      }
    } catch (err) {
      console.error('Failed to load proctoring data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (loading) {
    return <LoadingState message="Retrieving proctoring compliance timeline..." />;
  }

  if (!data) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
        <p className="text-slate-500 text-sm">No proctoring session found.</p>
        <button
          onClick={() => navigate('/candidate/assessments')}
          className="mt-4 px-4 py-2 bg-ai-600 text-white rounded-xl text-xs font-bold"
        >
          Back
        </button>
      </div>
    );
  }

  const { summary, timeline, snapshots } = data;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Assessment</span>
        </button>

        <Badge
          variant={
            summary?.tabSwitches >= 4 || summary?.fullscreenExits >= 2
              ? 'danger'
              : summary?.tabSwitches >= 2
              ? 'warning'
              : 'success'
          }
        >
          {summary?.tabSwitches >= 4 ? 'Review Recommended' : 'Compliance Normal'}
        </Badge>
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-ai-950 to-brand-950 p-6 sm:p-8 border border-slate-800 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-white/10 text-emerald-400 backdrop-blur-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Proctoring Compliance Report</h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Objective event timeline and periodic verification snapshots recorded during assessment session.
            </p>
          </div>
        </div>
      </div>

      {/* Counters Grid - 10 Proctoring Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Events</p>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">{summary?.total || 0}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tab Switches</p>
          <p className="text-2xl font-black text-ai-700 font-mono mt-1">{summary?.tabSwitches || 0}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fullscreen Exits</p>
          <p className="text-2xl font-black text-amber-600 font-mono mt-1">{summary?.fullscreenExits || 0}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Camera Interruptions</p>
          <p className="text-2xl font-black text-slate-700 font-mono mt-1">{summary?.cameraInterruptions || 0}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mic Interruptions</p>
          <p className="text-2xl font-black text-slate-700 font-mono mt-1">{summary?.microphoneInterruptions || 0}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Multiple Faces</p>
          <p className="text-2xl font-black text-rose-600 font-mono mt-1">{summary?.multipleFaces || 0}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Face Not Detected</p>
          <p className="text-2xl font-black text-amber-600 font-mono mt-1">{summary?.faceNotDetected || 0}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Human Speech</p>
          <p className="text-2xl font-black text-ai-700 font-mono mt-1">{summary?.humanSpeech || 0}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Clipboard Actions</p>
          <p className="text-2xl font-black text-slate-700 font-mono mt-1">{summary?.copyPasteAttempts || 0}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Right Clicks</p>
          <p className="text-2xl font-black text-slate-700 font-mono mt-1">{summary?.rightClicks || 0}</p>
        </div>
      </div>

      {/* Violation Timeline */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900">Recorded Events Timeline</h3>
          <p className="text-xs text-slate-500">
            Chronological record of browser, focus, camera, speech, and stream interactions. Events represent objective technical signals.
          </p>
        </div>

        {timeline?.length === 0 ? (
          <p className="p-8 text-center text-xs text-slate-400 italic">
            Zero integrity interruptions recorded throughout the assessment session.
          </p>
        ) : (
          <div className="space-y-3">
            {timeline.map((item: any) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="font-mono text-slate-400 font-bold flex items-center gap-1 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatTimestamp(item.timestamp)}</span>
                  </div>

                  <Badge
                    variant={
                      item.severity === 'HIGH' ? 'danger' : item.severity === 'WARNING' ? 'warning' : 'brand'
                    }
                    size="sm"
                  >
                    {item.eventType}
                  </Badge>

                  <span className="font-medium text-slate-700">{item.description}</span>

                  {item.evidenceSnapshot && (
                    <a
                      href={`/api/proctoring/snapshots/${item.evidenceSnapshot}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold hover:bg-rose-100 transition-colors"
                    >
                      <Camera className="w-3 h-3 text-rose-600" />
                      <span>View Evidence Snapshot</span>
                    </a>
                  )}
                </div>

                {item.durationSeconds > 0 && (
                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    Duration: {item.durationSeconds.toFixed(1)}s
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Webcam Snapshots Gallery */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900">Webcam Verification & Evidence Snapshots</h3>
          <p className="text-xs text-slate-500">
            Periodic verification snapshots and event-triggered evidence snapshots captured during the proctored exam.
          </p>
        </div>

        {snapshots?.length === 0 ? (
          <p className="p-8 text-center text-xs text-slate-400 italic">No snapshots available for this session.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {snapshots.map((snap: any) => {
              const isEvidence = snap.eventContext && snap.eventContext.toLowerCase().includes('evidence');
              return (
                <div
                  key={snap.id}
                  className={`rounded-2xl overflow-hidden border bg-slate-900 relative group ${
                    isEvidence ? 'border-rose-500/80 ring-2 ring-rose-500/30' : 'border-slate-200'
                  }`}
                >
                  <img
                    src={snap.url}
                    alt="Snapshot"
                    className="w-full aspect-video object-cover"
                    onError={(e: any) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  {isEvidence && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                      <span>Evidence</span>
                    </div>
                  )}
                  <div className="p-2.5 bg-slate-900/90 text-white text-[10px] flex items-center justify-between">
                    <span className="font-mono font-bold flex items-center gap-1">
                      <Camera className="w-3 h-3 text-ai-400" />
                      {formatTimestamp(snap.timestamp)}
                    </span>
                    <span className="text-slate-400 truncate max-w-[90px]">{snap.eventContext || 'Verification'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
