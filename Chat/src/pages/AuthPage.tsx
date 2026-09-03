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
      className="min-h-screen w-full relative flex flex-col items-center justify-center bg-[#0d061f] overflow-x-hidden overflow-y-auto select-none py-6 sm:py-8 lg:py-12"
    >
      {/* Surreal Atmospheric Landscape Background with Parallax */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0a0418] via-[#1d073b] to-[#46146e]">
        {/* Pulsing & Floating Nebulae Orbs */}
        <div
          style={{ transform: `translate(${mousePos.x * 0.8}px, ${mousePos.y * 0.8}px)` }}
          className="absolute -top-24 -left-24 w-[350px] sm:w-[650px] h-[350px] sm:h-[650px] bg-purple-600/30 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none animate-pulse-orb transition-transform duration-75 ease-out"
        />
        <div
          style={{ transform: `translate(${-mousePos.x * 1.2}px, ${-mousePos.y * 1.2}px)` }}
          className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[300px] sm:w-[550px] h-[300px] sm:h-[550px] bg-fuchsia-600/25 rounded-full blur-[120px] sm:blur-[160px] pointer-events-none animate-pulse-orb transition-transform duration-75 ease-out"
        />
        <div
          style={{ transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)` }}
          className="absolute -bottom-32 -right-32 w-[400px] sm:w-[750px] h-[400px] sm:h-[750px] bg-indigo-600/30 rounded-full blur-[120px] sm:blur-[180px] pointer-events-none animate-pulse-orb transition-transform duration-75 ease-out"
        />

        {/* Floating Futuristic Vector Rings */}
        <div
          style={{ transform: `translate(${mousePos.x * 1.5}px, ${mousePos.y * 1.5}px)` }}
          className="absolute top-12 left-6 sm:left-16 w-20 sm:w-28 h-20 sm:h-28 border-4 border-purple-400/30 rounded-full pointer-events-none animate-rotate-slow transition-transform duration-100 ease-out"
        />
        <div
          style={{ transform: `translate(${-mousePos.x * 0.9}px, ${-mousePos.y * 0.9}px)` }}
          className="absolute bottom-16 left-1/3 w-40 sm:w-64 h-40 sm:h-64 border-4 sm:border-8 border-purple-400/15 rounded-full pointer-events-none animate-float-slow transition-transform duration-100 ease-out"
        />
        <div
          style={{ transform: `translate(${mousePos.x * 2}px, ${mousePos.y * 2}px)` }}
          className="absolute top-20 right-6 sm:right-1/4 w-24 sm:w-36 h-24 sm:h-36 border-2 border-indigo-400/30 rounded-full pointer-events-none animate-rotate-slow transition-transform duration-100 ease-out"
        />

        {/* Twinkling Ambient Star Particles */}
        <div className="absolute top-1/4 left-1/5 w-1.5 h-1.5 bg-white rounded-full animate-ping opacity-75" />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-200 rounded-full animate-pulse opacity-90" />
        <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-fuchsia-300 rounded-full blur-xs animate-pulse opacity-80" />
        <div className="absolute top-16 right-12 w-1.5 h-1.5 bg-indigo-200 rounded-full animate-ping opacity-60" />

        {/* Landscape Silhouettes (Monolith / Mountains SVG) */}
        <svg
          className="absolute bottom-0 left-0 right-0 w-full h-36 sm:h-48 md:h-64 object-cover opacity-60 pointer-events-none"
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
        <div className="z-20 w-full max-w-4xl mb-4 px-3 sm:px-4">
          <div className="w-full p-3 sm:px-4 sm:py-2.5 bg-purple-950/75 border border-purple-500/40 backdrop-blur-md rounded-2xl text-xs text-purple-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-2xl text-center sm:text-left">
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
      <div className="z-10 w-full max-w-6xl px-4 py-2 sm:py-6 md:py-10 flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-12 animate-fade-in my-auto">
        {/* Left Side: Welcome Hero Branding & Animated SB Logo */}
        <div
          style={{ transform: `translate(${mousePos.x * 0.4}px, ${mousePos.y * 0.4}px)` }}
          className="w-full lg:flex-1 flex flex-col items-center lg:items-start text-center lg:text-left text-white space-y-4 sm:space-y-6 max-w-xl transition-transform duration-200 ease-out"
        >
          {/* Animated Logo & App Name Header */}
          <div className="group flex items-center gap-3 bg-white/10 backdrop-blur-md px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl border border-white/15 shadow-xl hover:border-purple-400/40 hover:bg-white/15 transition-all duration-300 cursor-pointer">
            <div className="relative">
              <div className="absolute -inset-1 bg-purple-500 rounded-full blur-xs opacity-40 group-hover:opacity-100 transition-opacity" />
              <img
                src={appLogo}
                alt="SB Chat Logo"
                className="relative h-7 sm:h-9 w-auto object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <span className="text-xs sm:text-sm font-extrabold tracking-widest text-purple-100 group-hover:text-white transition-colors">
              SB CHAT PRO
            </span>
          </div>

          {/* Headline & Subtitle */}
          <div className="space-y-2 sm:space-y-3 pt-1 sm:pt-2">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-purple-300 drop-shadow-lg leading-tight sm:leading-none animate-float-slow">
              Welcome
            </h1>
            <p className="text-sm sm:text-lg md:text-xl text-purple-200/90 font-light tracking-wide max-w-md">
              Have a great journey ahead...
            </p>
          </div>

          {/* Animated Feature Badges */}
          <div className="pt-2 sm:pt-4 flex flex-wrap justify-center lg:justify-start gap-2 text-xs text-purple-200/90 font-medium">
            <span className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-purple-900/50 border border-purple-400/30 rounded-full backdrop-blur-md flex items-center gap-1.5 hover:border-purple-400 hover:bg-purple-900/70 transition-all cursor-pointer shadow-md text-[11px] sm:text-xs">
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" /> Real-time Scalable Messaging
            </span>
            <span className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-purple-900/50 border border-purple-400/30 rounded-full backdrop-blur-md flex items-center gap-1.5 hover:border-purple-400 hover:bg-purple-900/70 transition-all cursor-pointer shadow-md text-[11px] sm:text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> End-to-End Encrypted
            </span>
          </div>
        </div>

        {/* Right Side: Floating Animated Dark Glassmorphism Form Card */}
        <div
          style={{ transform: `translate(${-mousePos.x * 0.3}px, ${-mousePos.y * 0.3}px)` }}
          className="w-full max-w-md bg-[#180e2e]/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl border border-purple-500/30 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:border-purple-400/50 hover:shadow-[0_0_50px_rgba(147,51,234,0.35)]"
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


