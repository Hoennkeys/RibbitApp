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

const DASHBOARD_DATA = {
  news: [
    { id: 1, title: 'Nova espécie descoberta na Amazônia', date: 'Hoje' },
    { id: 2, title: 'Workshop de Identificação Sonora no próximo sábado', date: '2 dias atrás' },
  ],
  importantDiscoveries: [
    { id: 101, name: 'Sapo-de-chifre', location: 'Mata Atlântica', rarity: 'Raro' },
    { id: 102, name: 'Perereca-verde', location: 'Cerrado', rarity: 'Comum' },
  ],
  recentActivity: [
    { id: 201, user: 'João Silva', action: 'identificou um Sapo-cururu', time: '10 min atrás' },
    { id: 202, user: 'Maria Souza', action: 'subiu uma nova foto de Perereca-de-vidro', time: '45 min atrás' },
  ]
};

export default function DashboardScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>O que há de novo no mundo dos anfíbios</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Novidades & Anúncios</Text>
        {DASHBOARD_DATA.news.map(item => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardInfo}>{item.date}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Descobertas Importantes</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
          {DASHBOARD_DATA.importantDiscoveries.map(item => (
            <TouchableOpacity key={item.id} style={styles.horizontalCard}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.rarity}</Text>
              </View>
              <Text style={styles.discoveryName}>{item.name}</Text>
              <Text style={styles.discoveryLocation}>{item.location}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Atividade Recente</Text>
        <View style={styles.groupContainer}>
          {DASHBOARD_DATA.recentActivity.map((item, index) => (
            <View key={item.id}>
              <View style={styles.activityItem}>
                <Text style={styles.activityUser}>{item.user}</Text>
                <Text style={styles.activityAction}>{item.action}</Text>
                <Text style={styles.activityTime}>{item.time}</Text>
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
  content: { padding: 24, paddingTop: 60 },
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
