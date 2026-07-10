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
import { useLanguage } from '../utils/i18n';

const REGIONS = ['Todos', 'Mata Atlântica', 'Cerrado', 'Sudeste', 'Norte', 'Sul'];

export default function ExploreScreen() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('Todos');
  const [selectedType, setSelectedType] = useState('Todos'); // 'Todos', 'Sapos', 'Rãs', 'Pererecas'
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
      item.nome_cientifico.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.descricao.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesRegion =
      selectedRegion === 'Todos' || 
      item.regiao.toLowerCase().includes(selectedRegion.toLowerCase());

    const matchesType =
      selectedType === 'Todos' ||
      item.tipo?.toLowerCase() === selectedType.toLowerCase().replace(/s$/, '').replace(/rãs$/, 'rã');

    return matchesSearch && matchesRegion && matchesType;
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
        <Text style={styles.title}>{t('explore_title')}</Text>
        <Text style={styles.subtitle}>{t('explore_subtitle')}</Text>
      </View>

      <View style={styles.searchBarContainer}>
        <View style={styles.searchBarWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchBar}
            placeholder={t('search_placeholder')}
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Category selector */}
      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
          {['Todos', 'Sapos', 'Rãs', 'Pererecas'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.categoryButton,
                selectedType === type && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedType(type)}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedType === type && styles.categoryButtonTextActive,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Region selector */}
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
                {region === 'Todos' ? t('all_brazil') : region}
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
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('empty_search')}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const tagBg = item.tipo === 'Sapo' ? 'rgba(217, 119, 6, 0.1)' : item.tipo === 'Rã' ? 'rgba(0, 113, 227, 0.1)' : 'rgba(52, 199, 89, 0.1)';
            const tagColor = item.tipo === 'Sapo' ? '#D97706' : item.tipo === 'Rã' ? '#0071E3' : '#34C759';

            return (
              <TouchableOpacity
                style={styles.speciesCard}
                onPress={() => setSelectedSpeciesId(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.cardTitle}>{item.nome_popular}</Text>
                      <View style={[styles.taxBadge, { backgroundColor: tagBg }]}>
                        <Text style={[styles.taxBadgeText, { color: tagColor }]}>{item.tipo}</Text>
                      </View>
                    </View>
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
            );
          }}
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
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    marginTop: 4,
    fontWeight: '400',
    textAlign: 'center',
  },
  searchBarContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(118, 118, 128, 0.12)',
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
    fontSize: 16,
  },
  categoriesContainer: {
    marginBottom: 10,
  },
  categoriesScroll: {
    paddingHorizontal: 24,
  },
  categoryButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  regionsContainer: {
    marginBottom: 20,
  },
  regionsScroll: {
    paddingHorizontal: 24,
  },
  regionButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 8,
  },
  regionButtonActive: {
    backgroundColor: '#0071E3',
    borderColor: '#0071E3',
  },
  regionButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  regionButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 150,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  speciesCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    marginBottom: 14,
    ...theme.shadows.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  taxBadge: {
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 4,
  },
  taxBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  chevronContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevron: {
    color: theme.colors.border,
    fontSize: 22,
    fontWeight: '300',
  },
  cardScientific: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 2,
    fontWeight: '500',
  },
  cardDescription: {
    color: theme.colors.textSecondary,
    fontSize: 13.5,
    marginTop: 10,
    lineHeight: 18,
    fontWeight: '400',
  },
  tagsContainer: {
    flexDirection: 'row',
    marginTop: 12,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tagHabitat: {
    backgroundColor: 'rgba(0, 113, 227, 0.05)',
    borderColor: 'rgba(0, 113, 227, 0.1)',
  },
  tagText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
});
