// ─────────────────────────────────────────────────────────────────────────────
// Ribbit — Dynamic Social Dashboard Screen
// Location: C:\Ribbit\RibbitApp\src\screens\DashboardScreen.js
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
  Share,
  ActivityIndicator,
  Animated,
  Pressable,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import supabase from '../services/supabaseClient';
import { dataService } from '../services/dataService';
import { theme } from '../utils/theme';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_EMOJIS = ['🐸', '🎙️', '🔍', '🌿', '📝', '🧪', '🦎', '🌙', '🌧️', '🔬', '📍', '❤️', '🏆', '🌊', '🐾'];

const MOCK_STATUSES = [
  { id: 'mock1', name: 'Ana Lima', emoji: '🔍', status: 'Explorando o Cerrado', avatar: null, isSimulated: true },
  { id: 'mock2', name: 'Carlos Bio', emoji: '🎙️', status: 'Gravando coaxares', avatar: null, isSimulated: true },
  { id: 'mock3', name: 'Petra F.', emoji: '🧪', status: 'Analisando amostras', avatar: null, isSimulated: true },
  { id: 'mock4', name: 'Rafa R.', emoji: '🌿', status: 'Mata Atlântica', avatar: null, isSimulated: true },
  { id: 'mock5', name: 'Diogo N.', emoji: '🏆', status: 'Nível Platina!', avatar: null, isSimulated: true },
];

const MOCK_DISCOVERIES = [
  {
    id: 'disc1',
    species: { nome_popular: 'Perereca-de-vidro', nome_cientifico: 'Teratohyla spinosa', imagem_url: 'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?w=600&auto=format&fit=crop' },
    localizacao: 'Litoral Norte, SP',
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    matchChance: 94,
    profiles: { full_name: 'Ana Lima', avatar_url: null },
    isSimulated: true,
  },
  {
    id: 'disc2',
    species: { nome_popular: 'Sapo-cururu', nome_cientifico: 'Rhinella diptycha', imagem_url: 'https://images.unsplash.com/photo-1563200921-774f2662c16c?w=600&auto=format&fit=crop' },
    localizacao: 'Parque Estadual, MG',
    created_at: new Date(Date.now() - 1000 * 60 * 47).toISOString(),
    matchChance: 88,
    profiles: { full_name: 'Carlos Bio', avatar_url: null },
    isSimulated: true,
  },
  {
    id: 'disc3',
    species: { nome_popular: 'Sapinho-pingo-de-ouro', nome_cientifico: 'Brachycephalus ephippium', imagem_url: 'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=600&auto=format&fit=crop' },
    localizacao: 'Serra da Cantareira, SP',
    created_at: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
    matchChance: 97,
    profiles: { full_name: 'Petra F.', avatar_url: null },
    isSimulated: true,
  },
];

const CHALLENGES = [
  { id: 'ch1', emoji: '🌧️', title: 'Registros da Estação Chuvosa', desc: 'Colete 20 gravações de anfíbios da Mata Atlântica neste mês', current: 14, total: 20, color: '#0071E3' },
  { id: 'ch2', emoji: '🦎', title: 'Diversidade do Cerrado', desc: 'Identifique 5 espécies diferentes no Cerrado', current: 3, total: 5, color: '#8B5CF6' },
  { id: 'ch3', emoji: '📸', title: 'Semana da Biodiversidade', desc: 'Contribua com registros por 7 dias consecutivos', current: 5, total: 7, color: '#34C759' },
];

