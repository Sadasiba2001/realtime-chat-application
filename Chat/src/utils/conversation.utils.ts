/**
 * Deterministic conversation identifier helper for 1-to-1 direct chats.
 * Always resolves to the same identifier regardless of user argument order.
 * E.g., getDirectConversationId(1, 2) === getDirectConversationId(2, 1) === 'conv_1_2'
 */
export const getDirectConversationId = (
  userId1: string | number,
  userId2: string | number
): string => {
  const s1 = String(userId1).trim();
  const s2 = String(userId2).trim();

  // Extract clean numeric IDs if present
  const num1 = parseInt(s1.replace(/\D+/g, ''), 10);
  const num2 = parseInt(s2.replace(/\D+/g, ''), 10);

  if (!isNaN(num1) && !isNaN(num2)) {
    const smaller = Math.min(num1, num2);
    const larger = Math.max(num1, num2);
    return `conv_${smaller}_${larger}`;
  }

  // Fallback for non-numeric usernames/identifiers (alphabetical sort)
  const sorted = [s1, s2].sort();
  return `conv_${sorted[0]}_${sorted[1]}`;
};

/**
 * Extracts target user ID given current user and direct conversation participant IDs.
 */
export const getTargetUserIdFromConversation = (
  currentUserId: string | number,
  participantIds: (string | number)[]
): string | number | null => {
  const currentStr = String(currentUserId);
  const other = participantIds.find((id) => String(id) !== currentStr);
  return other ?? null;
};
