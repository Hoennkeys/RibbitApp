// ─────────────────────────────────────────────────────────────────────────────
// Ribbit — Unified Herpetological Library & Sound Portal (Apple Design System)
// Location: C:\Ribbit\RibbitApp\src\screens\LibraryScreen.js
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Share,
  Alert,
  Image,
  Modal,
  ScrollView,
  BackHandler,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { dataService } from '../services/dataService';
import supabase from '../services/supabaseClient';
import SpeciesDetailsScreen from './SpeciesDetailsScreen';
import { theme } from '../utils/theme';
import { useLanguage } from '../utils/i18n';

const REGIONS = [
  'Todos',
  'Todo o Brasil',
  'Mata Atlântica',
  'Cerrado',
  'Sudeste',
  'Norte',
  'Sul'
];

export default function LibraryScreen({ navigation, route }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('species'); // 'species' or 'community'
  const [currentUser, setCurrentUser] = useState(null);

  // General Library Data
  const [speciesList, setSpeciesList] = useState([]);
  const [filteredSpecies, setFilteredSpecies] = useState([]);
  
  const [communityObs, setCommunityObs] = useState([]);
  const [filteredObs, setFilteredObs] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  
  // Selection Filters for Species
  const [selectedType, setSelectedType] = useState('Todos'); // 'Todos', 'Sapo', 'Rã', 'Perereca'
  const [selectedRegion, setSelectedRegion] = useState('Todos');

  // Sub-Navigation to Details
  const [selectedSpeciesId, setSelectedSpeciesId] = useState(null);

  // Audio Playback Simulation States
  const [playingAudioUrl, setPlayingAudioUrl] = useState(null);
  const [audioPlaybackProgress, setAudioPlaybackProgress] = useState(0);

  // Share to Chat States
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [activeChats, setActiveChats] = useState([]);
  const [itemToShare, setItemToShare] = useState(null); // { type: 'species'|'observation', id: string, name: string }
  const [loadingChats, setLoadingChats] = useState(false);

  // Load User Session & Data
  useFocusEffect(
    useCallback(() => {
      supabase.auth.getUser().then(({ data: { user } }) => {
        setCurrentUser(user);
      });

      // Parse Deep Link route params from Chat Screen
      if (route?.params?.selectedSpeciesId) {
        setSelectedSpeciesId(route.params.selectedSpeciesId);
        navigation.setParams({ selectedSpeciesId: null }); // Reset parameter
      }

      loadData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [route?.params?.selectedSpeciesId])
  );

  // Simulated Audio Playback progress
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

  // Intercept Android back button to return from detail sheet to list view
  useEffect(() => {
    const backAction = () => {
      if (selectedSpeciesId) {
        setSelectedSpeciesId(null);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [selectedSpeciesId]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'species') {
        const data = await dataService.getSpecies();
        setSpeciesList(data);
        applySpeciesFilters(searchText, selectedType, selectedRegion, data);
      } else {
        const data = await dataService.getApprovedObservations();
        setCommunityObs(data);
        applyCommunityFilters(searchText, data);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar a biblioteca.');
    } finally {
      setLoading(false);
    }
  };

  // Filter logic for Species
  const applySpeciesFilters = (text, type, region, list = speciesList) => {
    setSearchText(text);
    let temp = [...list];

    // Text Search
    if (text.trim()) {
      const q = text.toLowerCase().trim();
      temp = temp.filter(s => 
        s.nome_popular.toLowerCase().includes(q) ||
        s.nome_cientifico.toLowerCase().includes(q) ||
        s.descricao.toLowerCase().includes(q) ||
        s.habitat.toLowerCase().includes(q)
      );
    }

    // Type Filter
    if (type !== 'Todos') {
      temp = temp.filter(s => s.tipo?.toLowerCase() === type.toLowerCase());
    }

    // Region Filter
    if (region !== 'Todos') {
      temp = temp.filter(s => s.regiao?.toLowerCase().includes(region.toLowerCase()));
    }

    setFilteredSpecies(temp);
  };

  // Filter logic for Community Observations
  const applyCommunityFilters = (text, list = communityObs) => {
    setSearchText(text);
    if (!text.trim()) {
      setFilteredObs(list);
      return;
    }
    const q = text.toLowerCase().trim();
    const temp = list.filter(item => {
      const popularName = (item.species?.nome_popular || '').toLowerCase();
      const scientificName = (item.species?.nome_cientifico || '').toLowerCase();
      const suggestion = (item.sugestao || '').toLowerCase();
      const location = (item.localizacao || '').toLowerCase();
      const recorder = (item.profiles?.full_name || '').toLowerCase();

      return popularName.includes(q) ||
             scientificName.includes(q) ||
             suggestion.includes(q) ||
             location.includes(q) ||
             recorder.includes(q);
    });
    setFilteredObs(temp);
  };

  // Native share handler
  const handleNativeShare = async (item, isSpec = false) => {
    try {
      let content = '';
      if (isSpec) {
        content = `🐸 Biblioteca Herpetológica Ribbit:
Espécie: ${item.nome_popular} (${item.nome_cientifico})
Tipo: ${item.tipo} | Região: ${item.regiao}
Descrição: ${item.descricao}`;
      } else {
        content = `🎙️ Gravação Bioacústica da Comunidade (Ribbit):
Anfíbio: ${item.species?.nome_popular || 'Espécie Não Identificada'} (${item.species?.nome_cientifico || 'Pendente'})
Gravado por: ${item.profiles?.full_name || 'Usuário'}
Local: ${item.localizacao || 'Desconhecido'}
Ouça em: ${item.audio_url}`;
      }

      await Share.share({ message: content });
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível compartilhar.');
    }
  };

  // Chat sharing options
  const openShareToChat = async (item, isSpec = false) => {
    if (!currentUser) {
      Alert.alert(
        'Acesso Restrito',
        'Crie uma conta ou entre no aplicativo para compartilhar com outros usuários no Chat.',
        [{ text: 'Entrar', onPress: () => navigation.navigate('Perfil') }, { text: 'Cancelar', style: 'cancel' }]
      );
      return;
    }

    setItemToShare({
      type: isSpec ? 'species' : 'observation',
      id: item.id,
      name: isSpec ? item.nome_popular : (item.species?.nome_popular || 'Gravação')
    });
    setIsShareModalVisible(true);
    setLoadingChats(true);

    try {
      const chatsList = await dataService.getChats(currentUser.id);
      setActiveChats(chatsList);
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Não foi possível carregar seus contatos.');
    } finally {
      setLoadingChats(false);
    }
  };

  const handleSendToChat = async (chat) => {
    if (!itemToShare || !currentUser) return;
    try {
      const msgText = `[${itemToShare.type}]:${itemToShare.id}`;
      await dataService.sendMessage(chat.id, currentUser.id, msgText);
      setIsShareModalVisible(false);

      // Confirm send and ask to navigate to chat screen
      Alert.alert(
        'Enviado!',
        `Compartilhado com sucesso na conversa. Deseja ir para a tela de Chat?`,
        [
          { 
            text: 'Ir para Chat', 
            onPress: () => navigation.navigate('Chat', { selectedChatId: chat.id }) 
          },
          { text: 'Ficar na Biblioteca', style: 'cancel' }
        ]
      );
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Não foi possível enviar a mensagem.');
    }
  };

  const getChatPartnerName = (chat) => {
    const isSelf = chat.user_id === currentUser?.id;
    const partner = isSelf ? chat.recipient : chat.user;
    return partner?.full_name || 'Membro do Ribbit';
  };

  const getChatPartnerAvatar = (chat) => {
    const isSelf = chat.user_id === currentUser?.id;
    const partner = isSelf ? chat.recipient : chat.user;
    return partner?.avatar_url;
  };

  // Render detail view if species selected
  if (selectedSpeciesId) {
    return (
      <SpeciesDetailsScreen
        speciesId={selectedSpeciesId}
        onBack={() => setSelectedSpeciesId(null)}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Redesigned Header with Tabs */}
      <View style={styles.header}>
        <Text style={styles.title}>Biblioteca</Text>
        <Text style={styles.subtitle}>Portal oficial de anfíbios e banco de bioacústica</Text>

        {/* Tab Switch Segmented Control */}
        <View style={styles.tabSegmented}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'species' && styles.activeTabButton]}
            onPress={() => {
              setActiveTab('species');
              setSearchText('');
            }}
          >
            <Text style={[styles.tabButtonText, activeTab === 'species' && styles.activeTabButtonText]}>
              📚 Espécies
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'community' && styles.activeTabButton]}
            onPress={() => {
              setActiveTab('community');
              setSearchText('');
            }}
          >
            <Text style={[styles.tabButtonText, activeTab === 'community' && styles.activeTabButtonText]}>
              🎙️ Coaxares Comunitários
            </Text>
          </TouchableOpacity>
        </View>

        {/* Unified Search Input */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={
              activeTab === 'species'
                ? 'Buscar por nome popular, científico...'
                : 'Buscar sons, locais, observadores...'
            }
            placeholderTextColor={theme.colors.textSecondary}
            value={searchText}
            onChangeText={(text) => {
              if (activeTab === 'species') {
                applySpeciesFilters(text, selectedType, selectedRegion);
              } else {
                applyCommunityFilters(text);
              }
            }}
          />
          {searchText ? (
            <TouchableOpacity 
              onPress={() => {
                if (activeTab === 'species') {
                  applySpeciesFilters('', selectedType, selectedRegion);
                } else {
                  applyCommunityFilters('');
                }
              }} 
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filters Panel (Only visible for Species Catalog tab) */}
        {activeTab === 'species' && (
          <View style={styles.filterPanel}>
            {/* Taxonomic Type Tabs */}
            <View style={styles.typeSelector}>
              {['Todos', 'Sapo', 'Rã', 'Perereca'].map(tType => (
                <TouchableOpacity
                  key={tType}
                  style={[styles.typeBadge, selectedType === tType && styles.activeTypeBadge]}
                  onPress={() => {
                    setSelectedType(tType);
                    applySpeciesFilters(searchText, tType, selectedRegion);
                  }}
                >
                  <Text style={[styles.typeBadgeText, selectedType === tType && styles.activeTypeBadgeText]}>
                    {tType}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Region Scroll Selector */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.regionSelector}
            >
              {REGIONS.map(reg => (
                <TouchableOpacity
                  key={reg}
                  style={[styles.regionChip, selectedRegion === reg && styles.activeRegionChip]}
                  onPress={() => {
                    setSelectedRegion(reg);
                    applySpeciesFilters(searchText, selectedType, reg);
                  }}
                >
                  <Text style={[styles.regionChipText, selectedRegion === reg && styles.activeRegionChipText]}>
                    📍 {reg}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Main List Rendering */}
      {loading ? (
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Carregando catálogo...</Text>
        </View>
      ) : activeTab === 'species' ? (
        /* Species Tab List */
        <FlatList
          data={filteredSpecies}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={loadData}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🐸</Text>
              <Text style={styles.emptyTitle}>Nenhuma espécie catalogada</Text>
              <Text style={styles.emptyText}>Tente buscar outros filtros ou termos.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const tagBg = item.tipo === 'Sapo' ? 'rgba(217, 119, 6, 0.1)' : item.tipo === 'Rã' ? 'rgba(0, 113, 227, 0.1)' : 'rgba(52, 199, 89, 0.1)';
            const tagColor = item.tipo === 'Sapo' ? '#D97706' : item.tipo === 'Rã' ? '#0071E3' : '#34C759';

            return (
              <TouchableOpacity
                style={styles.speciesCard}
                onPress={() => setSelectedSpeciesId(item.id)}
                activeOpacity={0.8}
              >
                {item.imagem_url ? (
                  <Image source={{ uri: item.imagem_url }} style={styles.speciesImage} />
                ) : (
                  <View style={[styles.speciesImagePlaceholder, { backgroundColor: tagBg }]}>
                    <Text style={{ fontSize: 24 }}>🐸</Text>
                  </View>
                )}

                <View style={styles.speciesInfo}>
                  <View style={styles.speciesHeaderRow}>
                    <Text style={styles.speciesPopularName}>{item.nome_popular}</Text>
                    <View style={[styles.taxTypeBadge, { backgroundColor: tagBg }]}>
                      <Text style={[styles.taxTypeBadgeText, { color: tagColor }]}>{item.tipo}</Text>
                    </View>
                  </View>
                  <Text style={styles.speciesScientificName}>{item.nome_cientifico}</Text>
                  <Text style={styles.speciesSummary} numberOfLines={2}>{item.descricao}</Text>
                  
                  <View style={styles.speciesFooter}>
                    <Text style={styles.speciesLocality}>📍 {item.regiao}</Text>
                    <Text style={styles.detailsArrow}>Ver Ficha ›</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        /* Community Sounds Tab List */
        <FlatList
          data={filteredObs}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={loadData}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🎙️</Text>
              <Text style={styles.emptyTitle}>Nenhuma gravação aprovada</Text>
              <Text style={styles.emptyText}>Tente buscar outros termos ou grave um coaxar!</Text>
            </View>
          }
          renderItem={({ item }) => {
            const dateFormatted = new Date(item.created_at).toLocaleDateString('pt-BR');
            const popularName = item.species?.nome_popular || 'Espécie Catalogada';
            const scientificName = item.species?.nome_cientifico || 'Desconhecida';
            const isCurrentPlaying = playingAudioUrl === item.audio_url;
            const recorderName = item.profiles?.full_name || 'Observador';

            return (
              <View style={styles.card}>
                {/* Profile header */}
                <View style={styles.cardHeader}>
                  <View style={styles.profileRow}>
                    {item.profiles?.avatar_url ? (
                      <Image source={{ uri: item.profiles.avatar_url }} style={styles.avatarImage} />
                    ) : (
                      <View style={styles.avatar}>
                        <Text style={styles.avatarLetter}>{recorderName.charAt(0).toUpperCase()}</Text>
                      </View>
                    )}
                    <View>
                      <Text style={styles.recorderName}>{recorderName}</Text>
                      <Text style={styles.dateText}>📅 {dateFormatted}</Text>
                    </View>
                  </View>
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedBadgeText}>✅ APROVADO</Text>
                  </View>
                </View>

                {/* Body details */}
                <Text style={styles.speciesPopular}>{popularName}</Text>
                <Text style={styles.speciesScientific}>{scientificName}</Text>
                <Text style={styles.locationText}>📍 {item.localizacao || 'Mata Atlântica'}</Text>

                {/* Player and sharing actions */}
                <View style={styles.controlsRow}>
                  <TouchableOpacity
                    style={[styles.playButton, isCurrentPlaying && styles.playingButton]}
                    onPress={() => {
                      if (isCurrentPlaying) setPlayingAudioUrl(null);
                      else setPlayingAudioUrl(item.audio_url);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.playButtonText}>
                      {isCurrentPlaying ? '⏸️ Pausar' : '🔊 Ouvir Canto'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.chatShareButton}
                    onPress={() => openShareToChat(item, false)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.chatShareButtonText}>💬 Enviar no Chat</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={() => handleNativeShare(item, false)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.shareButtonText}>🔗</Text>
                  </TouchableOpacity>
                </View>

                {/* Progress bar */}
                {isCurrentPlaying && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${audioPlaybackProgress * 100}%` }]} />
                    </View>
                    <Text style={styles.progressTime}>
                      0:0{Math.floor(audioPlaybackProgress * 5)} / 0:05
                    </Text>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}

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
              Compartilhar "{itemToShare?.name}" no chat privado
            </Text>

            {loadingChats ? (
              <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginVertical: 30 }} />
            ) : activeChats.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>💬</Text>
                <Text style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>
                  Nenhuma conversa ativa encontrada. Inicie um chat pelo perfil de um usuário no mural!
                </Text>
              </View>
            ) : (
              <FlatList
                data={activeChats}
                keyExtractor={(chat) => chat.id}
                style={{ maxHeight: 300 }}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: 12,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
    marginBottom: 14,
  },
  tabSegmented: {
    flexDirection: 'row',
    backgroundColor: '#090d16',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9,
  },
  activeTabButton: {
    backgroundColor: theme.colors.surface,
    ...theme.shadows.soft,
  },
  tabButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabButtonText: {
    color: theme.colors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#030712',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 13.5,
    height: '100%',
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  filterPanel: {
    marginTop: 10,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  typeBadge: {
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 8,
    backgroundColor: '#0b101d',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeTypeBadge: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  typeBadgeText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  activeTypeBadgeText: {
    color: '#FFF',
  },
  regionSelector: {
    paddingVertical: 2,
    gap: 6,
  },
  regionChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#0b101d',
    marginRight: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeRegionChip: {
    backgroundColor: 'rgba(0, 113, 227, 0.15)',
    borderColor: '#0071E3',
  },
  regionChipText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  activeRegionChipText: {
    color: '#0071E3',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 130,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 54,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  emptyText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 5,
    paddingHorizontal: 24,
  },
  speciesCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(249, 250, 251, 0.04)',
    ...theme.shadows.soft,
  },
  speciesImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 12,
  },
  speciesImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speciesInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  speciesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  speciesPopularName: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 6,
  },
  taxTypeBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 5,
  },
  taxTypeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  speciesScientificName: {
    color: theme.colors.textSecondary,
    fontSize: 12.5,
    fontStyle: 'italic',
    marginTop: 1,
  },
  speciesSummary: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 6,
    lineHeight: 16,
  },
  speciesFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  speciesLocality: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  detailsArrow: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(249, 250, 251, 0.03)',
    ...theme.shadows.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 8,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.2)',
  },
  avatarLetter: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  recorderName: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
    fontSize: 13.5,
  },
  dateText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.08)',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 5,
  },
  verifiedBadgeText: {
    color: theme.colors.primary,
    fontSize: 9,
    fontWeight: '800',
  },
  speciesPopular: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  speciesScientific: {
    color: theme.colors.textSecondary,
    fontSize: 12.5,
    fontStyle: 'italic',
    marginTop: 1.5,
  },
  locationText: {
    color: theme.colors.textSecondary,
    fontSize: 12.5,
    marginTop: 10,
  },
  controlsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 6,
  },
  playButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1.2,
  },
  playingButton: {
    backgroundColor: '#FF3B30',
  },
  playButtonText: {
    color: '#FFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  chatShareButton: {
    backgroundColor: 'rgba(0, 113, 227, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 113, 227, 0.2)',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1.2,
  },
  chatShareButtonText: {
    color: '#0071E3',
    fontSize: 12,
    fontWeight: '700',
  },
  shareButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    width: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 12.5,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2.5,
  },
  progressTime: {
    color: theme.colors.textSecondary,
    fontSize: 10.5,
    marginLeft: 8,
    fontWeight: '600',
  },

  // Modal Share styles
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
