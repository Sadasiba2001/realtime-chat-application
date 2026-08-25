import React, { useState } from 'react';
import { Mail, Lock, Loader2, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LoginFormProps {
  onSuccess: () => void;
  onToggleView?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onToggleView }) => {
  const { login, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotMsg, setForgotMsg] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    try {
      await login({ email, password });
      onSuccess();
    } catch {
      // Error handled by AuthContext
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-white">
      {error && (
        <div className="p-3 text-xs text-rose-200 bg-rose-950/70 border border-rose-500/40 rounded-2xl flex items-center justify-between backdrop-blur-xs">
          <span>{error}</span>
          <button type="button" onClick={clearError} className="font-bold ml-2 text-rose-300 hover:text-white">
            ×
          </button>
        </div>
      )}

      {forgotMsg && (
        <div className="p-2.5 text-xs text-purple-200 bg-purple-900/60 border border-purple-400/30 rounded-2xl flex items-center justify-between">
          <span>Password reset link sent to your registered email!</span>
          <button type="button" onClick={() => setForgotMsg(false)} className="font-bold ml-2 text-purple-300">
            ×
          </button>
        </div>
      )}

      {/* Username / Email Input */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-purple-200/90 tracking-wide ml-1">
          Username or Email
        </label>
        <div className="relative group">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300/60 group-focus-within:text-purple-300 transition-colors" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email or username"
            className="w-full pl-11 pr-4 py-3 text-xs bg-white/10 dark:bg-[#251545]/70 text-white placeholder-purple-300/40 rounded-full border border-purple-400/25 outline-hidden focus:scale-[1.01] focus:ring-2 focus:ring-purple-400/70 focus:border-purple-400 focus:shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-all duration-200 shadow-inner"
          />
        </div>
      </div>

      {/* Password Input */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-purple-200/90 tracking-wide ml-1">
          Password
        </label>
        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300/60 group-focus-within:text-purple-300 transition-colors" />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full pl-11 pr-4 py-3 text-xs bg-white/10 dark:bg-[#251545]/70 text-white placeholder-purple-300/40 rounded-full border border-purple-400/25 outline-hidden focus:scale-[1.01] focus:ring-2 focus:ring-purple-400/70 focus:border-purple-400 focus:shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-all duration-200 shadow-inner"
          />
        </div>
      </div>

      {/* Remember Me Checkbox */}
      <div className="flex items-center justify-between text-xs pt-1 px-1">
        <label className="flex items-center gap-2 text-purple-200/80 cursor-pointer select-none group">
          <button
            type="button"
            onClick={() => setRememberMe(!rememberMe)}
            className={`w-4 h-4 rounded-xs border flex items-center justify-center transition-all duration-200 group-hover:scale-110 active:scale-90 ${
              rememberMe
                ? 'bg-purple-600 border-purple-400 text-white shadow-xs'
                : 'border-purple-400/40 bg-white/5 group-hover:border-purple-400/70'
            }`}
          >
            {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
          </button>
          <span className="group-hover:text-purple-100 transition-colors">Remember me</span>
        </label>

        <button
          type="button"
          onClick={() => setForgotMsg(true)}
          className="text-purple-300/70 hover:text-purple-200 hover:underline transition-all text-[11px]"
        >
          Forgot Password?
        </button>
      </div>

      {/* Submit Button (Pill Design) */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 hover:scale-[1.02] hover:shadow-[0_0_35px_rgba(168,85,247,0.55)] active:scale-[0.98] disabled:opacity-50 text-white font-extrabold rounded-full transition-all duration-300 shadow-lg shadow-purple-600/40 flex items-center justify-center gap-2 text-xs tracking-wider uppercase cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            'SIGN IN'
          )}
        </button>
      </div>

      {/* Footer Toggle Link */}
      <div className="pt-4 text-center text-xs text-purple-200/70">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={onToggleView}
          className="text-white font-bold underline underline-offset-4 hover:text-purple-200 transition-colors cursor-pointer ml-1"
        >
          Sign Up
        </button>
      </div>
    </form>
  );
};

