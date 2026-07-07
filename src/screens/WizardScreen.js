// ─────────────────────────────────────────────────────────────────────────────
// Ribbit — Wizard Screen (Apple Design System)
// Location: C:\Ribbit\RibbitApp\src\screens\WizardScreen.js
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { dataService } from '../services/dataService';
import SpeciesDetailsScreen from './SpeciesDetailsScreen';
import { theme } from '../utils/theme';

const QUESTIONS = [
  {
    title: '1. Onde você ouviu o som?',
    key: 'habitat',
    options: [
      { label: 'Áreas Urbanas, Quintais ou Brejos', value: 'Área Urbana' },
      { label: 'Florestas densas ou em Bromélias', value: 'Florestas' },
      { label: 'Margem de Lagoas ou Pastagens', value: 'Margens de Lagoas' },
      { label: 'No chão da floresta (entre folhas caídas)', value: 'Serrapilheira' }
    ]
  },
  {
    title: '2. Como descreveria o tipo de som?',
    key: 'som',
    options: [
      { label: 'Grave e compassado ("rô-rô-rô")', value: 'grave' },
      { label: 'Curto, agudo (assobio metálico rápido)', value: 'metalico' },
      { label: 'Forte e estalado ("whip" ecoante)', value: 'estalado' },
      { label: 'Estridente e contínuo (como grilo)', value: 'grilo' }
    ]
  },
  {
    title: '3. Em qual região do Brasil você está?',
    key: 'regiao',
    options: [
      { label: 'Sudeste e Centro-Oeste', value: 'Sudeste' },
      { label: 'Mata Atlântica (Serra do Mar/Litoral)', value: 'Mata Atlântica' },
      { label: 'Cerrado e Caatinga', value: 'Cerrado' }
    ]
  }
];

export default function WizardScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState([]);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState(null);

  const handleSelectOption = async (value) => {
    const key = QUESTIONS[currentStep].key;
    const newAnswers = { ...answers, [key]: value };
    setAnswers(newAnswers);
    
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      showSuggestions(newAnswers);
    }
  };

  const showSuggestions = async (finalAnswers) => {
    try {
      const allSpecies = await dataService.getSpecies();
      
      const matches = allSpecies.filter(spec => {
        const matchReg = !finalAnswers.regiao || spec.regiao.toLowerCase().includes(finalAnswers.regiao.toLowerCase()) || spec.nome_popular === 'Sapo-cururu';
        const matchHab = !finalAnswers.habitat || spec.habitat.toLowerCase().includes(finalAnswers.habitat.toLowerCase()) || spec.nome_popular === 'Sapo-cururu';
        return matchReg || matchHab;
      });

      setResults(matches);
      setCurrentStep(QUESTIONS.length);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentStep(0);
    setResults([]);
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
        <Text style={styles.title}>Assistente</Text>
        <Text style={styles.subtitle}>Responda e identifique a espécie sem gravar áudio</Text>
      </View>

      {currentStep < QUESTIONS.length ? (
        <View style={styles.card}>
          <Text style={styles.progressText}>Passo {currentStep + 1} de {QUESTIONS.length}</Text>
          <Text style={styles.questionTitle}>{QUESTIONS[currentStep].title}</Text>

          <View style={styles.optionsContainer}>
            {QUESTIONS[currentStep].options.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={styles.optionButton}
                onPress={() => handleSelectOption(opt.value)}
                activeOpacity={0.6}
              >
                <Text style={styles.optionText}>{opt.label}</Text>
                <Text style={styles.optionChevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          {currentStep > 0 && (
            <TouchableOpacity
              style={styles.backStepButton}
              onPress={() => setCurrentStep(prev => prev - 1)}
            >
              <Text style={styles.backStepText}>Voltar ao passo anterior</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.resultsContainer}>
          <Text style={styles.sectionTitle}>Espécies Sugeridas</Text>
          
          {results.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhuma combinação exata encontrada. Tente novamente.</Text>
            </View>
          ) : (
            results.map((spec) => (
              <TouchableOpacity
                key={spec.id}
                style={styles.resultCard}
                onPress={() => setSelectedSpeciesId(spec.id)}
                activeOpacity={0.7}
              >
                <View style={styles.resultHeader}>
                  <View>
                    <Text style={styles.resultPopular}>{spec.nome_popular}</Text>
                    <Text style={styles.resultScientific}>{spec.nome_cientifico}</Text>
                  </View>
                  <Text style={styles.resultArrow}>›</Text>
                </View>
                <Text style={styles.resultDescription} numberOfLines={2}>
                  {spec.descricao}
                </Text>
              </TouchableOpacity>
            ))
          )}

          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>Reiniciar Assistente</Text>
          </TouchableOpacity>
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
    paddingTop: 60, // Increased top padding for vertical balance
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
    fontWeight: '400',
    textAlign: 'center', // Centralized text
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 24,
    ...theme.shadows.soft,
  },
  questionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 24,
    letterSpacing: -0.3,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 1,
  },
  optionsContainer: {
    width: '100%',
  },
  optionButton: {
    backgroundColor: theme.colors.background,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  optionChevron: {
    color: theme.colors.border,
    fontSize: 20,
    marginLeft: 8,
  },
  backStepButton: {
    alignSelf: 'center',
    marginTop: 16,
  },
  backStepText: {
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: '500',
  },
  resultsContainer: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  resultCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    marginBottom: 16,
    ...theme.shadows.soft,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  resultPopular: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  resultArrow: {
    color: theme.colors.border,
    fontSize: 24,
    fontWeight: '300',
  },
  resultScientific: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 2,
  },
  resultDescription: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    marginTop: 12,
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  resetButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
    ...theme.shadows.medium,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 17,
  },
});
