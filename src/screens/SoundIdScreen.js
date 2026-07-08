// ─────────────────────────────────────────────────────────────────────────────
// Ribbit — Sound ID Screen (Apple Design System)
// Location: C:\Ribbit\RibbitApp\src\screens\SoundIdScreen.js
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import Spectrogram from '../components/Spectrogram';
import { dataService } from '../services/dataService';
import supabase from '../services/supabaseClient';
import SpeciesDetailsScreen from './SpeciesDetailsScreen';
import { theme } from '../utils/theme';
import { useLanguage } from '../utils/i18n';

// Map species ID to beautiful online illustrations
const getSpeciesImage = (id, name) => {
  const normalizedName = (name || '').toLowerCase();
  if (normalizedName.includes('cururu') || id === 'sp-1') {
    return 'https://images.unsplash.com/photo-1563200921-774f2662c16c?w=600&auto=format&fit=crop';
  } else if (normalizedName.includes('verde') || id === 'sp-2') {
    return 'https://images.unsplash.com/photo-1579380656108-f98e4df8ea62?w=600&auto=format&fit=crop';
  } else if (normalizedName.includes('pimenta') || id === 'sp-3') {
    return 'https://images.unsplash.com/photo-1622273464529-65123d573ebc?w=600&auto=format&fit=crop';
  } else if (normalizedName.includes('adornado') || id === 'sp-4') {
    return 'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=600&auto=format&fit=crop';
  }
  return 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=600&auto=format&fit=crop';
};

