// ─────────────────────────────────────────────────────────────────────────────
// Ribbit — Jest Chat & Followers Unit Tests
// Location: C:\Ribbit\RibbitApp\__tests__\chat.test.js
// ─────────────────────────────────────────────────────────────────────────────

// Re-creating the pure logic functions from screens/ChatScreen.js and LifeListScreen.js
const getPartnerInfo = (chatRow, currentUserId) => {
  if (!currentUserId || !chatRow) return { name: '', avatar_url: '', id: '' };
  const isSelfUser = chatRow.user_id === currentUserId;
  const partner = isSelfUser ? chatRow.recipient : chatRow.user;
  return {
    id: partner?.id || '',
    name: partner?.full_name || 'Usuário Ribbit',
    avatar_url: partner?.avatar_url || null,
    nivel: partner?.nivel || 'Bronze'
  };
};

const getMessageStatusIndicator = (status, isMe) => {
  if (!isMe) return '';
  return status === 'delivered' ? '✓✓' : '✓';
};

describe('Ribbit Chat & Followers System', () => {
  test('getPartnerInfo correctly determines the chat recipient vs sender', () => {
    const currentUser = { id: 'user-123', full_name: 'Lucas' };
    const partnerUser = { id: 'partner-456', full_name: 'Dr. Helder', avatar_url: 'http://image.png', nivel: 'Ouro' };
    
    // Scenario A: current user initiated the chat
    const chatRowA = {
      id: 'chat-abc',
      user_id: 'user-123',
      recipient_id: 'partner-456',
      user: currentUser,
      recipient: partnerUser
    };
    
    const partnerInfoA = getPartnerInfo(chatRowA, currentUser.id);
    expect(partnerInfoA.id).toBe('partner-456');
    expect(partnerInfoA.name).toBe('Dr. Helder');
    expect(partnerInfoA.avatar_url).toBe('http://image.png');
    expect(partnerInfoA.nivel).toBe('Ouro');

    // Scenario B: partner initiated the chat
    const chatRowB = {
      id: 'chat-abc',
      user_id: 'partner-456',
      recipient_id: 'user-123',
      user: partnerUser,
      recipient: currentUser
    };
    
    const partnerInfoB = getPartnerInfo(chatRowB, currentUser.id);
    expect(partnerInfoB.id).toBe('partner-456');
    expect(partnerInfoB.name).toBe('Dr. Helder');
  });

  test('getMessageStatusIndicator returns double checkmark for delivered and single checkmark for sent', () => {
    expect(getMessageStatusIndicator('delivered', true)).toBe('✓✓');
    expect(getMessageStatusIndicator('sent', true)).toBe('✓');
    // It should return empty string if the message was sent by the other user
    expect(getMessageStatusIndicator('delivered', false)).toBe('');
    expect(getMessageStatusIndicator('sent', false)).toBe('');
  });
});
