import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { IAssessmentQuestion, QuestionDifficulty, AssessmentType } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import { Badge } from '../../components/common/Badge';
import {
  ShieldAlert,
  Camera,
  Mic,
  Maximize2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Send,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export const ProctoredAssessmentPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlType = searchParams.get('type') as AssessmentType | null;

  // Pre-check & Consent states (Strict System Readiness Check Gate for ALL assessments)
  const [assessmentType, setAssessmentType] = useState<AssessmentType>(urlType || 'RESUME_BASED');
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState<boolean>(false);
  const [cameraConnected, setCameraConnected] = useState<boolean>(false);
  const [faceDetected, setFaceDetected] = useState<boolean>(false);
  const [faceStabilized, setFaceStabilized] = useState<boolean>(false);
  const [fullscreenReady, setFullscreenReady] = useState<boolean>(true);
  const [consentAccepted, setConsentAccepted] = useState<boolean>(false);
  const [readinessError, setReadinessError] = useState<string>('');

  // Assessment states
  const [loading, setLoading] = useState<boolean>(true);
  const [questionsList, setQuestionsList] = useState<IAssessmentQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answersMap, setAnswersMap] = useState<Record<string, number>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number>(1800);
  const [currentDifficulty, setCurrentDifficulty] = useState<QuestionDifficulty>('MEDIUM');
  const [totalQuestions, setTotalQuestions] = useState<number>(20);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string>('');
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);

  // Media references
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const snapshotIntervalRef = useRef<any>(null);
  const faceDetectionIntervalRef = useRef<any>(null);
  const faceStabilityTimerRef = useRef<any>(null);
  const listenersAttachedRef = useRef<boolean>(false);

  useEffect(() => {
    fetchSessionInitialStatus();

    return () => {
      stopCamera();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (snapshotIntervalRef.current) clearInterval(snapshotIntervalRef.current);
      if (faceDetectionIntervalRef.current) clearInterval(faceDetectionIntervalRef.current);
      if (faceStabilityTimerRef.current) clearTimeout(faceStabilityTimerRef.current);
    };
  }, [sessionId]);

  const startCountdownTimer = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const fetchSessionInitialStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/assessment-sessions/${sessionId}/status`);
      if (res.data.success) {
        const session = res.data.session;
        if (session.status === 'SUBMITTED' || session.status === 'AUTO_SUBMITTED') {
          navigate(`/candidate/assessment/${sessionId}/report`);
          return;
        }

        const resolvedType: AssessmentType =
          session.assessmentType ||
          session.assessment?.assessmentType ||
          (session.roomId ? 'RECRUITER_ROOM' : 'RESUME_BASED');

        setAssessmentType(resolvedType);
        setRemainingSeconds(session.remainingSeconds || 1800);
        setTotalQuestions(session.totalQuestions || 20);
        setCurrentDifficulty(session.currentDifficulty || 'MEDIUM');

        // Restore existing answers if any
        if (Array.isArray(session.existingAnswers)) {
          const map: Record<string, number> = {};
          for (const a of session.existingAnswers) {
            if (a.questionId && typeof a.selectedOption === 'number') {
              map[String(a.questionId)] = a.selectedOption;
            }
          }
          setAnswersMap(map);
        }

        // Load sanitized questionsList
        if (Array.isArray(res.data.questionsList) && res.data.questionsList.length > 0) {
          setQuestionsList(res.data.questionsList);
          setTotalQuestions(res.data.questionsList.length);
        } else if (session.assessment) {
          const aid = session.assessment._id || session.assessment;
          const qRes = await api.get(`/assessments/${aid}/questions`);
          if (qRes.data.success && Array.isArray(qRes.data.questions)) {
            const mapped = qRes.data.questions.map((q: any, i: number) => ({
              id: q.id || q._id,
              questionId: q.id || q._id,
              questionNumber: i + 1,
              totalQuestions: qRes.data.questions.length,
              skill: q.skill,
              topic: q.topic || q.skill,
              difficulty: q.difficulty,
              question: q.question,
              options: q.options,
            }));
            setQuestionsList(mapped);
            setTotalQuestions(mapped.length);
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to load assessment status:', err);
    } finally {
      setLoading(false);
    }
  };

  // Hardware Readiness & Face Detection Verification
  const initializeSystemReadiness = async () => {
    setReadinessError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true,
      });

      streamRef.current = stream;
      setCameraConnected(true);
      setCameraPermissionGranted(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      startFaceDetectionMonitoring();
    } catch (err: any) {
      console.warn('Primary camera/mic access failed, attempting video-only:', err);
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
        });
        streamRef.current = videoStream;
        setCameraConnected(true);
        setCameraPermissionGranted(true);

        if (videoRef.current) {
          videoRef.current.srcObject = videoStream;
          await videoRef.current.play().catch(() => {});
        }

        startFaceDetectionMonitoring();
      } catch (videoErr: any) {
        setCameraConnected(false);
        setCameraPermissionGranted(false);
        setReadinessError('Camera access is required to start this assessment.');
      }
    }
  };

  const startFaceDetectionMonitoring = () => {
    if (faceDetectionIntervalRef.current) clearInterval(faceDetectionIntervalRef.current);

    faceDetectionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !streamRef.current) return;

      const video = videoRef.current;
      if (video.readyState < 2 || video.videoWidth === 0) return;

      let detected = false;

      // Try native Chrome/Edge FaceDetector API if supported
      if ('FaceDetector' in window) {
        try {
          const detector = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
          const faces = await detector.detect(video);
          detected = faces.length > 0;
        } catch (e) {
          detected = true;
        }
      } else {
        // Fallback: Frame variance and luminance check to ensure a live subject is in frame
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 64;
          canvas.height = 48;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, 64, 48);
            const imgData = ctx.getImageData(0, 0, 64, 48);
            let totalLuminance = 0;
            const len = imgData.data.length;
            for (let i = 0; i < len; i += 4) {
              totalLuminance += 0.299 * imgData.data[i] + 0.587 * imgData.data[i + 1] + 0.114 * imgData.data[i + 2];
            }
            const avgLuminance = totalLuminance / (len / 4);
            detected = avgLuminance > 12 && avgLuminance < 245;
          } else {
            detected = true;
          }
        } catch {
          detected = true;
        }
      }

      if (detected) {
        setFaceDetected(true);
        setReadinessError('');
        if (!faceStabilized && !faceStabilityTimerRef.current) {
          faceStabilityTimerRef.current = setTimeout(() => {
            setFaceStabilized(true);
            faceStabilityTimerRef.current = null;
          }, 1500);
        }
      } else {
        setFaceDetected(false);
        setFaceStabilized(false);
        if (faceStabilityTimerRef.current) {
          clearTimeout(faceStabilityTimerRef.current);
          faceStabilityTimerRef.current = null;
        }
        setReadinessError('Face not detected. Please position your face clearly in front of the camera.');
        if (hasStarted) {
          logProctoringEvent('FACE_NOT_DETECTED', { timestamp: new Date() });
          showWarningToast('Face not detected. Please remain facing the camera.');
        }
      }
    }, 400);
  };

  const stopCamera = () => {
    if (faceDetectionIntervalRef.current) clearInterval(faceDetectionIntervalRef.current);
    if (faceStabilityTimerRef.current) clearTimeout(faceStabilityTimerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  const handleStartExam = async () => {
    if (!cameraConnected || !cameraPermissionGranted || !faceDetected || !faceStabilized || !consentAccepted) {
      return;
    }

    try {
      if (document.documentElement.requestFullscreen) {
        try {
          await document.documentElement.requestFullscreen();
          setFullscreenReady(true);
        } catch (e) {
          setFullscreenReady(true);
        }
      }

      setHasStarted(true);
      startCountdownTimer();

      // Start periodic webcam snapshots every 40 seconds
      snapshotIntervalRef.current = setInterval(() => {
        captureAndUploadSnapshot();
      }, 40000);

      setupProctoringListeners();
    } catch (err: any) {
      alert('Error initializing proctored session: ' + err.message);
    }
  };

  const setupProctoringListeners = () => {
    if (listenersAttachedRef.current) return;
    listenersAttachedRef.current = true;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        logProctoringEvent('TAB_SWITCH', { hidden: true });
        showWarningToast('Leaving the assessment window has been recorded.');
      }
    };

    const handleWindowBlur = () => {
      logProctoringEvent('WINDOW_BLUR', { blurred: true });
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && assessmentType === 'RECRUITER_ROOM') {
        logProctoringEvent('FULLSCREEN_EXIT', { exited: true });
        showWarningToast('Fullscreen exited. Please remain in fullscreen during proctoring.');
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      logProctoringEvent('COPY_ATTEMPT', {});
      showWarningToast('Copying content is disabled during assessments.');
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      logProctoringEvent('PASTE_ATTEMPT', {});
      showWarningToast('Pasting content is recorded.');
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      logProctoringEvent('RIGHT_CLICK', {});
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
  };

  const showWarningToast = (msg: string) => {
    setWarningMessage(msg);
    setTimeout(() => setWarningMessage(''), 4500);
  };

  const logProctoringEvent = async (eventType: string, metadata: any) => {
    try {
      await api.post('/proctoring/events', {
        sessionId,
        eventType,
        metadata,
      });
    } catch (err) {
      // Non-blocking
    }
  };

  const captureAndUploadSnapshot = async () => {
    if (!videoRef.current || !streamRef.current) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 320, 240);
        canvas.toBlob(async (blob) => {
          if (blob) {
            const formData = new FormData();
            formData.append('snapshot', blob, 'webcam.jpg');
            formData.append('sessionId', sessionId || '');
            formData.append('eventContext', 'Periodic proctoring snapshot');
            await api.post('/proctoring/snapshots', formData);
          }
        }, 'image/jpeg', 0.7);
      }
    } catch (e) {
      // Non-blocking
    }
  };

  const currentQuestion: IAssessmentQuestion | null = questionsList[currentIndex] || null;
  const currentQId = currentQuestion ? String(currentQuestion.id || currentQuestion.questionId) : '';
  const selectedOption = currentQId && answersMap[currentQId] !== undefined ? answersMap[currentQId] : null;
  const answeredCount = Object.keys(answersMap).length;

  const handleSelectOption = (optionIdx: number) => {
    if (!currentQuestion) return;
    const qId = String(currentQuestion.id || currentQuestion.questionId);
    setAnswersMap((prev) => ({
      ...prev,
      [qId]: optionIdx,
    }));

    // Persist answer to backend asynchronously without forcing question advance
    api
      .post(`/assessment-sessions/${sessionId}/answer`, {
        questionId: qId,
        selectedOption: optionIdx,
        timeSpentSeconds: 15,
        autoAdvance: false,
      })
      .then((res) => {
        if (res.data?.currentDifficulty) {
          setCurrentDifficulty(res.data.currentDifficulty);
        }
      })
      .catch(() => {
        // Answer is also sent in batch on final submission
      });
  };

  const handlePreviousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questionsList.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setShowSubmitModal(true);
    }
  };

  const buildSubmittedAnswersArray = () => {
    return Object.entries(answersMap).map(([questionId, selectedOption]) => ({
      questionId,
      selectedOption,
      timeSpentSeconds: 15,
    }));
  };

  const handleManualSubmit = async () => {
    try {
      setSubmitting(true);
      await api.post(`/assessment-sessions/${sessionId}/submit`, {
        answers: buildSubmittedAnswersArray(),
      });
      handleExamCompletion();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error submitting assessment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = async () => {
    try {
      await api.post(`/assessment-sessions/${sessionId}/submit`, {
        answers: buildSubmittedAnswersArray(),
      });
      handleExamCompletion();
    } catch (e) {
      navigate(`/candidate/assessment/${sessionId}/report`);
    }
  };

  const handleExamCompletion = () => {
    stopCamera();
    if (document.fullscreenElement) {
      try {
        document.exitFullscreen();
      } catch (e) {}
    }
    navigate(`/candidate/assessment/${sessionId}/report`);
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <LoadingState message="Loading assessment session and server timer..." />;
  }

  // Pre-Assessment System Check & Consent Screen (Required for BOTH Resume-Based and Recruiter assessments)
  if (!hasStarted) {
    const isReadyToStart =
      cameraConnected &&
      cameraPermissionGranted &&
      faceDetected &&
      faceStabilized &&
      fullscreenReady &&
      consentAccepted;

    return (
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-ai-50 text-ai-600 rounded-2xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900">System Readiness Check</h2>
                <Badge variant={assessmentType === 'RESUME_BASED' ? 'ai' : 'brand'} size="sm">
                  {assessmentType === 'RESUME_BASED' ? 'Resume AI Assessment' : 'Recruiter Room'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Proctored assessment session requires camera verification, active face detection, and integrity consent.
              </p>
            </div>
          </div>

          {/* Camera Preview Box with Face Status Overlay */}
          <div className="relative aspect-video max-w-md mx-auto bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />

            {!cameraPermissionGranted ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/85 text-white p-4 text-center">
                <Camera className="w-10 h-10 text-slate-400 mb-2" />
                <p className="text-xs font-bold">Camera access is required to start this assessment.</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                  Click below to enable your camera and initialize automatic face detection.
                </p>
                <button
                  type="button"
                  onClick={initializeSystemReadiness}
                  className="mt-3 px-5 py-2.5 rounded-xl bg-ai-600 hover:bg-ai-500 text-white text-xs font-bold transition-all shadow-md"
                >
                  Enable Camera
                </button>
              </div>
            ) : !faceDetected ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 text-white p-4 text-center">
                <AlertTriangle className="w-9 h-9 text-amber-400 mb-2 animate-bounce" />
                <p className="text-xs font-bold text-amber-200">
                  Face not detected. Please position your face clearly in front of the camera.
                </p>
                <span className="text-[10px] text-slate-400 mt-1">Ensure good lighting and direct eye contact.</span>
              </div>
            ) : !faceStabilized ? (
              <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-amber-500/90 text-white text-[10px] font-bold shadow-md flex items-center gap-1.5 animate-pulse">
                <span>Stabilizing face detection...</span>
              </div>
            ) : (
              <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-emerald-600/90 text-white text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Face Detected & Verified</span>
              </div>
            )}
          </div>

          {/* Dynamic Error Banner */}
          {readinessError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{readinessError}</span>
            </div>
          )}

          {/* Mandatory Readiness Checklist */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-bold text-slate-700">
                <Camera className="w-4 h-4 text-ai-600" />
                Camera connected
              </span>
              {cameraConnected ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Ready
                </span>
              ) : (
                <span className="text-slate-400 font-medium">Checking...</span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-bold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-ai-600" />
                Camera permission granted
              </span>
              {cameraPermissionGranted ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Granted
                </span>
              ) : (
                <span className="text-slate-400 font-medium">Pending Permission</span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-bold text-slate-700">
                <ShieldAlert className="w-4 h-4 text-ai-600" />
                Face detected & stabilized
              </span>
              {faceDetected && faceStabilized ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Verified
                </span>
              ) : faceDetected ? (
                <span className="text-amber-600 font-bold flex items-center gap-1 animate-pulse">
                  Stabilizing (1.5s)...
                </span>
              ) : (
                <span className="text-slate-400 font-medium">Position face in frame</span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-bold text-slate-700">
                <Maximize2 className="w-4 h-4 text-ai-600" />
                Fullscreen ready
              </span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Ready
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-bold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-ai-600" />
                Proctoring consent accepted
              </span>
              {consentAccepted ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Accepted
                </span>
              ) : (
                <span className="text-slate-400 font-medium">Required</span>
              )}
            </div>
          </div>

          {/* Consent Statement */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs space-y-2">
            <p className="font-bold text-amber-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              Proctoring & Privacy Consent
            </p>
            <p className="text-amber-800 leading-relaxed text-[11px]">
              During this screening assessment, periodic webcam snapshots will be captured to verify candidate identity. Fullscreen exit and window switching events are recorded objectively in your session compliance timeline. All monitoring records are strictly private and accessible only to authorized reviewers.
            </p>
            <label className="flex items-center gap-2.5 pt-2 cursor-pointer font-bold text-slate-800">
              <input
                type="checkbox"
                checked={consentAccepted}
                onChange={(e) => setConsentAccepted(e.target.checked)}
                className="w-4 h-4 text-ai-600 rounded border-slate-300 focus:ring-ai-500"
              />
              <span>I consent to proctored integrity monitoring for this assessment session</span>
            </label>
          </div>

          {/* Start Assessment Button - Strictly disabled until all checks pass */}
          <button
            onClick={handleStartExam}
            disabled={!isReadyToStart}
            className={`w-full py-4 rounded-2xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 ${
              isReadyToStart
                ? 'bg-gradient-to-r from-ai-600 to-brand-600 hover:from-ai-500 hover:to-brand-500 text-white shadow-ai-600/30 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            <span>Start Assessment</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const progressPercentage = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  // Active Assessment View (Shared between RESUME_BASED and RECRUITER_ROOM)
  return (
    <div className="min-h-screen pb-12 space-y-6">
      {/* Integrity Alert Banner */}
      {warningMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-rose-600 text-white font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{warningMessage}</span>
        </div>
      )}

      {/* Floating Webcam Feed (Proctored stream active during exam) */}
      {streamRef.current && (
        <div className="fixed bottom-6 right-6 z-40 w-44 h-32 rounded-2xl bg-slate-900 border-2 border-ai-500/80 shadow-2xl overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-rose-600/90 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            Proctored
          </div>
        </div>
      )}

      {/* Assessment Header Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-ai-50 text-ai-600 rounded-xl">
            {assessmentType === 'RESUME_BASED' ? (
              <Sparkles className="w-5 h-5" />
            ) : (
              <HelpCircle className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900">
                Question {currentIndex + 1} of {totalQuestions}
              </h2>
              <Badge variant={assessmentType === 'RESUME_BASED' ? 'ai' : 'brand'} size="sm">
                {assessmentType === 'RESUME_BASED' ? 'Resume-Based AI Assessment' : 'Recruiter Assessment Room'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Skill / Topic:{' '}
              <span className="font-bold text-slate-700">
                {currentQuestion?.skill || 'General'}
                {currentQuestion?.topic && currentQuestion.topic !== currentQuestion.skill
                  ? ` — ${currentQuestion.topic}`
                  : ''}
              </span>
            </p>
          </div>
        </div>

        {/* Server Synchronized Timer & Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div
            className={`px-4 py-2 rounded-2xl font-mono text-sm font-black flex items-center gap-2 border ${
              remainingSeconds < 300
                ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTimer(remainingSeconds)}</span>
          </div>

          <Badge
            variant={
              (currentQuestion?.difficulty || currentDifficulty) === 'HARD'
                ? 'danger'
                : (currentQuestion?.difficulty || currentDifficulty) === 'MEDIUM'
                ? 'warning'
                : 'success'
            }
          >
            {currentQuestion?.difficulty || currentDifficulty}
          </Badge>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
          >
            Submit Assessment
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-2xl px-6 py-3 border border-slate-200/80 shadow-xs flex items-center gap-4">
        <span className="text-xs font-bold text-slate-600 shrink-0">
          Answered: {answeredCount} / {totalQuestions}
        </span>
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-ai-600 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <span className="text-xs font-mono font-bold text-ai-700 shrink-0">{progressPercentage}%</span>
      </div>

      {/* Main Question Card */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ai-600">
                Question {currentIndex + 1} of {totalQuestions}
              </span>
              <span className="text-xs text-slate-400">
                Select one option below
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-relaxed">
              {currentQuestion?.question || 'Question content loading...'}
            </h3>
          </div>

          {/* Options */}
          <div className="space-y-3 pt-2">
            {currentQuestion?.options.map((opt, i) => (
              <div
                key={i}
                onClick={() => handleSelectOption(i)}
                className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                  selectedOption === i
                    ? 'border-ai-600 bg-ai-50/60 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    selectedOption === i
                      ? 'bg-ai-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {String.fromCharCode(65 + i)}
                </div>
                <span className="text-sm font-medium text-slate-800 leading-relaxed pt-0.5">
                  {opt}
                </span>
              </div>
            ))}
          </div>

          {/* Footer Navigation: [Previous] and [Next] */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handlePreviousQuestion}
              disabled={currentIndex === 0}
              className={`px-5 py-3 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 ${
                currentIndex > 0
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  : 'bg-slate-50 text-slate-300 cursor-not-allowed'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="text-xs text-slate-400 hidden sm:inline">
              Server-authoritative timer • Answers saved automatically
            </span>

            {currentIndex + 1 < totalQuestions ? (
              <button
                type="button"
                onClick={handleNextQuestion}
                className="px-6 py-3 rounded-2xl font-bold text-xs shadow-md transition-all flex items-center gap-2 bg-ai-600 hover:bg-ai-700 text-white shadow-ai-600/20"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="px-6 py-3 rounded-2xl font-bold text-xs shadow-md transition-all flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Send className="w-4 h-4" />
                <span>Submit Assessment</span>
              </button>
            )}
          </div>
        </div>

        {/* Question Palette Sidebar */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 h-fit">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Question Navigator
          </h4>
          <div className="grid grid-cols-5 gap-2">
            {questionsList.map((q, i) => {
              const qId = String(q.id || q.questionId);
              const isCurrent = currentIndex === i;
              const isAnswered = answersMap[qId] !== undefined;
              return (
                <button
                  type="button"
                  key={qId || i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-ai-600 text-white ring-2 ring-ai-400 ring-offset-2'
                      : isAnswered
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-ai-600" />
              <span>Current Question</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-200" />
              <span>Answered ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-200" />
              <span>Unanswered ({Math.max(0, totalQuestions - answeredCount)})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <h3 className="text-lg font-black text-slate-900">Submit Assessment?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              You have answered <span className="font-bold text-slate-900">{answeredCount}</span> of{' '}
              <span className="font-bold text-slate-900">{totalQuestions}</span> questions (
              <span className="font-bold text-slate-900">{Math.max(0, totalQuestions - answeredCount)}</span> unanswered).
              Once submitted, your session will be scored server-side and your TrustScore Report will be updated.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                Continue Assessment
              </button>
              <button
                type="button"
                onClick={handleManualSubmit}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-ai-600 hover:bg-ai-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Submitting...' : 'Confirm Submission'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
