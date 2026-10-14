import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  ShieldCheck,
  User,
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role')?.toUpperCase();

  const [role, setRole] = useState<UserRole>(
    roleParam === 'RECRUITER' ? 'RECRUITER' : 'CANDIDATE'
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (roleParam === 'RECRUITER') {
      setRole('RECRUITER');
    } else if (roleParam === 'CANDIDATE') {
      setRole('CANDIDATE');
    }
  }, [roleParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (role === 'RECRUITER' && !companyName.trim()) {
      setError('Company Name is required for recruiter registration.');
      return;
    }

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        companyName: role === 'RECRUITER' ? companyName.trim() : undefined,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || 'Registration failed. Please check your credentials.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="blueprint-grid min-h-screen p-4 sm:p-6 md:p-8 flex items-center justify-center relative overflow-hidden">
      {/* Background Glow Blobs */}
      <div className="fixed -top-24 left-1/4 w-96 h-96 bg-sky-200/50 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-teal-200/50 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Register Card */}
      <div className="max-w-5xl w-full rounded-3xl overflow-hidden border border-slate-200/90 white-card-shadow grid grid-cols-1 md:grid-cols-12 bg-white relative z-10 shadow-2xl">
        
        {/* LEFT SIDE: Brand Panel */}
        <div className="md:col-span-5 light-brand-panel p-6 sm:p-8 md:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200/80 relative">
          <div>
            {/* Top Back link & Logo */}
            <div className="mb-6">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0284C7] transition-colors mb-4"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>← Back to TrustHireAI</span>
              </Link>

              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-[#072969] via-[#0284c7] to-[#0D9488] flex items-center justify-center shadow-md text-white">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xl font-black tracking-tight leading-none">
                    <span className="text-[#0A192F]">TrustHire</span>
                    <span className="text-[#0284C7]">AI</span>
                  </div>
                  <div className="text-[10px] text-slate-600 font-semibold mt-0.5">
                    Verified Skills. Smarter Hiring.
                  </div>
                </div>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight text-[#0A192F]">
              Understand your resume.
              <span className="block bg-gradient-to-r from-[#072969] via-[#0284C7] to-[#0D9488] bg-clip-text text-transparent mt-1">
                Verify your credibility.
              </span>
            </h1>

            <p className="text-xs text-slate-600 mt-3 leading-relaxed font-medium">
              Join thousands of candidates and engineering teams using CredRAG to make hiring transparent, explainable, and evidence-based.
            </p>

            {/* Three Visual Pillars */}
            <div className="space-y-3 mt-6">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/80 backdrop-blur-md border border-white shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-[#0284C7] text-xs shrink-0 font-bold">
                  ⚡
                </div>
                <div>
                  <div className="text-xs font-extrabold text-[#0A192F]">CredRAG AI Verification</div>
                  <div className="text-[11px] text-slate-600 leading-tight mt-0.5">
                    Hybrid 768-D vector + lexical source hierarchy.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/80 backdrop-blur-md border border-white shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-700 text-xs shrink-0 font-bold">
                  🛡️
                </div>
                <div>
                  <div className="text-xs font-extrabold text-[#0A192F]">Proctored Exam Rooms (RAI-XXXXX)</div>
                  <div className="text-[11px] text-slate-600 leading-tight mt-0.5">
                    Server-authoritative timers & neutral integrity logs.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/80 backdrop-blur-md border border-white shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-[#072969] text-xs shrink-0 font-bold">
                  📊
                </div>
                <div>
                  <div className="text-xs font-extrabold text-[#0A192F]">Transparent TrustScore</div>
                  <div className="text-[11px] text-slate-600 leading-tight mt-0.5">
                    30% Evidence + 50% Assessment + 20% Consistency.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-5 mt-6 border-t border-slate-300/60 flex items-center justify-between text-[10px] font-semibold text-slate-500">
            <span>© 2026 TrustHireAI</span>
            <span className="text-teal-700 bg-teal-100/80 px-2.5 py-0.5 rounded-full border border-teal-200 font-bold">
              Zero Setup Friction
            </span>
          </div>
        </div>

        {/* RIGHT SIDE: Register Form */}
        <div className="md:col-span-7 p-6 sm:p-8 md:p-11 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto">
            <h2 className="text-2xl font-extrabold text-[#0A192F]">
              Create your account
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Choose your role to get started with verified skill assessment.
            </p>

            {/* Role Selector Tabs (Candidate / Recruiter) */}
            <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-slate-100 border border-slate-200/80 mt-5 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setRole('CANDIDATE');
                  setError(null);
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all ${
                  role === 'CANDIDATE'
                    ? 'bg-white text-[#0284C7] shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Candidate</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole('RECRUITER');
                  setError(null);
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all ${
                  role === 'RECRUITER'
                    ? 'bg-white text-teal-700 shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Recruiter</span>
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Registration Form with Empty Inputs and Clean Placeholders */}
            <form onSubmit={handleSubmit} className="space-y-3.5 mt-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-[#0284C7] focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-[#0284C7] focus:bg-white transition"
                  />
                </div>
              </div>

              {role === 'RECRUITER' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Company Name
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Enter your company name"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                      className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-[#0284C7] focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-[#0284C7] focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-[#072969] via-[#0284C7] to-[#0D9488] hover:brightness-105 text-white font-extrabold text-xs rounded-xl shadow-md shadow-sky-600/20 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Register as {role === 'RECRUITER' ? 'Recruiter' : 'Candidate'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-[#0284C7] hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
