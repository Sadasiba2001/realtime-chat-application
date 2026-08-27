import React from 'react';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Trash2 } from 'lucide-react';
import { useVoiceCall } from '../../context/VoiceCallContext';
import { useVideoCall } from '../../context/VideoCallContext';
import { Avatar } from '../common/Avatar';

export const CallsView: React.FC = () => {
  const { callLogs, startCall, clearCallLogs } = useVoiceCall();
  const { startVideoCall } = useVideoCall();

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#111b21] overflow-hidden select-none">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Calls Log
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Recent incoming, outgoing, and missed voice and video calls
          </p>
        </div>
        {callLogs.length > 0 && (
          <button
            onClick={clearCallLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
            title="Clear History"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear History
          </button>
        )}
      </div>

      {/* Call Log List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-4xl divide-y divide-gray-100 dark:divide-gray-800/60">
        {callLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center text-gray-400">
            <Phone className="w-12 h-12 mb-3 text-gray-300 dark:text-gray-700" />
            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">No call history</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-xs">
              Voice and video calls with your contacts will appear here.
            </p>
          </div>
        ) : (
          callLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between py-3.5 px-2 hover:bg-gray-50 dark:hover:bg-[#202c33]/50 rounded-2xl transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <Avatar src={log.contact.avatar} name={log.contact.name} size="lg" />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {log.contact.name}
                    </h4>
                    {log.type === 'video' && (
                      <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                        Video
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {log.status === 'incoming' && <PhoneIncoming className="w-3.5 h-3.5 text-emerald-500" />}
                    {log.status === 'outgoing' && <PhoneOutgoing className="w-3.5 h-3.5 text-blue-500" />}
                    {log.status === 'missed' && <PhoneMissed className="w-3.5 h-3.5 text-rose-500" />}
                    <span className={log.status === 'missed' ? 'text-rose-500 font-medium' : ''}>
                      {log.timestamp} {log.duration ? `(${log.duration})` : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => startCall(log.contact)}
                  className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 rounded-xl transition-colors"
                  title="Voice Call"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  onClick={() => startVideoCall(log.contact)}
                  className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 rounded-xl transition-colors"
                  title="Video Call"
                >
                  <Video className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
