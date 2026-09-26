import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Volume2 } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { Avatar } from './Avatar';

export const CallOverlay: React.FC = () => {
  const { activeCall, endCall, toggleCallMute, toggleCallVideo } = useChat();
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!activeCall) return;
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => {
      clearInterval(interval);
      setSeconds(0);
    };
  }, [activeCall]);

  if (!activeCall) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/90 backdrop-blur-md animate-fade-in select-none dark:backdrop-blur-none">
      <div className="flex flex-col items-center justify-between h-[80vh] max-h-[650px] w-[90%] max-w-md p-8 bg-[#111b21] rounded-3xl shadow-2xl border border-gray-800 text-white relative overflow-hidden dark:bg-g-bg2 dark:border-g-line dark:text-g-text">
        {/* Background Decorative Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/20 via-transparent to-black/60 pointer-events-none dark:hidden" />

        {/* Call Header Info */}
        <div className="flex flex-col items-center text-center z-10 space-y-2 mt-4">
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-medium">
            WhatsApp {activeCall.type === 'video' ? 'Video Call' : 'Voice Call'}
          </span>
          <h2 className="text-2xl font-bold text-gray-100 dark:text-g-text">{activeCall.contact.name}</h2>
          <span className="text-sm text-gray-400 font-mono dark:text-g-text2">{formatTime(seconds)}</span>
        </div>

        {/* Call Avatar / Simulated Video View */}
        <div className="relative flex items-center justify-center my-auto z-10">
          {activeCall.type === 'video' && !activeCall.isVideoOff ? (
            <div className="relative w-64 h-64 rounded-2xl overflow-hidden shadow-2xl border-2 border-emerald-500/50">
              <img
                src={activeCall.contact.avatar}
                alt={activeCall.contact.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded-md text-[10px] text-gray-300 dark:text-g-text2">
                HD 1080p
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute -inset-4 bg-emerald-500/20 rounded-full animate-pulse-record" />
              <Avatar
                src={activeCall.contact.avatar}
                name={activeCall.contact.name}
                size="xl"
              />
            </div>
          )}
        </div>

        {/* Call Controls Toolbar */}
        <div className="flex items-center justify-center gap-6 z-10 mb-4 bg-gray-900/80 px-6 py-4 rounded-full border border-gray-800 shadow-xl dark:border-g-line">
          {/* Mute Toggle */}
          <button
            onClick={toggleCallMute}
            className={`p-3.5 rounded-full transition-all ${
              activeCall.isMuted
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40 dark:text-g-text'
                : 'bg-gray-800 text-gray-200 hover:bg-gray-700 dark:bg-g-s2 dark:text-g-text dark:hover:bg-g-s3'
            }`}
            title={activeCall.isMuted ? 'Unmute' : 'Mute'}
          >
            {activeCall.isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {/* End Call Button */}
          <button
            onClick={endCall}
            className="p-4 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-transform hover:scale-110 shadow-xl shadow-rose-900/50 dark:text-g-text"
            title="End Call"
          >
            <PhoneOff className="w-7 h-7" />
          </button>

          {/* Video Toggle */}
          {activeCall.type === 'video' && (
            <button
              onClick={toggleCallVideo}
              className={`p-3.5 rounded-full transition-all ${
                activeCall.isVideoOff
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40 dark:text-g-text'
                  : 'bg-gray-800 text-gray-200 hover:bg-gray-700 dark:bg-g-s2 dark:text-g-text dark:hover:bg-g-s3'
              }`}
              title={activeCall.isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
            >
              {activeCall.isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </button>
          )}

          {/* Speaker Button */}
          <button
            className="p-3.5 bg-gray-800 text-gray-200 hover:bg-gray-700 rounded-full transition-colors dark:bg-g-s2 dark:text-g-text dark:hover:bg-g-s3"
            title="Speaker"
          >
            <Volume2 className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
