import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ProgressBar } from '../components/common/ProgressBar';
import {
  UploadCloud,
  FileText,
  X,
  Sparkles,
  CheckCircle,
  AlertCircle,
  BrainCircuit,
  Loader2,
} from 'lucide-react';

interface Stage {
  label: string;
  status: 'pending' | 'active' | 'completed';
}

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [failedResumeId, setFailedResumeId] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  // Upload progress state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadPercentage, setUploadPercentage] = useState<number>(0);
  const [uploadedBytes, setUploadedBytes] = useState<number>(0);
  const [totalBytes, setTotalBytes] = useState<number>(0);
  const [uploadSpeedBytesPerSec, setUploadSpeedBytesPerSec] = useState<number>(0);
  const [estimatedRemainingSeconds, setEstimatedRemainingSeconds] = useState<number | null>(null);

  // AI Processing stage state
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
  const [aiStages, setAiStages] = useState<Stage[]>([
    { label: 'Resume uploaded & validated', status: 'pending' },
    { label: 'Extracting text from document', status: 'pending' },
    { label: 'Analyzing with Gemini AI model', status: 'pending' },
    { label: 'Identifying technical skills & evidence', status: 'pending' },
    { label: 'Detecting projects & experience timeline', status: 'pending' },
    { label: 'Generating vector embeddings & indexing', status: 'pending' },
  ]);

  const handleFileChange = (file: File | null) => {
    setError(null);
    setFailedResumeId(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const lowerName = file.name.toLowerCase();
    const isPdf = file.type === 'application/pdf' || lowerName.endsWith('.pdf');
    const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                  lowerName.endsWith('.docx') || lowerName.endsWith('.doc');

    if (!isPdf && !isDocx) {
      setError('Please upload a valid PDF or DOCX resume document.');
      setSelectedFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Resume file size exceeds maximum limit of 10 MB.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const startAiStageAnimation = async () => {
    setIsAiProcessing(true);

    const updateStage = (index: number, status: 'active' | 'completed') => {
      setAiStages((prev) =>
        prev.map((stage, idx) => {
          if (idx === index) return { ...stage, status };
          if (idx < index) return { ...stage, status: 'completed' };
          return stage;
        })
      );
    };

    updateStage(0, 'completed');
    await new Promise((r) => setTimeout(r, 400));

    updateStage(1, 'completed');
    await new Promise((r) => setTimeout(r, 500));

    updateStage(2, 'active');
    await new Promise((r) => setTimeout(r, 600));

    updateStage(3, 'active');
    await new Promise((r) => setTimeout(r, 600));

    updateStage(4, 'active');
    await new Promise((r) => setTimeout(r, 600));

    updateStage(5, 'active');
  };

  const handleRetry = async () => {
    if (!failedResumeId) return;
    setIsRetrying(true);
    setError(null);
    try {
      const response = await api.post(`/resumes/${failedResumeId}/retry`);
      if (response.data.success && response.data.resume?.id) {
        navigate(`/analysis/${response.data.resume.id}`);
      }
    } catch (err: any) {
      setIsRetrying(false);
      setError(
        err.response?.data?.message || 'Retry failed. Please check server logs.'
      );
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;

    setError(null);
    setFailedResumeId(null);
    setIsUploading(true);
    setUploadPercentage(0);

    const formData = new FormData();
    formData.append('resume', selectedFile);

    const startTime = Date.now();
    let lastLoaded = 0;
    let lastTime = startTime;

    try {
      const response = await api.post('/resumes/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || selectedFile.size;
          const loaded = progressEvent.loaded;
          const percent = Math.round((loaded * 100) / total);

          const currentTime = Date.now();
          const timeElapsedSec = (currentTime - lastTime) / 1000;

          if (timeElapsedSec >= 0.2) {
            const bytesLoadedDelta = loaded - lastLoaded;
            const speed = bytesLoadedDelta / timeElapsedSec;

            setUploadSpeedBytesPerSec(speed);

            if (speed > 0) {
              const remainingBytes = total - loaded;
              const remainingSeconds = Math.ceil(remainingBytes / speed);
              setEstimatedRemainingSeconds(remainingSeconds);
            }

            lastLoaded = loaded;
            lastTime = currentTime;
          }

          setUploadPercentage(percent);
          setUploadedBytes(loaded);
          setTotalBytes(total);

          if (percent === 100) {
            startAiStageAnimation();
          }
        },
      });

      if (response.data.success && response.data.resume?.id) {
        setAiStages((prev) => prev.map((s) => ({ ...s, status: 'completed' })));
        setTimeout(() => {
          navigate(`/analysis/${response.data.resume.id}`);
        }, 800);
      }
    } catch (err: any) {
      setIsUploading(false);
      setIsAiProcessing(false);
      const data = err.response?.data;
      if (data?.resumeId) {
        setFailedResumeId(data.resumeId);
      }
      if (data?.errorCode === 'EMPTY_TEXT') {
        setError("We couldn't extract readable text from this document. Please ensure it is not scanned or empty.");
      } else if (data?.errorCode === 'INVALID_FILE') {
        setError("Please upload a valid PDF or DOCX resume document.");
      } else if (data?.errorCode === 'RESUME_PARSE_FAILED') {
        setError("Unable to parse this resume document. Please check the file format.");
      } else if (data?.errorCode === 'AI_SERVICE_UNAVAILABLE') {
        setError("AI analysis service is temporarily busy. You can retry analysis without re-uploading.");
      } else if (data?.errorCode === 'UNAUTHENTICATED') {
        setError("Your session has expired. Please sign in again.");
      } else {
        setError(data?.message || err.message || 'Something went wrong while processing your resume. Please try again.');
      }
    }
  };

  const formatMB = (bytes: number) => (bytes / (1024 * 1024)).toFixed(2);
  const formatSpeed = (bytesPerSec: number) => {
    const mbPerSec = bytesPerSec / (1024 * 1024);
    if (mbPerSec < 0.1) {
      return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
    }
    return `${mbPerSec.toFixed(1)} MB/s`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ai-50 border border-ai-100 text-ai-700 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Resume Upload Portal</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Upload Your Resume</h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload your PDF resume to extract structured personal details, technical skills, education timeline, and projects using Gemini AI.
        </p>
      </div>

      {/* Main Upload Box */}
      {!isUploading ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-10 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Upload Error</span>
                  <span>{error}</span>
                </div>
              </div>
              {failedResumeId && (
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shrink-0 shadow-sm flex items-center gap-1.5 transition-all"
                >
                  {isRetrying ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    'Retry Analysis'
                  )}
                </button>
              )}
            </div>
          )}

          {/* Drag and Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-ai-500 bg-ai-50/50 scale-[1.01]'
                : selectedFile
                ? 'border-emerald-300 bg-emerald-50/20'
                : 'border-slate-300 hover:border-ai-400 hover:bg-slate-50/80'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              className="hidden"
            />

            {!selectedFile ? (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-ai-50 text-ai-600 border border-ai-100 mx-auto flex items-center justify-center shadow-xs">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Drop your resume here, or <span className="text-ai-600 underline">browse</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports text-based PDF and DOCX files up to 10 MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-4 text-left">
                  <div className="p-3 bg-ai-50 text-ai-600 rounded-xl">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 max-w-sm truncate">
                      {selectedFile.name}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono">
                      {formatMB(selectedFile.size)} MB • {selectedFile.name.toLowerCase().endsWith('.pdf') ? 'PDF Document' : 'Word Document'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="flex justify-end">
            <button
              onClick={handleUploadSubmit}
              disabled={!selectedFile}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-ai-600 to-brand-600 hover:from-ai-500 hover:to-brand-500 text-white font-bold text-sm shadow-lg shadow-ai-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
            >
              Upload Resume
            </button>
          </div>
        </div>
      ) : (
        /* Progress Monitor Interface */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg p-6 sm:p-10 space-y-8">
          {!isAiProcessing ? (
            /* Upload Progress Stage */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Uploading Resume...</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedFile?.name}</p>
                </div>
                <span className="text-2xl font-black text-ai-600 font-mono">
                  {uploadPercentage}%
                </span>
              </div>

              <ProgressBar
                percentage={uploadPercentage}
                color="ai"
              />

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Uploaded</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {formatMB(uploadedBytes)} MB / {formatMB(totalBytes)} MB
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Upload Speed</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {uploadSpeedBytesPerSec > 0 ? formatSpeed(uploadSpeedBytesPerSec) : 'Calculating...'}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-slate-400 block mb-0.5">Estimated Remaining Time</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {estimatedRemainingSeconds !== null
                      ? `${estimatedRemainingSeconds} seconds`
                      : 'Calculating...'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* AI Processing Stage Breakdown */
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-ai-100 text-ai-600 rounded-2xl animate-pulse">
                  <BrainCircuit className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Analyzing your resume with Gemini AI...
                  </h3>
                  <p className="text-xs text-slate-500">
                    Extracting skills, experience, projects, and education timeline.
                  </p>
                </div>
              </div>

              {/* Stage Stepper List */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                {aiStages.map((stage, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-xl text-xs font-medium transition-all ${
                      stage.status === 'completed'
                        ? 'bg-emerald-50/70 text-emerald-800 border border-emerald-100'
                        : stage.status === 'active'
                        ? 'bg-ai-50 text-ai-800 border border-ai-200 font-bold'
                        : 'bg-slate-50 text-slate-400 border border-slate-100'
                    }`}
                  >
                    {stage.status === 'completed' && (
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    {stage.status === 'active' && (
                      <Loader2 className="w-4 h-4 text-ai-600 animate-spin shrink-0" />
                    )}
                    {stage.status === 'pending' && (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                    )}
                    <span>{stage.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
