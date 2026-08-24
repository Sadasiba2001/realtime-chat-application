import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, LogOut, MessageSquare } from 'lucide-react';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { useAuth } from '../context/AuthContext';
import appLogo from '../assets/photo_6073207430587290090_y-removebg-preview.png';

export const AuthPage: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/chat');
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-100 dark:bg-[#090d16] p-3 select-none">
      {/* Banner if already authenticated */}
      {isAuthenticated && (
        <div className="w-full max-w-md mb-2 p-2 px-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-600 dark:text-amber-400 flex items-center justify-between shadow-xs">
          <span>
            Logged in as <b>{user?.name || 'User'}</b>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/chat')}
              className="px-2 py-1 bg-sky-600 text-white rounded-lg font-semibold flex items-center gap-1 hover:bg-sky-700 text-[11px]"
            >
              <MessageSquare className="w-3 h-3" /> Go to Chat
            </button>
            <button
              onClick={() => logout()}
              className="px-2 py-1 bg-rose-600 text-white rounded-lg font-semibold flex items-center gap-1 hover:bg-rose-700 text-[11px]"
            >
              <LogOut className="w-3 h-3" /> Sign Out
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-md bg-white dark:bg-[#0f172a] rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 animate-fade-in max-h-[92vh] flex flex-col">
        {/* Compact Top Header Card */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 px-6 py-3 text-white text-center relative flex-shrink-0 overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="inline-flex items-center justify-center transition-transform hover:scale-105">
            <img
              src={appLogo}
              alt="Logo"
              className="w-36 h-36 -my-8 object-contain drop-shadow-lg scale-125"
            />
          </div>
          <h1 className="text-lg font-bold tracking-tight">SB Chat Web Pro</h1>
          <p className="text-[11px] text-sky-100 mt-0.5 max-w-xs mx-auto">
            Real-time scalable messaging system
          </p>
        </div>

        {/* Tab Selector & Form */}
        <div className="p-5 overflow-y-auto flex-1">
          <div className="flex bg-gray-100 dark:bg-[#1e293b] p-1 rounded-2xl mb-4 text-xs font-semibold">
            <button
              onClick={() => setIsLoginView(true)}
              className={`flex-1 py-2 rounded-xl transition-all ${isLoginView
                ? 'bg-white dark:bg-[#0f172a] text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLoginView(false)}
              className={`flex-1 py-2 rounded-xl transition-all ${!isLoginView
                ? 'bg-white dark:bg-[#0f172a] text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          {isLoginView ? (
            <LoginForm onSuccess={handleSuccess} />
          ) : (
            <RegisterForm onSuccess={handleSuccess} />
          )}

          {/* Demo Hint Footer */}
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/80 text-center">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-500" /> Secure cookie-based session verification active
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
