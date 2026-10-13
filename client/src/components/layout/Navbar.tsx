import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, LogOut, User as UserIcon, Menu } from 'lucide-react';
import { Badge } from '../common/Badge';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/80 px-4 lg:px-8 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-tr from-brand-600 to-ai-600 rounded-lg text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-black text-xl text-slate-900 tracking-tight">
            Resume<span className="text-ai-600">AI</span>
          </span>
          <Badge variant="ai" size="sm">
            V1.0
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-bold text-slate-900 leading-tight">
                {user.name}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {user.role === 'RECRUITER' ? user.companyName || 'Recruiter' : 'Candidate'}
              </span>
            </div>

            <div className="w-9 h-9 rounded-full bg-ai-100 border border-ai-200 flex items-center justify-center text-ai-700 font-bold text-sm">
              {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
