import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  Save,
  User as UserIcon,
  Phone,
  Mail,
  FileText,
  Camera,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';

export const ProfileModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    openModal,
    currentUser,
    updateUserProfile,
    uploadProfilePicture,
    removeProfilePicture,
  } = useChat();

  const [name, setName] = useState(currentUser.name);
  const [about, setAbout] = useState(currentUser.about);
  const [phone, setPhone] = useState(currentUser.phone);
  const [email, setEmail] = useState(currentUser.email || '');

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when modal opens or currentUser updates
  useEffect(() => {
    setName(currentUser.name);
    setAbout(currentUser.about);
    setPhone(currentUser.phone);
    setEmail(currentUser.email || '');
    setUploadError(null);
    setUploadSuccess(null);
  }, [currentUser, activeModal]);

  // Clean up object URLs on unmount or when preview changes
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (activeModal !== 'profile') return null;

  const handleSave = () => {
    updateUserProfile({ name, about, phone, email });
    closeModal();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(null);

    // Basic client check
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setUploadError('Please select a JPEG, PNG, or WebP image.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds the 10MB limit. Please choose a smaller photo.');
      return;
    }

    // Temporary local preview
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    setIsUploading(true);
    try {
      await uploadProfilePicture(file);
      setUploadSuccess('Profile picture updated successfully!');
      // Once uploaded, reset local preview since currentUser now has the Cloudinary URL
      setPreviewUrl(null);
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'Failed to upload profile picture. Please try again.';
      setUploadError(errMsg);
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (isUploading) return;
    setUploadError(null);
    setUploadSuccess(null);
    setIsUploading(true);
    try {
      await removeProfilePicture();
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setUploadSuccess('Profile picture removed.');
    } catch {
      setUploadError('Failed to remove profile picture.');
    } finally {
      setIsUploading(false);
    }
  };

  const currentDisplayedAvatar = previewUrl || currentUser.avatar;
  const hasCustomPhoto =
    Boolean(currentDisplayedAvatar) &&
    typeof currentDisplayedAvatar === 'string' &&
    currentDisplayedAvatar.trim() !== '' &&
    !currentDisplayedAvatar.includes('images.unsplash.com');

  const handleViewFullPhoto = () => {
    if (hasCustomPhoto && currentDisplayedAvatar) {
      openModal('media_viewer', {
        url: currentDisplayedAvatar,
        name: `${currentUser.name} Profile Photo`,
        type: 'image',
      });
    }
  };

  return (
    <Modal isOpen={activeModal === 'profile'} onClose={closeModal} title="User Profile" maxWidth="md">
      <div className="space-y-6 select-none">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp, image/jpg"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Avatar Upload / View Container */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative group">
            <Avatar
              src={hasCustomPhoto ? currentDisplayedAvatar : ''}
              name={currentUser.name}
              size="xl"
              onClick={hasCustomPhoto ? handleViewFullPhoto : () => !isUploading && fileInputRef.current?.click()}
            />

            {/* Hover overlay for quick photo upload / change */}
            <div
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title={hasCustomPhoto ? 'Change Profile Photo' : 'Upload Profile Photo'}
            >
              {isUploading ? (
                <Loader2 className="w-7 h-7 animate-spin text-sky-400" />
              ) : (
                <>
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-semibold">{hasCustomPhoto ? 'Change' : 'Upload'}</span>
                </>
              )}
            </div>

            {/* Uploading Spinner Badge */}
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
              </div>
            )}
          </div>

          {/* Action buttons under Avatar */}
          <div className="flex items-center gap-3 mt-3">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Camera className="w-3.5 h-3.5" />
              {hasCustomPhoto ? 'Change Photo' : 'Upload Photo'}
            </button>

            {hasCustomPhoto && (
              <>
                <button
                  type="button"
                  onClick={handleViewFullPhoto}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" /> View Full
                </button>

                <button
                  type="button"
                  disabled={isUploading}
                  onClick={handleRemovePhoto}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Remove Profile Photo"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </>
            )}
          </div>


          {/* Feedback messages */}
          {uploadError && (
            <div className="mt-2 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
          {uploadSuccess && (
            <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              {uploadSuccess}
            </div>
          )}
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

