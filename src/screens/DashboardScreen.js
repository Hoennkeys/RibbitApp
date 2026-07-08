// ─────────────────────────────────────────────────────────────────────────────
// Ribbit — Dashboard Screen (Apple Design System)
// Location: C:\Ribbit\RibbitApp\src\screens\DashboardScreen.js
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { theme } from '../utils/theme';
import { useLanguage } from '../utils/i18n';

const DASHBOARD_DATA = {
  news: [
    { id: 1, titleKey: 'news_1', dateKey: 'date_today' },
    { id: 2, titleKey: 'news_2', dateKey: 'date_2days' },
  ],
  importantDiscoveries: [
    { id: 101, nameKey: 'species_horned', locationKey: 'region_atlantic', rarityKey: 'rarity_rare' },
    { id: 102, nameKey: 'species_tree', locationKey: 'region_cerrado', rarityKey: 'rarity_common' },
  ],
  recentActivity: [
    { id: 201, user: 'João Silva', actionKey: 'act_identified', timeKey: 'time_10m' },
    { id: 202, user: 'Maria Souza', actionKey: 'act_uploaded', timeKey: 'time_45m' },
  ]
};

export default function DashboardScreen() {
  const { t } = useLanguage();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('dashboard')}</Text>
        <Text style={styles.subtitle}>{t('dashboard_subtitle')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('news')}</Text>
        {DASHBOARD_DATA.news.map(item => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.cardTitle}>{t(item.titleKey)}</Text>
            <Text style={styles.cardInfo}>{t(item.dateKey)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('discoveries')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
          {DASHBOARD_DATA.importantDiscoveries.map(item => (
            <TouchableOpacity key={item.id} style={styles.horizontalCard}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{t(item.rarityKey)}</Text>
              </View>
              <Text style={styles.discoveryName}>{t(item.nameKey)}</Text>
              <Text style={styles.discoveryLocation}>{t(item.locationKey)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('activity')}</Text>
        <View style={styles.groupContainer}>
          {DASHBOARD_DATA.recentActivity.map((item, index) => (
            <View key={item.id}>
              <View style={styles.activityItem}>
                <Text style={styles.activityUser}>{item.user}</Text>
                <Text style={styles.activityAction}>{t(item.actionKey)}</Text>
                <Text style={styles.activityTime}>{t(item.timeKey)}</Text>
              </View>
              {index < DASHBOARD_DATA.recentActivity.length - 1 && <View style={styles.separator} />}
            </View>
          ))}
        </View>
      </View>
      <View style={{ height: 180 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 24, paddingTop: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 34, fontWeight: '800', color: theme.colors.textPrimary, textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: theme.colors.textSecondary, marginTop: 8, textAlign: 'center' },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 16, letterSpacing: -0.3 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, ...theme.shadows.soft },
  cardTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.textPrimary },
  cardInfo: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 4 },
  horizontalScroll: { paddingRight: 24 },
  horizontalCard: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, marginRight: 16, width: 200, ...theme.shadows.soft },
  badge: { backgroundColor: 'rgba(52, 199, 89, 0.1)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 12 },
  badgeText: { color: theme.colors.primary, fontSize: 11, fontWeight: '700' },
  discoveryName: { fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary },
  discoveryLocation: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 4 },
  groupContainer: { backgroundColor: theme.colors.surface, borderRadius: 16, overflow: 'hidden', ...theme.shadows.soft },
  activityItem: { padding: 16 },
  activityUser: { fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary },
  activityAction: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 2 },
  activityTime: { fontSize: 12, color: theme.colors.border, marginTop: 6, fontWeight: '600' },
  separator: { height: 1, backgroundColor: theme.colors.background, marginHorizontal: 16 },
});
