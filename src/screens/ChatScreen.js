// ─────────────────────────────────────────────────────────────────────────────
// Ribbit — Chat Screen (Apple Design System & Supabase Real-time)
// Location: C:\Ribbit\RibbitApp\src\screens\ChatScreen.js
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
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
  ActivityIndicator,
  Modal,
  Alert,
  BackHandler,
  Keyboard,
  Linking,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { theme } from '../utils/theme';
import { useLanguage } from '../utils/i18n';
import supabase from '../services/supabaseClient';
import { dataService } from '../services/dataService';

const audioRecorderPlayer = new AudioRecorderPlayer();

const EMOJIS_LIST = [
  '😊', '😂', '😍', '👍',
  '❤️', '🙏', '😭', '😎',
  '😉', '🔥', '😮', '🐸',
  '🔊', '📷', '📍', '💬'
];

const formatTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const hrs = date.getHours().toString().padStart(2, '0');
  const mins = date.getMinutes().toString().padStart(2, '0');
  return `${hrs}:${mins}`;
};

export default function ChatScreen({ navigation, route }) {
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  
  // Active Chat states
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState('');

  // Audio Recording & Playing States
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState('00:00');
  const [playingAudioUrl, setPlayingAudioUrl] = useState(null);
  const [playTime, setPlayTime] = useState('00:00');
  const [playDuration, setPlayDuration] = useState('00:00');

  // Dynamically hide/show the parent tab navigator bottom bar
  useEffect(() => {
    if (selectedChat) {
      navigation.setOptions({
        tabBarStyle: { display: 'none' }
      });
    } else {
      navigation.setOptions({
        tabBarStyle: {
          backgroundColor: 'rgb(15, 23, 42)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(249, 250, 251, 0.08)',
          height: Platform.OS === 'ios' ? 88 : 65,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 10,
        }
      });
    }
    // Fechar emoji picker ao mudar de tela
    setShowEmojiPicker(false);
  }, [selectedChat, navigation]);

  // Emoji picker visibility state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Fullscreen image viewer states
  const [selectedViewerImage, setSelectedViewerImage] = useState(null);
  const [showViewerMenu, setShowViewerMenu] = useState(false);

  // Voice message playback speed state (1.0x, 1.25x, 1.50x, 2.0x)
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  // Close emoji picker automatically if native keyboard opens
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setShowEmojiPicker(false);
    });
    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);
  
  // New Chat Modal states
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const messagesListRef = useRef(null);

  // 1. Fetch current session user
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setCurrentUser(session.user);
      }
    });
  }, []);

  // Intercept native back press to exit active chat room
  useEffect(() => {
    const backAction = () => {
      if (selectedChat) {
        setSelectedChat(null);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [selectedChat]);

  // 2. Fetch user's chats
  const loadChats = async () => {
    if (!currentUser) return;
    try {
      const chatData = await dataService.getChats(currentUser.id);
      if (chatData && chatData.length > 0) {
        const chatsWithDetails = await Promise.all(
          chatData.map(async (chat) => {
            const latestMsg = await dataService.getLatestMessage(chat.id);
            const unreadCount = await dataService.getUnreadCount(chat.id, currentUser.id);
            return {
              ...chat,
              last_message: latestMsg ? latestMsg.text : chat.last_message,
              last_message_time: latestMsg ? latestMsg.created_at : chat.created_at,
              unread_count: unreadCount,
            };
          })
        );
        // Sort by last_message_time descending
        chatsWithDetails.sort((a, b) => {
          const timeA = new Date(a.last_message_time || a.created_at);
          const timeB = new Date(b.last_message_time || b.created_at);
          return timeB - timeA;
        });
        setChats(chatsWithDetails);
      } else {
        setChats([]);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadChats();

      // Backup Polling: Sync conversation cards list every 5 seconds
      const chatsPolling = setInterval(() => {
        loadChats();
      }, 5000);
      
      // Subscribe to chats changes to update the conversation list in real-time
      const chatsChannel = supabase
        .channel('realtime-chats-list')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'chats' },
          () => {
            loadChats();
          }
        )
        .subscribe();

      // Also subscribe to messages changes to instantly capture new texts and unread changes
      const messagesChannel = supabase
        .channel('realtime-messages-list')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'messages' },
          () => {
            loadChats();
          }
        )
        .subscribe();

      return () => {
        clearInterval(chatsPolling);
        chatsChannel.unsubscribe();
        messagesChannel.unsubscribe();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // 3. Handle navigation params to auto-open a chat (e.g. from Profile Card)
  const handleSelectChatById = async (chatId) => {
    if (!currentUser) return;
    try {
      setLoadingMessages(true);
      const chatList = await dataService.getChats(currentUser.id);
      const foundChat = chatList.find(c => c.id === chatId);
      if (foundChat) {
        setSelectedChat(foundChat);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (route?.params?.selectedChatId && currentUser) {
      const chatId = route.params.selectedChatId;
      handleSelectChatById(chatId);
      // Clear navigation params so we don't loop
      navigation.setParams({ selectedChatId: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route?.params?.selectedChatId, currentUser]);

  // 4. Fetch messages when a chat is selected
  useEffect(() => {
    if (!selectedChat || !currentUser) return;

    let isFirstLoad = true;

    const fetchMessages = async () => {
      if (isFirstLoad) {
        setLoadingMessages(true);
      }
      try {
        const msgs = await dataService.getMessages(selectedChat.id);
        
        // Only trigger state update if messages data is different
        setMessages((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(msgs)) return prev;
          return msgs || [];
        });
        
        // Mark messages from other user as delivered
        await dataService.markMessagesAsDelivered(selectedChat.id, currentUser.id);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        if (isFirstLoad) {
          setLoadingMessages(false);
          isFirstLoad = false;
        }
      }
    };

    fetchMessages();

    // Backup Polling: Sync active messages every 3 seconds
    const pollingInterval = setInterval(() => {
      fetchMessages();
    }, 3000);

    // Subscribe to messages changes in this chat
    const messagesChannel = supabase
      .channel(`chat-messages-${selectedChat.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${selectedChat.id}`,
        },
        async (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
          // Mark as delivered
          if (payload.new.sender_id !== currentUser.id) {
            await dataService.markMessagesAsDelivered(selectedChat.id, currentUser.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${selectedChat.id}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === payload.new.id ? payload.new : m))
          );
        }
      )
      .subscribe();

    return () => {
      clearInterval(pollingInterval);
      messagesChannel.unsubscribe();
    };
  }, [selectedChat, currentUser]);

  // Scroll to bottom when messages load/change
  useEffect(() => {
    if (messages.length > 0 && messagesListRef.current) {
      setTimeout(() => {
        messagesListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Toggle emoji picker visibility (dismisses native keyboard)
  const toggleEmojiPicker = () => {
    if (showEmojiPicker) {
      setShowEmojiPicker(false);
    } else {
      Keyboard.dismiss();
      setShowEmojiPicker(true);
    }
  };

  // Add selected emoji to the end of current text message
  const handleSelectEmoji = (emoji) => {
    setMessageText((prev) => prev + emoji);
  };

  // 5. Send Message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedChat || !currentUser) return;
    const textToSend = messageText.trim();
    setMessageText('');
    setShowEmojiPicker(false); // Close picker on send
    try {
      const sentMsg = await dataService.sendMessage(selectedChat.id, currentUser.id, textToSend);
      if (sentMsg) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === sentMsg.id)) return prev;
          return [...prev, sentMsg];
        });
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível enviar a mensagem.');
    }
  };

  // Clean up audio recorder and player on unmount
  useEffect(() => {
    return () => {
      audioRecorderPlayer.stopRecorder().catch(() => {});
      audioRecorderPlayer.removeRecordBackListener();
      audioRecorderPlayer.stopPlayer().catch(() => {});
      audioRecorderPlayer.removePlayBackListener();
    };
  }, []);

  // Image Helper: Upload and send image message using stable Base64/ArrayBuffer
  const handleUploadAndSendImage = async (uri, mimeType, base64) => {
    if (!selectedChat || !currentUser) return;
    try {
      setLoadingMessages(true);
      const publicUrl = await dataService.uploadChatFile(currentUser.id, uri, mimeType || 'image/jpeg', base64);
      const textToSend = `[image]:${publicUrl}`;
      const sentMsg = await dataService.sendMessage(selectedChat.id, currentUser.id, textToSend);
      if (sentMsg) {
        setMessages((prev) => [...prev, sentMsg]);
      }
    } catch (error) {
      console.error('Image send error:', error);
      Alert.alert('Erro', 'Não foi possível enviar a imagem.');
    } finally {
      setLoadingMessages(false);
      setTimeout(() => {
        messagesListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  };

  // Attachment: open image gallery
  const handleAttachment = () => {
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.8, includeBase64: true },
      (response) => {
        if (response.didCancel || response.errorCode || !response.assets?.[0]) return;
        const asset = response.assets[0];
        handleUploadAndSendImage(asset.uri, asset.type, asset.base64);
      }
    );
  };

  // Camera: open native camera
  const handleCamera = () => {
    launchCamera(
      { mediaType: 'photo', quality: 0.8, saveToPhotos: false, includeBase64: true },
      (response) => {
        if (response.didCancel || response.errorCode || !response.assets?.[0]) return;
        const asset = response.assets[0];
        handleUploadAndSendImage(asset.uri, asset.type, asset.base64);
      }
    );
  };

  // Start Audio Recording
  const startAudioRecording = async () => {
    try {
      setIsRecording(true);
      setRecordTime('00:00');
      
      const uri = await audioRecorderPlayer.startRecorder(undefined); // Automatic temp filename
      audioRecorderPlayer.addRecordBackListener((e) => {
        const seconds = Math.floor(e.currentPosition / 1000);
        const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
        const ss = Math.floor(seconds % 60).toString().padStart(2, '0');
        setRecordTime(`${mm}:${ss}`);
      });
      console.log('Gravando áudio em:', uri);
    } catch (err) {
      console.error('Erro ao iniciar gravação:', err);
      setIsRecording(false);
      Alert.alert('Erro', 'Não foi possível acessar o microfone.');
    }
  };

  // Stop & Upload/Cancel Audio Recording
  const stopAudioRecording = async (shouldSend) => {
    try {
      const uri = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setIsRecording(false);
      
      if (!shouldSend || !uri) {
        console.log('Gravação cancelada.');
        return;
      }

      setLoadingMessages(true);
      // Upload do arquivo m4a/mp4 de áudio
      const publicUrl = await dataService.uploadChatFile(currentUser.id, uri, 'audio/mp4');
      const textToSend = `[audio]:${publicUrl}`;
      const sentMsg = await dataService.sendMessage(selectedChat.id, currentUser.id, textToSend);
      if (sentMsg) {
        setMessages((prev) => [...prev, sentMsg]);
      }
    } catch (err) {
      console.error('Erro ao salvar gravação:', err);
      Alert.alert('Erro', 'Falha ao processar arquivo de áudio.');
    } finally {
      setLoadingMessages(false);
      setTimeout(() => {
        messagesListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  };

  // Play / Pause Audio messages in bubbles
  const togglePlayAudio = async (audioUrl) => {
    try {
      if (playingAudioUrl === audioUrl) {
        // Pausar/Parar se for o mesmo áudio
        await audioRecorderPlayer.stopPlayer();
        setPlayingAudioUrl(null);
      } else {
        // Parar se algum outro áudio estiver tocando
        if (playingAudioUrl) {
          await audioRecorderPlayer.stopPlayer();
        }
        setPlayingAudioUrl(audioUrl);
        setPlayTime('00:00');
        
        await audioRecorderPlayer.startPlayer(audioUrl);
        // Set the active playback speed immediately on start
        await audioRecorderPlayer.setPlaybackSpeed(playbackSpeed);
        
        audioRecorderPlayer.addPlayBackListener((e) => {
          // Tempo atual
          const playSec = Math.floor(e.currentPosition / 1000);
          const mmPlay = Math.floor(playSec / 60).toString().padStart(2, '0');
          const ssPlay = Math.floor(playSec % 60).toString().padStart(2, '0');
          setPlayTime(`${mmPlay}:${ssPlay}`);

          // Duração
          const durSec = Math.floor(e.duration / 1000);
          const mmDur = Math.max(0, Math.floor(durSec / 60)).toString().padStart(2, '0');
          const ssDur = Math.max(0, Math.floor(durSec % 60)).toString().padStart(2, '0');
          setPlayDuration(`${mmDur}:${ssDur}`);

          // Finalizou a reprodução
          if (e.currentPosition === e.duration) {
            audioRecorderPlayer.stopPlayer().catch(() => {});
            setPlayingAudioUrl(null);
          }
        });
      }
    } catch (err) {
      console.error('Erro ao reproduzir áudio:', err);
      setPlayingAudioUrl(null);
    }
  };

  // Cycle playback speed (1x -> 1.25x -> 1.5x -> 2x -> 1x)
  const handleCycleSpeed = async () => {
    let newSpeed = 1.0;
    if (playbackSpeed === 1.0) newSpeed = 1.25;
    else if (playbackSpeed === 1.25) newSpeed = 1.5;
    else if (playbackSpeed === 1.5) newSpeed = 2.0;
    else newSpeed = 1.0;

    setPlaybackSpeed(newSpeed);
    if (playingAudioUrl) {
      try {
        await audioRecorderPlayer.setPlaybackSpeed(newSpeed);
      } catch (err) {
        console.error('Falha ao definir velocidade de reprodução:', err);
      }
    }
  };

  // 6. Open partner profile card modal
  const handleOpenPartnerProfile = (partnerId) => {
    // Navigate to profile tab with param
    navigation.navigate('Perfil', { viewUserProfileId: partnerId });
  };

  // 7. Load profiles for New Chat Modal
  const openNewChatModal = async () => {
    setShowNewChatModal(true);
    setLoadingProfiles(true);
    try {
      const allProfiles = await dataService.getAllProfiles();
      // Filter out self
      const others = (allProfiles || []).filter((p) => p.id !== currentUser?.id);
      setProfiles(others);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const handleStartChatWithUser = async (otherUser) => {
    setShowNewChatModal(false);
    try {
      const chat = await dataService.getOrCreateChat(currentUser.id, otherUser.id);
      // Selected chat will reload and trigger the messages fetch
      setSelectedChat({
        ...chat,
        recipient: otherUser,
        user: currentUser
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar a conversa.');
    }
  };

  // Get recipient profile info from chat row
  const getPartnerInfo = (chatRow) => {
    if (!currentUser || !chatRow) return { name: '', avatar_url: '', id: '' };
    const isSelfUser = chatRow.user_id === currentUser.id;
    const partner = isSelfUser ? chatRow.recipient : chatRow.user;
    return {
      id: partner?.id || '',
      name: partner?.full_name || 'Usuário Ribbit',
      avatar_url: partner?.avatar_url || null,
      nivel: partner?.nivel || 'Bronze'
    };
  };

  // Filter profiles based on search query
  const filteredProfiles = profiles.filter((p) =>
    (p.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // MAIN RENDER: Chats List
  if (!selectedChat) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Chat</Text>
          <Text style={styles.subtitle}>{t('chat_subtitle')}</Text>
        </View>

        {loadingChats ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={chats}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={() => (
              <View style={{ alignItems: 'center', marginTop: 40 }}>
                <Text style={styles.emptyText}>Nenhuma conversa iniciada.</Text>
                <TouchableOpacity
                  style={{
                    marginTop: 16,
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                    backgroundColor: theme.colors.primary,
                    borderRadius: 20,
                  }}
                  onPress={openNewChatModal}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>
                    💬 {t('start_chat')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            renderItem={({ item }) => {
              const partner = getPartnerInfo(item);
              return (
                <TouchableOpacity
                  style={styles.chatItem}
                  onPress={() => setSelectedChat(item)}
                >
                  <TouchableOpacity
                    style={styles.avatarPlaceholder}
                    onPress={() => handleOpenPartnerProfile(partner.id)}
                  >
                    {partner.avatar_url ? (
                      <Image source={{ uri: partner.avatar_url }} style={styles.avatarImage} />
                    ) : (
                      <Text style={styles.avatarText}>{partner.name[0].toUpperCase()}</Text>
                    )}
                  </TouchableOpacity>
                  <View style={styles.chatInfo}>
                    <View style={styles.chatTopRow}>
                      <Text style={styles.chatName} numberOfLines={1}>{partner.name}</Text>
                      <Text style={styles.chatTime}>{formatTime(item.created_at)}</Text>
                    </View>
                    <View style={styles.chatBottomRow}>
                      <Text style={styles.lastMessage} numberOfLines={1}>
                        {item.last_message || 'Inicie a conversa'}
                      </Text>
                      {item.unread_count > 0 && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadText}>{item.unread_count}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}

        <TouchableOpacity style={styles.fabNewChat} onPress={openNewChatModal}>
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>

        {/* New Chat Search Modal */}
        <Modal
          visible={showNewChatModal}
          animationType="slide"
          onRequestClose={() => setShowNewChatModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('new_chat_title')}</Text>
              <TouchableOpacity onPress={() => setShowNewChatModal(false)}>
                <Text style={styles.modalCancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder={t('search_users_placeholder')}
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {loadingProfiles ? (
              <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={filteredProfiles}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.modalList}
                ListEmptyComponent={() => (
                  <Text style={styles.emptyText}>Nenhum usuário encontrado.</Text>
                )}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.userListItem}
                    onPress={() => handleStartChatWithUser(item)}
                  >
                    <View style={styles.avatarPlaceholderSmall}>
                      {item.avatar_url ? (
                        <Image source={{ uri: item.avatar_url }} style={styles.avatarImage} />
                      ) : (
                        <Text style={styles.avatarTextSmall}>{item.full_name ? item.full_name[0].toUpperCase() : 'U'}</Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.userName}>{item.full_name}</Text>
                      <Text style={styles.userLevel}>🏆 {item.nivel || 'Bronze'}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </Modal>
      </View>
    );
  }

  // DETAILED CHAT SCREEN
  const activePartner = getPartnerInfo(selectedChat);

  // Use KeyboardAvoidingView with behavior 'padding' on iOS and 'height' on Android
  // to avoid keyboard overlays and double offsets when the Bottom Tab Bar is hidden.
  const ChatWrapper = KeyboardAvoidingView;
  const chatWrapperProps = Platform.OS === 'ios'
    ? { behavior: 'padding', keyboardVerticalOffset: 90 }
    : { behavior: 'padding', keyboardVerticalOffset: 24 };

  return (
    <ChatWrapper style={styles.container} {...chatWrapperProps}>
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={() => setSelectedChat(null)} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹ {t('back')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.chatHeaderUser}
          onPress={() => handleOpenPartnerProfile(activePartner.id)}
        >
          <View style={styles.avatarPlaceholderSmall}>
            {activePartner.avatar_url ? (
              <Image source={{ uri: activePartner.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarTextSmall}>{activePartner.name[0].toUpperCase()}</Text>
            )}
          </View>
          <Text style={styles.chatTitle} numberOfLines={1}>{activePartner.name}</Text>
        </TouchableOpacity>
      </View>

      {loadingMessages ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          ref={messagesListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          renderItem={({ item }) => {
            const isMe = item.sender_id === currentUser?.id;
            
            // Detecta tipo de mensagem
            const isImage = item.text.startsWith('[image]:');
            const isAudio = item.text.startsWith('[audio]:');
            const imageUrl = isImage ? item.text.substring(8) : null;
            const audioUrl = isAudio ? item.text.substring(8) : null;

            return (
              <View
                style={[
                  styles.messageBubble,
                  isMe ? styles.myBubble : styles.otherBubble,
                  isImage && { padding: 4, borderRadius: 12 }, // Estilo mais limpo para imagens
                ]}
              >
                {isImage ? (
                  <TouchableOpacity onPress={() => { setSelectedViewerImage(imageUrl); setShowViewerMenu(false); }}>
                    <Image source={{ uri: imageUrl }} style={{ width: 220, height: 160, borderRadius: 10 }} resizeMode="cover" />
                  </TouchableOpacity>
                ) : isAudio ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', minWidth: 180, paddingVertical: 4 }}>
                    <TouchableOpacity
                      onPress={() => togglePlayAudio(audioUrl)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : 'rgba(52, 199, 89, 0.1)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 10
                      }}
                    >
                      <Text style={{ fontSize: 16, color: isMe ? '#FFFFFF' : theme.colors.primary }}>
                        {playingAudioUrl === audioUrl ? '⏸️' : '▶️'}
                      </Text>
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, color: isMe ? '#FFFFFF' : theme.colors.textPrimary, fontWeight: '500' }}>
                        {playingAudioUrl === audioUrl ? `Tocando ${playTime}` : 'Mensagem de voz'}
                      </Text>
                      {playingAudioUrl === audioUrl && (
                        <Text style={{ fontSize: 10, color: isMe ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary }}>
                          Duração: {playDuration}
                        </Text>
                      )}
                    </View>
                    
                    {/* Playback speed chip buttons (WhatsApp style) */}
                    {playingAudioUrl === audioUrl && (
                      <TouchableOpacity
                        onPress={handleCycleSpeed}
                        style={{
                          marginLeft: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 12,
                          backgroundColor: isMe ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.08)',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '800', color: isMe ? '#FFFFFF' : theme.colors.textPrimary }}>
                          {playbackSpeed}x
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <Text
                    style={[
                      styles.messageText,
                      isMe ? styles.myMessageText : styles.otherMessageText,
                    ]}
                  >
                    {item.text}
                  </Text>
                )}
                
                <View style={styles.messageFooter}>
                  <Text style={[styles.messageTime, isMe ? styles.myTimeText : styles.otherTimeText]}>
                    {formatTime(item.created_at)}
                  </Text>
                  {isMe && (
                    <Text style={styles.checkMark}>
                      {item.status === 'delivered' ? '✓✓' : '✓'}
                    </Text>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* ── WhatsApp-style input bar ── */}
      <View style={styles.inputArea}>
        {isRecording ? (
          // Interface de gravação de áudio ativa
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'space-between' }}>
            <TouchableOpacity style={styles.inputIconBtn} onPress={() => stopAudioRecording(false)}>
              <Text style={{ fontSize: 22 }}>🗑️</Text>
            </TouchableOpacity>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginHorizontal: 12 }}>
              <Text style={{ fontSize: 12, marginRight: 6 }}>🔴</Text>
              <Text style={{ color: '#FF3B30', fontSize: 16, fontWeight: '700' }}>Gravando: {recordTime}</Text>
            </View>

            <TouchableOpacity style={styles.sendFab} onPress={() => stopAudioRecording(true)}>
              <Text style={styles.sendFabIcon}>⏹️</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Interface normal (digitação e botões de mídia)
          <>
            {/* Emoji button */}
            <TouchableOpacity style={styles.inputIconBtn} onPress={toggleEmojiPicker}>
              <Text style={styles.inputIcon}>{showEmojiPicker ? '⌨️' : '😊'}</Text>
            </TouchableOpacity>

            {/* Text input */}
            <TextInput
              style={styles.messageInput}
              placeholder={t('message_placeholder')}
              placeholderTextColor={theme.colors.textSecondary}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              returnKeyType="default"
              onFocus={() => setShowEmojiPicker(false)}
            />

            {/* Attachment clip */}
            <TouchableOpacity style={styles.inputIconBtn} onPress={handleAttachment}>
              <Text style={styles.inputIcon}>📎</Text>
            </TouchableOpacity>

            {/* Camera */}
            <TouchableOpacity style={styles.inputIconBtn} onPress={handleCamera}>
              <Text style={styles.inputIcon}>📷</Text>
            </TouchableOpacity>

            {/* Send arrow (when typing) or Mic (when idle) */}
            {messageText.trim().length > 0 ? (
              <TouchableOpacity style={styles.sendFab} onPress={handleSendMessage}>
                <Text style={styles.sendFabIcon}>➤</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.sendFab} onPress={startAudioRecording}>
                <Text style={styles.sendFabIcon}>🎤</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* ── 16 Emojis 4x4 Grid Drawer ── */}
      {showEmojiPicker && (
        <View style={styles.emojiPickerContainer}>
          <FlatList
            data={EMOJIS_LIST}
            numColumns={4}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.emojiButton}
                onPress={() => handleSelectEmoji(item)}
              >
                <Text style={styles.emojiText}>{item}</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.emojiListContent}
          />
        </View>
      )}
      {/* ── Fullscreen Image Viewer Modal ── */}
      <Modal
        visible={selectedViewerImage !== null}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setSelectedViewerImage(null)}
      >
        <View style={styles.viewerContainer}>
          {/* Transparent Header */}
          <View style={styles.viewerHeader}>
            <TouchableOpacity
              style={styles.viewerCloseButton}
              onPress={() => setSelectedViewerImage(null)}
            >
              <Text style={styles.viewerCloseText}>‹ Voltar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.viewerMenuButton}
              onPress={() => setShowViewerMenu(!showViewerMenu)}
            >
              <Text style={styles.viewerMenuText}>•••</Text>
            </TouchableOpacity>
          </View>

          {/* Expanded Image Body */}
          {selectedViewerImage && (
            <Image
              source={{ uri: selectedViewerImage }}
              style={styles.viewerImage}
              resizeMode="contain"
            />
          )}

          {/* 3-Dots Dropdown Options Menu */}
          {showViewerMenu && (
            <View style={styles.viewerDropdown}>
              <TouchableOpacity
                style={styles.viewerDropdownItem}
                onPress={() => {
                  setShowViewerMenu(false);
                  if (selectedViewerImage) {
                    Linking.openURL(selectedViewerImage).catch((e) => {
                      console.error('Error opening image URL:', e);
                      Alert.alert('Erro', 'Não foi possível baixar a imagem.');
                    });
                  }
                }}
              >
                <Text style={styles.viewerDropdownText}>⬇️ Baixar Imagem</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </ChatWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24, alignItems: 'center' },
  title: { fontSize: 34, fontWeight: '800', color: theme.colors.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: 16, color: theme.colors.textSecondary, marginTop: 8, textAlign: 'center' },
  listContent: { paddingHorizontal: 20, paddingBottom: 30 },
  chatItem: { flexDirection: 'row', padding: 16, backgroundColor: theme.colors.surface, borderRadius: 16, marginBottom: 12, ...theme.shadows.soft, alignItems: 'center' },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(52, 199, 89, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 14, overflow: 'hidden' },
  avatarPlaceholderSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(52, 199, 89, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 10, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: theme.colors.primary, fontSize: 20, fontWeight: '700' },
  avatarTextSmall: { color: theme.colors.primary, fontSize: 16, fontWeight: '700' },
  chatInfo: { flex: 1 },
  chatTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatName: { fontSize: 17, fontWeight: '700', color: theme.colors.textPrimary, flex: 1, marginRight: 8 },
  chatTime: { fontSize: 13, color: theme.colors.textSecondary },
  chatBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  lastMessage: { fontSize: 14, color: theme.colors.textSecondary, flex: 1, marginRight: 8 },
  unreadBadge: { backgroundColor: theme.colors.primary, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  unreadText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, backgroundColor: theme.colors.surface, ...theme.shadows.soft },
  backButton: { marginRight: 16 },
  backButtonText: { color: theme.colors.accent, fontSize: 17, fontWeight: '500' },
  chatHeaderUser: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  chatTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary, flex: 1 },
  messagesList: { padding: 20, paddingBottom: 40 },
  messageBubble: { padding: 12, borderRadius: 18, marginBottom: 10, maxWidth: '80%' },
  myBubble: { alignSelf: 'flex-end', backgroundColor: theme.colors.primary, borderBottomRightRadius: 4 },
  otherBubble: { alignSelf: 'flex-start', backgroundColor: theme.colors.surface, borderBottomLeftRadius: 4, ...theme.shadows.soft },
  messageText: { fontSize: 16, lineHeight: 20 },
  myMessageText: { color: '#FFFFFF' },
  otherMessageText: { color: theme.colors.textPrimary },
  messageFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 4 },
  messageTime: { fontSize: 10, marginRight: 4 },
  myTimeText: { color: 'rgba(255, 255, 255, 0.7)' },
  otherTimeText: { color: theme.colors.textSecondary },
  checkMark: { color: '#34C759', fontSize: 12, fontWeight: 'bold' },

  // ── WhatsApp-style input bar ──
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  inputIconBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputIcon: {
    fontSize: 22,
    lineHeight: 28,
  },
  messageInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: theme.colors.background,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 4,
    color: theme.colors.textPrimary,
    fontSize: 16,
    lineHeight: 20,
  },
  sendFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  sendFabIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  fabNewChat: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.accent, justifyContent: 'center', alignItems: 'center', ...theme.shadows.medium },
  fabIcon: { color: '#FFFFFF', fontSize: 30, fontWeight: '300' },
  emptyText: { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 16 },
  
  // Modal styles
  modalContainer: { flex: 1, backgroundColor: theme.colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: theme.colors.surface },
  modalTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.textPrimary },
  modalCancelText: { color: '#FF3B30', fontSize: 16, fontWeight: '600' },
  searchInput: { backgroundColor: theme.colors.surface, margin: 16, padding: 12, borderRadius: 10, color: theme.colors.textPrimary, fontSize: 16 },
  modalList: { paddingHorizontal: 20 },
  userListItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.surface },
  userName: { color: theme.colors.textPrimary, fontSize: 16, fontWeight: '600' },
  userLevel: { color: theme.colors.primary, fontSize: 12, marginTop: 2 },

  // Emoji Picker Styles
  emojiPickerContainer: {
    height: 220,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  emojiListContent: {
    paddingVertical: 10,
  },
  emojiButton: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  emojiText: {
    fontSize: 28,
  },

  // Image Viewer Styles
  viewerContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 90 : 70,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 10,
  },
  viewerCloseButton: {
    padding: 6,
  },
  viewerCloseText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  viewerMenuButton: {
    padding: 6,
  },
  viewerMenuText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  viewerImage: {
    width: '100%',
    height: '100%',
  },
  viewerDropdown: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 95 : 75,
    right: 20,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 4,
    minWidth: 150,
    zIndex: 20,
    ...theme.shadows.medium,
  },
  viewerDropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewerDropdownText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
