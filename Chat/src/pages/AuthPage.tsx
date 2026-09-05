import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, LogOut, MessageSquare, ShieldCheck, Zap } from 'lucide-react';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { useAuth } from '../context/AuthContext';
import appLogo from '../assets/logo.png';

export const AuthPage: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleSuccess = () => {
    navigate('/chat');
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 30;
    const y = (clientY / innerHeight - 0.5) * 30;
    setMousePos({ x, y });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="min-h-screen w-full relative flex flex-col items-center justify-center bg-[#0d061f] overflow-hidden select-none"
    >
      {/* Surreal Atmospheric Landscape Background with Parallax */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0a0418] via-[#1d073b] to-[#46146e]">
        {/* Pulsing & Floating Nebulae Orbs */}
        <div
          style={{ transform: `translate(${mousePos.x * 0.8}px, ${mousePos.y * 0.8}px)` }}
          className="absolute -top-24 -left-24 w-[650px] h-[650px] bg-purple-600/30 rounded-full blur-[140px] pointer-events-none animate-pulse-orb transition-transform duration-75 ease-out"
        />
        <div
          style={{ transform: `translate(${-mousePos.x * 1.2}px, ${-mousePos.y * 1.2}px)` }}
          className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[550px] h-[550px] bg-fuchsia-600/25 rounded-full blur-[160px] pointer-events-none animate-pulse-orb transition-transform duration-75 ease-out"
        />
        <div
          style={{ transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)` }}
          className="absolute -bottom-32 -right-32 w-[750px] h-[750px] bg-indigo-600/30 rounded-full blur-[180px] pointer-events-none animate-pulse-orb transition-transform duration-75 ease-out"
        />

        {/* Floating Futuristic Vector Rings */}
        <div
          style={{ transform: `translate(${mousePos.x * 1.5}px, ${mousePos.y * 1.5}px)` }}
          className="absolute top-12 left-16 w-28 h-28 border-4 border-purple-400/30 rounded-full pointer-events-none animate-rotate-slow transition-transform duration-100 ease-out"
        />
        <div
          style={{ transform: `translate(${-mousePos.x * 0.9}px, ${-mousePos.y * 0.9}px)` }}
          className="absolute bottom-16 left-1/3 w-64 h-64 border-8 border-purple-400/15 rounded-full pointer-events-none animate-float-slow transition-transform duration-100 ease-out"
        />
        <div
          style={{ transform: `translate(${mousePos.x * 2}px, ${mousePos.y * 2}px)` }}
          className="absolute top-20 right-1/4 w-36 h-36 border-2 border-indigo-400/30 rounded-full pointer-events-none animate-rotate-slow transition-transform duration-100 ease-out"
        />

        {/* Twinkling Ambient Star Particles */}
        <div className="absolute top-1/4 left-1/5 w-1.5 h-1.5 bg-white rounded-full animate-ping opacity-75" />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-200 rounded-full animate-pulse opacity-90" />
        <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-fuchsia-300 rounded-full blur-xs animate-pulse opacity-80" />
        <div className="absolute top-16 right-12 w-1.5 h-1.5 bg-indigo-200 rounded-full animate-ping opacity-60" />

        {/* Landscape Silhouettes (Monolith / Mountains SVG) */}
        <svg
          className="absolute bottom-0 left-0 right-0 w-full h-48 md:h-64 object-cover opacity-60 pointer-events-none"
          preserveAspectRatio="none"
          viewBox="0 0 1440 320"
        >
          <path
            fill="#100424"
            fillOpacity="0.88"
            d="M0,224L48,213.3C96,203,192,181,288,186.7C384,192,480,224,576,213.3C672,203,768,149,864,138.7C960,128,1056,160,1152,181.3C1248,203,1344,213,1392,218.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
          {/* Desert Monolith Formations */}
          <path
            fill="#070214"
            d="M280,320 L300,190 L320,170 L340,190 L360,320 Z M620,320 L640,160 L660,140 L690,170 L710,320 Z M1020,320 L1035,180 L1050,160 L1065,180 L1080,320 Z"
          />
        </svg>
      </div>

      {/* Top Banner if already authenticated */}
      {isAuthenticated && (
        <div className="z-20 w-full max-w-4xl mb-4 px-4">
          <div className="w-full p-2.5 px-4 bg-purple-950/75 border border-purple-500/40 backdrop-blur-md rounded-2xl text-xs text-purple-200 flex items-center justify-between shadow-2xl">
            <span>
              Logged in as <b className="text-white">{user?.name || 'User'}</b>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/chat')}
                className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold flex items-center gap-1.5 hover:from-purple-500 hover:to-indigo-500 text-xs transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Go to Chat
              </button>
              <button
                onClick={() => logout()}
                className="px-3 py-1.5 bg-rose-600/90 text-white rounded-xl font-semibold flex items-center gap-1.5 hover:bg-rose-700 text-xs transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Full-Screen Layout Container */}
      <div className="z-10 w-full max-w-6xl px-4 py-6 md:py-10 flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-12 animate-fade-in min-h-[80vh]">
        {/* Left Side: Welcome Hero Branding & Animated SB Logo */}
        <div
          style={{ transform: `translate(${mousePos.x * 0.4}px, ${mousePos.y * 0.4}px)` }}
          className="flex-1 flex flex-col justify-between items-start text-white space-y-6 max-w-xl transition-transform duration-200 ease-out"
        >
          {/* Animated Logo & App Name Header */}
          <div className="group flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15 shadow-xl hover:border-purple-400/40 hover:bg-white/15 transition-all duration-300 cursor-pointer">
            <div className="relative">
              <div className="absolute -inset-1 bg-purple-500 rounded-full blur-xs opacity-40 group-hover:opacity-100 transition-opacity" />
              <img
                src={appLogo}
                alt="SB Chat Logo"
                className="relative h-9 w-auto object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <span className="text-sm font-extrabold tracking-widest text-purple-100 group-hover:text-white transition-colors">
              SB CHAT PRO
            </span>
          </div>

          {/* Headline & Subtitle */}
          <div className="space-y-3 pt-2">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-purple-300 drop-shadow-lg leading-none animate-float-slow">
              Welcome
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-purple-200/90 font-light tracking-wide">
              Have a great journey ahead...
            </p>
          </div>

          {/* Animated Feature Badges */}
          <div className="pt-4 flex flex-wrap gap-2 text-xs text-purple-200/90 font-medium">
            <span className="px-3.5 py-2 bg-purple-900/50 border border-purple-400/30 rounded-full backdrop-blur-md flex items-center gap-1.5 hover:border-purple-400 hover:bg-purple-900/70 transition-all cursor-pointer shadow-md">
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> Real-time Scalable Messaging
            </span>
            <span className="px-3.5 py-2 bg-purple-900/50 border border-purple-400/30 rounded-full backdrop-blur-md flex items-center gap-1.5 hover:border-purple-400 hover:bg-purple-900/70 transition-all cursor-pointer shadow-md">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> End-to-End Encrypted
            </span>
          </div>
        </div>

        {/* Right Side: Floating Animated Dark Glassmorphism Form Card */}
        <div
          style={{ transform: `translate(${-mousePos.x * 0.3}px, ${-mousePos.y * 0.3}px)` }}
          className="w-full max-w-md bg-[#180e2e]/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-purple-500/30 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:border-purple-400/50 hover:shadow-[0_0_50px_rgba(147,51,234,0.35)]"
        >
          {/* Animated Shimmer Light Sweep Accent */}
          <div className="absolute -top-10 -left-20 w-40 h-40 bg-purple-400/20 blur-xl pointer-events-none animate-shimmer-sweep" />

          {/* Glow accent bar at top of card */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 animate-pulse" />

          {/* Form Header Tabs */}
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-4 mb-6 relative">
            <div className="flex gap-6 text-sm font-semibold">
              <button
                onClick={() => setIsLoginView(true)}
                className={`pb-1 transition-all duration-200 cursor-pointer relative ${
                  isLoginView
                    ? 'text-white font-extrabold scale-105'
                    : 'text-purple-300/60 hover:text-purple-200'
                }`}
              >
                Sign In
                {isLoginView && (
                  <span className="absolute -bottom-4 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-fuchsia-400 rounded-full animate-fade-in shadow-xs" />
                )}
              </button>
              <button
                onClick={() => setIsLoginView(false)}
                className={`pb-1 transition-all duration-200 cursor-pointer relative ${
                  !isLoginView
                    ? 'text-white font-extrabold scale-105'
                    : 'text-purple-300/60 hover:text-purple-200'
                }`}
              >
                Sign Up
                {!isLoginView && (
                  <span className="absolute -bottom-4 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-fuchsia-400 rounded-full animate-fade-in shadow-xs" />
                )}
              </button>
            </div>

            <div className="text-[11px] text-purple-300/70 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400 animate-spin-slow" />
              {isLoginView ? 'Welcome Back!' : 'Join SB Chat'}
            </div>
          </div>

          {/* Active Form with Smooth Entrance */}
          <div className="animate-fade-in transition-all">
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
    </div>
  );
};


