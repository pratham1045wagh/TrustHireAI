import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { LoadingState } from '../../components/common/LoadingState';
import { Badge } from '../../components/common/Badge';
import {
  Award,
  Copy,
  Check,
  ChevronLeft,
  Users,
  Clock,
  ShieldCheck,
  FileText,
  Sparkles,
  Star,
  UserCheck,
  X,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';

export const AssessmentRoomDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [room, setRoom] = useState<any>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Invitation states
  const [inviting, setInviting] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [eligibleCandidates, setEligibleCandidates] = useState<any[]>([]);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);

  useEffect(() => {
    fetchRoomDetails();
  }, [id]);

  const fetchRoomDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/assessment-rooms/${id}`);
      if (res.data.success) {
        setRoom(res.data.room);
      }
    } catch (err) {
      console.error('Failed to load room details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteType = async (type: 'STARRED' | 'SHORTLISTED') => {
    try {
      setInviting(true);
      setInviteFeedback(null);
      const res = await api.post(`/assessment-rooms/${id}/invite`, { inviteType: type });
      if (res.data.success) {
        setInviteFeedback(res.data.message || `Successfully invited candidates.`);
        fetchRoomDetails();
      }
    } catch (err: any) {
      setInviteFeedback(err.response?.data?.message || 'Failed to send invitations.');
    } finally {
      setInviting(false);
    }
  };

  const openCandidateSelector = async () => {
    try {
      setInviting(true);
      setInviteFeedback(null);
      const res = await api.get(`/assessment-rooms/${id}/invitees`);
      if (res.data.success) {
        setEligibleCandidates(res.data.candidates || []);
        setSelectedCandidateIds([]);
        setShowInviteModal(true);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to load candidates.');
    } finally {
      setInviting(false);
    }
  };

  const handleSendSelectedInvitations = async () => {
    if (selectedCandidateIds.length === 0) return;
    try {
      setInviting(true);
      const res = await api.post(`/assessment-rooms/${id}/invite`, {
        candidateIds: selectedCandidateIds,
      });
      if (res.data.success) {
        setInviteFeedback(res.data.message);
        setShowInviteModal(false);
        fetchRoomDetails();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send invitations.');
    } finally {
      setInviting(false);
    }
  };

  const copyCode = () => {
    if (!room?.roomCode) return;
    navigator.clipboard.writeText(room.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return <LoadingState message="Loading assessment room roster..." />;
  }

  if (!room) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
        <p className="text-slate-500 text-sm">Assessment room not found.</p>
        <button
          onClick={() => navigate('/recruiter/assessment-rooms')}
          className="mt-4 px-4 py-2 bg-ai-600 text-white rounded-xl text-xs font-bold"
        >
          Back to Rooms
        </button>
      </div>
    );
  }

  const candidates = room.candidates || [];
  const completedCount = candidates.filter((c: any) => c.status === 'COMPLETED').length;

  return (
    <div className="space-y-8 pb-12">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/recruiter/assessment-rooms')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Assessment Rooms</span>
        </button>
      </div>

      {/* Room Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-ai-950 to-brand-950 p-6 sm:p-8 border border-slate-800 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ai-500/10 border border-ai-500/20 text-ai-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Assessment Room Code & Roster</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{room.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mt-2 font-medium">
              <span>{room.durationMinutes} mins duration</span>
              <span>•</span>
              <span>{room.totalQuestions} questions</span>
              <span>•</span>
              <span>Skills: {room.skills?.join(', ')}</span>
            </div>
          </div>

          {/* Room Code Card */}
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center shrink-0 min-w-[220px]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ai-200">Candidate Room Code</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-2xl font-black font-mono tracking-wider text-white">
                {room.roomCode}
              </span>
              <button
                type="button"
                onClick={copyCode}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Copy Room Code"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-300 mt-1">Share this code with candidates</p>
          </div>
        </div>
      </div>

      {/* Candidate Invitation Controls */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">Assessment Invitations</h3>
          <p className="text-xs text-slate-500">
            Invite starred or shortlisted candidates who applied for this position. Candidates will see this room in their assessment portal.
          </p>
          {inviteFeedback && (
            <p className="text-xs font-bold text-ai-600 mt-1">{inviteFeedback}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleInviteType('STARRED')}
            disabled={inviting}
            className="px-4 py-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>Invite Starred Candidates</span>
          </button>
          <button
            type="button"
            onClick={() => handleInviteType('SHORTLISTED')}
            disabled={inviting}
            className="px-4 py-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Invite Shortlisted Candidates</span>
          </button>
          <button
            type="button"
            onClick={openCandidateSelector}
            disabled={inviting}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Select Candidates</span>
          </button>
        </div>
      </div>

      {/* Live Candidate Roster Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Room Candidate Roster</h3>
            <p className="text-xs text-slate-500">Live monitoring of candidates who entered using this room code</p>
          </div>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl">
            {completedCount} / {candidates.length} Completed
          </span>
        </div>

        {candidates.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">No candidates have entered this assessment room yet.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Candidates can join from their dashboard by entering code <span className="font-mono font-bold text-slate-700">{room.roomCode}</span>.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <th className="py-3.5 px-6">Candidate</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Score</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                {candidates.map((c: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-900 block">{c.name}</span>
                      <span className="text-[11px] text-slate-400">{c.email}</span>
                    </td>
                    <td className="py-4 px-6">
                      <Badge
                        variant={c.status === 'COMPLETED' ? 'success' : c.status === 'IN_PROGRESS' ? 'warning' : 'default'}
                        size="sm"
                      >
                        {c.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-ai-700">
                      {c.score !== undefined ? `${c.score}%` : '--'}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      {c.sessionId ? (
                        <>
                          <button
                            onClick={() => navigate(`/candidate/assessment/${c.sessionId}/report`)}
                            className="px-3 py-1.5 rounded-xl bg-ai-50 text-ai-700 hover:bg-ai-100 font-bold transition-colors inline-flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Score Report</span>
                          </button>
                          <button
                            onClick={() => navigate(`/candidate/assessment/${c.sessionId}/proctoring`)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold transition-colors inline-flex items-center gap-1"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Proctoring</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Test pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Select Candidates Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Candidates to Assessment Room"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Select candidates who applied to this position to send assessment invitations.
          </p>

          {eligibleCandidates.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              No applicant candidates found for this position.
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {eligibleCandidates.map((cand: any) => {
                const isSelected = selectedCandidateIds.includes(cand.candidateId);
                return (
                  <label
                    key={cand.candidateId}
                    className={`flex items-center justify-between p-3 rounded-2xl border text-xs cursor-pointer transition-colors ${
                      isSelected ? 'border-ai-500 bg-ai-50/50' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCandidateIds([...selectedCandidateIds, cand.candidateId]);
                          } else {
                            setSelectedCandidateIds(selectedCandidateIds.filter((id) => id !== cand.candidateId));
                          }
                        }}
                        className="w-4 h-4 text-ai-600 rounded focus:ring-ai-500"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">{cand.candidateName}</span>
                        <span className="text-[11px] text-slate-400 block">{cand.candidateEmail}</span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Resume: {cand.resumeName} • TrustScore: {cand.trustScore != null ? `${cand.trustScore}%` : 'Pending'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {cand.isStarred && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold">
                          Starred
                        </span>
                      )}
                      {cand.isShortlisted && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold">
                          Shortlisted
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 uppercase">
                        {cand.invitationStatus}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              {selectedCandidateIds.length} candidate(s) selected
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendSelectedInvitations}
                disabled={selectedCandidateIds.length === 0 || inviting}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-ai-600 to-brand-600 text-white font-bold text-xs shadow-md disabled:opacity-50"
              >
                {inviting ? 'Sending...' : 'Send Assessment Invitation'}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

