import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { IAssessmentRoom } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import { Badge } from '../../components/common/Badge';
import {
  Award,
  Sparkles,
  KeyRound,
  ArrowRight,
  Clock,
  HelpCircle,
  CheckCircle2,
  FileText,
  ShieldCheck,
  BrainCircuit,
  RotateCcw,
  AlertCircle,
  UploadCloud,
  Play,
  Loader2,
  Building2,
} from 'lucide-react';

export const AssessmentsHubPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetResumeId = searchParams.get('resumeId');
  const shouldPrepare = searchParams.get('prepare') === 'true';

  const [loading, setLoading] = useState<boolean>(true);
  const [resumeAssessments, setResumeAssessments] = useState<any[]>([]);
  const [availableRooms, setAvailableRooms] = useState<IAssessmentRoom[]>([]);
  const [mySessions, setMySessions] = useState<any[]>([]);

  // Room Code join state
  const [roomCode, setRoomCode] = useState<string>('');
  const [joiningRoom, setJoiningRoom] = useState<boolean>(false);
  const [joinError, setJoinError] = useState<string>('');

  // Assessment Preparation State (Requirement 4 & 6)
  const [prepResume, setPrepResume] = useState<any | null>(null);
  const [prepStatus, setPrepStatus] = useState<'IDLE' | 'GENERATING' | 'READY' | 'FALLBACK_READY' | 'FAILED'>('IDLE');
  const [prepProgress, setPrepProgress] = useState<number>(0);
  const [prepTotal, setPrepTotal] = useState<number>(20);
  const [prepAssessment, setPrepAssessment] = useState<any | null>(null);
  const [prepMessage, setPrepMessage] = useState<string>('');
  const [startingSession, setStartingSession] = useState<boolean>(false);
  const progressTimerRef = useRef<any>(null);

  useEffect(() => {
    fetchAssessmentsData();
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  const fetchAssessmentsData = async () => {
    try {
      setLoading(true);
      const [resumeAssessRes, roomsRes, sessionsRes] = await Promise.all([
        api.get('/assessments/my-resume-assessments').catch(() => ({ data: { success: false } })),
        api.get('/assessment-rooms/available').catch(() => ({ data: { success: false } })),
        api.get('/assessment-sessions/my-sessions').catch(() => ({ data: { success: false } })),
      ]);

      const rList = resumeAssessRes.data?.resumeAssessments || [];
      setResumeAssessments(rList);

      if (roomsRes.data?.success) {
        setAvailableRooms(roomsRes.data.rooms || []);
      }
      if (sessionsRes.data?.success) {
        setMySessions(sessionsRes.data.sessions || []);
      }

      // If navigated from [Take Assessment] on Resume/Analysis page, open Preparation UI automatically
      if (targetResumeId && shouldPrepare) {
        const matched = rList.find((r: any) => String(r.resumeId) === String(targetResumeId));
        if (matched && matched.resumeStatus === 'ANALYZED') {
          handlePrepareResumeAssessment(matched);
        }
      }
    } catch (err) {
      console.error('Failed to load assessment data:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 1: Prepare 20-question Resume-Based AI Assessment (Never hangs; shows 0/20 -> 20/20)
   */
  const handlePrepareResumeAssessment = async (resumeItem: any, forceRegenerate: boolean = false) => {
    setPrepResume(resumeItem);
    setPrepTotal(20);
    setPrepMessage('');
    setPrepAssessment(null);

    // If already READY/FALLBACK_READY and not regenerating, show 20/20 Ready state immediately
    if (
      !forceRegenerate &&
      resumeItem.assessment &&
      (resumeItem.assessment.generationStatus === 'READY' ||
        resumeItem.assessment.generationStatus === 'FALLBACK_READY') &&
      (resumeItem.assessment.generatedCount || 0) >= 20
    ) {
      setPrepProgress(resumeItem.assessment.totalQuestions || 20);
      setPrepTotal(resumeItem.assessment.totalQuestions || 20);
      setPrepAssessment(resumeItem.assessment);
      setPrepStatus(resumeItem.assessment.generationStatus);
      if (resumeItem.assessment.generationStatus === 'FALLBACK_READY') {
        setPrepMessage(
          'AI question generation is temporarily unavailable. A technical question set has been prepared using the available skill profile.'
        );
      }
      return;
    }

    setPrepStatus('GENERATING');
    setPrepProgress(1);

    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      setPrepProgress((prev) => (prev < 18 ? prev + 1 : prev));
    }, 350);

    try {
      const res = await api.post(`/assessments/resume/${resumeItem.resumeId}/create`, {
        regenerate: forceRegenerate,
      });

      if (progressTimerRef.current) clearInterval(progressTimerRef.current);

      if (res.data?.success && res.data.assessment) {
        const assess = res.data.assessment;
        const count = assess.generatedCount || assess.totalQuestions || 20;
        setPrepTotal(count);
        setPrepProgress(count);
        setPrepAssessment(assess);
        const st = assess.generationStatus === 'FALLBACK_READY' ? 'FALLBACK_READY' : 'READY';
        setPrepStatus(st);
        if (st === 'FALLBACK_READY') {
          setPrepMessage(
            res.data.message ||
              'AI question generation is temporarily unavailable. A technical question set has been prepared using the available skill profile.'
          );
        }
        // Refresh list in background
        api.get('/assessments/my-resume-assessments').then((r) => {
          if (r.data?.success) setResumeAssessments(r.data.resumeAssessments || []);
        });
      } else {
        setPrepStatus('FAILED');
        setPrepMessage('We could not generate the assessment at this time.');
      }
    } catch (err: any) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setPrepStatus('FAILED');
      setPrepMessage(
        err.response?.data?.message || 'Question generation failed. We could not generate the assessment at this time.'
      );
    }
  };

  /**
   * Step 2: Candidate confirms [Start Assessment] -> Start server-timed session
   */
  const handleConfirmStartResumeAssessment = async () => {
    if (!prepAssessment || !prepResume) return;
    try {
      setStartingSession(true);
      const res = await api.post('/assessment-sessions/start', {
        assessmentId: prepAssessment.id,
        resumeId: prepResume.resumeId,
      });
      if (res.data?.success && res.data.session?.id) {
        navigate(`/candidate/assessment/${res.data.session.id}?type=RESUME_BASED`);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start assessment session.');
    } finally {
      setStartingSession(false);
    }
  };

  const handleJoinRoom = async (codeToJoin: string) => {
    setJoinError('');
    const cleanCode = codeToJoin.trim().toUpperCase();
    if (!cleanCode) return;

    try {
      setJoiningRoom(true);
      const res = await api.post('/assessment-rooms/join', {
        roomCode: cleanCode,
      });

      if (res.data.success) {
        const sessionRes = await api.post('/assessment-sessions/start', {
          assessmentId: res.data.room.assessmentId,
          roomId: res.data.room.id,
        });

        if (sessionRes.data.success) {
          navigate(`/candidate/assessment/${sessionRes.data.session.id}?type=RECRUITER_ROOM`);
        }
      }
    } catch (err: any) {
      setJoinError(err.response?.data?.message || 'Invalid or expired room code. Please verify and try again.');
    } finally {
      setJoiningRoom(false);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleJoinRoom(roomCode);
  };

  if (loading) {
    return <LoadingState message="Loading AI Resume Assessment and Recruiter Assessment Rooms..." />;
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-ai-950 to-brand-950 p-6 sm:p-8 border border-slate-800 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ai-500/10 border border-ai-500/20 text-ai-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ResumeAI Dual Assessment Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Candidate Assessments Hub
            </h1>
            <p className="text-sm text-slate-300 mt-1 leading-relaxed">
              Complete your personalized 20-question AI Resume Verification Assessment or join a Recruiter Assessment Room.
            </p>
          </div>

          {/* Join Room Form */}
          <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 sm:min-w-[320px]">
            <p className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-ai-300" />
              Join Recruiter Room with Code
            </p>
            <form onSubmit={handleJoinByCode} className="space-y-2">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g. RAI-DEMO1"
                className="w-full px-3.5 py-2 rounded-xl bg-white text-slate-900 font-mono text-sm placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-ai-400 font-bold"
              />
              {joinError && <p className="text-[11px] text-rose-300 font-medium">{joinError}</p>}
              <button
                type="submit"
                disabled={joiningRoom}
                className="w-full py-2 rounded-xl bg-ai-500 hover:bg-ai-400 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                {joiningRoom ? 'Joining...' : 'Join Assessment Room'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ============================================================
          ASSESSMENT PREPARATION PANEL (Requirement 4 & 6)
         ============================================================ */}
      {prepResume && prepStatus !== 'IDLE' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-ai-500/80 shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-ai-50 text-ai-600 rounded-2xl">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900">Preparing Assessment</h2>
                  <Badge variant="ai" size="sm">Resume-Based AI Assessment</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {prepStatus === 'GENERATING'
                    ? 'AI is generating questions based on your resume...'
                    : prepStatus === 'FAILED'
                    ? 'Question generation failed.'
                    : 'Your personalized 20-question technical assessment is ready.'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-2xl font-black font-mono text-ai-600">
                {prepProgress} / {prepTotal}
              </span>
              <span className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                Questions Generated
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  prepStatus === 'FAILED'
                    ? 'bg-rose-500'
                    : prepStatus === 'READY' || prepStatus === 'FALLBACK_READY'
                    ? 'bg-emerald-500'
                    : 'bg-ai-600'
                }`}
                style={{ width: `${Math.min(100, Math.round((prepProgress / prepTotal) * 100))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>
                {prepStatus === 'GENERATING'
                  ? 'Generating personalized questions...'
                  : prepStatus === 'FAILED'
                  ? 'Generation stopped'
                  : `${prepProgress} / ${prepTotal} Personalized Questions Ready`}
              </span>
              <span className="font-mono font-bold">
                {Math.min(100, Math.round((prepProgress / prepTotal) * 100))}%
              </span>
            </div>
          </div>

          {/* Metadata Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Resume Name</span>
              <span className="font-bold text-slate-900 truncate block">{prepResume.resumeName}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Number of Questions</span>
              <span className="font-bold text-slate-900 font-mono">{prepTotal} Questions</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Estimated Duration</span>
              <span className="font-bold text-slate-900 font-mono">
                {prepAssessment?.durationMinutes || 30} Minutes
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Assessment Type</span>
              <span className="font-bold text-ai-700">Resume-Based AI Assessment</span>
            </div>
          </div>

          {/* Detected Topics/Skills */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Topics / Skills Detected from Resume
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(prepAssessment?.skills || prepResume.extractedSkills || ['Software Engineering']).map(
                (sk: string, idx: number) => (
                  <Badge key={idx} variant="brand" size="sm">
                    {sk}
                  </Badge>
                )
              )}
            </div>
          </div>

          {/* Fallback or Error Notices */}
          {prepStatus === 'FALLBACK_READY' && prepMessage && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{prepMessage}</span>
            </div>
          )}

          {prepStatus === 'FAILED' && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{prepMessage || 'We could not generate the assessment at this time.'}</span>
              </div>
              <button
                type="button"
                onClick={() => handlePrepareResumeAssessment(prepResume, true)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setPrepStatus('IDLE');
                setPrepResume(null);
                setSearchParams({});
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
            >
              Close
            </button>

            {(prepStatus === 'READY' || prepStatus === 'FALLBACK_READY') && (
              <button
                type="button"
                onClick={handleConfirmStartResumeAssessment}
                disabled={startingSession}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-ai-600 to-brand-600 hover:from-ai-500 hover:to-brand-500 text-white font-bold text-xs shadow-lg shadow-ai-600/20 flex items-center gap-2 transition-all"
              >
                {startingSession ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Starting Assessment...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Start Assessment</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ============================================================
          SECTION 1: MY AI RESUME ASSESSMENT (Resume-Specific)
         ============================================================ */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-ai-600 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SECTION 1 — RESUME ASSESSMENTS</span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">Resume-Based AI Assessments</h3>
            <p className="text-xs text-slate-500">
              Personalized 20-question AI assessments generated specifically from your uploaded resumes to calculate your resume-specific TrustScore.
            </p>
          </div>
          <button
            onClick={() => navigate('/candidate/verification')}
            className="px-4 py-2 rounded-xl bg-ai-50 text-ai-700 hover:bg-ai-100 font-bold text-xs transition-colors self-start sm:self-auto"
          >
            View TrustScore & Report
          </button>
        </div>

        {resumeAssessments.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No Uploaded Resumes Found</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Upload and parse your resume first to unlock your personalized 20-question AI verification assessment.
            </p>
            <button
              onClick={() => navigate('/upload')}
              className="px-5 py-2.5 rounded-xl bg-ai-600 hover:bg-ai-700 text-white font-bold text-xs inline-flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Resume</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {resumeAssessments.map((item) => {
              const isAnalyzed = item.resumeStatus === 'ANALYZED';
              const completed = item.completedSession;
              const active = item.activeSession;
              const assess = item.assessment;

              let statusBadge = <Badge variant="default" size="sm">Not Taken</Badge>;
              if (!isAnalyzed) {
                statusBadge = <Badge variant="danger" size="sm">Resume Not Parsed</Badge>;
              } else if (completed) {
                statusBadge = <Badge variant="success" size="sm">Completed</Badge>;
              } else if (active) {
                statusBadge = <Badge variant="warning" size="sm">In Progress</Badge>;
              } else if (assess?.generationStatus === 'READY' || assess?.generationStatus === 'FALLBACK_READY') {
                statusBadge = <Badge variant="ai" size="sm">20 Questions Ready</Badge>;
              }

              return (
                <div
                  key={item.resumeId}
                  className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between space-y-4 hover:border-ai-300 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-xl bg-ai-50 text-ai-600">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-900 truncate max-w-[220px]">
                            {item.resumeName}
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            Resume AI Assessment (20 Questions)
                          </span>
                        </div>
                      </div>
                      {statusBadge}
                    </div>

                    {item.extractedSkills && item.extractedSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {item.extractedSkills.slice(0, 6).map((sk: string, idx: number) => (
                          <Badge key={idx} variant="brand" size="sm">
                            {sk}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-white border border-slate-200/60 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Assessment Score</span>
                        <span className="font-mono font-black text-sm text-brand-700">
                          {completed ? `${completed.percentage}%` : 'Not Taken'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">TrustScore</span>
                        <span className="font-mono font-black text-sm text-ai-700">
                          {item.trustScore !== null && item.trustScore !== undefined
                            ? `${item.trustScore}%`
                            : item.verificationScore !== null && item.verificationScore !== undefined
                            ? `${item.verificationScore}%`
                            : 'Not Available'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2">
                    <button
                      onClick={() => navigate(`/analysis/${item.resumeId}`)}
                      className="text-xs font-bold text-slate-600 hover:text-ai-600 transition-colors"
                    >
                      View Analysis
                    </button>

                    {isAnalyzed && (
                      <div className="flex items-center gap-2">
                        {completed ? (
                          <>
                            <button
                              onClick={() => handlePrepareResumeAssessment(item, true)}
                              className="px-3 py-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors"
                              title="Retake Assessment"
                            >
                              Retake
                            </button>
                            <button
                              onClick={() => navigate(`/candidate/assessment/${completed.id}/report`)}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>View Result</span>
                            </button>
                          </>
                        ) : active ? (
                          <button
                            onClick={() => navigate(`/candidate/assessment/${active.id}?type=RESUME_BASED`)}
                            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                          >
                            <span>Resume Assessment</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePrepareResumeAssessment(item, false)}
                            className="px-4 py-2 rounded-xl bg-ai-600 hover:bg-ai-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>Take Assessment</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================
          SECTION 2: RECRUITER ASSESSMENT INVITATIONS (Invitation-Only)
         ============================================================ */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SECTION 2 — RECRUITER INVITATIONS</span>
          </div>
          <h3 className="text-lg font-extrabold text-slate-900">Recruiter Assessment Invitations</h3>
          <p className="text-xs text-slate-500">
            Dedicated screening assessments from recruiters for jobs you have applied to. Access is granted strictly via recruiter invitations.
          </p>
        </div>

        {availableRooms.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-2">
            <p className="text-xs text-slate-500 font-medium">
              You have no active recruiter assessment invitations right now.
            </p>
            <p className="text-[11px] text-slate-400">
              When a recruiter reviews your job application and sends an assessment invitation, it will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {availableRooms.map((room) => (
              <div
                key={room.id}
                className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between space-y-4 hover:border-brand-200 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-lg bg-ai-50 text-ai-700 border border-ai-200">
                          {room.roomCode}
                        </span>
                        <Badge variant="default" size="sm">
                          {room.difficulty || 'MIXED'}
                        </Badge>
                      </div>
                      <h4 className="text-base font-extrabold text-slate-900 mt-2">
                        {room.jobTitle || room.title}
                      </h4>
                    </div>
                    <Badge variant={room.invitationStatus === 'INVITED' ? 'brand' : 'success'} size="sm">
                      {room.invitationStatus || 'INVITED'}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-3">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Invited by: <strong className="text-slate-700">{room.recruiterName || 'Recruiter'}</strong></span>
                  </p>

                  {room.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 mb-3">{room.description}</p>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(room.skills || []).map((sk, i) => (
                      <Badge key={i} variant="brand" size="sm">
                        {sk}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      {room.totalQuestions} Questions
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {room.durationMinutes} mins
                    </span>
                    <span className="font-semibold text-ai-700">
                      {room.generationMode === 'PDF' ? 'PDF Question Set' : 'AI Generated'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Proctored Recruiter Session</span>
                  {room.candidateStatus === 'COMPLETED' && room.sessionId ? (
                    <button
                      onClick={() => navigate(`/candidate/assessment/${room.sessionId}/report`)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Completed ({room.candidateScore}%)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoinRoom(room.roomCode)}
                      disabled={joiningRoom}
                      className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <span>Start Assessment</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assessment History */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">My Assessment History</h3>
            <p className="text-xs text-slate-500">Review your past Resume-Based and Recruiter Room assessment reports</p>
          </div>
        </div>

        {mySessions.length === 0 ? (
          <p className="p-8 text-center text-xs text-slate-400 italic">You haven't completed any assessments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <th className="py-3.5 px-6">Assessment</th>
                  <th className="py-3.5 px-6">Type</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Score</th>
                  <th className="py-3.5 px-6">Questions</th>
                  <th className="py-3.5 px-6 text-right">Reports</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                {mySessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">{s.assessmentTitle}</td>
                    <td className="py-4 px-6">
                      <Badge variant={s.assessmentType === 'RECRUITER_ROOM' ? 'brand' : 'ai'} size="sm">
                        {s.assessmentType === 'RECRUITER_ROOM' ? 'Recruiter Room' : 'Resume AI'}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant={s.status === 'SUBMITTED' || s.status === 'AUTO_SUBMITTED' ? 'success' : 'brand'} size="sm">
                        {s.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-ai-700">
                      {s.percentage !== undefined ? `${s.percentage}%` : '--'}
                    </td>
                    <td className="py-4 px-6 text-slate-500">{s.totalQuestions} questions</td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => navigate(`/candidate/assessment/${s.id}/report`)}
                        className="px-3 py-1.5 rounded-xl bg-ai-50 text-ai-700 hover:bg-ai-100 font-bold transition-colors inline-flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Score Report</span>
                      </button>
                      {s.assessmentType === 'RECRUITER_ROOM' && (
                        <button
                          onClick={() => navigate(`/candidate/assessment/${s.id}/proctoring`)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold transition-colors inline-flex items-center gap-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Proctoring</span>
                        </button>
                      )}
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
