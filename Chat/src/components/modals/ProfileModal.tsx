import React, { useState } from 'react';
import { ZoomIn, Save, User as UserIcon, Phone, Mail, FileText } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';

export const ProfileModal: React.FC = () => {
  const { activeModal, closeModal, openModal, currentUser, updateUserProfile } = useChat();

  const [name, setName] = useState(currentUser.name);
  const [about, setAbout] = useState(currentUser.about);
  const [phone, setPhone] = useState(currentUser.phone);
  const [email, setEmail] = useState(currentUser.email || '');

  if (activeModal !== 'profile') return null;

  const handleSave = () => {
    updateUserProfile({ name, about, phone, email });
    closeModal();
  };

  const handleViewFullPhoto = () => {
    if (currentUser.avatar) {
      openModal('media_viewer', { url: currentUser.avatar, name: `${currentUser.name} Profile Photo`, type: 'image' });
    }
  };

  return (
    <Modal isOpen={activeModal === 'profile'} onClose={closeModal} title="User Profile" maxWidth="md">
      <div className="space-y-6 select-none">
        {/* Avatar Upload / View Container */}
        <div className="flex flex-col items-center justify-center">
          <div
            onClick={handleViewFullPhoto}
            className="relative group cursor-pointer"
            title="Click to view full photo"
          >
            <Avatar src={currentUser.avatar} name={currentUser.name} size="xl" />
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="w-6 h-6" />
            </div>
          </div>
          <button
            onClick={handleViewFullPhoto}
            className="text-xs text-sky-600 dark:text-sky-400 font-semibold mt-2 hover:underline flex items-center gap-1"
          >
            <ZoomIn className="w-3.5 h-3.5" /> View Photo Fullscreen
          </button>
        </div>

        {/* Form Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Your Name
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-gray-700 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              About / Bio
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-gray-700 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-gray-700 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-gray-700 outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-sky-600/30 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4" /> Save Profile Changes
        </button>
      </div>
    </Modal>
  );
};
