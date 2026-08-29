import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Bell,
  Shield,
  User,
  Key,
  Database,
  HelpCircle,
  Check,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { requestBrowserNotificationPermission } from '../../utils/browserNotification.utils';
import { Avatar } from '../common/Avatar';

export const SettingsView: React.FC = () => {
  const { currentUser, theme, toggleTheme, updateUserProfile } = useChat();
  const [name, setName] = useState(currentUser.name);
  const [about, setAbout] = useState(currentUser.about || '');
  const [notifications, setNotifications] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile({ name, about });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#0f172a] overflow-y-auto select-none p-6 md:p-10">
      <div className="max-w-3xl mx-auto w-full space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Settings
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage your account preferences, theme, privacy, and notifications.
          </p>
        </div>

        {/* Profile Card */}
        <section className="bg-gray-50 dark:bg-slate-900/70 p-6 rounded-3xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-4 text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            <User className="w-4 h-4" /> Personal Details
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-center gap-5">
              <Avatar src={currentUser.avatar} name={currentUser.name} size="xl" />
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {currentUser.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser.email}</p>
                <p className="text-xs text-sky-600 dark:text-sky-400 mt-1 font-mono">{currentUser.phone}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 text-xs bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-gray-700 outline-hidden focus:ring-2 focus:ring-sky-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  About / Bio
                </label>
                <input
                  type="text"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className="w-full px-4 py-2 text-xs bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-gray-700 outline-hidden focus:ring-2 focus:ring-sky-500/50"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {savedSuccess && (
                <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                  <Check className="w-4 h-4" /> Saved!
                </span>
              )}
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-all shadow-md shadow-sky-600/30"
              >
                Save Changes
              </button>
            </div>
          </form>
        </section>

        {/* Appearance Settings */}
        <section className="bg-gray-50 dark:bg-slate-900/70 p-6 rounded-3xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-4 text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />} Appearance
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Theme Mode</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Current mode: <span className="font-semibold capitalize text-sky-600 dark:text-sky-400">{theme}</span>
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="px-4 py-2 text-xs font-semibold bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 shadow-xs"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-600" />}
              Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
            </button>
          </div>
        </section>

        {/* Notifications & Privacy */}
        <section className="bg-gray-50 dark:bg-slate-900/70 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            <Bell className="w-4 h-4" /> Notifications & Privacy
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Message Alerts</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">Receive popup sound and badge notifications</p>
            </div>
            <input
              type="checkbox"
              checked={notifications}
              onChange={async (e) => {
                const val = e.target.checked;
                setNotifications(val);
                if (val) {
                  await requestBrowserNotificationPermission();
                }
              }}
              className="w-5 h-5 accent-sky-600 rounded-md cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-1 border-t border-gray-200 dark:border-gray-800 pt-3">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Read Receipts (Blue Ticks)</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">If turned off, you won't send or receive read receipts</p>
            </div>
            <input
              type="checkbox"
              checked={readReceipts}
              onChange={(e) => setReadReceipts(e.target.checked)}
              className="w-5 h-5 accent-sky-600 rounded-md cursor-pointer"
            />
          </div>
        </section>

        {/* Account Security Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-slate-900/70 rounded-2xl border border-gray-200 dark:border-gray-800 flex items-center gap-3">
            <Shield className="w-6 h-6 text-sky-500 flex-shrink-0" />
            <div>
              <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100">End-to-End Encrypted</h5>
              <p className="text-[10px] text-gray-500">AES-256 Protocol</p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-slate-900/70 rounded-2xl border border-gray-200 dark:border-gray-800 flex items-center gap-3">
            <Key className="w-6 h-6 text-indigo-500 flex-shrink-0" />
            <div>
              <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100">Two-Step Verification</h5>
              <p className="text-[10px] text-gray-500">PIN Enabled</p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-slate-900/70 rounded-2xl border border-gray-200 dark:border-gray-800 flex items-center gap-3">
            <Database className="w-6 h-6 text-emerald-500 flex-shrink-0" />
            <div>
              <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100">Encrypted Backups</h5>
              <p className="text-[10px] text-gray-500">Daily Cloud Sync</p>
            </div>
          </div>
        </div>

        {/* Help & Support */}
        <div className="text-center pt-4">
          <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
            <HelpCircle className="w-4 h-4" /> SB Chat Web Pro v2.4.0 • Production Scalable Release
          </p>
        </div>
      </div>
    </div>
  );
};