const ARTICLES = [
  {
    id: 'art1',
    title: 'Nova Espécie Descoberta na Amazônia',
    subtitle: 'Pesquisadores da USP catalogam anfíbio translúcido inédito na bacia do Rio Negro',
    emoji: '🔬',
    tag: 'Descoberta',
    tagColor: '#34C759',
    readTime: '4 min',
    date: 'Hoje',
  },
  {
    id: 'art2',
    title: 'Workshop de Bioacústica: Inscrições Abertas',
    subtitle: 'Aprenda a identificar espécies pelo canto com especialistas do INPA e USP',
    emoji: '🎙️',
    tag: 'Evento',
    tagColor: '#0071E3',
    readTime: '2 min',
    date: '2 dias atrás',
  },
  {
    id: 'art3',
    title: 'Impacto das Chuvas na Reprodução dos Anuros',
    subtitle: 'Estudo monitorou 8 espécies na Mata Atlântica por 3 anos consecutivos',
    emoji: '🌧️',
    tag: 'Pesquisa',
    tagColor: '#8B5CF6',
    readTime: '7 min',
    date: '5 dias atrás',
  },
];

// ─── Utilities ────────────────────────────────────────────────────────────────

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins} min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  return `${Math.floor(hrs / 24)}d atrás`;
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AvatarBubble({ name, avatarUrl, emoji, status, isMe, onPress, isSimulated }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true, speed: 30 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={[styles.statusBubbleWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <View style={[styles.statusBubbleRing, isMe && styles.statusBubbleRingMe]}>
          <View style={styles.statusBubbleInner}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.statusBubbleAvatar} />
            ) : (
              <View style={[styles.statusBubbleAvatar, styles.statusBubblePlaceholder]}>
                <Text style={styles.statusBubbleInitials}>{getInitials(name)}</Text>
              </View>
            )}
          </View>
          <View style={styles.statusEmojiBadge}>
            <Text style={{ fontSize: 12 }}>{emoji || '🐸'}</Text>
          </View>
        </View>
        <Text style={styles.statusBubbleName} numberOfLines={1}>{isMe ? 'Você' : name?.split(' ')[0]}</Text>
        {isSimulated && <View style={styles.simDot} />}
      </TouchableOpacity>
    </Animated.View>
  );
}

