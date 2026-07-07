// ─────────────────────────────────────────────────────────────────────────────
// Ribbit — Chat Screen (Apple Design System)
// Location: C:\Ribbit\RibbitApp\src\screens\ChatScreen.js
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { theme } from '../utils/theme';

const MOCK_CHATS = [
  { id: '1', name: 'Dr. Helder', lastMessage: 'Aquela espécie parece ser um Leptodactylus.', time: '14:20', unread: 2 },
  { id: '2', name: 'Grupo Mata Atlântica', lastMessage: 'Alguém mais ouviu esse canto hoje?', time: '12:05', unread: 0 },
  { id: '3', name: 'Beatriz Costa', lastMessage: 'Foto incrível!', time: 'Ontem', unread: 0 },
];

export default function ChatScreen() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: '1', text: 'Olá! Vi sua postagem sobre o sapo-de-chifre.', sender: 'other' },
    { id: '2', text: 'Sim! Foi uma sorte incrível encontrar um.', sender: 'me' },
  ]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    setMessages([...messages, { id: Date.now().toString(), text: message, sender: 'me' }]);
    setMessage('');
  };

  if (selectedChat) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setSelectedChat(null)} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹ Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.chatTitle}>{selectedChat.name}</Text>
        </View>

        <FlatList
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          renderItem={({ item }) => (
            <View style={[
              styles.messageBubble,
              item.sender === 'me' ? styles.myBubble : styles.otherBubble
            ]}>
              <Text style={[
                styles.messageText,
                item.sender === 'me' ? styles.myMessageText : styles.otherMessageText
              ]}>{item.text}</Text>
            </View>
          )}
        />

        <View style={styles.inputArea}>
          <TouchableOpacity style={styles.attachButton}>
            <Text style={styles.attachIcon}>🖼️</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.messageInput}
            placeholder="Mensagem..."
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
            <Text style={styles.sendIcon}>🚀</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chat</Text>
        <Text style={styles.subtitle}>Converse com outros pesquisadores</Text>
      </View>

      <FlatList
        data={MOCK_CHATS}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.chatItem} onPress={() => setSelectedChat(item)}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{item.name[0]}</Text>
            </View>
            <View style={styles.chatInfo}>
              <View style={styles.chatTopRow}>
                <Text style={styles.chatName}>{item.name}</Text>
                <Text style={styles.chatTime}>{item.time}</Text>
              </View>
              <View style={styles.chatBottomRow}>
                <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
                {item.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{item.unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fabNewChat}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 24, alignItems: 'center' },
  title: { fontSize: 34, fontWeight: '800', color: theme.colors.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: 16, color: theme.colors.textSecondary, marginTop: 8, textAlign: 'center' },
  listContent: { paddingHorizontal: 20 },
  chatItem: { flexDirection: 'row', padding: 16, backgroundColor: theme.colors.surface, borderRadius: 16, marginBottom: 12, ...theme.shadows.soft, alignItems: 'center' },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(52, 199, 89, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  avatarText: { color: theme.colors.primary, fontSize: 20, fontWeight: '700' },
  chatInfo: { flex: 1 },
  chatTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatName: { fontSize: 17, fontWeight: '700', color: theme.colors.textPrimary },
  chatTime: { fontSize: 13, color: theme.colors.textSecondary },
  chatBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  lastMessage: { fontSize: 14, color: theme.colors.textSecondary, flex: 1, marginRight: 8 },
  unreadBadge: { backgroundColor: theme.colors.primary, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  unreadText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, backgroundColor: theme.colors.surface, ...theme.shadows.soft },
  backButton: { marginRight: 16 },
  backButtonText: { color: theme.colors.accent, fontSize: 17, fontWeight: '500' },
  chatTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary },
  messagesList: { padding: 20 },
  messageBubble: { padding: 12, borderRadius: 18, marginBottom: 10, maxWidth: '80%' },
  myBubble: { alignSelf: 'flex-end', backgroundColor: theme.colors.primary },
  otherBubble: { alignSelf: 'flex-start', backgroundColor: theme.colors.surface, ...theme.shadows.soft },
  messageText: { fontSize: 16 },
  myMessageText: { color: '#FFFFFF' },
  otherMessageText: { color: theme.colors.textPrimary },
  inputArea: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingBottom: Platform.OS === 'ios' ? 30 : 12, backgroundColor: theme.colors.surface, borderTopWidth: 1, borderTopColor: theme.colors.background },
  attachButton: { padding: 8 },
  attachIcon: { fontSize: 24 },
  messageInput: { flex: 1, backgroundColor: theme.colors.background, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginHorizontal: 8, color: theme.colors.textPrimary, fontSize: 16, maxHeight: 100 },
  sendButton: { padding: 8 },
  sendIcon: { fontSize: 24 },
  fabNewChat: { position: 'absolute', bottom: 120, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.accent, justifyContent: 'center', alignItems: 'center', ...theme.shadows.medium },
  fabIcon: { color: '#FFFFFF', fontSize: 30, fontWeight: '300' },
});
