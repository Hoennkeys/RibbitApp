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
} from 'react-native';
import Spectrogram from '../components/Spectrogram';
import { dataService } from '../services/dataService';
import supabase from '../services/supabaseClient';
import SpeciesDetailsScreen from './SpeciesDetailsScreen';
import { theme } from '../utils/theme';
import { useLanguage } from '../utils/i18n';

export default function SoundIdScreen() {
  const { t } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });

    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev >= 6) {
            handleStopRecording();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setTimer(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleStartRecording = () => {
    setSuggestions([]);
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsAnalyzing(true);
    
    setTimeout(async () => {
      try {
        const allSpecies = await dataService.getSpecies();
        setIsAnalyzing(false);
        if (allSpecies.length > 0) {
          setSuggestions([
            { ...allSpecies[0], matchChance: 96 },
            { ...allSpecies[1], matchChance: 74 },
          ].filter(s => s.id));
        }
      } catch (error) {
        setIsAnalyzing(false);
        Alert.alert('Erro', t('err_analyze'));
      }
    }, 2000);
  };

  const handleSaveObservation = async (species) => {
    if (!userId) {
      Alert.alert('Aviso', t('login_warning'));
      return;
    }
    try {
      await dataService.addObservation(species.id, 'Localização GPS', userId);
      Alert.alert('✅ Sucesso!', t('obs_saved').replace('{species}', species.nome_popular));
      setSuggestions([]);
    } catch (error) {
      Alert.alert('Erro', t('err_save'));
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
            {isRecording ? `00:0${timer}` : t('ready_record')}
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
            onPress={handleStopRecording}
            activeOpacity={0.85}
          >
            <View style={styles.stopButtonInner} />
          </TouchableOpacity>
        )}

        {isAnalyzing && (
          <View style={styles.analyzingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.analyzingText}>{t('analyzing')}</Text>
          </View>
        )}
      </View>

      {suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.sectionTitle}>{t('identified_species')}</Text>
          {suggestions.map((spec) => (
            <View key={spec.id} style={styles.suggestionCard}>
              <TouchableOpacity
                style={styles.suggestionInfo}
                onPress={() => setSelectedSpeciesId(spec.id)}
              >
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{spec.matchChance}%</Text>
                </View>
                <View style={styles.suggestionTextContainer}>
                  <Text style={styles.suggestionName}>{spec.nome_popular}</Text>
                  <Text style={styles.suggestionScientific}>{spec.nome_cientifico}</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => handleSaveObservation(spec)}
              >
                <Text style={styles.saveButtonText}>{t('save')}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
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
    alignItems: 'center', // Centralized header
    marginBottom: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
    textAlign: 'center', // Centralized text
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 8,
    textAlign: 'center', // Centralized text
  },
  recordingArea: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 32,
    ...theme.shadows.soft,
    marginBottom: 32,
  },
  spectrogramContainer: {
    width: '100%',
    height: 120,
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  timerContainer: {
    marginBottom: 24,
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
  },
  analyzingText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
    marginTop: 16,
  },
  suggestionsContainer: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  suggestionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    ...theme.shadows.soft,
  },
  suggestionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  badge: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginRight: 12,
  },
  badgeText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionName: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  suggestionScientific: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 2,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
