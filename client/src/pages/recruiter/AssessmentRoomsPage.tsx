import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { IAssessmentRoom, IAssessment, IParsedPdfQuestion } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import { Badge } from '../../components/common/Badge';
import {
  Award,
  PlusCircle,
  Copy,
  Check,
  Clock,
  HelpCircle,
  Users,
  ArrowRight,
  Sparkles,
  FileUp,
  AlertTriangle,
  Eye,
  X,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

export const AssessmentRoomsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [rooms, setRooms] = useState<IAssessmentRoom[]>([]);
  const [assessments, setAssessments] = useState<IAssessment[]>([]);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string>('');

  // Generation mode: 'AI' | 'PDF'
  const [generationMode, setGenerationMode] = useState<'AI' | 'PDF'>('AI');

  // Shared Form states
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [topicsInput, setTopicsInput] = useState<string>('Java, OOP, Collections, Spring Boot, REST API');
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Mixed'>('Mixed');
  const [naturalLanguagePrompt, setNaturalLanguagePrompt] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [useExistingTemplate, setUseExistingTemplate] = useState<boolean>(false);
  const [assessmentId, setAssessmentId] = useState<string>('');

  // Async & Error states
  const [creating, setCreating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // PDF Upload states
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [parsingPdf, setParsingPdf] = useState<boolean>(false);
  const [parsedQuestions, setParsedQuestions] = useState<IParsedPdfQuestion[]>([]);
  const [missingAnswerKeysCount, setMissingAnswerKeysCount] = useState<number>(0);
  const [showPreviewList, setShowPreviewList] = useState<boolean>(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [roomsRes, assessmentsRes] = await Promise.all([
        api.get('/assessment-rooms/recruiter'),
        api.get('/assessments'),
      ]);

      if (roomsRes.data.success) {
        setRooms(roomsRes.data.rooms || []);
      }
      if (assessmentsRes.data.success) {
        setAssessments(assessmentsRes.data.assessments || []);
        if (assessmentsRes.data.assessments?.length > 0) {
          setAssessmentId(assessmentsRes.data.assessments[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load assessment rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setTitle('');
    setDescription('');
    setTopicsInput('Java, OOP, Collections, Spring Boot, REST API');
    setQuestionCount(20);
    setDifficulty('Mixed');
    setNaturalLanguagePrompt('');
    setDurationMinutes(30);
    setUseExistingTemplate(false);
    setPdfFile(null);
    setParsedQuestions([]);
    setMissingAnswerKeysCount(0);
    setErrorMsg(null);
    setShowCreateModal(false);
  };

  const handleParsePdf = async () => {
    if (!pdfFile) {
      setErrorMsg('Please select a PDF file containing assessment questions.');
      return;
    }

    try {
      setParsingPdf(true);
      setErrorMsg(null);
      const formData = new FormData();
      formData.append('file', pdfFile);

      const res = await api.post('/assessment-rooms/parse-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        const questions: IParsedPdfQuestion[] = res.data.questions || [];
        setParsedQuestions(questions);
        const missing = questions.filter((q) => !q.hasAnswerKey || !q.correctAnswer).length;
        setMissingAnswerKeysCount(missing);
        setShowPreviewList(true);
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message ||
          'Failed to extract questions from the uploaded PDF. Please ensure it is a readable text PDF.'
      );
      setParsedQuestions([]);
    } finally {
      setParsingPdf(false);
    }
  };

  const handleSelectPdfAnswerKey = (index: number, optionIndex: number) => {
    setParsedQuestions((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        correctAnswer: optionIndex,
        hasAnswerKey: true,
      };
      const missing = updated.filter(
        (q) => !q.hasAnswerKey && q.correctAnswer === undefined
      ).length;
      setMissingAnswerKeysCount(missing);
      return updated;
    });
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsedTopics = topicsInput
      .split(/[,\n]/)
      .map((t) => t.trim())
      .filter(Boolean);

    if (generationMode === 'PDF') {
      if (parsedQuestions.length === 0) {
        setErrorMsg('Please upload and parse a question PDF before publishing the room.');
        return;
      }

      const missing = parsedQuestions.filter(
        (q) =>
          q.correctAnswer === undefined ||
          q.correctAnswer === null ||
          (typeof q.correctAnswer === 'string' && !q.correctAnswer.trim())
      );
      if (missing.length > 0) {
        setErrorMsg(
          `${missing.length} question(s) are missing an answer key. Answer keys are required for automatically scored MCQ assessments. Please select the correct answer in the preview below.`
        );
        return;
      }

      try {
        setCreating(true);
        const res = await api.post('/assessment-rooms/publish-pdf', {
          title: title || 'Uploaded PDF Assessment Room',
          description,
          topics: parsedTopics,
          difficulty,
          durationMinutes,
          questions: parsedQuestions,
        });

        if (res.data.success) {
          resetModal();
          fetchData();
        }
      } catch (err: any) {
        setErrorMsg(err.response?.data?.message || 'Failed to publish PDF assessment room.');
      } finally {
        setCreating(false);
      }
      return;
    }

    // Method A: AI Generated Questions (or existing template)
    if (!useExistingTemplate && parsedTopics.length === 0 && !naturalLanguagePrompt.trim()) {
      setErrorMsg('Please specify at least one topic/skill or natural language instructions.');
      return;
    }

    try {
      setCreating(true);
      const payload: any = {
        title: title || 'Technical Screening Assessment Room',
        description,
        topics: parsedTopics,
        difficulty,
        questionCount,
        totalQuestions: questionCount,
        durationMinutes,
        generationMode: 'AI',
        naturalLanguagePrompt,
      };

      if (useExistingTemplate && assessmentId) {
        payload.assessmentId = assessmentId;
      }

      const res = await api.post('/assessment-rooms', payload);

      if (res.data.success) {
        resetModal();
        fetchData();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create assessment room.');
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2500);
  };

  if (loading) {
    return <LoadingState message="Loading assessment rooms..." />;
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-ai-950 to-brand-950 p-6 sm:p-8 border border-slate-800 text-white shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ai-500/10 border border-ai-500/20 text-ai-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recruiter Proctored Assessment Rooms</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Assessment Screening Rooms
            </h1>
            <p className="text-sm text-slate-300 mt-1 leading-relaxed">
              Create dedicated proctored assessment rooms using AI topic/prompt generation or by uploading a structured Question PDF.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-ai-600 to-brand-600 hover:from-ai-500 hover:to-brand-500 text-white font-bold text-sm shadow-lg shadow-ai-600/30 transition-all hover:scale-[1.02] shrink-0"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Create Assessment Room</span>
          </button>
        </div>
      </div>

      {/* Rooms Grid */}
      {rooms.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Assessment Rooms Created</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Create your first room to issue screening codes like RAI-8X92K to prospective candidates.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-5 py-2.5 rounded-xl bg-ai-600 hover:bg-ai-700 text-white font-bold text-xs"
          >
            Create Assessment Room
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {rooms.map((room) => {
            const displaySkills = room.topics?.length ? room.topics : room.skills || [];
            return (
              <div
                key={room.id}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-5 hover:border-ai-200 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-base font-black text-slate-900">{room.title}</h3>
                      {room.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {room.description}
                        </p>
                      )}
                      <div className="flex items-center flex-wrap gap-2 mt-2">
                        <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-ai-50 text-ai-700 border border-ai-200 flex items-center gap-1.5">
                          {room.roomCode}
                          <button
                            type="button"
                            onClick={() => copyToClipboard(room.roomCode)}
                            title="Copy Room Code"
                            className="hover:text-ai-900 transition-colors"
                          >
                            {copiedCode === room.roomCode ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </span>
                        <Badge variant="default" size="sm">
                          {room.generationMode === 'PDF' ? 'PDF Questions' : 'AI Generated'}
                        </Badge>
                        {room.difficulty && (
                          <Badge variant="brand" size="sm">
                            {room.difficulty}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Badge variant={room.status === 'ACTIVE' ? 'success' : 'default'} size="sm">
                      {room.status}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1.5 my-3">
                    {displaySkills.slice(0, 6).map((sk, i) => (
                      <Badge key={i} variant="brand" size="sm">
                        {sk}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 font-medium pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {room.durationMinutes} mins
                    </span>
                    <span className="flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      {room.questionCount || room.totalQuestions} questions
                    </span>
                    <span className="flex items-center gap-1 font-bold text-slate-700">
                      <Users className="w-3.5 h-3.5 text-ai-600" />
                      {room.candidatesCount || 0} Candidates
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-emerald-600 font-bold">
                    {room.completedCount || 0} Completed
                  </span>
                  <button
                    onClick={() => navigate(`/recruiter/assessment-rooms/${room.id}`)}
                    className="px-4 py-2 rounded-xl bg-ai-50 text-ai-700 hover:bg-ai-100 font-bold text-xs transition-colors flex items-center gap-1"
                  >
                    <span>View Room & Roster</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">Create Assessment Room</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure a dedicated proctored assessment room for candidates
                </p>
              </div>
              <button
                type="button"
                onClick={resetModal}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Method Selector Tabs */}
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setGenerationMode('AI');
                  setErrorMsg(null);
                }}
                className={`py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                  generationMode === 'AI'
                    ? 'bg-white text-ai-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Method A: AI Generated Questions</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setGenerationMode('PDF');
                  setErrorMsg(null);
                }}
                className={`py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                  generationMode === 'PDF'
                    ? 'bg-white text-ai-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileUp className="w-4 h-4" />
                <span>Method B: Upload Question PDF</span>
              </button>
            </div>

            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700 font-medium">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateRoom} className="space-y-4">
              {/* 1. Assessment Title & 2. Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    1. Assessment Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Java Backend Developer Screening"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-ai-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    2. Assessment Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short summary for candidates"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-ai-400"
                  />
                </div>
              </div>

              {/* 3. Topics / Skills */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  3. Topics / Skills (comma separated)
                </label>
                <input
                  type="text"
                  value={topicsInput}
                  onChange={(e) => setTopicsInput(e.target.value)}
                  placeholder="e.g. Java, OOP, Collections, Spring Boot, REST API"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-ai-400"
                />
              </div>

              {generationMode === 'AI' ? (
                <>
                  {/* 4. Number of Questions, 5. Difficulty, Duration */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        4. Number of Questions
                      </label>
                      <select
                        value={questionCount}
                        onChange={(e) => setQuestionCount(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-ai-400"
                      >
                        <option value={10}>10 Questions</option>
                        <option value={20}>20 Questions</option>
                        <option value={30}>30 Questions</option>
                        <option value={50}>50 Questions</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        5. Difficulty
                      </label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-ai-400"
                      >
                        <option value="Mixed">Mixed</option>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(Number(e.target.value))}
                        min={10}
                        max={180}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-ai-400"
                      />
                    </div>
                  </div>

                  {/* 6. Optional Natural Language Instructions */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      6. Optional Natural Language Instructions
                    </label>
                    <textarea
                      rows={3}
                      value={naturalLanguagePrompt}
                      onChange={(e) => setNaturalLanguagePrompt(e.target.value)}
                      placeholder="Describe what you want the assessment to test... e.g., Create a technical screening assessment for a Java backend developer. Focus on OOP, collections, exception handling, REST APIs and Spring Boot. Include practical scenario-based questions."
                      className="w-full p-3.5 rounded-xl border border-slate-200 text-xs leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-ai-400"
                    />
                  </div>

                  {/* Optional toggle to reuse an existing template */}
                  {assessments.length > 0 && (
                    <div className="pt-1">
                      <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useExistingTemplate}
                          onChange={(e) => setUseExistingTemplate(e.target.checked)}
                          className="rounded border-slate-300 text-ai-600 focus:ring-ai-500"
                        />
                        <span>Use existing saved assessment template instead of generating new questions</span>
                      </label>
                      {useExistingTemplate && (
                        <select
                          value={assessmentId}
                          onChange={(e) => setAssessmentId(e.target.value)}
                          className="mt-2 w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-ai-400"
                        >
                          {assessments.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.title} ({a.skills.join(', ')})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </>
              ) : (
                /* Method B: Upload Question PDF */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Difficulty Tag
                      </label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                      >
                        <option value="Mixed">Mixed</option>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(Number(e.target.value))}
                        min={10}
                        max={180}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-extrabold text-slate-800">
                          Upload Questions PDF (Supported: .pdf)
                        </p>
                        <p className="text-[11px] text-slate-500">
                          We extract MCQ questions, options, and answer keys into a preview before publishing.
                        </p>
                      </div>
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={(e) => {
                          const f = e.target.files?.[0] || null;
                          setPdfFile(f);
                          setParsedQuestions([]);
                        }}
                        className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-ai-50 file:text-ai-700 hover:file:bg-ai-100"
                      />
                    </div>

                    {pdfFile && (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                        <span className="text-xs font-semibold text-slate-700">
                          Selected: {pdfFile.name} ({(pdfFile.size / 1024).toFixed(1)} KB)
                        </span>
                        <button
                          type="button"
                          onClick={handleParsePdf}
                          disabled={parsingPdf}
                          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center gap-1.5"
                        >
                          {parsingPdf ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Extracting Questions...</span>
                            </>
                          ) : (
                            <>
                              <FileUp className="w-3.5 h-3.5" />
                              <span>Extract & Preview Questions</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Preview Extracted PDF Questions */}
                  {parsedQuestions.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 p-4 space-y-3 bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-extrabold text-slate-900">
                            Detected Questions: {parsedQuestions.length}
                          </span>
                          {missingAnswerKeysCount > 0 && (
                            <Badge variant="warning" size="sm">
                              {missingAnswerKeysCount} Missing Answer Key(s)
                            </Badge>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowPreviewList(!showPreviewList)}
                          className="text-xs font-bold text-ai-600 hover:text-ai-800 inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{showPreviewList ? 'Hide Preview' : 'Preview Questions'}</span>
                        </button>
                      </div>

                      {missingAnswerKeysCount > 0 && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 font-medium">
                          Answer keys were not detected for {missingAnswerKeysCount} question(s) in the uploaded PDF. We never silently invent answer keys — please click the correct option for any unkeyed question below before publishing.
                        </div>
                      )}

                      {showPreviewList && (
                        <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
                          {parsedQuestions.map((q, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-bold text-slate-900">
                                  Q{idx + 1}. {q.question}
                                </p>
                                <Badge
                                  variant={q.correctAnswer !== undefined && q.correctAnswer !== null ? 'success' : 'warning'}
                                  size="sm"
                                >
                                  {q.correctAnswer !== undefined && q.correctAnswer !== null ? 'Key Set' : 'Needs Key'}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {q.options.map((opt, oIdx) => {
                                  const isCorrect = q.correctAnswer === oIdx || q.correctAnswer === opt;
                                  return (
                                    <button
                                      key={oIdx}
                                      type="button"
                                      onClick={() => handleSelectPdfAnswerKey(idx, oIdx)}
                                      className={`text-left px-2.5 py-1.5 rounded-lg border text-[11px] transition-colors ${
                                        isCorrect
                                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                                          : 'bg-white border-slate-200 text-slate-600 hover:border-ai-300'
                                      }`}
                                    >
                                      {opt} {isCorrect && '✓'}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={resetModal}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || (generationMode === 'PDF' && parsedQuestions.length === 0)}
                  className="px-5 py-2.5 rounded-xl bg-ai-600 hover:bg-ai-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs inline-flex items-center gap-1.5"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>
                        {generationMode === 'PDF'
                          ? 'Publishing Assessment Room...'
                          : 'Generating Questions & Room...'}
                      </span>
                    </>
                  ) : (
                    <span>
                      {generationMode === 'PDF'
                        ? 'Publish Assessment Room'
                        : 'Create & Generate Room'}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
