// ─────────────────────────────────────────────────────────────────────────────
// Ribbit — Profile & Menu Screen (Apple Design System)
// Location: C:\Ribbit\RibbitApp\src\screens\LifeListScreen.js
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  PermissionsAndroid,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { dataService } from '../services/dataService';
import { theme } from '../utils/theme';

export default function LifeListScreen({ isGuest, user, onLogin, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('menu'); // 'menu', 'collection', 'changePassword', 'changeEmail', 'addPhoto'

  // States para Alterar Senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // States para Alterar E-mail
  const [newEmail, setNewEmail] = useState('');
  const [updatingEmail, setUpdatingEmail] = useState(false);

  // States para Foto de Perfil
  const [avatarUrl, setAvatarUrl] = useState('');
  const [updatingPhoto, setUpdatingPhoto] = useState(false);

  useEffect(() => {
    if (!isGuest && user) {
      loadProfileAndData();
    } else {
      setLoading(false);
    }
  }, [isGuest, user]);

  const loadProfileAndData = async () => {
    setLoading(true);
    try {
      const profileData = await dataService.getProfile(user.id);
      if (profileData) {
        setProfile(profileData);
        if (profileData.avatar_url) setAvatarUrl(profileData.avatar_url);
      } else {
        setProfile({
          full_name: user.user_metadata?.full_name || user.email.split('@')[0],
          xp: 0,
          nivel: 'Novo Observador'
        });
      }
      const obsData = await dataService.getObservations(user.id);
      setObservations(obsData);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Erro', 'A nova senha e a confirmação não coincidem.');
      return;
    }
    setUpdatingPassword(true);
    try {
      const isCorrect = await dataService.verifyCurrentPassword(user.email, currentPassword);
      if (!isCorrect) {
        Alert.alert('Erro', 'Senha atual incorreta.');
        setUpdatingPassword(false);
        return;
      }
      await dataService.updatePassword(newPassword);
      Alert.alert('Sucesso', 'Sua senha foi alterada com sucesso!');
      setCurrentView('menu');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail) {
      Alert.alert('Erro', 'Por favor, insira o novo e-mail.');
      return;
    }
    setUpdatingEmail(true);
    try {
      await dataService.updateEmail(newEmail);
      Alert.alert('E-mail Atualizado', 'Verifique seu novo e-mail para confirmar a alteração.');
      setCurrentView('menu');
      setNewEmail('');
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleUpdatePhoto = async () => {
    if (!avatarUrl) {
      Alert.alert('Erro', 'Por favor, insira uma URL válida.');
      return;
    }
    setUpdatingPhoto(true);
    try {
      await dataService.updateAvatar(user.id, avatarUrl);
      Alert.alert('Sucesso', 'Foto atualizada!');
      await loadProfileAndData();
      setCurrentView('menu');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar a foto.');
    } finally {
      setUpdatingPhoto(false);
    }
  };

  const handleSelectImage = async (useCamera = false) => {
    const options = { mediaType: 'photo', quality: 0.8 };
    const result = useCamera ? await launchCamera(options) : await launchImageLibrary(options);
    if (result.didCancel || result.errorCode) return;

    const imageFile = result.assets[0];
    setUpdatingPhoto(true);
    try {
      const publicUrl = await dataService.uploadAvatar(user.id, imageFile);
      await dataService.updateAvatar(user.id, publicUrl);
      setAvatarUrl(publicUrl);
      await loadProfileAndData();
      setCurrentView('menu');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível fazer o upload.');
    } finally {
      setUpdatingPhoto(false);
    }
  };

  if (isGuest) {
    return (
      <View style={styles.container}>
        <View style={styles.guestContainer}>
          <Text style={styles.guestEmoji}>🔒</Text>
          <Text style={styles.guestTitle}>Área Restrita</Text>
          <Text style={styles.guestSubtitle}>
            Faça login para salvar suas observações, ganhar XP e participar da comunidade científica.
          </Text>
          <TouchableOpacity style={styles.guestLoginButton} onPress={onLogin}>
            <Text style={styles.guestLoginButtonText}>Entrar ou Criar Conta</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // --- SUB-VIEWS ---

  if (currentView === 'collection') {
    return (
      <View style={styles.container}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setCurrentView('menu')} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹ Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.subTitle}>Minha Coleção</Text>
        </View>
        <FlatList
          data={observations}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const dateFormatted = new Date(item.created_at).toLocaleDateString('pt-BR');
            return (
              <View style={styles.obsCard}>
                <View style={styles.obsHeader}>
                  <Text style={styles.obsPopular}>{item.species?.nome_popular || 'Espécie'}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{item.status_revisao?.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.obsScientific}>{item.species?.nome_cientifico}</Text>
                <Text style={styles.obsInfo}>📍 {item.localizacao} • 📅 {dateFormatted}</Text>
              </View>
            );
          }}
        />
      </View>
    );
  }

  if (currentView === 'addPhoto') {
    return (
      <View style={styles.container}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setCurrentView('menu')} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹ Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.subTitle}>Foto de Perfil</Text>
        </View>
        <ScrollView contentContainerStyle={styles.formPadding}>
          <View style={styles.photoPreviewContainer}>
            <View style={styles.largeAvatarCircle}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.largeAvatarImage} />
              ) : (
                <Text style={styles.largeAvatarLetter}>
                  {profile?.full_name ? profile.full_name[0].toUpperCase() : 'U'}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>URL da Imagem</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Cole o link da foto"
              placeholderTextColor={theme.colors.textSecondary}
              value={avatarUrl}
              onChangeText={setAvatarUrl}
            />
          </View>
          <View style={styles.optionsRow}>
            <TouchableOpacity style={styles.optionMiniCard} onPress={() => handleSelectImage(true)}>
              <Text style={{fontSize: 24}}>📸</Text>
              <Text style={styles.miniCardText}>Câmera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionMiniCard} onPress={() => handleSelectImage(false)}>
              <Text style={{fontSize: 24}}>🖼️</Text>
              <Text style={styles.miniCardText}>Galeria</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.saveButton} onPress={handleUpdatePhoto} disabled={updatingPhoto}>
            {updatingPhoto ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Salvar Foto</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (currentView === 'changeEmail') {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setCurrentView('menu')} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹ Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.subTitle}>Alterar E-mail</Text>
        </View>
        <ScrollView contentContainerStyle={styles.formPadding}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Novo E-mail</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Digite o novo e-mail"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              value={newEmail}
              onChangeText={setNewEmail}
            />
          </View>
          <TouchableOpacity style={styles.saveButton} onPress={handleChangeEmail} disabled={updatingEmail}>
            {updatingEmail ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Atualizar E-mail</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (currentView === 'changePassword') {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setCurrentView('menu')} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹ Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.subTitle}>Alterar Senha</Text>
        </View>
        <ScrollView contentContainerStyle={styles.formPadding}>
          <View style={styles.groupContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Senha Atual"
              placeholderTextColor={theme.colors.textSecondary}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <View style={styles.separator} />
            <TextInput
              style={styles.textInput}
              placeholder="Nova Senha"
              placeholderTextColor={theme.colors.textSecondary}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <View style={styles.separator} />
            <TextInput
              style={styles.textInput}
              placeholder="Confirmar Nova Senha"
              placeholderTextColor={theme.colors.textSecondary}
              secureTextEntry
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
            />
          </View>
          <TouchableOpacity style={[styles.saveButton, {marginTop: 24}]} onPress={handleChangePassword} disabled={updatingPassword}>
            {updatingPassword ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Atualizar Senha</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // --- MAIN MENU VIEW ---

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.profileHeader}>
        <View style={styles.profileMain}>
          <View style={styles.avatarCircle}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarLetter}>
                {profile?.full_name ? profile.full_name[0].toUpperCase() : 'U'}
              </Text>
            )}
          </View>
          <View style={styles.profileDetails}>
            <Text style={styles.profileName}>{profile?.full_name || 'Usuário'}</Text>
            <Text style={styles.profileLevel}>🏆 {profile?.nivel || 'Iniciante'}</Text>
            <Text style={styles.xpText}>{profile?.xp || 0} XP acumulados</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
             <Text style={styles.logoutButtonText}>Sair</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.menuContainer}>
        <Text style={styles.sectionLabel}>ATIVIDADE</Text>
        <View style={styles.groupContainer}>
          <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentView('collection')}>
            <Text style={styles.menuIcon}>🐸</Text>
            <Text style={styles.menuText}>Minha Coleção ({observations.length})</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>PERFIL</Text>
        <View style={styles.groupContainer}>
          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Em breve', 'Funcionalidade Bio em desenvolvimento.')}>
            <Text style={styles.menuIcon}>📝</Text>
            <Text style={styles.menuText}>Bio</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Em breve', 'Informações Acadêmicas em desenvolvimento.')}>
            <Text style={styles.menuIcon}>🎓</Text>
            <Text style={styles.menuText}>Informações Acadêmicas</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentView('addPhoto')}>
            <Text style={styles.menuIcon}>📷</Text>
            <Text style={styles.menuText}>Foto de Perfil</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentView('changeEmail')}>
            <Text style={styles.menuIcon}>📧</Text>
            <Text style={styles.menuText}>Alterar E-mail</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentView('changePassword')}>
            <Text style={styles.menuIcon}>🔑</Text>
            <Text style={styles.menuText}>Alterar Senha</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>CONECTAR</Text>
        <View style={styles.groupContainer}>
          <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
            <Text style={styles.menuIcon}>🔗</Text>
            <Text style={styles.menuText}>Currículo Lattes</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
            <Text style={styles.menuIcon}>💼</Text>
            <Text style={styles.menuText}>LinkedIn</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ height: 180 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  profileHeader: { backgroundColor: theme.colors.surface, paddingHorizontal: 24, paddingTop: 64, paddingBottom: 32, ...theme.shadows.soft },
  profileMain: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', marginRight: 16, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarLetter: { color: theme.colors.primary, fontSize: 32, fontWeight: '800' },
  profileDetails: { flex: 1 },
  profileName: { color: theme.colors.textPrimary, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  profileLevel: { color: theme.colors.primary, fontSize: 15, marginTop: 2, fontWeight: '600' },
  xpText: { color: theme.colors.textSecondary, fontSize: 13, marginTop: 4 },
  logoutButton: { paddingVertical: 8 },
  logoutButtonText: { color: '#FF3B30', fontSize: 15, fontWeight: '600' },
  menuContainer: { padding: 20 },
  sectionLabel: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: '600', marginLeft: 16, marginBottom: 8, marginTop: 24 },
  groupContainer: { backgroundColor: theme.colors.surface, borderRadius: 14, overflow: 'hidden', ...theme.shadows.soft },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  separator: { height: 1, backgroundColor: theme.colors.background, marginHorizontal: 16 },
  menuIcon: { fontSize: 20, marginRight: 12 },
  menuText: { flex: 1, color: theme.colors.textPrimary, fontSize: 17, fontWeight: '400' },
  menuArrow: { color: theme.colors.border, fontSize: 20 },
  subHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 64, paddingBottom: 16, backgroundColor: theme.colors.surface },
  backButton: { marginRight: 16 },
  backButtonText: { color: theme.colors.accent, fontSize: 17, fontWeight: '500' },
  subTitle: { color: theme.colors.textPrimary, fontSize: 20, fontWeight: '700' },
  listContent: { padding: 20, paddingBottom: 120 },
  obsCard: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, ...theme.shadows.soft },
  obsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  obsPopular: { color: theme.colors.textPrimary, fontSize: 17, fontWeight: '700' },
  obsScientific: { color: theme.colors.textSecondary, fontSize: 13, fontStyle: 'italic', marginTop: 2 },
  obsInfo: { color: theme.colors.textSecondary, fontSize: 13, marginTop: 12 },
  statusBadge: { backgroundColor: 'rgba(52, 199, 89, 0.1)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  statusText: { color: theme.colors.primary, fontSize: 10, fontWeight: '700' },
  guestContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  guestEmoji: { fontSize: 80, marginBottom: 24 },
  guestTitle: { fontSize: 28, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 12 },
  guestSubtitle: { fontSize: 17, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 40, lineHeight: 24 },
  guestLoginButton: { backgroundColor: theme.colors.primary, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 32, width: '100%', alignItems: 'center', ...theme.shadows.medium },
  guestLoginButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
  formPadding: { padding: 20, paddingTop: 24 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: '600', marginLeft: 4, marginBottom: 8 },
  textInput: { backgroundColor: theme.colors.surface, padding: 16, color: theme.colors.textPrimary, fontSize: 17, borderRadius: 14 },
  saveButton: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 14, alignItems: 'center', ...theme.shadows.medium },
  saveButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
  photoPreviewContainer: { alignItems: 'center', marginBottom: 32 },
  largeAvatarCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', ...theme.shadows.medium },
  largeAvatarImage: { width: '100%', height: '100%' },
  largeAvatarLetter: { color: theme.colors.primary, fontSize: 48, fontWeight: '800' },
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  optionMiniCard: { flex: 1, backgroundColor: theme.colors.surface, padding: 16, borderRadius: 14, alignItems: 'center', marginHorizontal: 6, ...theme.shadows.soft },
  miniCardText: { color: theme.colors.textPrimary, fontSize: 13, marginTop: 8, fontWeight: '600' },
});
