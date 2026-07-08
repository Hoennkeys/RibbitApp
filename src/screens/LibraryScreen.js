// ─────────────────────────────────────────────────────────────────────────────
// Ribbit — Sound Library Screen (Apple Design System)
// Location: C:\Ribbit\RibbitApp\src\screens\LibraryScreen.js
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { dataService } from '../services/dataService';
import { theme } from '../utils/theme';
import { useLanguage } from '../utils/i18n';

export default function LibraryScreen() {
  const { t } = useLanguage();
  const [observations, setObservations] = useState([]);
  const [filteredObs, setFilteredObs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  // Audio simulation states
  const [playingAudioUrl, setPlayingAudioUrl] = useState(null);
  const [audioPlaybackProgress, setAudioPlaybackProgress] = useState(0);

  // Auto-refresh when tab is focused
  useFocusEffect(
    useCallback(() => {
      loadLibraryData();
      return () => {
        setPlayingAudioUrl(null);
      };
    }, [])
  );

  // Audio player simulation timer
  React.useEffect(() => {
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
      }, 500); // 5s playback simulation
    } else {
      setAudioPlaybackProgress(0);
    }
    return () => clearInterval(interval);
  }, [playingAudioUrl]);

  const loadLibraryData = async () => {
    try {
      setLoading(true);
      const data = await dataService.getAllObservations();
      
      // Filter out records without audio_url for the sound library
      const audioRecords = (data || []).filter(item => !!item.audio_url);
      
      setObservations(audioRecords);
      applyFilter(searchText, audioRecords);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar o banco de sons.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = (text, list = observations) => {
    setSearchText(text);
    const query = text.toLowerCase().trim();
    if (!query) {
      setFilteredObs(list);
      return;
    }

    const filtered = list.filter(item => {
      const popularName = (item.species?.nome_popular || '').toLowerCase();
      const scientificName = (item.species?.nome_cientifico || '').toLowerCase();
      const suggestion = (item.sugestao || '').toLowerCase();
      const recorder = (item.profiles?.full_name || 'Usuário').toLowerCase();
      const location = (item.localizacao || '').toLowerCase();

      return popularName.includes(query) || 
             scientificName.includes(query) || 
             suggestion.includes(query) || 
             recorder.includes(query) || 
             location.includes(query);
    });

    setFilteredObs(filtered);
  };

  const handleShare = async (item) => {
    try {
      const name = item.status_revisao === 'pendente' && item.sugestao
        ? `Sugestão: "${item.sugestao}"`
        : (item.species?.nome_popular || 'Espécie Não Identificada');
      
      const content = `🎙️ Ouça o coaxar no Ribbit!
Anfíbio: ${name}
Gravado por: ${item.profiles?.full_name || 'Membro do Ribbit'}
Local: ${item.localizacao || 'Mata Atlântica'}
Áudio: ${item.audio_url}`;

      await Share.share({
        message: content,
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível compartilhar o áudio.');
    }
  };

  if (loading && observations.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Carregando biblioteca de sons...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Biblioteca</Text>
        <Text style={styles.subtitle}>Banco global de sons de anfíbios da comunidade</Text>
        
        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por espécie, sugestão ou local..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchText}
            onChangeText={(text) => applyFilter(text)}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => applyFilter('')} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <FlatList
        data={filteredObs}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={loadLibraryData}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🐸</Text>
            <Text style={styles.emptyTitle}>Nenhum som encontrado</Text>
            <Text style={styles.emptyText}>Tente buscar outros termos ou verifique a conexão.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const dateFormatted = new Date(item.created_at).toLocaleDateString('pt-BR');
          const isPendente = item.status_revisao === 'pendente';
          const isRejeitado = item.status_revisao === 'rejeitado';
          
          const popularName = isPendente && item.sugestao 
            ? `Sugestão: ${item.sugestao}` 
            : (item.species?.nome_popular || 'Espécie Não Identificada');
          
          const scientificName = isPendente 
            ? 'Identificação Pendente' 
            : (item.species?.nome_cientifico || 'Desconhecida');

          const isCurrentPlaying = playingAudioUrl === item.audio_url;
          const recorderName = item.profiles?.full_name || 'Pesquisador';

          return (
            <View style={styles.card}>
              {/* Card Header: Profile Info */}
              <View style={styles.cardHeader}>
                <View style={styles.profileRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarLetter}>
                      {recorderName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.recorderName}>{recorderName}</Text>
                    <Text style={styles.dateText}>📅 {dateFormatted}</Text>
                  </View>
                </View>

                {/* Status Badge */}
                <View style={[
                  styles.statusBadge, 
                  isPendente && { backgroundColor: 'rgba(255, 149, 0, 0.1)' },
                  isRejeitado && { backgroundColor: 'rgba(255, 60, 48, 0.1)' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    isPendente && { color: '#FF9500' },
                    isRejeitado && { color: '#FF3C30' }
                  ]}>
                    {item.status_revisao?.toUpperCase() || 'PENDENTE'}
                  </Text>
                </View>
              </View>

              {/* Card Body */}
              <Text style={styles.speciesPopular}>{popularName}</Text>
              <Text style={styles.speciesScientific}>{scientificName}</Text>
              <Text style={styles.locationText}>📍 {item.localizacao || 'Mata Atlântica'}</Text>

              {/* Audio Player and Share Controls */}
              <View style={styles.controlsRow}>
                <TouchableOpacity
                  style={[styles.playButton, isCurrentPlaying && styles.playingButton]}
                  onPress={() => {
                    if (isCurrentPlaying) {
                      setPlayingAudioUrl(null);
                    } else {
                      setPlayingAudioUrl(item.audio_url);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.playButtonText}>
                    {isCurrentPlaying ? '⏸️ Pausar' : '🔊 Ouvir Canto'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={() => handleShare(item)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.shareButtonText}>🔗 Compartilhar</Text>
                </TouchableOpacity>
              </View>

              {/* Progress Bar (Only visible when current item is playing) */}
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
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#030712',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    height: '100%',
  },
  clearButton: {
    padding: 6,
  },
  clearButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  listContent: {
    padding: 20,
    paddingBottom: 120,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(249, 250, 251, 0.04)',
    ...theme.shadows.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.2)',
  },
  avatarLetter: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 15,
  },
  recorderName: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  dateText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  statusBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusText: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  speciesPopular: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  speciesScientific: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 2,
  },
  locationText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 8,
  },
  playButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playingButton: {
    backgroundColor: '#FF3B30',
  },
  playButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  shareButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  progressTime: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginLeft: 10,
    fontWeight: '600',
  },
});
