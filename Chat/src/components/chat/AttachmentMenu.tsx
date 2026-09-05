import React, { useRef } from 'react';
import { Image, FileText, Headphones, MapPin, UserCheck } from 'lucide-react';
import type { Attachment } from '../../types/chat.types';
import { useChat } from '../../context/ChatContext';

interface AttachmentMenuProps {
  onSelectAttachment: (attachment: Attachment) => void;
  onClose: () => void;
}

export const AttachmentMenu: React.FC<AttachmentMenuProps> = ({
  onSelectAttachment,
  onClose,
}) => {
  const { openModal, setActiveNotification } = useChat();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const handleRealFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      if (setActiveNotification) {
        setActiveNotification({
          id: `err_${Date.now()}`,
          type: 'error',
          message: 'This file is not a supported image.',
        });
      }
      onClose();
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      if (setActiveNotification) {
        setActiveNotification({
          id: `err_${Date.now()}`,
          type: 'error',
          message: 'Image size exceeds the allowed limit (10 MB).',
        });
      }
      onClose();
      return;
    }

    const formattedSize =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    const previewUrl = URL.createObjectURL(file);

    openModal('image_preview', {
      file,
      previewUrl,
      name: file.name,
      size: formattedSize,
    });
    onClose();
  };

  const handleGenericFileSelect = (e: React.ChangeEvent<HTMLInputElement>, category: 'document' | 'audio') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      if (setActiveNotification) {
        setActiveNotification({
          id: `err_${Date.now()}`,
          type: 'error',
          message: 'File size exceeds the allowed limit (10 MB).',
        });
      }
      onClose();
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const prohibited = ['exe', 'bat', 'cmd', 'sh', 'php', 'js', 'vbs'];
    if (prohibited.includes(ext)) {
      if (setActiveNotification) {
        setActiveNotification({
          id: `err_${Date.now()}`,
          type: 'error',
          message: 'This file type is not supported.',
        });
      }
      onClose();
      return;
    }

    const formattedSize =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    let fileType: Attachment['type'] = category;
    if (file.type.startsWith('video/')) fileType = 'video';
    else if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) fileType = 'document';

    onSelectAttachment({
      id: `att_${Date.now()}`,
      type: fileType,
      url: URL.createObjectURL(file),
      name: file.name,
      size: formattedSize,
      mimeType: file.type,
    });
    onClose();
  };

  const handlePickImageClick = () => {
    fileInputRef.current?.click();
  };

  const handlePickDocumentClick = () => {
    docInputRef.current?.click();
  };

  const handlePickAudioClick = () => {
    audioInputRef.current?.click();
  };

  const handlePickMockDocument = () => {
    onSelectAttachment({
      id: `att_${Date.now()}`,
      type: 'document',
      url: '#',
      name: 'Project_Requirements_v1.pdf',
      size: '4.5 MB',
      mimeType: 'application/pdf',
    });
    onClose();
  };

  const handlePickMockAudio = () => {
    onSelectAttachment({
      id: `att_${Date.now()}`,
      type: 'audio',
      url: '#',
      name: 'Voice_Note_002.mp3',
      size: '850 KB',
      duration: '0:45',
    });
    onClose();
  };

  const handlePickMockLocation = () => {
    onSelectAttachment({
      id: `att_${Date.now()}`,
      type: 'location',
      url: 'https://maps.google.com',
      latitude: 19.076,
      longitude: 72.8777,
      locationName: 'Bandra Kurla Complex, Mumbai',
    });
    onClose();
  };

  const handlePickMockContact = () => {
    onSelectAttachment({
      id: `att_${Date.now()}`,
      type: 'contact',
      url: '#',
      contactName: 'Rohan Mehta',
      contactPhone: '+91 98989 12345',
    });
    onClose();
  };

  const items = [
    {
      label: 'Photos & Videos',
      icon: <Image className="w-5 h-5 text-purple-500" />,
      bg: 'bg-purple-100 dark:bg-purple-950/60',
      onClick: handlePickImageClick,
    },
    {
      label: 'Document',
      icon: <FileText className="w-5 h-5 text-blue-500" />,
      bg: 'bg-blue-100 dark:bg-blue-950/60',
      onClick: handlePickDocumentClick,
    },
    {
      label: 'Audio',
      icon: <Headphones className="w-5 h-5 text-amber-500" />,
      bg: 'bg-amber-100 dark:bg-amber-950/60',
      onClick: handlePickAudioClick,
    },
    {
      label: 'Location',
      icon: <MapPin className="w-5 h-5 text-emerald-500" />,
      bg: 'bg-emerald-100 dark:bg-emerald-950/60',
      onClick: handlePickMockLocation,
    },
    {
      label: 'Contact Card',
      icon: <UserCheck className="w-5 h-5 text-rose-500" />,
      bg: 'bg-rose-100 dark:bg-rose-950/60',
      onClick: handlePickMockContact,
    },
  ];

  return (
    <div className="w-56 bg-white dark:bg-[#111b21] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-2 animate-fade-in z-50 select-none">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleRealFileSelect}
      />
      <input
        type="file"
        ref={docInputRef}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.ppt,.pptx,.zip,.rar,.tar,.gz"
        className="hidden"
        onChange={(e) => handleGenericFileSelect(e, 'document')}
      />
      <input
        type="file"
        ref={audioInputRef}
        accept="audio/*,video/*,.mp3,.wav,.ogg,.m4a,.mp4,.webm,.mov"
        className="hidden"
        onChange={(e) => handleGenericFileSelect(e, 'audio')}
      />
      <div className="space-y-1">
        {items.map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
          >
            <div className={`p-2 rounded-xl ${item.bg} flex items-center justify-center`}>
              {item.icon}
            </div>
            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
