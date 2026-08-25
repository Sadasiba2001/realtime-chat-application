import React, { useEffect, useRef } from 'react';
import {
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  RefreshCw,
} from 'lucide-react';
import { useVideoCall } from '../../context/VideoCallContext';
import { Avatar } from '../common/Avatar';

export const VideoCallModal: React.FC = () => {
  const {
    videoCallSession,
    localStream,
    remoteStream,
    acceptVideoCall,
    rejectVideoCall,
    cancelVideoCall,
    endVideoCall,
    toggleMute,
    toggleCamera,
    switchCamera,
  } = useVideoCall();

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // Attach local media stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch((e) => {
        console.warn('[VideoModal] Local video play error:', e);
      });
    }
  }, [localStream]);

  // Attach remote media stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch((e) => {
        console.warn('[VideoModal] Remote video play error:', e);
      });
    }
  }, [remoteStream]);

  if (!videoCallSession) return null;

  const {
    counterparty,
    isCaller,
    state,
    isMuted,
    isCameraOff,
    durationSec,
    statusMessage,
    error,
  } = videoCallSession;

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isTerminalState = ['rejected', 'busy', 'cancelled', 'ended', 'failed'].includes(state);
  const isCallActive = state === 'connected';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-2xl h-[92vh] max-h-[720px] rounded-3xl bg-[#0b0f17] border border-slate-800 shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Main Video View (Remote Video or Fallback) */}
        <div className="relative flex-1 w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
          {isCallActive && remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center z-10 space-y-4">
              {/* Animated rings during ringing / connecting */}
              <div className="relative flex items-center justify-center">
                {(state === 'calling' || state === 'ringing' || state === 'connecting') && (
                  <>
                    <div className="absolute -inset-6 rounded-full bg-indigo-500/20 animate-ping" />
                    <div className="absolute -inset-12 rounded-full bg-indigo-500/10 animate-pulse" />
                  </>
                )}
                <div className="relative z-10 ring-4 ring-slate-800 rounded-full shadow-2xl">
                  <Avatar
                    src={counterparty.avatar}
                    name={counterparty.name}
                    size="xl"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Top Bar Overlay */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-700/60 shadow-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-xs font-semibold tracking-wide uppercase text-slate-200">
                Video Call
              </span>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-white drop-shadow-md truncate max-w-[200px]">
                {counterparty.name || 'User'}
              </span>
              {isCallActive ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-medium text-emerald-400 drop-shadow">
                    {formatDuration(durationSec)}
                  </span>
                </div>
              ) : (
                <span
                  className={`text-xs font-medium drop-shadow ${
                    state === 'failed' || state === 'busy'
                      ? 'text-rose-400'
                      : state === 'rejected'
                      ? 'text-amber-400'
                      : 'text-slate-300'
                  }`}
                >
                  {error || statusMessage || 'Connecting...'}
                </span>
              )}
            </div>
          </div>

          {/* Picture-in-Picture Local Video Preview */}
          {localStream && (
            <div className="absolute bottom-24 right-4 z-30 w-28 h-40 sm:w-36 sm:h-48 rounded-2xl bg-slate-900 border-2 border-slate-700/80 shadow-2xl overflow-hidden group">
              {isCameraOff ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400">
                  <VideoOff className="w-6 h-6 mb-1" />
                  <span className="text-[10px]">Camera Off</span>
                </div>
              ) : (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              )}
              <div className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-medium text-slate-300">
                You
              </div>
            </div>
          )}
        </div>

        {/* Bottom Call Controls */}
        <div className="w-full bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 p-4 sm:p-5 flex items-center justify-center z-30">
          {/* Outgoing Call State Controls */}
          {state === 'calling' && (
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={cancelVideoCall}
                className="flex items-center justify-center w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white shadow-lg shadow-rose-900/50 transition-all"
                title="Cancel Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
              <span className="text-xs text-slate-400">Cancel</span>
            </div>
          )}

          {/* Incoming Call State Controls */}
          {state === 'ringing' && !isCaller && (
            <div className="flex items-center justify-around w-full max-w-sm px-4">
              <div className="flex flex-col items-center gap-1.5">
                <button
                  onClick={rejectVideoCall}
                  className="flex items-center justify-center w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white shadow-lg shadow-rose-900/50 transition-all"
                  title="Decline"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
                <span className="text-xs text-slate-400">Decline</span>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <button
                  onClick={acceptVideoCall}
                  className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-lg shadow-emerald-900/50 transition-all animate-bounce"
                  title="Accept Video Call"
                >
                  <Video className="w-6 h-6" />
                </button>
                <span className="text-xs text-emerald-400 font-medium">Accept</span>
              </div>
            </div>
          )}

          {/* Active / Connecting Video Call Controls */}
          {(state === 'connected' || state === 'connecting') && (
            <div className="flex items-center justify-center gap-4 sm:gap-6">
              {/* Mute Microphone */}
              <div className="flex flex-col items-center gap-1">
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
                <span className="text-[10px] text-slate-400">{isMuted ? 'Unmute' : 'Mute'}</span>
              </div>

              {/* Camera On / Off */}
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={toggleCamera}
                  className={`flex items-center justify-center w-12 h-12 rounded-full transition-all active:scale-95 ${
                    isCameraOff
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-lg'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                  title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
                >
                  {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
                <span className="text-[10px] text-slate-400">{isCameraOff ? 'Camera On' : 'Camera Off'}</span>
              </div>

              {/* Switch Camera */}
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={switchCamera}
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95 transition-all"
                  title="Switch camera"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <span className="text-[10px] text-slate-400">Flip</span>
              </div>

              {/* End Call */}
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={endVideoCall}
                  className="flex items-center justify-center w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white shadow-xl shadow-rose-900/50 transition-all"
                  title="End Video Call"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
                <span className="text-[10px] text-slate-400">End</span>
              </div>
            </div>
          )}

          {/* Terminal Banner */}
          {isTerminalState && (
            <div className="py-2 px-5 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
              <span className="text-xs text-slate-300">Returning to chat...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
