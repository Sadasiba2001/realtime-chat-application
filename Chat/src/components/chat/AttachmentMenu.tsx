import React from 'react';
import { Image, FileText, Headphones, MapPin, UserCheck } from 'lucide-react';
import type { Attachment } from '../../types/chat.types';

interface AttachmentMenuProps {
  onSelectAttachment: (attachment: Attachment) => void;
  onClose: () => void;
}

export const AttachmentMenu: React.FC<AttachmentMenuProps> = ({
  onSelectAttachment,
  onClose,
}) => {
  const handlePickMockImage = () => {
    onSelectAttachment({
      id: `att_${Date.now()}`,
      type: 'image',
      url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
      name: 'sunset_design.jpg',
      size: '2.1 MB',
    });
    onClose();
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
      onClick: handlePickMockImage,
    },
    {
      label: 'Document',
      icon: <FileText className="w-5 h-5 text-blue-500" />,
      bg: 'bg-blue-100 dark:bg-blue-950/60',
      onClick: handlePickMockDocument,
    },
    {
      label: 'Audio',
      icon: <Headphones className="w-5 h-5 text-amber-500" />,
      bg: 'bg-amber-100 dark:bg-amber-950/60',
      onClick: handlePickMockAudio,
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
