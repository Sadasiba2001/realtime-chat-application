import React, { useState } from 'react';
import { Mail, Loader2, MailCheck, ArrowLeft } from 'lucide-react';
import { authService } from '../../services/auth.service';

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authService.forgotPassword(email.trim().toLowerCase());
      setIsSubmitted(true);
    } catch (err: any) {
      // Return safe generic failure message without leaking technical internals
      const message = err?.response?.data?.message || 'Failed to request password reset. Please try again later.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="space-y-5 text-white text-center py-2 animate-fade-in">
        <div className="mx-auto w-14 h-14 bg-purple-600/30 border border-purple-400/40 rounded-full flex items-center justify-center text-purple-300 shadow-lg shadow-purple-600/30">
          <MailCheck className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-purple-200">
            Check your email
          </h3>
          <p className="text-xs text-purple-200/90 leading-relaxed px-2">
            If an account exists for <strong className="text-white">{email}</strong>, we've sent a password reset link.
          </p>
          <p className="text-[11px] text-purple-300/70">
            The link expires in 10 minutes. If you did not receive the email, please check your spam folder.
          </p>
        </div>

        <div className="pt-3">
          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 hover:scale-[1.02] text-white font-extrabold rounded-full transition-all duration-300 shadow-lg shadow-purple-600/40 text-xs tracking-wider uppercase cursor-pointer"
          >
            BACK TO SIGN IN
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-white animate-fade-in">
      {error && (
        <div className="p-3 text-xs text-rose-200 bg-rose-950/70 border border-rose-500/40 rounded-2xl flex items-center justify-between backdrop-blur-xs">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="font-bold ml-2 text-rose-300 hover:text-white">
            ×
          </button>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-purple-200/90 tracking-wide ml-1">
          Email Address
        </label>
        <div className="relative group">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300/60 group-focus-within:text-purple-300 transition-colors" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your registered email"
            className="w-full pl-11 pr-4 py-3 text-xs bg-white/10 dark:bg-[#251545]/70 text-white placeholder-purple-300/40 rounded-full border border-purple-400/25 outline-hidden focus:scale-[1.01] focus:ring-2 focus:ring-purple-400/70 focus:border-purple-400 focus:shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-all duration-200 shadow-inner"
          />
        </div>
        <p className="text-[11px] text-purple-300/60 ml-2">
          We'll send a single-use 10-minute password reset link to this address.
        </p>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 hover:scale-[1.02] hover:shadow-[0_0_35px_rgba(168,85,247,0.55)] active:scale-[0.98] disabled:opacity-50 text-white font-extrabold rounded-full transition-all duration-300 shadow-lg shadow-purple-600/40 flex items-center justify-center gap-2 text-xs tracking-wider uppercase cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              SENDING RESET LINK...
            </>
          ) : (
            'SEND RESET LINK'
          )}
        </button>
      </div>

      <div className="pt-3 text-center">
        <button
          type="button"
          onClick={onBackToLogin}
          className="text-xs text-purple-200/80 hover:text-white flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </button>
      </div>
    </form>
  );
};
