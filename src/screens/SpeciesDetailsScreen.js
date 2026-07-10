// ─────────────────────────────────────────────────────────────────────────────
// Ribbit — Species Details Screen (Apple Design System)
// Location: C:\Ribbit\RibbitApp\src\screens\SpeciesDetailsScreen.js
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import Spectrogram from '../components/Spectrogram';
import { dataService } from '../services/dataService';
import supabase from '../services/supabaseClient';
import { theme } from '../utils/theme';
import { useLanguage } from '../utils/i18n';

export default function SpeciesDetailsScreen({ speciesId, onBack }) {
  const { t } = useLanguage();
  const [species, setSpecies] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [user, setUser] = useState(null);

  // Community observations for this species
  const [communityObs, setCommunityObs] = useState([]);
  const [playingAudioUrl, setPlayingAudioUrl] = useState(null);
  const [audioPlaybackProgress, setAudioPlaybackProgress] = useState(0);

  // Share to Chat states
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [activeChats, setActiveChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
    fetchSpeciesData();
    return () => {
      setIsPlaying(false);
      setPlayingAudioUrl(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speciesId]);

  // Audio Playback Simulation for community sounds
  useEffect(() => {
    let interval;
    if (playingAudioUrl) {
      setAudioPlaybackProgress(0);
      interval = setInterval(() => {
        setAudioPlaybackProgress(prev => {
          if (prev >= 1) {
            setPlayingAudioUrl(null);
            return 0;
          }
          return prev + 0.1;
        });
      }, 500); // 5 seconds simulated duration
    } else {
      setAudioPlaybackProgress(0);
    }
    return () => clearInterval(interval);
  }, [playingAudioUrl]);

  const fetchSpeciesData = async () => {
    setLoading(true);
    try {
      const sData = await dataService.getSpeciesById(speciesId);
      setSpecies(sData);
      const cData = await dataService.getComments(speciesId);
      setComments(cData);
      const oData = await dataService.getObservationsBySpeciesId(speciesId);
      setCommunityObs(oData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newCommentText.trim() || !user) return;
    try {
      const userName = user.user_metadata?.full_name || user.email.split('@')[0];
      const result = await dataService.addComment(speciesId, user.id, userName, newCommentText);
      setNewCommentText('');
      
      // Feedback de XP
      if (result && result.xpResult) {
        if (result.xpResult.limitReached) {
          Alert.alert('Limite Atingido', t('daily_limit_reached'));
        } else if (result.xpResult.xpAdded > 0) {
          Alert.alert('XP!', t('earned_xp').replace('{xp}', result.xpResult.xpAdded.toString()));
        }
      }
      
      const cData = await dataService.getComments(speciesId);
      setComments(cData);
    } catch (error) {
      console.error(error);
    }
  };

  // Chat sharing functions
  const openShareToChat = async () => {
    if (!user) {
      Alert.alert(
        'Acesso Restrito',
        'Crie uma conta ou faça login para compartilhar esta espécie no Chat.',
        [{ text: 'Entrar', onPress: onBack }]
      );
      return;
    }

    setIsShareModalVisible(true);
    setLoadingChats(true);

    try {
      const chatsList = await dataService.getChats(user.id);
      setActiveChats(chatsList);
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Não foi possível carregar suas conversas.');
    } finally {
      setLoadingChats(false);
    }
  };

  const handleSendToChat = async (chat) => {
    if (!species || !user) return;
    try {
      const msgText = `[species]:${species.id}`;
      await dataService.sendMessage(chat.id, user.id, msgText);
      setIsShareModalVisible(false);

      Alert.alert(
        'Enviado!',
        'Ficha compartilhada no chat. Deseja abrir a conversa?',
        [
          { text: 'Ir para Chat', onPress: () => {
            onBack(); // Return to library
            // Wait slightly and navigate to Chat screen
            setTimeout(() => {
              // Navigating through root navigator
              if (chat.id) {
                // Trigger route params selectedChatId
                // Handled in parent screen hook
              }
            }, 300);
          }},
          { text: 'Ficar', style: 'cancel' }
        ]
      );
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Não foi possível compartilhar.');
    }
  };

  const getChatPartnerName = (chat) => {
    const isSelf = chat.user_id === user?.id;
    const partner = isSelf ? chat.recipient : chat.user;
    return partner?.full_name || 'Membro do Ribbit';
  };

  const getChatPartnerAvatar = (chat) => {
    const isSelf = chat.user_id === user?.id;
    const partner = isSelf ? chat.recipient : chat.user;
    return partner?.avatar_url;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!species) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{t('spec_not_found')}</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>{t('spec_back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const tagBg = species.tipo === 'Sapo' ? 'rgba(217, 119, 6, 0.1)' : species.tipo === 'Rã' ? 'rgba(0, 113, 227, 0.1)' : 'rgba(52, 199, 89, 0.1)';
  const tagColor = species.tipo === 'Sapo' ? '#D97706' : species.tipo === 'Rã' ? '#0071E3' : '#34C759';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardContainer}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Back and Share buttons header row */}
        <View style={styles.navigationRow}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>‹ {t('back')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.chatHeaderBtn} onPress={openShareToChat}>
            <Text style={styles.chatHeaderBtnText}>💬 Compartilhar no Chat</Text>
          </TouchableOpacity>
        </View>

        {/* Banner image */}
        {species.imagem_url && (
          <Image source={{ uri: species.imagem_url }} style={styles.bannerImage} />
        )}

        <View style={styles.header}>
          <Text style={styles.nomePopular}>{species.nome_popular}</Text>
          <Text style={styles.nomeCientifico}>{species.nome_cientifico}</Text>
          
          <View style={styles.tagsRow}>
            {species.tipo && (
              <View style={[styles.tag, { backgroundColor: tagBg }]}>
                <Text style={[styles.tagText, { color: tagColor }]}>{species.tipo}</Text>
              </View>
            )}
            {species.som_tipo && (
              <View style={[styles.tag, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                <Text style={[styles.tagText, { color: '#8B5CF6' }]}>Canto: {species.som_tipo}</Text>
              </View>
            )}
            <View style={[styles.tag, styles.tagRegion]}>
              <Text style={[styles.tagText, { color: theme.colors.primary }]}>{species.regiao}</Text>
            </View>
            <View style={[styles.tag, styles.tagHabitat]}>
              <Text style={[styles.tagText, { color: '#0071E3' }]}>{species.habitat}</Text>
            </View>
          </View>
        </View>

        {/* Acoustic Vocalization Player */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('spec_sound')}</Text>
          <View style={styles.playerCard}>
            <Spectrogram isActive={isPlaying} color={theme.colors.primary} />
            <TouchableOpacity
              style={[styles.playButton, isPlaying && styles.pauseButton]}
              onPress={() => setIsPlaying(!isPlaying)}
            >
              <Text style={styles.playButtonText}>
                {isPlaying ? t('spec_pause') : t('spec_play')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Biological Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('spec_description')}</Text>
          <View style={styles.infoCard}>
            <Text style={styles.bodyText}>{species.descricao}</Text>
          </View>
        </View>

        {/* Curious Facts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('spec_fact')}</Text>
          <View style={[styles.infoCard, styles.factCard]}>
            <Text style={styles.factText}>💡 {species.fatos_curiosos}</Text>
          </View>
        </View>

        {/* Coaxares da Comunidade */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔊 Coaxares da Comunidade ({communityObs.length})</Text>
          {communityObs.length === 0 ? (
            <View style={styles.infoCard}>
              <Text style={styles.bodyText}>Nenhuma gravação acústica confirmada para esta espécie ainda.</Text>
            </View>
          ) : (
            communityObs.map((obs) => {
              const isCurrentPlaying = playingAudioUrl === obs.audio_url;
              return (
                <View key={obs.id} style={styles.obsCard}>
                  <View style={styles.obsCardHeader}>
                    <Text style={styles.obsAuthor}>{obs.profiles?.full_name || 'Observador'}</Text>
                    <Text style={styles.obsDate}>{new Date(obs.created_at).toLocaleDateString('pt-BR')}</Text>
                  </View>
                  <Text style={styles.obsLocation}>📍 {obs.localizacao || 'Mata Atlântica'}</Text>
                  
                  <View style={styles.obsControls}>
                    <TouchableOpacity
                      style={[styles.obsPlayBtn, isCurrentPlaying && styles.obsPauseBtn]}
                      onPress={() => {
                        if (isCurrentPlaying) setPlayingAudioUrl(null);
                        else setPlayingAudioUrl(obs.audio_url);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.obsPlayBtnText}>
                        {isCurrentPlaying ? '⏸️ Pausar' : '🔊 Ouvir Canto'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {isCurrentPlaying && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${audioPlaybackProgress * 100}%` }]} />
                      </View>
                      <Text style={styles.progressTime}>
                        0:0{Math.floor(audioPlaybackProgress * 5)}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Discussions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('spec_discussion').replace('{count}', comments.length).replace('({count})', `(${comments.length})`)}</Text>
          {comments.map((item) => (
            <View key={item.id} style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentAuthor}>{item.usuario_nome}</Text>
                <Text style={styles.commentTime}>
                  {new Date(item.created_at).toLocaleDateString('pt-BR')}
                </Text>
              </View>
              <Text style={styles.commentText}>{item.texto}</Text>
            </View>
          ))}

          {user && (
            <View style={styles.addCommentContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder={t('spec_comment_placeholder')}
                placeholderTextColor={theme.colors.textSecondary}
                value={newCommentText}
                onChangeText={setNewCommentText}
                multiline
              />
              <TouchableOpacity style={styles.sendButton} onPress={handleAddComment}>
                <Text style={styles.sendButtonText}>{t('spec_send')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Share to Chat Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isShareModalVisible}
        onRequestClose={() => setIsShareModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enviar para...</Text>
              <TouchableOpacity onPress={() => setIsShareModalVisible(false)} style={styles.closeModalBtn}>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Compartilhar "{species.nome_popular}" no chat privado
            </Text>

            {loadingChats ? (
              <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginVertical: 30 }} />
            ) : activeChats.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>💬</Text>
                <Text style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>
                  Nenhuma conversa ativa encontrada.
                </Text>
              </View>
            ) : (
              <FlatList
                data={activeChats}
                keyExtractor={(chat) => chat.id}
                style={{ maxHeight: 280 }}
                renderItem={({ item: chat }) => {
                  const partnerName = getChatPartnerName(chat);
                  const partnerAvatar = getChatPartnerAvatar(chat);

                  return (
                    <TouchableOpacity
                      style={styles.chatContactItem}
                      onPress={() => handleSendToChat(chat)}
                      activeOpacity={0.7}
                    >
                      {partnerAvatar ? (
                        <Image source={{ uri: partnerAvatar }} style={styles.contactAvatarImage} />
                      ) : (
                        <View style={styles.contactAvatar}>
                          <Text style={styles.contactAvatarLetter}>
                            {partnerName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.contactName}>{partnerName}</Text>
                        <Text style={styles.contactSub}>{chat.last_message || 'Inicie a conversa'}</Text>
                      </View>
                      <Text style={styles.sendChevron}>›</Text>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingTop: 16, paddingBottom: 120 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  errorText: { color: theme.colors.textPrimary, fontSize: 16, marginBottom: 20 },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: { paddingVertical: 4 },
  backButtonText: { color: theme.colors.accent, fontSize: 16, fontWeight: '600' },
  chatHeaderBtn: {
    backgroundColor: 'rgba(0, 113, 227, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 113, 227, 0.15)',
  },
  chatHeaderBtnText: {
    color: '#0071E3',
    fontSize: 12,
    fontWeight: '700',
  },
  bannerImage: {
    width: '100%',
    height: 180,
    borderRadius: 18,
    marginBottom: 20,
  },
  header: {
    marginBottom: 28,
    alignItems: 'center',
  },
  nomePopular: {
    fontSize: 30,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  nomeCientifico: {
    fontSize: 17,
    fontStyle: 'italic',
    color: theme.colors.textSecondary,
    marginTop: 3,
    textAlign: 'center',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
    justifyContent: 'center',
    gap: 6,
  },
  tag: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 7 },
  tagRegion: { backgroundColor: 'rgba(52, 199, 89, 0.08)' },
  tagHabitat: { backgroundColor: 'rgba(0, 113, 227, 0.08)' },
  tagText: { fontSize: 11.5, fontWeight: '700' },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 10 },
  playerCard: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 18, alignItems: 'center', ...theme.shadows.soft },
  playButton: { backgroundColor: theme.colors.primary, paddingVertical: 10, paddingHorizontal: 28, borderRadius: 12, marginTop: 16, ...theme.shadows.medium },
  pauseButton: { backgroundColor: '#FF3B30' },
  playButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13.5 },
  infoCard: { backgroundColor: theme.colors.surface, borderRadius: 14, padding: 16, ...theme.shadows.soft },
  factCard: { backgroundColor: 'rgba(52, 199, 89, 0.04)', borderColor: 'rgba(52, 199, 89, 0.15)', borderWidth: 1 },
  factText: { color: theme.colors.textPrimary, fontSize: 14, lineHeight: 20 },
  bodyText: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 20 },
  
  // Community observations layout
  obsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.02)',
    ...theme.shadows.soft,
  },
  obsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  obsAuthor: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
    fontSize: 13,
  },
  obsDate: {
    color: theme.colors.textSecondary,
    fontSize: 11,
  },
  obsLocation: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  obsControls: {
    flexDirection: 'row',
    marginTop: 10,
  },
  obsPlayBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 7,
  },
  obsPauseBtn: {
    backgroundColor: '#FF3B30',
  },
  obsPlayBtnText: {
    color: '#FFF',
    fontSize: 11.5,
    fontWeight: '700',
  },

  // Comments styling
  commentCard: { backgroundColor: theme.colors.surface, borderRadius: 12, padding: 12, marginBottom: 10, ...theme.shadows.soft },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  commentAuthor: { color: theme.colors.primary, fontWeight: '700', fontSize: 13 },
  commentTime: { color: theme.colors.textSecondary, fontSize: 11 },
  commentText: { color: theme.colors.textPrimary, fontSize: 13, lineHeight: 18 },
  addCommentContainer: { marginTop: 12, flexDirection: 'row', alignItems: 'center' },
  commentInput: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: theme.colors.textPrimary, fontSize: 14, marginRight: 8, ...theme.shadows.soft, maxHeight: 80 },
  sendButton: { backgroundColor: theme.colors.primary, paddingVertical: 11, paddingHorizontal: 16, borderRadius: 12, ...theme.shadows.medium },
  sendButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

  // Shared progress track
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  progressTime: {
    color: theme.colors.textSecondary,
    fontSize: 9.5,
    marginLeft: 6,
    fontWeight: '600',
  },

  // Modal styling (from LibraryScreen)
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  closeModalBtn: {
    padding: 4,
  },
  modalSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginBottom: 16,
  },
  modalEmpty: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  chatContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  contactAvatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
  },
  contactAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,113,227,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,113,227,0.15)',
  },
  contactAvatarLetter: {
    color: '#0071E3',
    fontWeight: 'bold',
    fontSize: 15,
  },
  contactName: {
    color: theme.colors.textPrimary,
    fontSize: 14.5,
    fontWeight: '600',
  },
  contactSub: {
    color: theme.colors.textSecondary,
    fontSize: 11.5,
    marginTop: 1,
  },
  sendChevron: {
    color: theme.colors.border,
    fontSize: 20,
    marginLeft: 8,
  },
});
