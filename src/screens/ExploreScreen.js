// ─────────────────────────────────────────────────────────────────────────────
// Ribbit — Explore Screen (Apple Design System)
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
import { theme } from '../utils/theme';

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
        <View style={styles.searchBarWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchBar}
            placeholder="Buscar por nome ou espécie..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
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
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredSpecies}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhum anfíbio correspondente encontrado.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.speciesCard}
              onPress={() => setSelectedSpeciesId(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>{item.nome_popular}</Text>
                  <Text style={styles.cardScientific}>{item.nome_cientifico}</Text>
                </View>
                <View style={styles.chevronContainer}>
                   <Text style={styles.chevron}>›</Text>
                </View>
              </View>

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
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 16,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 4,
    fontWeight: '400',
  },
  searchBarContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(118, 118, 128, 0.12)', // Apple Search Bar color
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
    opacity: 0.5,
  },
  searchBar: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 17,
  },
  regionsContainer: {
    marginBottom: 24,
  },
  regionsScroll: {
    paddingHorizontal: 24,
  },
  regionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 10,
    ...theme.shadows.soft,
  },
  regionButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  regionButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  regionButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 180, // Space for FAB and Tab Bar
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  speciesCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    marginBottom: 16,
    ...theme.shadows.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  chevronContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevron: {
    color: theme.colors.border,
    fontSize: 24,
    fontWeight: '300',
  },
  cardScientific: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 2,
    fontWeight: '500',
  },
  cardDescription: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    marginTop: 12,
    lineHeight: 20,
    fontWeight: '400',
  },
  tagsContainer: {
    flexDirection: 'row',
    marginTop: 16,
  },
  tag: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)', // Light version of primary
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  tagHabitat: {
    backgroundColor: 'rgba(0, 113, 227, 0.1)', // Light version of accent
  },
  tagText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
});
