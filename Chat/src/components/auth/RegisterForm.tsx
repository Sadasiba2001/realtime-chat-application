import React, { useState } from 'react';
import { User as UserIcon, AtSign, Mail, Phone, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface RegisterFormProps {
  onSuccess: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
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
    <form onSubmit={handleSubmit} className="space-y-2">
      {error && (
        <div className="p-2 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={clearError} className="font-bold ml-2">×</button>
        </div>
      )}

      {/* Name Input */}
      <div>
        <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
          Full Name
        </label>
        <div className="relative">
          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Barsharani Barik"
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-[#201a30] text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-gray-700/60 outline-hidden focus:ring-2 focus:ring-purple-500/50 transition-all"
          />
        </div>
      </div>

      {/* Username Input */}
      <div>
        <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
          Username
        </label>
        <div className="relative">
          <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Barsha2001"
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-[#201a30] text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-gray-700/60 outline-hidden focus:ring-2 focus:ring-purple-500/50 transition-all"
          />
        </div>
      </div>

      {/* Email Input */}
      <div>
        <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="barsharni@gmail.com"
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-[#201a30] text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-gray-700/60 outline-hidden focus:ring-2 focus:ring-purple-500/50 transition-all"
          />
        </div>
      </div>

      {/* Phone Input */}
      <div>
        <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
          Phone Number
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+919876543210"
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-[#201a30] text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-gray-700/60 outline-hidden focus:ring-2 focus:ring-purple-500/50 transition-all"
          />
        </div>
      </div>

      {/* Password Input */}
      <div>
        <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create password"
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-[#201a30] text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-gray-700/60 outline-hidden focus:ring-2 focus:ring-purple-500/50 transition-all"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 text-xs mt-1.5 cursor-pointer"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            Create Account <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
};
