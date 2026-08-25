import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, LogOut, MessageSquare } from 'lucide-react';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { useAuth } from '../context/AuthContext';
import appLogo from '../assets/logo.png';

export const AuthPage: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/chat');
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-100 dark:bg-[#0f0c1b] p-3 select-none">
      {/* Banner if already authenticated */}
      {isAuthenticated && (
        <div className="w-full max-w-md mb-2 p-2 px-3 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-xs text-purple-600 dark:text-purple-400 flex items-center justify-between shadow-xs">
          <span>
            Logged in as <b>{user?.name || 'User'}</b>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/chat')}
              className="px-2 py-1 bg-purple-600 text-white rounded-lg font-semibold flex items-center gap-1 hover:bg-purple-700 text-[11px]"
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

      <div className="w-full max-w-md bg-white dark:bg-[#171324] rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-purple-900/20 animate-fade-in max-h-[92vh] flex flex-col">
        <div className="bg-gradient-to-br from-[#1a1528] via-[#3a1b4e] to-[#8b28a2] px-6 py-4 text-white text-center relative flex-shrink-0 overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="inline-flex items-center justify-center transition-transform hover:scale-105 mb-1">
            <img
              src={appLogo}
              alt="SB Chat Logo"
              className="h-14 md:h-16 w-auto object-contain drop-shadow-md"
            />
          </div>
          <h1 className="text-lg font-bold tracking-tight">SB Chat Web Pro</h1>
          <p className="text-[11px] text-purple-100/90 mt-0.5 max-w-xs mx-auto">
            Real-time scalable messaging system
          </p>
        </div>

        {/* Tab Selector & Form */}
        <div className="p-5 overflow-y-auto flex-1">
          <div className="flex bg-gray-100 dark:bg-[#201a30] p-1 rounded-2xl mb-4 text-xs font-semibold">
            <button
              onClick={() => setIsLoginView(true)}
              className={`flex-1 py-2 rounded-xl transition-all ${isLoginView
                ? 'bg-white dark:bg-[#171324] text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLoginView(false)}
              className={`flex-1 py-2 rounded-xl transition-all ${!isLoginView
                ? 'bg-white dark:bg-[#171324] text-purple-600 dark:text-purple-400 shadow-xs'
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
              <Sparkles className="w-3 h-3 text-purple-500" /> Secure cookie-based session verification active
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
