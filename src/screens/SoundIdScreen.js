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
import { mockDataService } from '../services/mockDataService';
import SpeciesDetailsScreen from './SpeciesDetailsScreen';

export default function SoundIdScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState(null);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev >= 6) {
            // Auto stop after 6 seconds
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
    
    // Simula análise de espectrograma por inteligência artificial (2 segundos)
    setTimeout(() => {
      setIsAnalyzing(false);
      // Sugere espécies baseado no som gravado
      const allSpecies = mockDataService.getSpecies();
      setSuggestions([
        { ...allSpecies[1], matchChance: 96 }, // Perereca-verde
        { ...allSpecies[0], matchChance: 74 }, // Sapo-cururu
        { ...allSpecies[2], matchChance: 35 }  // Rã-pimenta
      ]);
    }, 2000);
  };

  const handleSaveObservation = (species) => {
    mockDataService.addSon(species.id, 'Lagoa de Parelheiros, SP');
    Alert.alert(
      '🐸 Sucesso!',
      `Sua observação de "${species.nome_popular}" foi enviada para revisão da comunidade científica e você ganhou 50 XP!`,
      [{ text: 'Ver na Minha Lista' }]
    );
    // Limpa sugestões
    setSuggestions([]);
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
    paddingBottom: 40,
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
