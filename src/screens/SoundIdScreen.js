// ─────────────────────────────────────────────────────────────────────────────
// RibbitApp — Sound ID Screen
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

export default function SoundIdScreen() {
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
    
    // Análise simulada com dados reais do banco
    setTimeout(async () => {
      try {
        const allSpecies = await dataService.getSpecies();
        setIsAnalyzing(false);

        // Simula matching (em um app real isso seria via API de IA)
        if (allSpecies.length > 0) {
          setSuggestions([
            { ...allSpecies[0], matchChance: 96 },
            { ...allSpecies[1], matchChance: 74 },
          ].filter(s => s.id));
        }
      } catch (error) {
        setIsAnalyzing(false);
        Alert.alert('Erro', 'Não foi possível analisar o áudio.');
      }
    }, 2000);
  };

  const handleSaveObservation = async (species) => {
    if (!userId) {
      Alert.alert('Aviso', 'Você precisa estar logado para salvar observações.');
      return;
    }

    try {
      await dataService.addObservation(species.id, 'Localização GPS', userId);
      Alert.alert(
        '🐸 Sucesso!',
        `Sua observação de "${species.nome_popular}" foi enviada para o banco de dados. Você ganhou 50 XP!`,
      );
      setSuggestions([]);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar a observação.');
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
        <Text style={styles.subtitle}>Grave o coaxar para identificar o anfíbio</Text>
      </View>

      <View style={styles.recordingArea}>
        <Spectrogram isActive={isRecording} color="#2ECC71" />
        
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>
            {isRecording ? `Gravando: 00:0${timer}` : 'Pronto para gravar'}
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
            <ActivityIndicator size="large" color="#2ECC71" />
            <Text style={styles.analyzingText}>Analisando espectrograma de áudio...</Text>
          </View>
        )}
      </View>

      {suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.sectionTitle}>Espécies Identificadas</Text>
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
                <Text style={styles.saveButtonText}>Salvar</Text>
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
    backgroundColor: '#121B22',
  },
  content: {
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E9EDEF',
  },
  subtitle: {
    fontSize: 14,
    color: '#8596A0',
    marginTop: 6,
    textAlign: 'center',
  },
  recordingArea: {
    alignItems: 'center',
    marginBottom: 40,
  },
  timerContainer: {
    marginVertical: 20,
  },
  timerText: {
    color: '#E9EDEF',
    fontSize: 16,
    fontWeight: '600',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2ECC71',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  recordButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#121B22',
  },
  stopButton: {
    backgroundColor: '#E74C3C',
    shadowColor: '#E74C3C',
  },
  stopButtonInner: {
    width: 26,
    height: 26,
    borderRadius: 4,
    backgroundColor: '#121B22',
  },
  analyzingContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  analyzingText: {
    color: '#2ECC71',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
  },
  suggestionsContainer: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E9EDEF',
    marginBottom: 16,
  },
  suggestionCard: {
    backgroundColor: '#1F2C34',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A3942',
  },
  suggestionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  badge: {
    backgroundColor: '#2ECC71',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginRight: 14,
  },
  badgeText: {
    color: '#121B22',
    fontSize: 13,
    fontWeight: 'bold',
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionName: {
    color: '#E9EDEF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  suggestionScientific: {
    color: '#8596A0',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 2,
  },
  saveButton: {
    backgroundColor: '#2A3942',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3D5361',
  },
  saveButtonText: {
    color: '#2ECC71',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