function DiscoveryCard({ item, onLike, onShare, onViewDetails }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [localLiked, setLocalLiked] = useState(item.liked || false);
  const [localLikes, setLocalLikes] = useState(item.likes || Math.floor(Math.random() * 28) + 3);

  const handleLike = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.3, useNativeDriver: true, speed: 40 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 25 }),
    ]).start();
    setLocalLiked(prev => {
      const newVal = !prev;
      setLocalLikes(l => newVal ? l + 1 : Math.max(0, l - 1));
      return newVal;
    });
    onLike(item.id);
  };

  const speciesName = item.species?.nome_popular || item.sugestao || 'Espécie Não Identificada';
  const imgUrl = item.species?.imagem_url;
  const matchPct = item.matchChance || Math.floor(Math.random() * 20) + 78;
  const isHigh = matchPct >= 85;

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => onViewDetails(item)} style={styles.discoveryCard}>
      {/* Image Banner */}
      {imgUrl ? (
        <Image source={{ uri: imgUrl }} style={styles.discoveryImage} resizeMode="cover" />
      ) : (
        <View style={[styles.discoveryImage, styles.discoveryImagePlaceholder]}>
          <Text style={{ fontSize: 48 }}>🐸</Text>
        </View>
      )}

      {/* Overlay Badges */}
      <View style={styles.discoveryBadgesRow}>
        <View style={[styles.matchBadge, { backgroundColor: isHigh ? 'rgba(52,199,89,0.9)' : 'rgba(255,149,0,0.9)' }]}>
          <Text style={styles.matchBadgeText}>{matchPct}% Match</Text>
        </View>
        {item.isSimulated && (
          <View style={styles.simulationBadge}>
            <Text style={styles.simulationBadgeText}>Simulação</Text>
          </View>
        )}
      </View>

      {/* Card Body */}
      <View style={styles.discoveryBody}>
        {/* Author Row */}
        <View style={styles.discoveryAuthorRow}>
          <View style={styles.discoveryAvatar}>
            <Text style={styles.discoveryAvatarText}>{getInitials(item.profiles?.full_name)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.discoveryAuthorName}>{item.profiles?.full_name || 'Pesquisador Ribbit'}</Text>
            <Text style={styles.discoveryMeta}>📍 {item.localizacao || 'Brasil'} · {timeAgo(item.created_at)}</Text>
          </View>
        </View>

        {/* Species Info */}
        <Text style={styles.discoverySpeciesName}>{speciesName}</Text>
        {item.species?.nome_cientifico && (
          <Text style={styles.discoveryScientific}>{item.species.nome_cientifico}</Text>
        )}

        {/* Actions Row */}
        <View style={styles.discoveryActionsRow}>
          <TouchableOpacity onPress={handleLike} style={styles.discoveryActionBtn}>
            <Animated.Text style={[styles.discoveryActionIcon, { transform: [{ scale: scaleAnim }] }]}>
              {localLiked ? '❤️' : '🤍'}
            </Animated.Text>
            <Text style={[styles.discoveryActionText, localLiked && { color: '#FF3B30' }]}>{localLikes}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onShare(item)} style={styles.discoveryActionBtn}>
            <Text style={styles.discoveryActionIcon}>🔗</Text>
            <Text style={styles.discoveryActionText}>Compartilhar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onViewDetails(item)} style={[styles.discoveryActionBtn, styles.discoveryViewBtn]}>
            <Text style={styles.discoveryViewBtnText}>Ver Ficha</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ChallengeCard({ item }) {
  const progress = item.current / item.total;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 900,
      useNativeDriver: false,
      delay: 300,
    }).start();
  }, [progress, progressAnim]);

  const barWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.challengeCard}>
      <View style={styles.challengeHeader}>
        <Text style={styles.challengeEmoji}>{item.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.challengeTitle}>{item.title}</Text>
          <Text style={styles.challengeDesc} numberOfLines={2}>{item.desc}</Text>
        </View>
        <Text style={[styles.challengeCount, { color: item.color }]}>{item.current}/{item.total}</Text>
      </View>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: barWidth, backgroundColor: item.color }]} />
      </View>
      <Text style={styles.progressLabel}>
        {item.current >= item.total ? '✅ Concluído!' : `Faltam ${item.total - item.current} para completar`}
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [discoveries, setDiscoveries] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [statuses, setStatuses] = useState([]);

  // Status modal
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [myEmoji, setMyEmoji] = useState('🐸');
  const [myStatusText, setMyStatusText] = useState('');

  // Article modal
  const [articleModalItem, setArticleModalItem] = useState(null);

  // Hero banner animation
  const heroScale = useRef(new Animated.Value(1)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(heroOpacity, { toValue: 1, duration: 700, useNativeDriver: true }).start();
  }, [heroOpacity]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        const profile = await dataService.getProfile(user.id);
        setCurrentProfile(profile);

        // Parse emoji/status from bio JSON if saved there
        try {
          const bioObj = JSON.parse(profile?.bio || '{}');
          if (bioObj.dashEmoji) setMyEmoji(bioObj.dashEmoji);
          if (bioObj.dashStatus) setMyStatusText(bioObj.dashStatus);
        } catch (_) {}

        // Build statuses list — user first, then up to 9 mock/real members
        buildStatuses(user, profile);
      } else {
        buildStatuses(null, null);
      }

      // Load feed
      setLoadingFeed(true);
      const obsData = await dataService.getApprovedObservations();
      if (obsData && obsData.length > 0) {
        setDiscoveries(obsData.slice(0, 10));
      } else {
        setDiscoveries(MOCK_DISCOVERIES);
      }
    } catch (e) {
      console.error('Dashboard load error:', e.message);
      setDiscoveries(MOCK_DISCOVERIES);
    } finally {
      setLoadingFeed(false);
    }
  };

  const buildStatuses = (user, profile) => {
    const myEntry = {
      id: user?.id || 'me',
      name: profile?.full_name || 'Você',
      emoji: myEmoji,
      status: myStatusText || 'Toque para editar seu status',
      avatar: profile?.avatar_url || null,
      isMe: true,
    };
    const others = MOCK_STATUSES.slice(0, 9);
    setStatuses([myEntry, ...others]);
  };

  const handleSaveStatus = async () => {
    // Update local statuses array
    setStatuses(prev => prev.map(s => s.isMe ? { ...s, emoji: myEmoji, status: myStatusText } : s));
    setStatusModalVisible(false);

    // Persist in profile bio if user is logged in
    if (currentUser) {
      try {
        const profile = currentProfile;
        let bioObj = {};
        try { bioObj = JSON.parse(profile?.bio || '{}'); } catch (_) {}
        bioObj.dashEmoji = myEmoji;
        bioObj.dashStatus = myStatusText;
        await supabase.from('profiles').update({ bio: JSON.stringify(bioObj) }).eq('id', currentUser.id);
      } catch (_) {}
    }
  };

  const handleShare = async (item) => {
    const speciesName = item.species?.nome_popular || item.sugestao || 'um anfíbio';
    try {
      await Share.share({
        message: `🐸 Encontrei um ${speciesName} no Ribbit! Baixe o app e explore a herpetofauna brasileira: https://ribbit.bio`,
        title: `Descoberta Ribbit: ${speciesName}`,
      });
    } catch (_) {}
  };

  const handleHeroPress = () => {
    Animated.sequence([
      Animated.spring(heroScale, { toValue: 0.97, useNativeDriver: true, speed: 40 }),
      Animated.spring(heroScale, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();
  };

  const handleStatusBubblePress = (item) => {
    if (item.isMe) {
      setStatusModalVisible(true);
    } else {
      Alert.alert(
        `${item.emoji} ${item.name}`,
        item.status || 'Sem status no momento',
        [{ text: 'OK' }]
      );
    }
  };

  const renderDiscoveryItem = ({ item }) => (
    <DiscoveryCard
      item={item}
      onLike={() => {}}
      onShare={handleShare}
      onViewDetails={() => {}}
    />
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {currentUser ? `Olá, ${currentProfile?.full_name?.split(' ')[0] || 'Pesquisador'} 👋` : 'Bem-vindo ao Ribbit 🐸'}
          </Text>
          <Text style={styles.headerSub}>O que há de novo na herpetofauna hoje?</Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={{ fontSize: 22 }}>🌿</Text>
        </View>
      </View>

      {/* ── Status Bar (Stories Style) ── */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Status da Comunidade</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusRow}>
          {statuses.map(item => (
            <AvatarBubble
              key={item.id}
              name={item.name}
              avatarUrl={item.avatar}
              emoji={item.isMe ? myEmoji : item.emoji}
              status={item.isMe ? myStatusText : item.status}
              isMe={item.isMe}
              isSimulated={item.isSimulated}
              onPress={() => handleStatusBubblePress(item)}
            />
          ))}
        </ScrollView>
      </View>

      {/* ── Hero Science Banner ── */}
      <Animated.View style={[styles.heroBanner, { transform: [{ scale: heroScale }], opacity: heroOpacity }]}>
        <TouchableOpacity activeOpacity={0.92} onPress={handleHeroPress} style={styles.heroBannerInner}>
          <View style={styles.heroGlassTag}>
            <Text style={styles.heroTagText}>🔬 ARTIGO EM DESTAQUE</Text>
          </View>
          <Text style={styles.heroTitle}>
            Perereca-de-vidro:{'\n'}A Transparência como{'\n'}Camuflagem Evolutiva
          </Text>
          <Text style={styles.heroMeta}>Pesquisa INPA · 8 min de leitura</Text>
          <View style={styles.heroCta}>
            <Text style={styles.heroCtaText}>Ler artigo →</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Recent Discoveries Feed ── */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Descobertas Recentes</Text>
          <View style={styles.liveDot} />
          <Text style={styles.liveLabel}>AO VIVO</Text>
        </View>

        {loadingFeed ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={discoveries}
            keyExtractor={item => String(item.id)}
            renderItem={renderDiscoveryItem}
            scrollEnabled={false}
            initialNumToRender={5}
            maxToRenderPerBatch={5}
            removeClippedSubviews
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhuma descoberta registrada ainda. Grave um coaxar no Sound ID!</Text>
            }
          />
        )}
      </View>

      {/* ── Community Challenges ── */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Desafios da Comunidade</Text>
        {CHALLENGES.map(ch => <ChallengeCard key={ch.id} item={ch} />)}
      </View>

      {/* ── Articles & News ── */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Novidades & Artigos</Text>
        {ARTICLES.map(article => (
          <TouchableOpacity
            key={article.id}
            style={styles.articleCard}
            activeOpacity={0.78}
            onPress={() => setArticleModalItem(article)}
          >
            <View style={styles.articleEmojiBox}>
              <Text style={{ fontSize: 26 }}>{article.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.articleTagRow}>
                <View style={[styles.articleTag, { borderColor: article.tagColor }]}>
                  <Text style={[styles.articleTagText, { color: article.tagColor }]}>{article.tag}</Text>
                </View>
                <Text style={styles.articleDate}>{article.date} · {article.readTime}</Text>
              </View>
              <Text style={styles.articleTitle} numberOfLines={2}>{article.title}</Text>
              <Text style={styles.articleSubtitle} numberOfLines={2}>{article.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 120 }} />

      {/* ─────────────────────────────────────────────────────────────────────
          MODALS
      ───────────────────────────────────────────────────────────────────── */}

      {/* Status Edit Modal */}
      <Modal visible={statusModalVisible} transparent animationType="slide" onRequestClose={() => setStatusModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setStatusModalVisible(false)}>
          <Pressable style={styles.statusModal} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Meu Status</Text>
            <Text style={styles.modalSubtitle}>Como você está hoje? Deixe a comunidade saber 🐸</Text>

            {/* Emoji picker */}
            <Text style={styles.modalLabel}>Escolha um emoji</Text>
            <View style={styles.emojiGrid}>
              {STATUS_EMOJIS.map(e => (
                <TouchableOpacity
                  key={e}
                  onPress={() => setMyEmoji(e)}
                  style={[styles.emojiOption, myEmoji === e && styles.emojiOptionSelected]}
                >
                  <Text style={{ fontSize: 22 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Status message */}
            <Text style={styles.modalLabel}>Mensagem (até 30 caracteres)</Text>
            <TextInput
              style={styles.statusInput}
              value={myStatusText}
              onChangeText={t => setMyStatusText(t.slice(0, 30))}
              placeholder="Ex: Explorando o Cerrado..."
              placeholderTextColor={theme.colors.textSecondary}
              maxLength={30}
            />
            <Text style={styles.charCount}>{myStatusText.length}/30</Text>

            <TouchableOpacity style={styles.saveStatusBtn} onPress={handleSaveStatus}>
              <Text style={styles.saveStatusBtnText}>Salvar Status</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Article Modal */}
      <Modal visible={!!articleModalItem} transparent animationType="fade" onRequestClose={() => setArticleModalItem(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setArticleModalItem(null)}>
          <Pressable style={styles.articleModal} onPress={e => e.stopPropagation()}>
            {articleModalItem && (
              <>
                <Text style={{ fontSize: 48, marginBottom: 12, textAlign: 'center' }}>{articleModalItem.emoji}</Text>
                <View style={[styles.articleTag, { borderColor: articleModalItem.tagColor, alignSelf: 'center', marginBottom: 16 }]}>
                  <Text style={[styles.articleTagText, { color: articleModalItem.tagColor }]}>{articleModalItem.tag}</Text>
                </View>
                <Text style={styles.articleModalTitle}>{articleModalItem.title}</Text>
                <Text style={styles.articleModalSubtitle}>{articleModalItem.subtitle}</Text>
                <View style={styles.articleModalMeta}>
                  <Text style={styles.articleDate}>📅 {articleModalItem.date}</Text>
                  <Text style={styles.articleDate}>⏱️ {articleModalItem.readTime} de leitura</Text>
                </View>
                <Text style={styles.articleModalBody}>
                  Este artigo científico é um exemplo representativo do tipo de conteúdo que a plataforma Ribbit divulga para conectar pesquisadores e entusiastas da herpetofauna brasileira.{'\n\n'}
                  Em breve, a integração com publicações reais de pesquisadores parceiros será implementada nesta seção, enriquecendo o banco de conhecimento coletivo da comunidade.
                </Text>
                <TouchableOpacity style={styles.articleCloseBtn} onPress={() => setArticleModalItem(null)}>
                  <Text style={styles.articleCloseBtnText}>Fechar</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingTop: 24, paddingBottom: 40 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, marginBottom: 24 },
  greeting: { fontSize: 26, fontWeight: '800', color: theme.colors.textPrimary, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 4 },
  headerBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center', ...theme.shadows.soft },

  // Sections
  sectionBlock: { marginBottom: 32, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 16, letterSpacing: -0.3 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30' },
  liveLabel: { fontSize: 10, fontWeight: '800', color: '#FF3B30', letterSpacing: 1 },

  // Status bar
  statusRow: { paddingVertical: 4, paddingRight: 20, gap: 12 },
  statusBubbleWrapper: { alignItems: 'center', width: 72 },
  statusBubbleRing: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: theme.colors.border, padding: 3, position: 'relative' },
  statusBubbleRingMe: { borderColor: theme.colors.primary, borderWidth: 2.5 },
  statusBubbleInner: { flex: 1, borderRadius: 28, overflow: 'hidden' },
  statusBubbleAvatar: { width: '100%', height: '100%', borderRadius: 28 },
  statusBubblePlaceholder: { backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' },
  statusBubbleInitials: { fontSize: 18, fontWeight: '700', color: theme.colors.primary },
  statusEmojiBadge: { position: 'absolute', bottom: -4, right: -4, width: 24, height: 24, borderRadius: 12, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: theme.colors.border },
  statusBubbleName: { fontSize: 10, color: theme.colors.textSecondary, marginTop: 8, textAlign: 'center', fontWeight: '500', maxWidth: 64 },
  simDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.border, alignSelf: 'center', marginTop: 2 },

  // Hero Banner
  heroBanner: { marginHorizontal: 20, marginBottom: 32, borderRadius: 24, overflow: 'hidden', ...theme.shadows.neonPrimary },
  heroBannerInner: {
    padding: 28,
    backgroundColor: '#0A1628',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.25)',
    minHeight: 200,
    justifyContent: 'center',
    backgroundImage: undefined,
  },
  heroGlassTag: { backgroundColor: 'rgba(52, 199, 89, 0.12)', borderWidth: 1, borderColor: 'rgba(52, 199, 89, 0.3)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 16 },
  heroTagText: { fontSize: 10, fontWeight: '800', color: theme.colors.primary, letterSpacing: 1 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: theme.colors.textPrimary, lineHeight: 32, letterSpacing: -0.5, marginBottom: 12 },
  heroMeta: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '500', marginBottom: 20 },
  heroCta: { backgroundColor: theme.colors.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, alignSelf: 'flex-start' },
  heroCtaText: { color: '#000', fontWeight: '700', fontSize: 14 },

  // Discovery Cards
  discoveryCard: { backgroundColor: theme.colors.surface, borderRadius: 20, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.soft },
  discoveryImage: { width: '100%', height: 180 },
  discoveryImagePlaceholder: { backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' },
  discoveryBadgesRow: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', gap: 8 },
  matchBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  matchBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  simulationBadge: { backgroundColor: 'rgba(148,163,184,0.85)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  simulationBadgeText: { color: '#0F172A', fontSize: 10, fontWeight: '700' },
  discoveryBody: { padding: 16 },
  discoveryAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  discoveryAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(52,199,89,0.15)', justifyContent: 'center', alignItems: 'center' },
  discoveryAvatarText: { color: theme.colors.primary, fontSize: 13, fontWeight: '700' },
  discoveryAuthorName: { fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary },
  discoveryMeta: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  discoverySpeciesName: { fontSize: 20, fontWeight: '800', color: theme.colors.textPrimary, letterSpacing: -0.3, marginBottom: 2 },
  discoveryScientific: { fontSize: 13, color: theme.colors.textSecondary, fontStyle: 'italic', marginBottom: 14 },
  discoveryActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 12 },
  discoveryActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  discoveryActionIcon: { fontSize: 18 },
  discoveryActionText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: '500' },
  discoveryViewBtn: { marginLeft: 'auto', backgroundColor: 'rgba(52,199,89,0.12)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  discoveryViewBtnText: { color: theme.colors.primary, fontSize: 13, fontWeight: '700' },

  // Challenge Cards
  challengeCard: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border },
  challengeHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  challengeEmoji: { fontSize: 26 },
  challengeTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 4 },
  challengeDesc: { fontSize: 12, color: theme.colors.textSecondary, lineHeight: 18 },
  challengeCount: { fontSize: 16, fontWeight: '800', minWidth: 40, textAlign: 'right' },
  progressTrack: { height: 6, backgroundColor: theme.colors.border, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: 6, borderRadius: 3 },
  progressLabel: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: '500' },

  // Article Cards
  articleCard: { flexDirection: 'row', backgroundColor: theme.colors.surface, borderRadius: 16, padding: 14, marginBottom: 12, gap: 14, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'flex-start', ...theme.shadows.soft },
  articleEmojiBox: { width: 52, height: 52, borderRadius: 14, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' },
  articleTagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  articleTag: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  articleTagText: { fontSize: 10, fontWeight: '700' },
  articleDate: { fontSize: 11, color: theme.colors.textSecondary },
  articleTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary, lineHeight: 20, marginBottom: 4 },
  articleSubtitle: { fontSize: 12, color: theme.colors.textSecondary, lineHeight: 17 },

  // Empty Feed
  emptyText: { textAlign: 'center', color: theme.colors.textSecondary, fontSize: 14, lineHeight: 22, paddingVertical: 24, paddingHorizontal: 16 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  statusModal: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 48, borderWidth: 1, borderColor: theme.colors.border },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.colors.border, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 6 },
  modalSubtitle: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 24 },
  modalLabel: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  emojiOption: { width: 44, height: 44, borderRadius: 12, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  emojiOptionSelected: { borderColor: theme.colors.primary, backgroundColor: 'rgba(52,199,89,0.12)' },
  statusInput: { backgroundColor: theme.colors.background, color: theme.colors.textPrimary, borderRadius: 12, paddingHorizontal: 16, height: 50, fontSize: 15, borderWidth: 1, borderColor: theme.colors.border },
  charCount: { fontSize: 11, color: theme.colors.textSecondary, textAlign: 'right', marginTop: 6, marginBottom: 20 },
  saveStatusBtn: { backgroundColor: theme.colors.primary, borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center' },
  saveStatusBtnText: { color: '#000', fontWeight: '800', fontSize: 16 },

  // Article Modal
  articleModal: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 48, borderWidth: 1, borderColor: theme.colors.border, maxHeight: '85%' },
  articleModalTitle: { fontSize: 22, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 10, lineHeight: 30, textAlign: 'center' },
  articleModalSubtitle: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 22, marginBottom: 16, textAlign: 'center' },
  articleModalMeta: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 20 },
  articleModalBody: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 24, marginBottom: 24 },
  articleCloseBtn: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, height: 50, justifyContent: 'center', alignItems: 'center' },
  articleCloseBtnText: { color: theme.colors.textPrimary, fontWeight: '700', fontSize: 15 },
});
