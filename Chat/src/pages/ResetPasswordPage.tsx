import React, { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { ResetPasswordForm } from '../components/auth/ResetPasswordForm';
import appLogo from '../assets/logo.png';

export const ResetPasswordPage: React.FC = () => {
  const { token: urlParamToken } = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const token = urlParamToken || searchParams.get('token') || '';

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
      className="min-h-screen w-full relative flex flex-col items-center justify-center bg-[#0d061f] overflow-hidden select-none px-4"
    >
      {/* Ambient Gradient Background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0a0418] via-[#1d073b] to-[#46146e]">
        <div
          style={{ transform: `translate(${mousePos.x * 0.8}px, ${mousePos.y * 0.8}px)` }}
          className="absolute -top-24 -left-24 w-[650px] h-[650px] bg-purple-600/30 rounded-full blur-[140px] pointer-events-none animate-pulse-orb"
        />
        <div
          style={{ transform: `translate(${-mousePos.x * 1.2}px, ${-mousePos.y * 1.2}px)` }}
          className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[550px] h-[550px] bg-fuchsia-600/25 rounded-full blur-[160px] pointer-events-none animate-pulse-orb"
        />
        <div
          style={{ transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)` }}
          className="absolute -bottom-32 -right-32 w-[750px] h-[750px] bg-indigo-600/30 rounded-full blur-[180px] pointer-events-none animate-pulse-orb"
        />
      </div>

      {/* Main Container */}
      <div className="z-10 w-full max-w-md py-8 animate-fade-in">
        {/* Top Logo */}
        <div className="flex justify-center mb-6">
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/15 shadow-xl hover:border-purple-400/40 transition-all cursor-pointer"
          >
            <img src={appLogo} alt="SB Chat Logo" className="h-8 w-auto object-contain" />
            <span className="text-sm font-extrabold tracking-widest text-purple-100">
              SB CHAT PRO
            </span>
          </div>
        </div>

        {/* Card Container */}
        <div className="w-full bg-[#180e2e]/85 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-purple-500/30 relative overflow-hidden transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500" />

          <div className="border-b border-purple-500/20 pb-4 mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-wide">
              Reset Password
            </h2>
            <KeyRound className="w-4 h-4 text-purple-400" />
          </div>

          <ResetPasswordForm
            token={token}
            onSuccess={() => navigate('/auth')}
            onBackToLogin={() => navigate('/auth')}
          />
        </div>
      </div>
    </div>
  );
};
