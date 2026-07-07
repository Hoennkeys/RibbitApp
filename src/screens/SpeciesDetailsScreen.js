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
} from 'react-native';
import Spectrogram from '../components/Spectrogram';
import { dataService } from '../services/dataService';
import { supabase } from '../services/supabaseClient';
import { theme } from '../utils/theme';

export default function SpeciesDetailsScreen({ speciesId, onBack }) {
  const [species, setSpecies] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
    fetchSpeciesData();
    return () => setIsPlaying(false);
  }, [speciesId]);

  const fetchSpeciesData = async () => {
    setLoading(true);
    try {
      const sData = await dataService.getSpeciesById(speciesId);
      setSpecies(sData);
      const cData = await dataService.getComments(speciesId);
      setComments(cData);
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
      await dataService.addComment(speciesId, user.id, userName, newCommentText);
      setNewCommentText('');
      const cData = await dataService.getComments(speciesId);
      setComments(cData);
    } catch (error) {
      console.error(error);
    }
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
          <Text style={styles.backButtonText}>‹ Voltar</Text>
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
          <Text style={styles.sectionTitle}>Canto do Anfíbio</Text>
          <View style={styles.playerCard}>
            <Spectrogram isActive={isPlaying} color={theme.colors.primary} />
            <TouchableOpacity
              style={[styles.playButton, isPlaying && styles.pauseButton]}
              onPress={() => setIsPlaying(!isPlaying)}
            >
              <Text style={styles.playButtonText}>
                {isPlaying ? 'PAUSAR' : 'OUVIR CANTO 🔊'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descrição</Text>
          <View style={styles.infoCard}>
            <Text style={styles.bodyText}>{species.descricao}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fato Curioso</Text>
          <View style={[styles.infoCard, styles.factCard]}>
            <Text style={styles.factText}>💡 {species.fatos_curiosos}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discussão Científica ({comments.length})</Text>
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
                placeholder="Adicionar nota científica..."
                placeholderTextColor={theme.colors.textSecondary}
                value={newCommentText}
                onChangeText={setNewCommentText}
                multiline
              />
              <TouchableOpacity style={styles.sendButton} onPress={handleAddComment}>
                <Text style={styles.sendButtonText}>Enviar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 24, paddingTop: 64, paddingBottom: 100 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  errorText: { color: theme.colors.textPrimary, fontSize: 16, marginBottom: 20 },
  backButton: { marginBottom: 24 },
  backButtonText: { color: theme.colors.accent, fontSize: 17, fontWeight: '500' },
  header: { marginBottom: 32 },
  nomePopular: { fontSize: 34, fontWeight: '800', color: theme.colors.textPrimary, letterSpacing: -1 },
  nomeCientifico: { fontSize: 18, fontStyle: 'italic', color: theme.colors.textSecondary, marginTop: 4 },
  tagsRow: { flexDirection: 'row', marginTop: 16 },
  tag: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, marginRight: 10 },
  tagRegion: { backgroundColor: 'rgba(52, 199, 89, 0.1)' },
  tagHabitat: { backgroundColor: 'rgba(0, 113, 227, 0.1)' },
  tagText: { color: theme.colors.primary, fontSize: 12, fontWeight: '700' },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 12 },
  playerCard: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 20, alignItems: 'center', ...theme.shadows.soft },
  playButton: { backgroundColor: theme.colors.primary, paddingVertical: 12, paddingHorizontal: 32, borderRadius: 14, marginTop: 20, ...theme.shadows.medium },
  pauseButton: { backgroundColor: '#FF3B30' },
  playButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  infoCard: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 20, ...theme.shadows.soft },
  factCard: { backgroundColor: 'rgba(52, 199, 89, 0.05)', borderColor: 'rgba(52, 199, 89, 0.2)', borderWidth: 1 },
  factText: { color: theme.colors.textPrimary, fontSize: 15, lineHeight: 22 },
  bodyText: { fontSize: 15, color: theme.colors.textSecondary, lineHeight: 22 },
  commentCard: { backgroundColor: theme.colors.surface, borderRadius: 14, padding: 16, marginBottom: 12, ...theme.shadows.soft },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  commentAuthor: { color: theme.colors.primary, fontWeight: '700', fontSize: 14 },
  commentTime: { color: theme.colors.textSecondary, fontSize: 12 },
  commentText: { color: theme.colors.textPrimary, fontSize: 14, lineHeight: 20 },
  addCommentContainer: { marginTop: 16, flexDirection: 'row', alignItems: 'center' },
  commentInput: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, color: theme.colors.textPrimary, fontSize: 15, marginRight: 10, ...theme.shadows.soft, maxHeight: 100 },
  sendButton: { backgroundColor: theme.colors.primary, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 14, ...theme.shadows.medium },
  sendButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
