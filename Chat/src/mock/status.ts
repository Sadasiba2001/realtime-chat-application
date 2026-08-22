import type { StatusItem } from '../types/chat.types';
import { MOCK_USERS } from './users';

export const MOCK_STATUSES: StatusItem[] = [
  {
    id: 'status_rahul_1',
    userId: 'user_rahul',
    user: MOCK_USERS.find((u) => u.id === 'user_rahul')!,
    mediaUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
    caption: 'Late night coding session 💻☕',
    timestamp: 'Today at 8:15 AM',
    viewed: false,
  },
  {
    id: 'status_sanya_1',
    userId: 'user_sanya',
    user: MOCK_USERS.find((u) => u.id === 'user_sanya')!,
    mediaUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    caption: 'Weekend getaway vibes 🏖️✨',
    timestamp: 'Yesterday at 5:30 PM',
    viewed: true,
  },
  {
    id: 'status_priya_1',
    userId: 'user_priya',
    user: MOCK_USERS.find((u) => u.id === 'user_priya')!,
    caption: 'Design isn\'t just what it looks like and feels like. Design is how it works.',
    backgroundColor: '#00a884',
    timestamp: 'Yesterday at 2:10 PM',
    viewed: true,
  },
];
