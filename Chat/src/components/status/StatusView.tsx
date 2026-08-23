import React, { useState } from 'react';
import { CircleDashed, Plus, Eye, X } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';
import type { StatusItem } from '../../types/chat.types';

export const StatusView: React.FC = () => {
  const { currentUser, statuses } = useChat();
  const [activeStatus, setActiveStatus] = useState<StatusItem | null>(null);

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full bg-white dark:bg-[#111b21] overflow-hidden select-none">
      {/* Status List Sidebar */}
      <div className="w-full md:w-80 lg:w-96 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full bg-white dark:bg-[#111b21]">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800/80">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-4">
            Status
          </h1>

          {/* My Status Tile */}
          <div className="flex items-center gap-3.5 p-2.5 rounded-2xl hover:bg-gray-100 dark:hover:bg-[#202c33] cursor-pointer transition-colors">
            <div className="relative">
              <Avatar src={currentUser.avatar} name={currentUser.name} size="lg" />
              <span className="absolute bottom-0 right-0 p-1 bg-emerald-500 text-white rounded-full border-2 border-white dark:border-[#111b21]">
                <Plus className="w-3 h-3" />
              </span>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">My Status</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">Click to add status update</p>
            </div>
          </div>
        </div>

        {/* Recent Updates */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
            Recent Updates
          </span>

          {statuses.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              No recent status updates from contacts
            </div>
          ) : (
            statuses.map((item: StatusItem) => (
              <div
                key={item.id}
                onClick={() => setActiveStatus(item)}
                className="flex items-center gap-3.5 p-2.5 rounded-2xl hover:bg-gray-100 dark:hover:bg-[#202c33] cursor-pointer transition-colors"
              >
                <div
                  className={`p-0.5 rounded-full border-2 ${
                    item.viewed ? 'border-gray-300 dark:border-gray-700' : 'border-emerald-500'
                  }`}
                >
                  <Avatar src={item.user.avatar} name={item.user.name} size="md" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {item.user.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.timestamp}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>


      {/* Main Status Preview Area */}
      <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-gray-900 text-white relative">
        {activeStatus ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center p-8 bg-black">
            {/* Top Progress Bar */}
            <div className="absolute top-4 left-6 right-6 h-1 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-full animate-pulse" />
            </div>

            {/* Close Button */}
            <button
              onClick={() => setActiveStatus(null)}
              className="absolute top-8 right-6 p-2 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Media Content */}
            {activeStatus.mediaUrl ? (
              <img
                src={activeStatus.mediaUrl}
                alt="Status"
                className="max-h-[75vh] object-contain rounded-2xl shadow-2xl"
              />
            ) : (
              <div
                className="w-full max-w-lg h-96 rounded-3xl flex items-center justify-center p-8 text-center text-xl font-bold shadow-2xl"
                style={{ backgroundColor: activeStatus.backgroundColor || '#00a884' }}
              >
                {activeStatus.caption}
              </div>
            )}

            {/* Caption Footer */}
            {activeStatus.caption && activeStatus.mediaUrl && (
              <p className="mt-4 text-base font-medium text-gray-200 bg-black/60 px-4 py-2 rounded-xl">
                {activeStatus.caption}
              </p>
            )}

            {/* Views Indicator */}
            <div className="absolute bottom-6 flex items-center gap-2 text-xs text-gray-400">
              <Eye className="w-4 h-4" /> 18 views
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8 text-gray-400">
            <CircleDashed className="w-16 h-16 mb-4 text-emerald-500 animate-spin" />
            <h3 className="text-lg font-bold text-gray-200">Select a status update</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-xs">
              Click on any contact status on the left to view their recent story.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
