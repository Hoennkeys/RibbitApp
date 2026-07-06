// ─────────────────────────────────────────────────────────────────────────────
// RibbitApp — Life List & Review Screen
// Location: C:\Ribbit\RibbitApp\src\screens\LifeListScreen.js
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { mockDataService } from '../services/mockDataService';

export default function LifeListScreen() {
  const [profile, setProfile] = useState({});
  const [sons, setSons] = useState([]);
  const [isRevisorMode, setIsRevisorMode] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState(null);
  const [reviewComments, setReviewComments] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProfile({ ...mockDataService.getUserProfile() });
    setSons([...mockDataService.getSons()]);
  };

  const handleReviewAction = (sonId, aprovado) => {
    if (!reviewComments.trim()) {
      Alert.alert('Erro', 'Por favor, adicione uma justificativa científica.');
      return;
    }
    mockDataService.reviewSon(sonId, aprovado, reviewComments);
    Alert.alert(
      'Revisão Concluída',
      `O áudio foi ${aprovado ? 'APROVADO' : 'REJEITADO'} com sucesso. O autor recebeu 100 XP.`
    );
    setSelectedReviewId(null);
    setReviewComments('');
    loadData();
  };

  const renderObservationItem = ({ item }) => {
    const species = mockDataService.getSpeciesById(item.especie_id);
    const dateFormatted = new Date(item.data_captura).toLocaleDateString('pt-BR');
    
    // Cores de status
    const statusColors = {
      aprovado: '#2ECC71',
      pendente: '#F1C40F',
      rejeitado: '#E74C3C',
    };

    return (
      <View style={styles.obsCard}>
        <View style={styles.obsHeader}>
          <Text style={styles.obsPopular}>{species?.nome_popular || 'Espécie Desconhecida'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status_revisao] + '20' }]}>
            <Text style={[styles.statusText, { color: statusColors[item.status_revisao] }]}>
              {item.status_revisao.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.obsScientific}>{species?.nome_cientifico}</Text>
        <Text style={styles.obsInfo}>📍 {item.localizacao} • 📅 {dateFormatted}</Text>
        
        {item.comentarios_revisor && (
          <View style={styles.revisorFeedback}>
            <Text style={styles.revisorFeedbackTitle}>Comentário do Revisor Científico:</Text>
            <Text style={styles.revisorFeedbackText}>"{item.comentarios_revisor}"</Text>
          </View>
        )}
      </View>
    );
  };

  const renderReviewItem = ({ item }) => {
    const species = mockDataService.getSpeciesById(item.especie_id);
    const dateFormatted = new Date(item.data_captura).toLocaleDateString('pt-BR');

    const isReviewingThis = selectedReviewId === item.id;

    return (
      <View style={[styles.obsCard, styles.reviewCard]}>
        <View style={styles.obsHeader}>
          <View>
            <Text style={styles.obsPopular}>{species?.nome_popular}</Text>
            <Text style={styles.obsScientific}>{species?.nome_cientifico}</Text>
          </View>
          <Text style={styles.submitterText}>Por: {item.usuario_nome}</Text>
        </View>
        
        <Text style={styles.obsInfo}>📍 {item.localizacao} • 📅 {dateFormatted}</Text>
        
        {isReviewingThis ? (
          <View style={styles.reviewForm}>
            <TextInput
              style={styles.reviewInput}
              placeholder="Justificativa científica da validação..."
              placeholderTextColor="#8596A0"
              value={reviewComments}
              onChangeText={setReviewComments}
              multiline
            />
            <View style={styles.reviewActionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.approveBtn]}
                onPress={() => handleReviewAction(item.id, true)}
              >
                <Text style={styles.actionBtnText}>Aprovar ✓</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionBtn, styles.rejectBtn]}
                onPress={() => handleReviewAction(item.id, false)}
              >
                <Text style={styles.actionBtnText}>Rejeitar ✗</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedReviewId(null)}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.startReviewBtn}
            onPress={() => setSelectedReviewId(item.id)}
          >
            <Text style={styles.startReviewBtnText}>Avaliar Registro</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Filtra dependendo do modo
  const listData = isRevisorMode
    ? sons.filter(s => s.status_revisao === 'pendente')
    : sons.filter(s => s.usuario_id === profile.id);

  // Calcula porcentagem da barra de XP (teto de 500 XP para fins de demonstração)
  const xpPercent = Math.min((profile.xp / 500) * 100, 100);

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarLetter}>{profile.nome ? profile.nome[0] : 'U'}</Text>
        </View>
        <View style={styles.profileDetails}>
          <Text style={styles.profileName}>{profile.nome}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>🏆 {profile.nivel}</Text>
          </View>
          
          <View style={styles.xpContainer}>
            <View style={styles.xpBarBackground}>
              <View style={[styles.xpBarForeground, { width: `${xpPercent}%` }]} />
            </View>
            <Text style={styles.xpText}>{profile.xp} / 500 XP</Text>
          </View>
        </View>
      </View>

      <View style={styles.modeToggleContainer}>
        <TouchableOpacity
          style={[styles.modeTab, !isRevisorMode && styles.modeTabActive]}
          onPress={() => {
            setIsRevisorMode(false);
            setSelectedReviewId(null);
          }}
        >
          <Text style={[styles.modeTabText, !isRevisorMode && styles.modeTabTextActive]}>
            Minhas Observações
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.modeTab, isRevisorMode && styles.modeTabActive]}
          onPress={() => {
            setIsRevisorMode(true);
            setSelectedReviewId(null);
          }}
        >
          <Text style={[styles.modeTabText, isRevisorMode && styles.modeTabTextActive]}>
            Modo Revisor 🔬
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={listData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          isRevisorMode ? (
            <Text style={styles.sectionTitle}>Sons Aguardando Revisão Científica</Text>
          ) : (
            <Text style={styles.sectionTitle}>Minha Coleção Científica</Text>
          )
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {isRevisorMode
                ? 'Nenhum som pendente de revisão.'
                : 'Você ainda não registrou nenhum canto de anfíbio.'}
            </Text>
          </View>
        }
        renderItem={isRevisorMode ? renderReviewItem : renderObservationItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121B22',
  },
  profileHeader: {
    backgroundColor: '#1F2C34',
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#2A3942',
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2ECC71',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  avatarLetter: {
    color: '#121B22',
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    color: '#E9EDEF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  levelBadge: {
    backgroundColor: '#2A3942',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  levelBadgeText: {
    color: '#E9EDEF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  xpContainer: {
    marginTop: 10,
  },
  xpBarBackground: {
    height: 8,
    backgroundColor: '#2A3942',
    borderRadius: 4,
    width: '90%',
    overflow: 'hidden',
  },
  xpBarForeground: {
    height: '100%',
    backgroundColor: '#2ECC71',
  },
  xpText: {
    color: '#8596A0',
    fontSize: 11,
    marginTop: 4,
  },
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#1F2C34',
    padding: 6,
    borderRadius: 12,
    marginHorizontal: 24,
    marginVertical: 18,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeTabActive: {
    backgroundColor: '#121B22',
    borderWidth: 1,
    borderColor: '#2A3942',
  },
  modeTabText: {
    color: '#8596A0',
    fontSize: 13,
    fontWeight: '600',
  },
  modeTabTextActive: {
    color: '#2ECC71',
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E9EDEF',
    marginBottom: 16,
  },
  obsCard: {
    backgroundColor: '#1F2C34',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2A3942',
  },
  reviewCard: {
    borderColor: '#3D5361',
  },
  obsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  obsPopular: {
    color: '#E9EDEF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  obsScientific: {
    color: '#8596A0',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
  obsInfo: {
    color: '#8596A0',
    fontSize: 12,
    marginTop: 8,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  revisorFeedback: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A3942',
  },
  revisorFeedbackTitle: {
    color: '#2ECC71',
    fontSize: 12,
    fontWeight: 'bold',
  },
  revisorFeedbackText: {
    color: '#E9EDEF',
    fontSize: 12.5,
    fontStyle: 'italic',
    marginTop: 4,
  },
  submitterText: {
    color: '#8596A0',
    fontSize: 12,
    fontWeight: '600',
  },
  startReviewBtn: {
    backgroundColor: '#2ECC71',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  startReviewBtnText: {
    color: '#121B22',
    fontWeight: 'bold',
    fontSize: 13,
  },
  reviewForm: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#2A3942',
    paddingTop: 12,
  },
  reviewInput: {
    backgroundColor: '#121B22',
    borderRadius: 10,
    padding: 12,
    color: '#E9EDEF',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#2A3942',
    minHeight: 60,
  },
  reviewActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  approveBtn: {
    backgroundColor: '#2ECC71',
  },
  rejectBtn: {
    backgroundColor: '#E74C3C',
  },
  actionBtnText: {
    color: '#121B22',
    fontWeight: 'bold',
    fontSize: 13,
  },
  cancelBtn: {
    alignSelf: 'center',
    marginTop: 12,
  },
  cancelBtnText: {
    color: '#8596A0',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#8596A0',
    fontSize: 14,
    textAlign: 'center',
  },
});
