import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ProgressBar } from '../../components/common/ProgressBar';
import {
  Briefcase,
  UploadCloud,
  FileText,
  X,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Building2,
  MapPin,
  Clock,
  DollarSign,
  Plus,
} from 'lucide-react';

export const CreateJobPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<'manual' | 'upload'>('manual');

  // Form State
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('Full Time');
  const [experienceLevel, setExperienceLevel] = useState('0-2 years');
  const [salaryRange, setSalaryRange] = useState('');
  const [description, setDescription] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<string[]>(['React', 'Node.js', 'MongoDB']);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [preferredSkills, setPreferredSkills] = useState<string[]>(['TypeScript', 'AWS']);
  const [newPreferredInput, setNewPreferredInput] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('PUBLISHED');

  // Assessment Room Configuration states
  const [createAssessmentRoom, setCreateAssessmentRoom] = useState(false);
  const [roomTitle, setRoomTitle] = useState('');
  const [roomTopics, setRoomTopics] = useState('');
  const [roomQCount, setRoomQCount] = useState(20);
  const [roomDifficulty, setRoomDifficulty] = useState('MIXED');
  const [roomDuration, setRoomDuration] = useState(45);
  const [roomPrompt, setRoomPrompt] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // PDF Upload Progress State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercentage, setUploadPercentage] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  const handleAddRequiredSkill = () => {
    if (!newSkillInput.trim()) return;
    if (!requiredSkills.includes(newSkillInput.trim())) {
      setRequiredSkills([...requiredSkills, newSkillInput.trim()]);
    }
    setNewSkillInput('');
  };

  const handleRemoveRequiredSkill = (skill: string) => {
    setRequiredSkills(requiredSkills.filter((s) => s !== skill));
  };

  const handleAddPreferredSkill = () => {
    if (!newPreferredInput.trim()) return;
    if (!preferredSkills.includes(newPreferredInput.trim())) {
      setPreferredSkills([...preferredSkills, newPreferredInput.trim()]);
    }
    setNewPreferredInput('');
  };

  const handleRemovePreferredSkill = (skill: string) => {
    setPreferredSkills(preferredSkills.filter((s) => s !== skill));
  };

  const handlePdfUploadSubmit = async () => {
    if (!selectedFile) return;

    setError(null);
    setIsUploading(true);
    setUploadPercentage(0);

    const formData = new FormData();
    formData.append('resume', selectedFile); // Using uploadSingleResume middleware
    formData.append('title', title || selectedFile.name.replace('.pdf', ''));
    formData.append('companyName', companyName || 'TechCorp');
    formData.append('location', location || 'Remote');
    formData.append('status', status);
    if (createAssessmentRoom) {
      formData.append('createAssessmentRoom', 'true');
      formData.append('assessmentRoomConfig', JSON.stringify({
        title: roomTitle || `${title || selectedFile.name.replace('.pdf', '')} Assessment`,
        topics: roomTopics || requiredSkills.join(', '),
        totalQuestions: roomQCount,
        difficulty: roomDifficulty,
        durationMinutes: roomDuration,
        description: roomPrompt,
      }));
    }

    const startTime = Date.now();
    let lastLoaded = 0;
    let lastTime = startTime;

    try {
      const response = await api.post('/jobs/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || selectedFile.size;
          const loaded = progressEvent.loaded;
          const percent = Math.round((loaded * 100) / total);

          const currentTime = Date.now();
          const timeElapsedSec = (currentTime - lastTime) / 1000;

          if (timeElapsedSec >= 0.2) {
            const speed = (loaded - lastLoaded) / timeElapsedSec;
            setUploadSpeed(speed);
            if (speed > 0) {
              setRemainingSeconds(Math.ceil((total - loaded) / speed));
            }
            lastLoaded = loaded;
            lastTime = currentTime;
          }

          setUploadPercentage(percent);
          setUploadedBytes(loaded);
          setTotalBytes(total);
        },
      });

      if (response.data.success) {
        navigate('/recruiter/jobs');
      }
    } catch (err: any) {
      setIsUploading(false);
      setError(err.response?.data?.message || err.message || 'Failed to upload and create Job Description.');
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title) {
      setError('Job Title is required.');
      return;
    }
    if (!companyName) {
      setError('Company Name is required.');
      return;
    }
    if (!description) {
      setError('Job Description is required.');
      return;
    }
    if (requiredSkills.length === 0) {
      setError('Please add at least one required skill before publishing this job.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/jobs/create', {
        title,
        companyName,
        location: location || 'Remote',
        employmentType,
        experienceLevel,
        salaryRange,
        description,
        requiredSkills,
        preferredSkills,
        status,
        createAssessmentRoom,
        assessmentRoomConfig: createAssessmentRoom ? {
          title: roomTitle || `${title} Assessment`,
          topics: roomTopics || requiredSkills.join(', '),
          totalQuestions: roomQCount,
          difficulty: roomDifficulty,
          durationMinutes: roomDuration,
          description: roomPrompt,
        } : undefined,
      });

      navigate('/recruiter/jobs');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create job.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ai-50 text-ai-700 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Job Description Builder</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create a New Job</h1>
        <p className="text-sm text-slate-500 mt-1">
          Publish a new job position to start receiving candidate applications and informational AI match metrics.
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-200/80 rounded-2xl max-w-md">
        <button
          type="button"
          onClick={() => {
            setActiveTab('manual');
            setError(null);
          }}
          className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'manual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Enter Manually
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('upload');
            setError(null);
          }}
          className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Upload JD PDF
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <span className="font-bold block">Validation Error</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {activeTab === 'manual' ? (
        /* Manual Job Form */
        <form onSubmit={handleManualSubmit} className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Job Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Full Stack Developer"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-ai-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. TechCorp Innovations"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-ai-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Location *
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Pune, Maharashtra / Remote"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-ai-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Employment Type
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-ai-500"
              >
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
                <option value="Contract">Contract</option>
                <option value="Remote">Remote</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Experience Level
              </label>
              <input
                type="text"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                placeholder="e.g. 0–2 years"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-ai-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Salary Range (Optional)
              </label>
              <input
                type="text"
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                placeholder="e.g. $80,000 - $110,000"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-ai-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Job Description *
            </label>
            <textarea
              rows={5}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe role responsibilities, team environment, and expectations..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-ai-500"
            />
          </div>

          {/* Required Skills Badges */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Required Skills *
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddRequiredSkill();
                  }
                }}
                placeholder="Add required skill (e.g. React) and press Enter"
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-ai-500"
              />
              <button
                type="button"
                onClick={handleAddRequiredSkill}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs"
              >
                Add Skill
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {requiredSkills.map((sk) => (
                <span
                  key={sk}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 text-xs font-bold"
                >
                  {sk}
                  <button type="button" onClick={() => handleRemoveRequiredSkill(sk)}>
                    <X className="w-3 h-3 hover:text-rose-600" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Preferred Skills */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Preferred Skills (Optional)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newPreferredInput}
                onChange={(e) => setNewPreferredInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPreferredSkill();
                  }
                }}
                placeholder="Add preferred skill (e.g. AWS) and press Enter"
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-ai-500"
              />
              <button
                type="button"
                onClick={handleAddPreferredSkill}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold text-xs"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {preferredSkills.map((sk) => (
                <span
                  key={sk}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ai-50 text-ai-700 border border-ai-200 text-xs font-bold"
                >
                  {sk}
                  <button type="button" onClick={() => handleRemovePreferredSkill(sk)}>
                    <X className="w-3 h-3 hover:text-rose-600" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Optional Assessment Room Integration */}
          <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={createAssessmentRoom}
                onChange={(e) => setCreateAssessmentRoom(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Create Assessment Room for this Job
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Configure and automatically link an AI assessment room to evaluate shortlisted candidates for this position.
                </span>
              </div>
            </label>

            {createAssessmentRoom && (
              <div className="pt-3 border-t border-purple-200/60 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Assessment Room Title
                    </label>
                    <input
                      type="text"
                      value={roomTitle}
                      onChange={(e) => setRoomTitle(e.target.value)}
                      placeholder={title ? `${title} Assessment` : 'e.g. Senior Frontend Assessment'}
                      className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Assessment Topics (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={roomTopics}
                      onChange={(e) => setRoomTopics(e.target.value)}
                      placeholder={requiredSkills.join(', ') || 'React, TypeScript, CSS'}
                      className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Number of Questions
                    </label>
                    <select
                      value={roomQCount}
                      onChange={(e) => setRoomQCount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value={10}>10 Questions</option>
                      <option value={20}>20 Questions (Standard)</option>
                      <option value={30}>30 Questions</option>
                      <option value={50}>50 Questions</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Difficulty Level
                    </label>
                    <select
                      value={roomDifficulty}
                      onChange={(e) => setRoomDifficulty(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="MIXED">Mixed (Dynamic Adaptive)</option>
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      value={roomDuration}
                      onChange={(e) => setRoomDuration(Number(e.target.value))}
                      min={10}
                      max={180}
                      className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Custom NLP Description / Instructions (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={roomPrompt}
                    onChange={(e) => setRoomPrompt(e.target.value)}
                    placeholder="e.g. Focus deeply on state management, asynchronous workflows, and API error resilience."
                    className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="jobStatus"
                  checked={status === 'PUBLISHED'}
                  onChange={() => setStatus('PUBLISHED')}
                />
                <span>Publish Position Immediately</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="jobStatus"
                  checked={status === 'DRAFT'}
                  onChange={() => setStatus('DRAFT')}
                />
                <span>Save as Draft</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-ai-600 to-brand-600 hover:from-ai-500 hover:to-brand-500 text-white font-bold text-xs shadow-lg shadow-ai-600/25 disabled:opacity-50"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Job'}
            </button>
          </div>
        </form>
      ) : (
        /* PDF Upload Portal */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-10 space-y-6">
          {!isUploading ? (
            <div className="space-y-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-ai-400 hover:bg-slate-50/80 rounded-3xl p-10 text-center cursor-pointer transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                />

                {!selectedFile ? (
                  <div className="space-y-3">
                    <div className="w-16 h-16 rounded-3xl bg-ai-50 text-ai-600 border border-ai-100 mx-auto flex items-center justify-center">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      Drop Job Description PDF here, or <span className="text-ai-600 underline">browse</span>
                    </h3>
                    <p className="text-xs text-slate-400">PDF files up to 10 MB</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-3">
                      <FileText className="w-6 h-6 text-rose-600" />
                      <div className="text-left">
                        <h4 className="text-xs font-bold text-slate-900">{selectedFile.name}</h4>
                        <p className="text-[11px] text-slate-400">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • PDF
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handlePdfUploadSubmit}
                  disabled={!selectedFile}
                  className="px-8 py-3 rounded-2xl bg-ai-600 hover:bg-ai-700 text-white font-bold text-xs shadow-md disabled:opacity-50"
                >
                  Upload & Extract JD with Gemini
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900">Uploading Job Description PDF...</h3>
              <ProgressBar percentage={uploadPercentage} color="ai" />
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 text-xs">
                <div>
                  <span className="text-slate-400 block">Uploaded</span>
                  <span className="font-bold">
                    {(uploadedBytes / (1024 * 1024)).toFixed(2)} MB / {(totalBytes / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Remaining Time</span>
                  <span className="font-bold">
                    {remainingSeconds !== null ? `${remainingSeconds} seconds` : 'Calculating...'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
