// ─────────────────────────────────────────────────────────────────────────────
// RibbitApp — Wizard Screen (Assistente de Identificação)
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
import { mockDataService } from '../services/mockDataService';
import SpeciesDetailsScreen from './SpeciesDetailsScreen';

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

  const handleSelectOption = (value) => {
    const key = QUESTIONS[currentStep].key;
    setAnswers(prev => ({ ...prev, [key]: value }));
    
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Processa resultado
      showSuggestions();
    }
  };

  const showSuggestions = () => {
    const allSpecies = mockDataService.getSpecies();
    
    // Filtro flexível baseado nas respostas
    const matches = allSpecies.filter(spec => {
      // Região
      const matchReg = !answers.regiao || spec.regiao.toLowerCase().includes(answers.regiao.toLowerCase()) || spec.nome_popular === 'Sapo-cururu';
      // Habitat
      const matchHab = !answers.habitat || spec.habitat.toLowerCase().includes(answers.habitat.toLowerCase()) || spec.nome_popular === 'Sapo-cururu';
      
      return matchReg || matchHab;
    });

    setResults(matches);
    setCurrentStep(QUESTIONS.length); // Ir para tela de resultados
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
          <Text style={styles.questionTitle}>{QUESTIONS[currentStep].title}</Text>
          <Text style={styles.progressText}>Passo {currentStep + 1} de {QUESTIONS.length}</Text>
          
          <View style={styles.optionsContainer}>
            {QUESTIONS[currentStep].options.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={styles.optionButton}
                onPress={() => handleSelectOption(opt.value)}
              >
                <Text style={styles.optionText}>{opt.label}</Text>
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
                activeOpacity={0.8}
              >
                <View style={styles.resultHeader}>
                  <Text style={styles.resultPopular}>{spec.nome_popular}</Text>
                  <Text style={styles.resultArrow}>→</Text>
                </View>
                <Text style={styles.resultScientific}>{spec.nome_cientifico}</Text>
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
  card: {
    backgroundColor: '#1F2C34',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2A3942',
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E9EDEF',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 13,
    color: '#8596A0',
    marginBottom: 24,
  },
  optionsContainer: {
    width: '100%',
  },
  optionButton: {
    backgroundColor: '#2A3942',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3D5361',
  },
  optionText: {
    color: '#E9EDEF',
    fontSize: 14,
    fontWeight: '600',
  },
  backStepButton: {
    alignSelf: 'center',
    marginTop: 16,
  },
  backStepText: {
    color: '#8596A0',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  resultsContainer: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E9EDEF',
    marginBottom: 16,
  },
  resultCard: {
    backgroundColor: '#1F2C34',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A3942',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultPopular: {
    color: '#E9EDEF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultArrow: {
    color: '#2ECC71',
    fontSize: 18,
  },
  resultScientific: {
    color: '#8596A0',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
  resultDescription: {
    color: '#8596A0',
    fontSize: 13,
    marginTop: 10,
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  emptyText: {
    color: '#8596A0',
    fontSize: 14,
  },
  resetButton: {
    backgroundColor: '#2ECC71',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  resetButtonText: {
    color: '#121B22',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
