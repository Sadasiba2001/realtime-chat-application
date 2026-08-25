import React, { useState } from 'react';
import { User as UserIcon, AtSign, Mail, Phone, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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
      onSuccess();
    } catch {
      // Error handled by AuthContext
    }
  };

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
        <label className="block text-[11px] font-semibold text-purple-200/90 tracking-wide ml-1">
          Full Name
        </label>
        <div className="relative">
          <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300/60" />
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="w-full pl-11 pr-4 py-2.5 text-xs bg-white/10 dark:bg-[#251545]/70 text-white placeholder-purple-300/40 rounded-full border border-purple-400/25 outline-hidden focus:ring-2 focus:ring-purple-400/60 focus:border-purple-400 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Username Input */}
      <div className="space-y-1">
        <label className="block text-[11px] font-semibold text-purple-200/90 tracking-wide ml-1">
          Username
        </label>
        <div className="relative">
          <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300/60" />
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="johndoe2026"
            className="w-full pl-11 pr-4 py-2.5 text-xs bg-white/10 dark:bg-[#251545]/70 text-white placeholder-purple-300/40 rounded-full border border-purple-400/25 outline-hidden focus:ring-2 focus:ring-purple-400/60 focus:border-purple-400 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Email Input */}
      <div className="space-y-1">
        <label className="block text-[11px] font-semibold text-purple-200/90 tracking-wide ml-1">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300/60" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            className="w-full pl-11 pr-4 py-2.5 text-xs bg-white/10 dark:bg-[#251545]/70 text-white placeholder-purple-300/40 rounded-full border border-purple-400/25 outline-hidden focus:ring-2 focus:ring-purple-400/60 focus:border-purple-400 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Phone Input */}
      <div className="space-y-1">
        <label className="block text-[11px] font-semibold text-purple-200/90 tracking-wide ml-1">
          Phone Number
        </label>
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300/60" />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 234 567 8900"
            className="w-full pl-11 pr-4 py-2.5 text-xs bg-white/10 dark:bg-[#251545]/70 text-white placeholder-purple-300/40 rounded-full border border-purple-400/25 outline-hidden focus:ring-2 focus:ring-purple-400/60 focus:border-purple-400 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Password Input */}
      <div className="space-y-1">
        <label className="block text-[11px] font-semibold text-purple-200/90 tracking-wide ml-1">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300/60" />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create password"
            className="w-full pl-11 pr-4 py-2.5 text-xs bg-white/10 dark:bg-[#251545]/70 text-white placeholder-purple-300/40 rounded-full border border-purple-400/25 outline-hidden focus:ring-2 focus:ring-purple-400/60 focus:border-purple-400 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Submit Button (Pill Design) */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-[0.99] disabled:opacity-50 text-white font-extrabold rounded-full transition-all shadow-lg shadow-purple-600/40 flex items-center justify-center gap-2 text-xs tracking-wider uppercase cursor-pointer"
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

