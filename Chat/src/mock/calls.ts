import type { CallLog } from '../types/chat.types';
import { MOCK_USERS } from './users';

export const MOCK_CALL_LOGS: CallLog[] = [
  {
    id: 'call_1',
    contactId: 'user_rahul',
    contact: MOCK_USERS.find((u) => u.id === 'user_rahul')!,
    type: 'video',
    status: 'incoming',
    timestamp: 'Today, 10:15 AM',
    duration: '4 mins 12 secs',
  },
  {
    id: 'call_2',
    contactId: 'user_priya',
    contact: MOCK_USERS.find((u) => u.id === 'user_priya')!,
    type: 'audio',
    status: 'outgoing',
    timestamp: 'Yesterday, 4:20 PM',
    duration: '12 mins 05 secs',
  },
  {
    id: 'call_3',
    contactId: 'user_amit',
    contact: MOCK_USERS.find((u) => u.id === 'user_amit')!,
    type: 'audio',
    status: 'missed',
    timestamp: 'Yesterday, 11:45 AM',
  },
  {
    id: 'call_4',
    contactId: 'user_sanya',
    contact: MOCK_USERS.find((u) => u.id === 'user_sanya')!,
    type: 'video',
    status: 'outgoing',
    timestamp: 'August 20, 3:30 PM',
    duration: '25 mins 40 secs',
  },
];
