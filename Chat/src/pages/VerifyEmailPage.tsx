import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, Loader2, CheckCircle2, ArrowLeft, RefreshCw, Mail } from 'lucide-react';
import { authService } from '../services/auth.service';
import appLogo from '../assets/logo.png';

export const VerifyEmailPage: React.FC = () => {
  const { token: urlParamToken } = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = urlParamToken || searchParams.get('token') || '';

  const [status, setStatus] = useState<'loading' | 'success' | 'expired' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Verifying your email address...');
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendFeedback, setResendFeedback] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const performVerification = async () => {
      if (!token || !token.trim()) {
        if (isMounted) {
          setStatus('error');
          setMessage('Verification token is missing from the link.');
        }
        return;
      }

      try {
        const res = await authService.verifyEmail(token.trim());
        if (isMounted) {
          setStatus('success');
          setMessage(res.message || 'Your SB Chat email has been verified successfully.');
        }
      } catch (err: any) {
        if (isMounted) {
          const errMsg =
            err?.response?.data?.message ||
            'This verification link is invalid, has expired, or has already been used.';
          const isExpired = errMsg.toLowerCase().includes('expired');
          setStatus(isExpired ? 'expired' : 'error');
          setMessage(errMsg);
        }
      }
    };

    performVerification();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim() || isResending) return;

    setIsResending(true);
    setResendFeedback(null);

    try {
      const res = await authService.resendVerification(resendEmail.trim().toLowerCase());
      setResendFeedback(res.message || 'If an unverified account exists, a new verification link has been sent.');
    } catch {
      setResendFeedback('Failed to resend verification link. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-center bg-[#0d061f] overflow-hidden select-none px-4">
      {/* Background Gradient */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0a0418] via-[#1d073b] to-[#46146e]">
        <div className="absolute -top-24 -left-24 w-[600px] h-[600px] bg-purple-600/25 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-[700px] h-[700px] bg-indigo-600/25 rounded-full blur-[180px] pointer-events-none" />
      </div>

      <div className="z-10 w-full max-w-md animate-fade-in">
        {/* Top Logo */}
        <div className="flex justify-center mb-6">
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/15 shadow-xl hover:border-purple-400/40 transition-all cursor-pointer"
          >
            <img src={appLogo} alt="SB Chat Logo" className="h-8 w-auto object-contain" />
            <span className="text-sm font-extrabold tracking-widest text-purple-100">
              SB CHAT PRO
            </span>
          </div>
        </div>

        {/* Card Container */}
        <div className="w-full bg-[#180e2e]/85 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-purple-500/30 relative overflow-hidden transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500" />

          {/* 1. Loading State */}
          {status === 'loading' && (
            <div className="py-8 text-center text-white space-y-4">
              <Loader2 className="w-10 h-10 text-purple-400 animate-spin mx-auto" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Verifying your email</h3>
                <p className="text-xs text-purple-200/70">Please wait a moment while we verify your account...</p>
              </div>
            </div>
          )}

          {/* 2. Success State */}
          {status === 'success' && (
            <div className="space-y-5 text-white text-center py-2 animate-fade-in">
              <div className="mx-auto w-14 h-14 bg-emerald-600/30 border border-emerald-400/40 rounded-full flex items-center justify-center text-emerald-300 shadow-lg shadow-emerald-600/30">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-emerald-200">
                  Email verified
                </h3>
                <p className="text-xs text-purple-200/90 leading-relaxed px-2">
                  {message}
                </p>
                <p className="text-[11px] text-purple-300/70">
                  You can now sign in to your SB Chat account.
                </p>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => navigate('/auth')}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 hover:scale-[1.02] text-white font-extrabold rounded-full transition-all duration-300 shadow-lg shadow-purple-600/40 text-xs tracking-wider uppercase cursor-pointer"
                >
                  CONTINUE TO SIGN IN
                </button>
              </div>
            </div>
          )}

          {/* 3. Expired or Invalid Error State */}
          {(status === 'expired' || status === 'error') && (
            <div className="space-y-5 text-white text-center py-2 animate-fade-in">
              <div className="mx-auto w-14 h-14 bg-rose-600/30 border border-rose-400/40 rounded-full flex items-center justify-center text-rose-300 shadow-lg shadow-rose-600/30">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-rose-100 to-rose-200">
                  {status === 'expired' ? 'Verification link expired' : 'Invalid verification link'}
                </h3>
                <p className="text-xs text-rose-200/90 leading-relaxed px-2">
                  {message}
                </p>
                <p className="text-[11px] text-purple-300/70">
                  Verification links are single-use and expire after 10 minutes.
                </p>
              </div>

              {/* Resend Form */}
              <div className="pt-2 border-t border-purple-500/20 text-left">
                <p className="text-xs font-semibold text-purple-200 mb-2 text-center">
                  Request a new verification link:
                </p>

                <form onSubmit={handleResend} className="space-y-3">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300/60 group-focus-within:text-purple-300 transition-colors" />
                    <input
                      type="email"
                      required
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="Enter your registered email"
                      className="w-full pl-11 pr-4 py-2.5 text-xs bg-white/10 dark:bg-[#251545]/70 text-white placeholder-purple-300/40 rounded-full border border-purple-400/25 outline-hidden focus:scale-[1.01] focus:ring-2 focus:ring-purple-400/70 focus:border-purple-400 transition-all duration-200 shadow-inner"
                    />
                  </div>

                  {resendFeedback && (
                    <div className="p-2.5 text-xs text-purple-200 bg-purple-900/60 border border-purple-400/30 rounded-2xl text-center">
                      {resendFeedback}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isResending}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-full transition-all text-xs tracking-wider uppercase cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                    {isResending ? 'SENDING...' : 'RESEND VERIFICATION LINK'}
                  </button>
                </form>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => navigate('/auth')}
                  className="text-xs text-purple-200/80 hover:text-white flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
