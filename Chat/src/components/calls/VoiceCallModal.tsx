import React from 'react';
import { Phone, PhoneOff, Mic, MicOff, AlertCircle, Volume2 } from 'lucide-react';
import { useVoiceCall } from '../../context/VoiceCallContext';
import { Avatar } from '../common/Avatar';

export const VoiceCallModal: React.FC = () => {
  const { callSession, acceptCall, rejectCall, cancelCall, endCall, toggleMute, enableAudio } = useVoiceCall();

  if (!callSession) return null;

  const { counterparty, isCaller, state, isMuted, durationSec, statusMessage, error, isAudioBlocked } = callSession;

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isTerminalState = ['rejected', 'busy', 'cancelled', 'ended', 'failed'].includes(state);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#0f172a] dark:bg-[#0f172a] border border-slate-800 shadow-2xl p-6 flex flex-col items-center justify-between min-h-[440px] text-white overflow-hidden">
        {/* Subtle Ambient Background */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex flex-col items-center text-center z-10 mt-2 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] font-medium tracking-wide uppercase text-slate-300">
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
            Voice Call
          </div>

          <h2 className="text-xl font-bold text-slate-100 tracking-tight truncate max-w-[260px] mt-2">
            {counterparty.name || 'User'}
          </h2>

          {/* Status / Timer */}
          {state === 'connected' ? (
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-mono font-medium text-emerald-400">
                {formatDuration(durationSec)}
              </span>
            </div>
          ) : (
            <p
              className={`text-xs font-medium mt-1 ${
                state === 'busy' || state === 'failed'
                  ? 'text-rose-400'
                  : state === 'rejected'
                  ? 'text-amber-400'
                  : 'text-slate-400'
              }`}
            >
              {error || statusMessage || 'Connecting...'}
            </p>
          )}

          {/* Autoplay Blocked User Fallback Banner */}
          {isAudioBlocked && state === 'connected' && (
            <button
              onClick={() => enableAudio()}
              className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-medium hover:bg-amber-500/30 transition-all animate-bounce"
            >
              <Volume2 className="w-3.5 h-3.5" />
              Tap to Enable Audio
            </button>
          )}
        </div>

        {/* Center Avatar & Animated Pulse */}
        <div className="relative my-auto flex items-center justify-center z-10">
          {(state === 'calling' || state === 'ringing' || state === 'connecting') && (
            <>
              <div className="absolute -inset-4 rounded-full bg-violet-500/20 animate-ping" />
              <div className="absolute -inset-8 rounded-full bg-violet-500/10 animate-pulse" />
            </>
          )}

          {state === 'connected' && !isMuted && (
            <div className="absolute -inset-3 rounded-full bg-emerald-500/20 animate-pulse" />
          )}

          <div className="relative z-10 ring-4 ring-slate-800 rounded-full">
            <Avatar
              src={counterparty.avatar}
              name={counterparty.name}
              size="xl"
            />
          </div>

          {state === 'failed' && (
            <div className="absolute -bottom-2 -right-2 p-1.5 bg-rose-600 rounded-full text-white shadow-lg">
              <AlertCircle className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="w-full z-10 mt-auto pt-4 flex items-center justify-center">
          {/* Outgoing Call State */}
          {state === 'calling' && (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={cancelCall}
                className="flex items-center justify-center w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white shadow-lg shadow-rose-900/50 transition-all"
                title="Cancel Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
              <span className="text-xs text-slate-400">Cancel</span>
            </div>
          )}

          {/* Incoming Call State */}
          {state === 'ringing' && !isCaller && (
            <div className="flex items-center justify-around w-full px-4">
              {/* Reject Button */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={rejectCall}
                  className="flex items-center justify-center w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white shadow-lg shadow-rose-900/50 transition-all"
                  title="Decline"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
                <span className="text-xs text-slate-400">Decline</span>
              </div>

              {/* Accept Button */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={acceptCall}
                  className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-lg shadow-emerald-900/50 transition-all animate-bounce"
                  title="Accept"
                >
                  <Phone className="w-6 h-6" />
                </button>
                <span className="text-xs text-emerald-400 font-medium">Accept</span>
              </div>
            </div>
          )}

          {/* Connected / Connecting Call Controls */}
          {(state === 'connected' || state === 'connecting') && (
            <div className="flex items-center justify-center gap-6">
              {/* Mute Microphone Button */}
              <div className="flex flex-col items-center gap-1.5">
                <button
                  onClick={toggleMute}
                  className={`flex items-center justify-center w-12 h-12 rounded-full transition-all active:scale-95 ${
                    isMuted
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-lg'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                  title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <span className="text-[11px] text-slate-400">
                  {isMuted ? 'Unmute' : 'Mute'}
                </span>
              </div>

              {/* End Call Button */}
              <div className="flex flex-col items-center gap-1.5">
                <button
                  onClick={endCall}
                  className="flex items-center justify-center w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white shadow-xl shadow-rose-900/50 transition-all"
                  title="End Call"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
                <span className="text-[11px] text-slate-400">End</span>
              </div>
            </div>
          )}

          {/* Terminal / Closing State Banner */}
          {isTerminalState && (
            <div className="py-2 px-4 rounded-xl bg-slate-800/60 border border-slate-700 text-center">
              <span className="text-xs text-slate-300">Returning to chat...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
