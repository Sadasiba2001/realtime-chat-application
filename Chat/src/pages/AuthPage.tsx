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
    <div className="min-h-screen w-full relative flex flex-col items-center justify-center bg-[#110826] overflow-hidden select-none">
      {/* Surreal Atmospheric Landscape Background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0c051d] via-[#210943] to-[#4c1678]">
        {/* Glowing Nebulae / Radial Gradients */}
        <div className="absolute -top-24 -left-24 w-[600px] h-[600px] bg-purple-600/30 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-fuchsia-600/20 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-[700px] h-[700px] bg-indigo-600/25 rounded-full blur-[180px] pointer-events-none" />

        {/* Floating Futuristic Vector Rings */}
        <div className="absolute top-8 left-12 w-24 h-24 border-4 border-purple-400/30 rounded-full pointer-events-none animate-pulse" />
        <div className="absolute bottom-12 left-1/3 w-56 h-56 border-8 border-purple-400/20 rounded-full pointer-events-none" />
        <div className="absolute top-16 right-1/4 w-32 h-32 border-2 border-indigo-400/25 rounded-full pointer-events-none" />

        {/* Landscape Silhouettes (Monolith / Mountains SVG) */}
        <svg
          className="absolute bottom-0 left-0 right-0 w-full h-48 md:h-64 object-cover opacity-60 pointer-events-none"
          preserveAspectRatio="none"
          viewBox="0 0 1440 320"
        >
          <path
            fill="#120529"
            fillOpacity="0.85"
            d="M0,224L48,213.3C96,203,192,181,288,186.7C384,192,480,224,576,213.3C672,203,768,149,864,138.7C960,128,1056,160,1152,181.3C1248,203,1344,213,1392,218.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
          {/* Desert Monolith Formations */}
          <path
            fill="#090217"
            d="M280,320 L300,190 L320,170 L340,190 L360,320 Z M620,320 L640,160 L660,140 L690,170 L710,320 Z M1020,320 L1035,180 L1050,160 L1065,180 L1080,320 Z"
          />
        </svg>
      </div>

      {/* Top Banner if already authenticated */}
      {isAuthenticated && (
        <div className="z-20 w-full max-w-4xl mb-4 px-4">
          <div className="w-full p-2.5 px-4 bg-purple-950/70 border border-purple-500/40 backdrop-blur-md rounded-2xl text-xs text-purple-200 flex items-center justify-between shadow-xl">
            <span>
              Logged in as <b className="text-white">{user?.name || 'User'}</b>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/chat')}
                className="px-3 py-1.5 bg-purple-600 text-white rounded-xl font-semibold flex items-center gap-1.5 hover:bg-purple-700 text-xs transition-all shadow-md cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Go to Chat
              </button>
              <button
                onClick={() => logout()}
                className="px-3 py-1.5 bg-rose-600/90 text-white rounded-xl font-semibold flex items-center gap-1.5 hover:bg-rose-700 text-xs transition-all shadow-md cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Full-Screen Layout Container */}
      <div className="z-10 w-full max-w-6xl px-4 py-6 md:py-10 flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-12 animate-fade-in min-h-[80vh]">
        {/* Left Side: Welcome Hero Branding & SB Logo */}
        <div className="flex-1 flex flex-col justify-between items-start text-white space-y-6 max-w-xl">
          {/* Logo & App Name Header */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15 shadow-lg">
            <img src={appLogo} alt="SB Chat Logo" className="h-9 w-auto object-contain drop-shadow-md" />
            <span className="text-sm font-bold tracking-wider text-purple-100">SB CHAT PRO</span>
          </div>

          {/* Headline & Subtitle */}
          <div className="space-y-3 pt-4">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-lg leading-none">
              Welcome
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-purple-200/90 font-light tracking-wide">
              Have a great journey ahead...
            </p>
          </div>

          {/* Feature Pills */}
          <div className="pt-6 flex flex-wrap gap-2 text-xs text-purple-200/80 font-medium">
            <span className="px-3 py-1.5 bg-purple-900/40 border border-purple-400/20 rounded-full backdrop-blur-xs flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Real-time Scalable Messaging
            </span>
            <span className="px-3 py-1.5 bg-purple-900/40 border border-purple-400/20 rounded-full backdrop-blur-xs">
              🔒 End-to-End Encrypted
            </span>
          </div>
        </div>

        {/* Right Side: Floating Dark Glassmorphism Form Card */}
        <div className="w-full max-w-md bg-[#180e2e]/75 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-purple-500/25 flex flex-col justify-between relative overflow-hidden">
          {/* Glow accent bar at top of card */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500" />

          {/* Form Header Tabs */}
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-4 mb-6">
            <div className="flex gap-4 text-sm font-semibold">
              <button
                onClick={() => setIsLoginView(true)}
                className={`pb-1 transition-all cursor-pointer relative ${
                  isLoginView
                    ? 'text-white font-bold'
                    : 'text-purple-300/60 hover:text-purple-200'
                }`}
              >
                Sign In
                {isLoginView && (
                  <span className="absolute -bottom-4 left-0 right-0 h-0.5 bg-purple-400 rounded-full" />
                )}
              </button>
              <button
                onClick={() => setIsLoginView(false)}
                className={`pb-1 transition-all cursor-pointer relative ${
                  !isLoginView
                    ? 'text-white font-bold'
                    : 'text-purple-300/60 hover:text-purple-200'
                }`}
              >
                Sign Up
                {!isLoginView && (
                  <span className="absolute -bottom-4 left-0 right-0 h-0.5 bg-purple-400 rounded-full" />
                )}
              </button>
            </div>

            <div className="text-[11px] text-purple-300/60">
              {isLoginView ? 'Welcome Back!' : 'Join SB Chat'}
            </div>
          </div>

          {/* Active Form */}
          {isLoginView ? (
            <LoginForm
              onSuccess={handleSuccess}
              onToggleView={() => setIsLoginView(false)}
            />
          ) : (
            <RegisterForm
              onSuccess={handleSuccess}
              onToggleView={() => setIsLoginView(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

