import { describe, it, expect } from 'vitest';
import { getDirectConversationId, getTargetUserIdFromConversation } from '@/utils/conversation.utils';

describe('conversation.utils unit tests', () => {
  it('should generate deterministic direct conversation ID regardless of user order', () => {
    const id1 = getDirectConversationId(5, 12);
    const id2 = getDirectConversationId(12, 5);
    expect(id1).toBe(id2);
    expect(id1).toBe('conv_5_12');
  });

  it('should extract target user id from conversation participant IDs', () => {
    const target = getTargetUserIdFromConversation('user_1', ['user_1', 'user_2']);
    expect(target).toBe('user_2');
  });

  it('should return null if conversation only contains current user', () => {
    const target = getTargetUserIdFromConversation('user_1', ['user_1']);
    expect(target).toBeNull();
  });
});
