// ─────────────────────────────────────────────────────────────────────────────
// RibbitApp — Species Details Screen
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
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Spectrogram from '../components/Spectrogram';
import { mockDataService } from '../services/mockDataService';

export default function SpeciesDetailsScreen({ speciesId, onBack }) {
  const species = mockDataService.getSpeciesById(speciesId);
  const [isPlaying, setIsPlaying] = useState(false);
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  
  // Encontra o primeiro som gravado dessa espécie para vincular comentários
  const associatedSons = mockDataService.getSonsBySpecies(speciesId);
  const associatedSomId = associatedSons[0]?.id || `mock-som-${speciesId}`;

  useEffect(() => {
    loadComments();
    return () => setIsPlaying(false);
  }, [speciesId]);

  const loadComments = () => {
    const list = mockDataService.getComentarios(associatedSomId);
    setComments([...list]);
  };

  const handlePlayToggle = () => {
    setIsPlaying(!isPlaying);
  };

  const handleAddComment = () => {
    if (!newCommentText.trim()) return;
    mockDataService.addComentario(associatedSomId, newCommentText);
    setNewCommentText('');
    loadComments();
  };

  if (!species) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Espécie não encontrada.</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardContainer}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.nomePopular}>{species.nome_popular}</Text>
          <Text style={styles.nomeCientifico}>{species.nome_cientifico}</Text>
          
          <View style={styles.tagsRow}>
            <View style={[styles.tag, styles.tagRegion]}>
              <Text style={styles.tagText}>{species.regiao}</Text>
            </View>
            <View style={[styles.tag, styles.tagHabitat]}>
              <Text style={styles.tagText}>{species.habitat}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Canto do Anfíbio (Player)</Text>
          <Spectrogram isActive={isPlaying} color="#3498DB" />
          
          <View style={styles.playerControls}>
            <TouchableOpacity
              style={[styles.playButton, isPlaying && styles.pauseButton]}
              onPress={handlePlayToggle}
              activeOpacity={0.8}
            >
              <Text style={styles.playButtonText}>
                {isPlaying ? 'Pausar Canto' : 'Ouvir Canto 🔊'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descrição da Espécie</Text>
          <View style={styles.infoCard}>
            <Text style={styles.bodyText}>{species.descricao}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dicas de Identificação</Text>
          <View style={[styles.infoCard, styles.tipsCard]}>
            <Text style={styles.bodyText}>{species.dicas_identificacao}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fato Curioso</Text>
          <View style={[styles.infoCard, styles.factCard]}>
            <Text style={[styles.bodyText, styles.factText]}>💡 {species.fatos_curiosos}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discussão Científica ({comments.length})</Text>
          
          {comments.length === 0 ? (
            <Text style={styles.noCommentsText}>Nenhum comentário científico ainda. Seja o primeiro!</Text>
          ) : (
            comments.map((item) => (
              <View key={item.id} style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentAuthor}>{item.usuario_nome}</Text>
                  <Text style={styles.commentTime}>
                    {new Date(item.criado_em).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
                <Text style={styles.commentText}>{item.texto}</Text>
              </View>
            ))
          )}

          <View style={styles.addCommentContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Adicionar nota ou observação..."
              placeholderTextColor="#8596A0"
              value={newCommentText}
              onChangeText={setNewCommentText}
              multiline
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleAddComment}>
              <Text style={styles.sendButtonText}>Enviar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#121B22',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 50,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121B22',
  },
  errorText: {
    color: '#E9EDEF',
    fontSize: 16,
    marginBottom: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#1F2C34',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2A3942',
  },
  backButtonText: {
    color: '#2ECC71',
    fontWeight: 'bold',
    fontSize: 14,
  },
  header: {
    marginBottom: 30,
  },
  nomePopular: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E9EDEF',
  },
  nomeCientifico: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#8596A0',
    marginTop: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  tag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 10,
  },
  tagRegion: {
    backgroundColor: '#1A3326',
  },
  tagHabitat: {
    backgroundColor: '#1A2933',
  },
  tagText: {
    color: '#2ECC71',
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E9EDEF',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#1F2C34',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A3942',
  },
  tipsCard: {
    borderColor: '#3D5361',
  },
  factCard: {
    backgroundColor: '#1B2C3A',
    borderColor: '#3498DB',
  },
  factText: {
    color: '#E9EDEF',
  },
  bodyText: {
    fontSize: 14,
    color: '#8596A0',
    lineHeight: 22,
  },
  playerControls: {
    alignItems: 'center',
    marginTop: 14,
  },
  playButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
    shadowColor: '#3498DB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  pauseButton: {
    backgroundColor: '#E74C3C',
    shadowColor: '#E74C3C',
  },
  playButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  noCommentsText: {
    color: '#8596A0',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  commentCard: {
    backgroundColor: '#1F2C34',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A3942',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  commentAuthor: {
    color: '#2ECC71',
    fontWeight: 'bold',
    fontSize: 13,
  },
  commentTime: {
    color: '#8596A0',
    fontSize: 11,
  },
  commentText: {
    color: '#E9EDEF',
    fontSize: 13,
    lineHeight: 18,
  },
  addCommentContainer: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#1F2C34',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#E9EDEF',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#2A3942',
    marginRight: 10,
    maxHeight: 80,
  },
  sendButton: {
    backgroundColor: '#2ECC71',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  sendButtonText: {
    color: '#121B22',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
