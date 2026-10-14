import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  UploadCloud,
  Briefcase,
  PlusCircle,
  Users,
  UserCheck,
  Star,
  Sparkles,
  Search,
  CheckCircle,
  ShieldCheck,
  Award,
  Video,
  Database,
  Sliders,
  Activity,
  FolderGit2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const role = user?.role || 'CANDIDATE';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 left-0 z-40 w-64 h-full bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 overflow-y-auto">
          {/* Logo Branding */}
          <div className="hidden lg:flex items-center gap-2.5 mb-6 px-2">
            <div className="p-2 bg-gradient-to-tr from-[#072969] to-[#0284c7] rounded-xl text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-slate-900 leading-tight">
                TrustHire<span className="text-[#0284C7]">AI</span>
              </h1>
              <p className="text-[10px] uppercase font-bold tracking-wider text-teal-600">
                Verified Skills
              </p>
            </div>
          </div>

          {/* ADMIN SIDEBAR NAVIGATION */}
          {role === 'ADMIN' && (
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
                  Administration
                </p>
                <div className="space-y-0.5">
                  <NavLink
                    to="/admin/dashboard"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-xs transition-all ${
                        isActive
                          ? 'bg-ai-50 text-ai-700 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`
                    }
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Admin Overview</span>
                  </NavLink>

                  <NavLink
                    to="/admin/users"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-xs transition-all ${
                        isActive
                          ? 'bg-ai-50 text-ai-700 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`
                    }
                  >
                    <Users className="w-4 h-4" />
                    <span>User Management</span>
                  </NavLink>

                  <NavLink
                    to="/admin/jobs"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-xs transition-all ${
                        isActive
                          ? 'bg-ai-50 text-ai-700 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`
                    }
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Job Management</span>
                  </NavLink>

                  <NavLink
                    to="/admin/resumes"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-xs transition-all ${
                        isActive
                          ? 'bg-ai-50 text-ai-700 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`
                    }
                  >
                    <FileText className="w-4 h-4" />
                    <span>Resumes Repository</span>
                  </NavLink>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
                  Assessment & Proctoring
                </p>
                <div className="space-y-0.5">
                  <NavLink
                    to="/admin/assessments"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-xs transition-all ${
                        isActive
                          ? 'bg-ai-50 text-ai-700 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`
                    }
                  >
                    <Award className="w-4 h-4" />
                    <span>Assessments & Rooms</span>
                  </NavLink>

                  <NavLink
                    to="/admin/proctoring"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-xs transition-all ${
                        isActive
                          ? 'bg-ai-50 text-ai-700 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`
                    }
                  >
                    <Video className="w-4 h-4" />
                    <span>Proctoring Monitor</span>
                  </NavLink>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
                  Intelligence & Logs
                </p>
                <div className="space-y-0.5">
                  <NavLink
                    to="/admin/vector-db"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-xs transition-all ${
                        isActive
                          ? 'bg-ai-50 text-ai-700 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`
                    }
                  >
                    <Database className="w-4 h-4" />
                    <span>Vector DB Status</span>
                  </NavLink>

                  <NavLink
                    to="/admin/ai-usage"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-xs transition-all ${
                        isActive
                          ? 'bg-ai-50 text-ai-700 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`
                    }
                  >
                    <Activity className="w-4 h-4" />
                    <span>AI Usage & Quota</span>
                  </NavLink>

                  <NavLink
                    to="/admin/audit-logs"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-xs transition-all ${
                        isActive
                          ? 'bg-ai-50 text-ai-700 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`
                    }
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Audit Logs</span>
                  </NavLink>
                </div>
              </div>
            </div>
          )}

          {/* RECRUITER SIDEBAR NAVIGATION */}
          {role === 'RECRUITER' && (
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
                  Overview
                </p>
                <NavLink
                  to="/dashboard"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-xs transition-all ${
                      isActive
                        ? 'bg-ai-50 text-ai-700 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`
                  }
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </NavLink>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
                  Job Management
                </p>
                <div className="space-y-0.5">
                  <NavLink
                    to="/recruiter/jobs"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-xs transition-all ${
                        isActive
                          ? 'bg-ai-50 text-ai-700 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`
                    }
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Job Descriptions</span>
                  </NavLink>

                  <NavLink
                    to="/recruiter/jobs/create"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-xs transition-all ${
                        isActive
                          ? 'bg-ai-50 text-ai-700 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`
                    }
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Create Job</span>
                  </NavLink>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
                  Talent Matching & Verification
                </p>
                <div className="space-y-0.5">
                  <NavLink
                    to="/recruiter/candidates"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-xs transition-all ${
                        isActive
                          ? 'bg-ai-50 text-ai-700 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`
                    }
                  >
                    <Search className="w-4 h-4" />
                    <span>Semantic Matching</span>
                  </NavLink>

                  <NavLink
                    to="/recruiter/applicants"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-xs transition-all ${
                        isActive
                          ? 'bg-ai-50 text-ai-700 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`
                    }
                  >
                    <Users className="w-4 h-4" />
                    <span>Applicants</span>
                  </NavLink>

                  <NavLink
                    to="/recruiter/starred"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-xs transition-all ${
                        isActive
                          ? 'bg-ai-50 text-ai-700 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`
                    }
                  >
                    <Star className="w-4 h-4 text-amber-500" />
                    <span>Starred Candidates</span>
                  </NavLink>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
                  Proctored Assessments
                </p>
                <div className="space-y-0.5">
                  <NavLink
                    to="/recruiter/assessment-rooms"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-xs transition-all ${
                        isActive
                          ? 'bg-ai-50 text-ai-700 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`
                    }
                  >
                    <Award className="w-4 h-4" />
                    <span>Assessment Rooms</span>
                  </NavLink>

                  <NavLink
                    to="/recruiter/reports"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-xs transition-all ${
                        isActive
                          ? 'bg-ai-50 text-ai-700 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`
                    }
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verification Reports</span>
                  </NavLink>
                </div>
              </div>
            </div>
          )}

          {/* CANDIDATE SIDEBAR NAVIGATION */}
          {role === 'CANDIDATE' && (
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
                  Overview
                </p>
                <NavLink
                  to="/dashboard"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-xs transition-all ${
                      isActive
                        ? 'bg-ai-50 text-ai-700 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`
                  }
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </NavLink>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
                  Resumes & Evidence
                </p>
                <div className="space-y-0.5">
                  <NavLink
                    to="/upload"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-xs transition-all ${
                        isActive
                          ? 'bg-ai-50 text-ai-700 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`
                    }
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload Resume</span>
                  </NavLink>

                  <NavLink
                    to="/resumes"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-xs transition-all ${
                        isActive
                          ? 'bg-ai-50 text-ai-700 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`
                    }
                  >
                    <FileText className="w-4 h-4" />
                    <span>My Resumes</span>
                  </NavLink>

                  <NavLink
                    to="/candidate/skill-verification"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-xs transition-all ${
                        isActive
                          ? 'bg-ai-50 text-ai-700 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`
                    }
                  >
                    <FolderGit2 className="w-4 h-4 text-brand-600" />
                    <span>Skill Evidence Map</span>
                  </NavLink>

                  <NavLink
                    to="/candidate/verification-report"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-xs transition-all ${
                        isActive
                          ? 'bg-ai-50 text-ai-700 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`
                    }
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>TrustScore Report</span>
                  </NavLink>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
                  Assessments
                </p>
                <div className="space-y-0.5">
                  <NavLink
                    to="/candidate/assessments"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-xs transition-all ${
                        isActive
                          ? 'bg-ai-50 text-ai-700 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`
                    }
                  >
                    <Award className="w-4 h-4 text-ai-600" />
                    <span>Proctored Assessments</span>
                  </NavLink>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
                  Job Opportunities
                </p>
                <div className="space-y-0.5">
                  <NavLink
                    to="/jobs"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-xs transition-all ${
                        isActive
                          ? 'bg-ai-50 text-ai-700 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`
                    }
                  >
                    <Search className="w-4 h-4" />
                    <span>Browse Jobs</span>
                  </NavLink>

                  <NavLink
                    to="/my-applications"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-xs transition-all ${
                        isActive
                          ? 'bg-ai-50 text-ai-700 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`
                    }
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>My Applications</span>
                  </NavLink>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Account Footer Badge */}
        <div className="p-4 border-t border-slate-100 m-3 bg-slate-50 rounded-2xl border border-slate-200/60">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                role === 'ADMIN'
                  ? 'bg-rose-100 text-rose-700'
                  : role === 'RECRUITER'
                  ? 'bg-brand-100 text-brand-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {role === 'ADMIN' ? 'ADM' : role === 'RECRUITER' ? 'REC' : 'CAN'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-900 truncate">
                {role === 'ADMIN' ? 'Admin Portal' : role === 'RECRUITER' ? 'Recruiter Account' : 'Candidate Account'}
              </p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