export default function SoundIdScreen() {
  const { t } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Custom pipeline states
  const [analysisStep, setAnalysisStep] = useState('');
  const [analysisError, setAnalysisError] = useState('');
  const [matchedSpecies, setMatchedSpecies] = useState(null);
  
  const [showSuggestionInput, setShowSuggestionInput] = useState(false);
  const [suggestionText, setSuggestionText] = useState('');
  const [lastUploadedAudioUrl, setLastUploadedAudioUrl] = useState(null);
  const [isSavingSuggestion, setIsSavingSuggestion] = useState(false);

  const [selectedSpeciesId, setSelectedSpeciesId] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
      } else {
        setUserId(null);
      }
    });

    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev >= 30) {
            handleStopRecording(30);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setTimer(0);
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);

  const handleStartRecording = () => {
    setMatchedSpecies(null);
    setShowSuggestionInput(false);
    setSuggestionText('');
    setAnalysisError('');
    setAnalysisStep('');
    setLastUploadedAudioUrl(null);
    setIsRecording(true);
  };

  const handleStopRecording = (forcedDuration = null) => {
    setIsRecording(false);
    const duration = forcedDuration !== null ? forcedDuration : timer;
    
    // Validate duration
    if (duration < 3) {
      const errMsg = 'Erro: gravação insuficiente.';
      setAnalysisError(errMsg);
      Alert.alert('Erro de Captura', errMsg);
      return;
    }

    // Default recording format is valid (.mp3)
    processAudioPipeline('gravação_celular.mp3', duration);
  };

  const validateFile = (filename, duration) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (!['wav', 'mp3', 'aac'].includes(ext)) {
      throw new Error('Erro: formato de áudio não aceito.');
    }
    if (duration < 3) {
      throw new Error('Erro: gravação insuficiente.');
    }
    if (duration > 30) {
      throw new Error('Erro: gravação excede o limite de 30 segundos.');
    }
  };

  const processAudioPipeline = async (filename, duration, forceConfidence = null) => {
    setIsAnalyzing(true);
    setAnalysisError('');
    setMatchedSpecies(null);
    setShowSuggestionInput(false);
    setSuggestionText('');

    try {
      // 1. Validate audio details
      validateFile(filename, duration);

      // 2. Pre-processing simulation
      setAnalysisStep('Capturando gravação...');
      await new Promise(resolve => setTimeout(resolve, 800));

      setAnalysisStep('Normalizando volume...');
      await new Promise(resolve => setTimeout(resolve, 800));

      setAnalysisStep('Reduzindo ruídos...');
      await new Promise(resolve => setTimeout(resolve, 800));

      setAnalysisStep('Identificando espécie...');
      await new Promise(resolve => setTimeout(resolve, 800));

      // 3. Automatic identification check
      const allSpecies = await dataService.getSpecies();
      
      const isHighConfidence = forceConfidence !== null ? forceConfidence >= 80 : Math.random() >= 0.4;
      const matchChance = isHighConfidence ? Math.floor(Math.random() * 20) + 80 : Math.floor(Math.random() * 45) + 30;

      setIsAnalyzing(false);
      setAnalysisStep('');

      if (matchChance >= 80 && allSpecies.length > 0) {
        // High confidence match
        const match = allSpecies[0]; // Map to first species (usually Sapo-cururu)
        setMatchedSpecies({
          ...match,
          matchChance,
          image: getSpeciesImage(match.id, match.nome_popular)
        });
        // Create public storage mock link
        setLastUploadedAudioUrl(`https://wopqlnjextgodfvvmapc.supabase.co/storage/v1/object/public/sons/mock-audio-${match.id}.mp3`);
      } else {
        // Fallback flow
        setShowSuggestionInput(true);
        setLastUploadedAudioUrl(`https://wopqlnjextgodfvvmapc.supabase.co/storage/v1/object/public/sons/mock-audio-fallback-${Date.now()}.mp3`);
      }

    } catch (error) {
      setIsAnalyzing(false);
      setAnalysisStep('');
      setAnalysisError(error.message);
      Alert.alert('Erro de Validação', error.message);
    }
  };

  const handleSaveObservation = async (species) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Aviso', t('login_warning'));
      return;
    }
    try {
      // Pass the audio URL along with location and species
      const result = await dataService.addObservation(
        species.id,
        'Parque Estadual, SP',
        user.id,
        null, // sugestao is null since identified
        lastUploadedAudioUrl
      );
      
      // XP Feedback
      if (result && result.xpResult) {
        if (result.xpResult.limitReached) {
          Alert.alert('Limite Atingido', t('daily_limit_reached'));
        } else if (result.xpResult.xpAdded > 0) {
          Alert.alert('XP!', t('earned_xp').replace('{xp}', result.xpResult.xpAdded.toString()));
        }
      }
      
      Alert.alert('✅ Sucesso!', t('obs_saved').replace('{species}', species.nome_popular));
      setMatchedSpecies(null);
    } catch (error) {
      Alert.alert('Erro', t('err_save'));
    }
  };

  const handleSubmitSuggestion = async () => {
    if (!suggestionText.trim()) {
      Alert.alert('Erro', 'Por favor, insira uma sugestão de identificação.');
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Aviso', t('login_warning'));
      return;
    }

    setIsSavingSuggestion(true);
    try {
      // Save pending suggestion (species id is null)
      const result = await dataService.addObservation(
        null,
        'Mata Atlântica, SP',
        user.id,
        suggestionText,
        lastUploadedAudioUrl
      );

      // Award XP
      if (result && result.xpResult && result.xpResult.xpAdded > 0) {
        Alert.alert(
          'Sugestão Enviada!',
          `Gravação recebida. Sua sugestão "${suggestionText}" foi salva com sucesso e está pendente de validação pela administradora.\n\n${t('earned_xp').replace('{xp}', result.xpResult.xpAdded.toString())}`
        );
      } else {
        Alert.alert(
          'Sugestão Enviada!',
          `Gravação recebida. Sua sugestão "${suggestionText}" foi salva e está pendente de validação pela administradora.`
        );
      }

      setShowSuggestionInput(false);
      setSuggestionText('');
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', error.message || 'Não foi possível enviar a sugestão.');
    } finally {
      setIsSavingSuggestion(false);
    }
  };

  if (selectedSpeciesId) {
    return (
      <SpeciesDetailsScreen
        speciesId={selectedSpeciesId}
        onBack={() => setSelectedSpeciesId(null)}
      />
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Sound ID</Text>
        <Text style={styles.subtitle}>{t('soundid_subtitle')}</Text>
      </View>

      <View style={styles.recordingArea}>
        <View style={styles.spectrogramContainer}>
           <Spectrogram isActive={isRecording} color={theme.colors.primary} />
        </View>
        
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>
            {isRecording ? `00:${timer < 10 ? '0' + timer : timer}` : t('ready_record')}
          </Text>
        </View>

        {!isRecording && !isAnalyzing && (
          <TouchableOpacity
            style={styles.recordButton}
            onPress={handleStartRecording}
            activeOpacity={0.85}
          >
            <View style={styles.recordButtonInner} />
          </TouchableOpacity>
        )}

        {isRecording && (
          <TouchableOpacity
            style={[styles.recordButton, styles.stopButton]}
            onPress={() => handleStopRecording()}
            activeOpacity={0.85}
          >
            <View style={styles.stopButtonInner} />
          </TouchableOpacity>
        )}

        {isAnalyzing && (
          <View style={styles.analyzingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.analyzingText}>{analysisStep || t('analyzing')}</Text>
          </View>
        )}
        
        {analysisError ? (
          <Text style={styles.errorText}>{analysisError}</Text>
        ) : null}
      </View>

      {/* High Confidence Result Card */}
      {matchedSpecies && (
        <View style={styles.resultCard}>
          <Text style={styles.statusTitle}>✅ Espécie encontrada: {matchedSpecies.nome_popular}</Text>
          
          <Image source={{ uri: matchedSpecies.image }} style={styles.speciesImage} />
          
          <View style={styles.speciesInfoRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{matchedSpecies.matchChance}% Match</Text>
            </View>
            <Text style={styles.scientificName}>{matchedSpecies.nome_cientifico}</Text>
          </View>

          <Text style={styles.speciesDesc} numberOfLines={3}>
            {matchedSpecies.descricao}
          </Text>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.btn, styles.btnSecondary]} 
              onPress={() => setSelectedSpeciesId(matchedSpecies.id)}
            >
              <Text style={styles.btnSecondaryText}>Ver Detalhes</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.btn, styles.btnPrimary]} 
              onPress={() => handleSaveObservation(matchedSpecies)}
            >
              <Text style={styles.btnPrimaryText}>{t('save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Low Confidence / Fallback Card */}
      {showSuggestionInput && (
        <View style={styles.fallbackCard}>
          <Text style={styles.warningTitle}>⚠️ Não encontramos correspondência.</Text>
          <Text style={styles.fallbackSubtitle}>Deseja sugerir uma identificação?</Text>
          
          <TextInput
            style={styles.suggestionInput}
            placeholder="Nome científico ou popular..."
            placeholderTextColor={theme.colors.textSecondary}
            value={suggestionText}
            onChangeText={setSuggestionText}
          />

          <TouchableOpacity
            style={styles.submitSuggestionBtn}
            onPress={handleSubmitSuggestion}
            disabled={isSavingSuggestion}
          >
            {isSavingSuggestion ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitSuggestionText}>Enviar Sugestão</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Simulator Control Dashboard (For Development / Verification) */}
      <View style={styles.simDashboard}>
        <Text style={styles.simTitle}>🛠️ Simulador de Pipeline (Validação)</Text>
        <Text style={styles.simSubtitle}>Teste os critérios do plano sem precisar gravar fisicamente</Text>

        <View style={styles.simButtonsContainer}>
          <TouchableOpacity
            style={styles.simBtn}
            onPress={() => processAudioPipeline('som.mp3', 2)} // Duration error
          >
            <Text style={styles.simBtnText}>⏱️ Duração &lt; 3s</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.simBtn}
            onPress={() => processAudioPipeline('foto_sapo.png', 10)} // Format error
          >
            <Text style={styles.simBtnText}>📄 Formato PNG</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.simBtn, styles.simBtnSuccess]}
            onPress={() => processAudioPipeline('canto.mp3', 15, 95)} // Success High Confidence
          >
            <Text style={styles.simBtnTextSuccess}>🐸 Alta Confiança (95%)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.simBtn, styles.simBtnWarning]}
            onPress={() => processAudioPipeline('ruido.wav', 8, 45)} // Success Low Confidence
          >
            <Text style={styles.simBtnTextWarning}>🔍 Baixa Confiança (45%)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 24,
    paddingTop: 24,
    paddingBottom: 180,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  recordingArea: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 28,
    ...theme.shadows.soft,
    borderWidth: 1,
    borderColor: 'rgba(249, 250, 251, 0.04)',
    marginBottom: 20,
  },
  spectrogramContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#030712',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  timerContainer: {
    marginBottom: 20,
  },
  timerText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  recordButtonInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  stopButtonInner: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  analyzingContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  analyzingText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.2)',
    ...theme.shadows.medium,
  },
  statusTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  speciesImage: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    marginBottom: 16,
  },
  speciesInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  badgeText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  scientificName: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  speciesDesc: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: theme.colors.primary,
    marginLeft: 8,
  },
  btnPrimaryText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  btnSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 8,
  },
  btnSecondaryText: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
    fontSize: 15,
  },
  fallbackCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.2)',
    ...theme.shadows.medium,
  },
  warningTitle: {
    color: '#FF9500',
    fontSize: 18,
    fontWeight: '800',
  },
  fallbackSubtitle: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 16,
  },
  suggestionInput: {
    backgroundColor: '#030712',
    color: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  submitSuggestionBtn: {
    backgroundColor: theme.colors.accent,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  submitSuggestionText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  simDashboard: {
    backgroundColor: 'rgba(139, 92, 246, 0.06)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.15)',
    marginTop: 10,
  },
  simTitle: {
    color: theme.colors.purple,
    fontSize: 16,
    fontWeight: '700',
  },
  simSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  simButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  simBtn: {
    width: '48%',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  simBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  simBtnSuccess: {
    borderColor: 'rgba(52, 199, 89, 0.2)',
  },
  simBtnTextSuccess: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  simBtnWarning: {
    borderColor: 'rgba(255, 149, 0, 0.2)',
  },
  simBtnTextWarning: {
    color: '#FF9500',
    fontSize: 12,
    fontWeight: '700',
  },
});
