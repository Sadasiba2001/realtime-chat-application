import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { authService } from '../../services/auth.service';

interface ResetPasswordFormProps {
  token: string;
  onSuccess: () => void;
  onBackToLogin: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  token,
  onSuccess,
  onBackToLogin,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isVerifyingToken, setIsVerifyingToken] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Validate token validity on mount
  useEffect(() => {
    let isMounted = true;

    const checkToken = async () => {
      if (!token || !token.trim()) {
        if (isMounted) {
          setTokenError('Password reset token is missing or invalid.');
          setIsVerifyingToken(false);
        }
        return;
      }

      try {
        await authService.verifyResetToken(token.trim());
        if (isMounted) {
          setIsVerifyingToken(false);
        }
      } catch (err: any) {
        if (isMounted) {
          const message =
            err?.response?.data?.message ||
            'This password reset link is invalid or has expired (10-minute limit).';
          setTokenError(message);
          setIsVerifyingToken(false);
        }
      }
    };

    checkToken();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!newPassword || newPassword.length < 6) {
      setSubmitError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSubmitError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await authService.resetPassword(token.trim(), newPassword, confirmPassword);
      setIsSuccess(true);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        'Failed to reset password. The link may have expired. Please request a new link.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Initial token verification loading state
  if (isVerifyingToken) {
    return (
      <div className="py-8 text-center text-white space-y-4 animate-fade-in">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
        <p className="text-xs text-purple-200/80 font-medium">Validating reset link...</p>
      </div>
    );
  }

  // 2. Invalid or expired token error state
  if (tokenError) {
    return (
      <div className="space-y-5 text-white text-center py-2 animate-fade-in">
        <div className="mx-auto w-14 h-14 bg-rose-600/30 border border-rose-400/40 rounded-full flex items-center justify-center text-rose-300 shadow-lg shadow-rose-600/30">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-rose-100 to-rose-200">
            Reset link expired or invalid
          </h3>
          <p className="text-xs text-rose-200/90 leading-relaxed px-2">
            {tokenError}
          </p>
          <p className="text-[11px] text-purple-300/70">
            Password reset links expire after 10 minutes for your account security.
          </p>
        </div>

        <div className="pt-2 space-y-2.5">
          <a
            href="/forgot-password"
            className="block w-full py-3 px-6 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 hover:scale-[1.02] text-white font-extrabold rounded-full transition-all duration-300 shadow-lg shadow-purple-600/40 text-xs tracking-wider uppercase cursor-pointer text-center"
          >
            REQUEST NEW RESET LINK
          </a>

          <button
            type="button"
            onClick={onBackToLogin}
            className="text-xs text-purple-200/80 hover:text-white flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer pt-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  // 3. Success state
  if (isSuccess) {
    return (
      <div className="space-y-5 text-white text-center py-2 animate-fade-in">
        <div className="mx-auto w-14 h-14 bg-emerald-600/30 border border-emerald-400/40 rounded-full flex items-center justify-center text-emerald-300 shadow-lg shadow-emerald-600/30">
          <CheckCircle2 className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-emerald-200">
            Password reset successful
          </h3>
          <p className="text-xs text-purple-200/90 leading-relaxed px-2">
            Your password has been updated successfully.
          </p>
          <p className="text-[11px] text-purple-300/70">
            You can now sign in to your SB Chat account using your new password.
          </p>
        </div>

        <div className="pt-3">
          <button
            type="button"
            onClick={onSuccess}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 hover:scale-[1.02] text-white font-extrabold rounded-full transition-all duration-300 shadow-lg shadow-purple-600/40 text-xs tracking-wider uppercase cursor-pointer"
          >
            CONTINUE TO SIGN IN
          </button>
        </div>
      </div>
    );
  }

  // 4. Password Reset Form
  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-white animate-fade-in">
      {submitError && (
        <div className="p-3 text-xs text-rose-200 bg-rose-950/70 border border-rose-500/40 rounded-2xl flex items-center justify-between backdrop-blur-xs">
          <span>{submitError}</span>
          <button
            type="button"
            onClick={() => setSubmitError(null)}
            className="font-bold ml-2 text-rose-300 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* New Password Input */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-purple-200/90 tracking-wide ml-1">
          New Password
        </label>
        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300/60 group-focus-within:text-purple-300 transition-colors" />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password (min 6 characters)"
            className="w-full pl-11 pr-11 py-3 text-xs bg-white/10 dark:bg-[#251545]/70 text-white placeholder-purple-300/40 rounded-full border border-purple-400/25 outline-hidden focus:scale-[1.01] focus:ring-2 focus:ring-purple-400/70 focus:border-purple-400 focus:shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-all duration-200 shadow-inner"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-300/60 hover:text-purple-200 transition-colors cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Confirm Password Input */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-purple-200/90 tracking-wide ml-1">
          Confirm New Password
        </label>
        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300/60 group-focus-within:text-purple-300 transition-colors" />
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            className="w-full pl-11 pr-11 py-3 text-xs bg-white/10 dark:bg-[#251545]/70 text-white placeholder-purple-300/40 rounded-full border border-purple-400/25 outline-hidden focus:scale-[1.01] focus:ring-2 focus:ring-purple-400/70 focus:border-purple-400 focus:shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-all duration-200 shadow-inner"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-300/60 hover:text-purple-200 transition-colors cursor-pointer"
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 hover:scale-[1.02] hover:shadow-[0_0_35px_rgba(168,85,247,0.55)] active:scale-[0.98] disabled:opacity-50 text-white font-extrabold rounded-full transition-all duration-300 shadow-lg shadow-purple-600/40 flex items-center justify-center gap-2 text-xs tracking-wider uppercase cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              RESETTING PASSWORD...
            </>
          ) : (
            'RESET PASSWORD'
          )}
        </button>
      </div>

      <div className="pt-2 text-center">
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
