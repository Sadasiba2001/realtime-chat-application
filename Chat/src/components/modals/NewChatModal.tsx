import React, { useState, useEffect } from 'react';
import { Search, Users, Check } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useChat } from '../../context/ChatContext';
import { MOCK_USERS } from '../../mock/users';
import { userService } from '../../services/user.service';
import { Avatar } from '../common/Avatar';
import type { User } from '../../types/chat.types';

export const NewChatModal: React.FC = () => {
  const { activeModal, closeModal, createNewChat, createNewGroup, currentUser } = useChat();
  const [search, setSearch] = useState('');
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>(MOCK_USERS);

  useEffect(() => {
    let isMounted = true;
    userService
      .searchUsers(search)
      .then((users) => {
        if (isMounted) setSearchResults(users);
      })
      .catch(() => {
        if (isMounted) {
          const q = search.toLowerCase().trim();
          const filtered = MOCK_USERS.filter(
            (u) =>
              u.name.toLowerCase().includes(q) ||
              (u as { username?: string }).username?.toLowerCase().includes(q) ||
              u.phone.toLowerCase().includes(q) ||
              (u.email && u.email.toLowerCase().includes(q))
          );
          setSearchResults(filtered);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [search]);

  if (activeModal !== 'new_chat') return null;

  const contacts = searchResults.filter((u: User) => {
    const myIdStr = String(currentUser.id).trim();
    const uIdStr = String(u.id).trim();
    if (myIdStr === uIdStr) return false;

    const myMatch = myIdStr.match(/\d+/);
    const uMatch = uIdStr.match(/\d+/);
    if (myMatch && uMatch && myMatch[0] === uMatch[0]) return false;

    if (currentUser.email && u.email && currentUser.email.toLowerCase() === u.email.toLowerCase()) return false;
    return true;
  });

  const toggleSelectMember = (user: User) => {
    if (selectedMembers.some((m) => m.id === user.id)) {
      setSelectedMembers(selectedMembers.filter((m) => m.id !== user.id));
    } else {
      setSelectedMembers([...selectedMembers, user]);
    }
  };

  const handleCreateGroup = () => {
    if (!groupName.trim() || selectedMembers.length === 0) return;
    createNewGroup(groupName, selectedMembers);
  };

  return (
    <Modal
      isOpen={activeModal === 'new_chat'}
      onClose={closeModal}
      title={isGroupMode ? 'New Group Chat' : 'Start New Conversation'}
      maxWidth="md"
    >
      <div className="space-y-4 select-none">
        {/* Toggle Mode */}
        <div className="flex bg-gray-100 dark:bg-[#202c33] p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setIsGroupMode(false)}
            className={`flex-1 py-2 rounded-lg transition-all ${
              !isGroupMode ? 'bg-white dark:bg-[#111b21] text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-gray-500'
            }`}
          >
            Direct Message
          </button>
          <button
            onClick={() => setIsGroupMode(true)}
            className={`flex-1 py-2 rounded-lg transition-all ${
              isGroupMode ? 'bg-white dark:bg-[#111b21] text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-gray-500'
            }`}
          >
            New Group
          </button>
        </div>

        {/* Group Name Input if Group Mode */}
        {isGroupMode && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Group Subject / Name
            </label>
            <input
              type="text"
              placeholder="e.g. Frontend Architecture Sync"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-[#202c33] text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-gray-700 outline-hidden"
            />
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-[#202c33] text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-gray-700 outline-hidden"
          />
        </div>

        {/* Contact List */}
        <div className="max-h-60 overflow-y-auto space-y-1 divide-y divide-gray-100 dark:divide-gray-800/40">
          {contacts.map((contact: User) => {
            const isSelected = selectedMembers.some((m) => m.id === contact.id);

            return (
              <div
                key={contact.id}
                onClick={() => (isGroupMode ? toggleSelectMember(contact) : createNewChat(contact))}
                className="flex items-center justify-between p-2.5 hover:bg-gray-100 dark:hover:bg-[#202c33] rounded-xl cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar src={contact.avatar} name={contact.name} size="md" status={contact.status} showStatus />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{contact.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{contact.about}</p>
                  </div>
                </div>

                {isGroupMode && (
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-400'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Button for Group */}
        {isGroupMode && (
          <button
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedMembers.length === 0}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4" /> Create Group ({selectedMembers.length} selected)
          </button>
        )}
      </div>
    </Modal>
  );
};
