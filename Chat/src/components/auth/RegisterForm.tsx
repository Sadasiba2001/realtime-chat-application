import React, { useState } from 'react';
import { User as UserIcon, AtSign, Mail, Phone, Lock, Loader2, MailCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth.service';

interface RegisterFormProps {
  onSuccess: () => void;
  onToggleView?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onToggleView }) => {
  const { register, isLoading, error, clearError } = useAuth();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Post-registration email verification state
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !email.trim() || !password.trim()) return;

    try {
      await register({
        name,
        username,
        email,
        phone_number: phone,
        password,
      });
      setRegisteredEmail(email.trim().toLowerCase());
    } catch {
      // Error handled by AuthContext
    }
  };

  const handleResend = async () => {
    if (!registeredEmail || isResending) return;
    setIsResending(true);
    setResendStatus(null);
    try {
      const res = await authService.resendVerification(registeredEmail);
      setResendStatus(res.message || 'Verification email resent successfully.');
    } catch {
      setResendStatus('Failed to resend email. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  // If registration is complete, show the verification guidance screen
  if (registeredEmail) {
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
            We've sent a verification link to <strong className="text-white">{registeredEmail}</strong>.
          </p>
          <p className="text-[11px] text-purple-300/70">
            Click the link in the email to activate your SB Chat account. The link expires in 10 minutes.
          </p>
        </div>

        {resendStatus && (
          <div className="p-2.5 text-xs text-purple-200 bg-purple-900/60 border border-purple-400/30 rounded-2xl">
            {resendStatus}
          </div>
        )}

        <div className="pt-2 space-y-3">
          <button
            type="button"
            onClick={onToggleView || onSuccess}
            className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 hover:scale-[1.02] text-white font-extrabold rounded-full transition-all duration-300 shadow-lg shadow-purple-600/40 text-xs tracking-wider uppercase cursor-pointer"
          >
            CONTINUE TO SIGN IN
          </button>

          <button
            type="button"
            disabled={isResending}
            onClick={handleResend}
            className="text-purple-300/70 hover:text-purple-200 text-xs flex items-center justify-center gap-1.5 mx-auto transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
            {isResending ? 'Resending...' : "Didn't receive email? Resend"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-white">
      {error && (
        <div className="p-2.5 text-xs text-rose-200 bg-rose-950/70 border border-rose-500/40 rounded-2xl flex items-center justify-between backdrop-blur-xs">
          <span>{error}</span>
          <button type="button" onClick={clearError} className="font-bold ml-2 text-rose-300 hover:text-white">
            ×
          </button>
        </div>
      )}

      {/* Name Input */}
      <div className="space-y-1">
        <label className="block text-[11px] sm:text-xs font-semibold text-purple-200/90 tracking-wide ml-1">
          Full Name
        </label>
        <div className="relative group">
          <UserIcon className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300/60 group-focus-within:text-purple-300 transition-colors" />
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="w-full pl-10 sm:pl-11 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-white/10 dark:bg-[#251545]/70 text-white placeholder-purple-300/40 rounded-full border border-purple-400/25 outline-hidden focus:scale-[1.01] focus:ring-2 focus:ring-purple-400/70 focus:border-purple-400 focus:shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-all duration-200 shadow-inner"
          />
        </div>
      </div>

      {/* Username Input */}
      <div className="space-y-1">
        <label className="block text-[11px] sm:text-xs font-semibold text-purple-200/90 tracking-wide ml-1">
          Username
        </label>
        <div className="relative group">
          <AtSign className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300/60 group-focus-within:text-purple-300 transition-colors" />
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="johndoe2026"
            className="w-full pl-10 sm:pl-11 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-white/10 dark:bg-[#251545]/70 text-white placeholder-purple-300/40 rounded-full border border-purple-400/25 outline-hidden focus:scale-[1.01] focus:ring-2 focus:ring-purple-400/70 focus:border-purple-400 focus:shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-all duration-200 shadow-inner"
          />
        </div>
      </div>

      {/* Email Input */}
      <div className="space-y-1">
        <label className="block text-[11px] sm:text-xs font-semibold text-purple-200/90 tracking-wide ml-1">
          Email Address
        </label>
        <div className="relative group">
          <Mail className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300/60 group-focus-within:text-purple-300 transition-colors" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            className="w-full pl-10 sm:pl-11 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-white/10 dark:bg-[#251545]/70 text-white placeholder-purple-300/40 rounded-full border border-purple-400/25 outline-hidden focus:scale-[1.01] focus:ring-2 focus:ring-purple-400/70 focus:border-purple-400 focus:shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-all duration-200 shadow-inner"
          />
        </div>
      </div>

      {/* Phone Input */}
      <div className="space-y-1">
        <label className="block text-[11px] sm:text-xs font-semibold text-purple-200/90 tracking-wide ml-1">
          Phone Number
        </label>
        <div className="relative group">
          <Phone className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300/60 group-focus-within:text-purple-300 transition-colors" />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 234 567 8900"
            className="w-full pl-10 sm:pl-11 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-white/10 dark:bg-[#251545]/70 text-white placeholder-purple-300/40 rounded-full border border-purple-400/25 outline-hidden focus:scale-[1.01] focus:ring-2 focus:ring-purple-400/70 focus:border-purple-400 focus:shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-all duration-200 shadow-inner"
          />
        </div>
      </div>

      {/* Password Input */}
      <div className="space-y-1">
        <label className="block text-[11px] sm:text-xs font-semibold text-purple-200/90 tracking-wide ml-1">
          Password
        </label>
        <div className="relative group">
          <Lock className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300/60 group-focus-within:text-purple-300 transition-colors" />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create password (min 6 characters)"
            className="w-full pl-11 pr-4 py-2.5 text-xs bg-white/10 dark:bg-[#251545]/70 text-white placeholder-purple-300/40 rounded-full border border-purple-400/25 outline-hidden focus:scale-[1.01] focus:ring-2 focus:ring-purple-400/70 focus:border-purple-400 focus:shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-all duration-200 shadow-inner"
          />
        </div>
      </div>

      {/* Submit Button (Pill Design) */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 sm:py-3 px-6 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 hover:scale-[1.02] hover:shadow-[0_0_35px_rgba(168,85,247,0.55)] active:scale-[0.98] disabled:opacity-50 text-white font-extrabold rounded-full transition-all duration-300 shadow-lg shadow-purple-600/40 flex items-center justify-center gap-2 text-xs sm:text-sm tracking-wider uppercase cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            'CREATE ACCOUNT'
          )}
        </button>
      </div>

      {/* Footer Toggle Link */}
      <div className="pt-2 text-center text-xs text-purple-200/70">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onToggleView}
          className="text-white font-bold underline underline-offset-4 hover:text-purple-200 transition-colors cursor-pointer ml-1"
        >
          Sign In
        </button>
      </div>
    </form>
  );
};
