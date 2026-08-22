import React, { useState } from 'react';
import { User, Bell, Palette, Moon, Sun } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useChat } from '../../context/ChatContext';

export const SettingsModal: React.FC = () => {
  const { activeModal, closeModal, theme, toggleTheme } = useChat();
  const [activeTab, setActiveTab] = useState<'account' | 'chats' | 'notifications' | 'appearance'>('appearance');

  if (activeModal !== 'settings') return null;

  return (
    <Modal isOpen={activeModal === 'settings'} onClose={closeModal} title="Application Settings" maxWidth="lg">
      <div className="flex flex-col md:flex-row gap-6 min-h-[350px] select-none">
        {/* Settings Navigation Tabs */}
        <div className="w-full md:w-48 flex flex-row md:flex-col gap-1 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 pb-3 md:pb-0 md:pr-3">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'appearance'
                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Palette className="w-4 h-4" /> Appearance & Theme
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'notifications'
                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Bell className="w-4 h-4" /> Notifications
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'account'
                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <User className="w-4 h-4" /> Account & Privacy
          </button>
        </div>

        {/* Tab Panel Content */}
        <div className="flex-1 space-y-4">
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Theme Mode</h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => theme !== 'light' && toggleTheme()}
                  className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                    theme === 'light'
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-600 font-semibold shadow-xs'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  <Sun className="w-6 h-6 text-amber-500" />
                  <span className="text-xs">Light Theme</span>
                </button>
                <button
                  onClick={() => theme !== 'dark' && toggleTheme()}
                  className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                    theme === 'dark'
                      ? 'border-emerald-500 bg-emerald-950/50 text-emerald-400 font-semibold shadow-xs'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  <Moon className="w-6 h-6 text-indigo-400" />
                  <span className="text-xs">Dark Theme (WhatsApp Dark)</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Notification Alerts</h4>
              <div className="space-y-2">
                <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#202c33] rounded-xl text-xs">
                  <span>Message Toast Sounds</span>
                  <input type="checkbox" defaultChecked className="accent-emerald-600 w-4 h-4" />
                </label>
                <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#202c33] rounded-xl text-xs">
                  <span>Desktop Popups</span>
                  <input type="checkbox" defaultChecked className="accent-emerald-600 w-4 h-4" />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-3 text-xs text-gray-600 dark:text-gray-300">
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Security & Privacy</h4>
              <p>End-to-End Encryption enabled by default across all 1-on-1 and Group chats.</p>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 font-medium">
                ✓ Session verification active
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
