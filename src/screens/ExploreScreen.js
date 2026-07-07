// ─────────────────────────────────────────────────────────────────────────────
// Ribbit — Explore Screen
// Location: C:\Ribbit\RibbitApp\src\screens\ExploreScreen.js
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { dataService } from '../services/dataService';
import SpeciesDetailsScreen from './SpeciesDetailsScreen';

const REGIONS = ['Todos', 'Mata Atlântica', 'Cerrado e Caatinga', 'Sudeste e Centro-Oeste'];

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('Todos');
  const [selectedSpeciesId, setSelectedSpeciesId] = useState(null);
  const [speciesList, setSpeciesList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpecies();
  }, []);

  const fetchSpecies = async () => {
    try {
      const data = await dataService.getSpecies();
      setSpeciesList(data);
    } catch (error) {
      console.error('Erro ao buscar espécies:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSpecies = speciesList.filter((item) => {
    const matchesSearch =
      item.nome_popular.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nome_cientifico.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesRegion =
      selectedRegion === 'Todos' || item.regiao.includes(selectedRegion);

    return matchesSearch && matchesRegion;
  });

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
      <View style={styles.header}>
        <Text style={styles.title}>Explorar Regiões</Text>
        <Text style={styles.subtitle}>Descubra os anfíbios que habitam o Brasil</Text>
      </View>

      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchBar}
          placeholder="Buscar por nome ou espécie..."
          placeholderTextColor="#8596A0"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.regionsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.regionsScroll}>
          {REGIONS.map((region) => (
            <TouchableOpacity
              key={region}
              style={[
                styles.regionButton,
                selectedRegion === region && styles.regionButtonActive,
              ]}
              onPress={() => setSelectedRegion(region)}
            >
              <Text
                style={[
                  styles.regionButtonText,
                  selectedRegion === region && styles.regionButtonTextActive,
                ]}
              >
                {region === 'Todos' ? 'Brasil Inteiro' : region}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2ECC71" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredSpecies}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhum anfíbio correspondente encontrado.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.speciesCard}
              onPress={() => setSelectedSpeciesId(item.id)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.nome_popular}</Text>
                <Text style={styles.cardArrow}>→</Text>
              </View>
              <Text style={styles.cardScientific}>{item.nome_cientifico}</Text>
              <Text style={styles.cardDescription} numberOfLines={2}>
                {item.descricao}
              </Text>

              <View style={styles.tagsContainer}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{item.regiao}</Text>
                </View>
                <View style={[styles.tag, styles.tagHabitat]}>
                  <Text style={styles.tagText}>{item.habitat}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121B22',
  },
  header: {
    padding: 24,
    paddingBottom: 10,
    alignItems: 'center',
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
  },
  searchBarContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchBar: {
    backgroundColor: '#1F2C34',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#E9EDEF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2A3942',
  },
  regionsContainer: {
    marginBottom: 20,
  },
  regionsScroll: {
    paddingHorizontal: 24,
  },
  regionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#1F2C34',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#2A3942',
  },
  regionButtonActive: {
    backgroundColor: '#2ECC71',
    borderColor: '#2ECC71',
  },
  regionButtonText: {
    color: '#8596A0',
    fontSize: 13,
    fontWeight: '600',
  },
  regionButtonTextActive: {
    color: '#121B22',
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#8596A0',
    fontSize: 14,
  },
  speciesCard: {
    backgroundColor: '#1F2C34',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2A3942',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#E9EDEF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardArrow: {
    color: '#2ECC71',
    fontSize: 20,
    fontWeight: 'bold',
  },
  cardScientific: {
    color: '#8596A0',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 2,
  },
  cardDescription: {
    color: '#8596A0',
    fontSize: 13,
    marginTop: 10,
    lineHeight: 18,
  },
  tagsContainer: {
    flexDirection: 'row',
    marginTop: 14,
  },
  tag: {
    backgroundColor: '#1A3326',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginRight: 8,
  },
  tagHabitat: {
    backgroundColor: '#1A2933',
  },
  tagText: {
    color: '#2ECC71',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
