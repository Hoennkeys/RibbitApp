// ─────────────────────────────────────────────────────────────────────────────
// Ribbit — Profile & Menu Screen
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
    if (newPassword.length < 6) {
      Alert.alert('Erro', 'A nova senha deve ter pelo menos 6 caracteres.');
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
      Alert.alert('Erro', 'Não foi possível alterar a senha: ' + error.message);
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail) {
      Alert.alert('Erro', 'Por favor, insira o novo e-mail.');
      return;
    }
    if (newEmail === user.email) {
      Alert.alert('Erro', 'O novo e-mail deve ser diferente do atual.');
      return;
    }

    setUpdatingEmail(true);
    try {
      await dataService.updateEmail(newEmail);
      Alert.alert(
        'E-mail Atualizado',
        'Um link de confirmação foi enviado para o seu novo e-mail. Por favor, verifique para concluir a alteração.'
      );
      setCurrentView('menu');
      setNewEmail('');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível alterar o e-mail: ' + error.message);
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleUpdatePhoto = async () => {
    if (!avatarUrl) {
      Alert.alert('Erro', 'Por favor, insira uma URL de imagem válida.');
      return;
    }

    setUpdatingPhoto(true);
    try {
      await dataService.updateAvatar(user.id, avatarUrl);
      Alert.alert('Sucesso', 'Sua foto de perfil foi atualizada!');
      await loadProfileAndData();
      setCurrentView('menu');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar a foto.');
    } finally {
      setUpdatingPhoto(false);
    }
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Permissão de Câmera',
            message: 'O Ribbit precisa de acesso à sua câmera para tirar sua foto de perfil.',
            buttonNeutral: 'Perguntar Depois',
            buttonNegative: 'Cancelar',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const handleSelectImage = async (useCamera = false) => {
    if (useCamera) {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Alert.alert('Erro', 'A permissão da câmera foi negada.');
        return;
      }
    }

    const options = {
      mediaType: 'photo',
      includeBase64: true,
      maxHeight: 1000,
      maxWidth: 1000,
      quality: 0.8,
    };

    const result = useCamera
      ? await launchCamera(options)
      : await launchImageLibrary(options);

    if (result.didCancel) return;
    if (result.errorCode) {
      Alert.alert('Erro', 'Houve um erro ao acessar a mídia.');
      return;
    }

    const imageFile = result.assets[0];
    setUpdatingPhoto(true);

    try {
      const publicUrl = await dataService.uploadAvatar(user.id, imageFile);
      await dataService.updateAvatar(user.id, publicUrl);
      setAvatarUrl(publicUrl);
      Alert.alert('Sucesso', 'Foto atualizada com sucesso!');
      await loadProfileAndData();
      setCurrentView('menu');
    } catch (error) {
      console.error('Erro detalhado:', error);
      Alert.alert('Erro', `Não foi possível fazer o upload: ${error.message || 'Verifique sua conexão'}`);
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
        <ActivityIndicator size="large" color="#2ECC71" />
      </View>
    );
  }

  // View de Coleção (Sub-menu)
  if (currentView === 'collection') {
    return (
      <View style={styles.container}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setCurrentView('menu')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.subTitle}>Minha Coleção</Text>
        </View>
        <FlatList
          data={observations}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const dateFormatted = new Date(item.created_at).toLocaleDateString('pt-BR');
            const statusColors = { aprovado: '#2ECC71', pendente: '#F1C40F', rejeitado: '#E74C3C' };
            return (
              <View style={styles.obsCard}>
                <View style={styles.obsHeader}>
                  <Text style={styles.obsPopular}>{item.species?.nome_popular || 'Espécie'}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status_revisao] + '20' }]}>
                    <Text style={[styles.statusText, { color: statusColors[item.status_revisao] }]}>
                      {item.status_revisao?.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.obsScientific}>{item.species?.nome_cientifico}</Text>
                <Text style={styles.obsInfo}>📍 {item.localizacao} • 📅 {dateFormatted}</Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhuma observação registrada.</Text>
            </View>
          }
        />
      </View>
    );
  }

  // View de Adicionar Foto de Perfil
  if (currentView === 'addPhoto') {
    return (
      <View style={styles.container}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setCurrentView('menu')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Voltar</Text>
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
            <Text style={styles.photoHint}>Preview da sua foto de perfil</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>URL da sua Foto</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Cole o link da sua foto (JPG/PNG)"
              placeholderTextColor="#8596A0"
              value={avatarUrl}
              onChangeText={setAvatarUrl}
            />
          </View>

          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.optionMiniCard}
              onPress={() => handleSelectImage(true)}
              disabled={updatingPhoto}
            >
              <Text style={{fontSize: 32}}>📸</Text>
              <Text style={styles.miniCardText}>Câmera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionMiniCard}
              onPress={() => handleSelectImage(false)}
              disabled={updatingPhoto}
            >
              <Text style={{fontSize: 32}}>🖼️</Text>
              <Text style={styles.miniCardText}>Galeria</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, updatingPhoto && { opacity: 0.7 }]}
            onPress={handleUpdatePhoto}
            disabled={updatingPhoto}
          >
            {updatingPhoto ? (
              <ActivityIndicator color="#121B22" />
            ) : (
              <Text style={styles.saveButtonText}>Salvar Foto de Perfil</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.infoNote}>
            Nota: Esta foto identifica você como pesquisador/observador na comunidade Ribbit.
          </Text>
        </ScrollView>
      </View>
    );
  }

  // Views de Alterar Senha/Email (Omitidas para brevidade, mas mantidas no arquivo original)
  if (currentView === 'changePassword' || currentView === 'changeEmail') {
     // Re-incluir os blocos de Password/Email que estavam aqui
     if (currentView === 'changePassword') {
        return (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <View style={styles.subHeader}>
              <TouchableOpacity onPress={() => setCurrentView('menu')} style={styles.backButton}><Text style={styles.backButtonText}>← Voltar</Text></TouchableOpacity>
              <Text style={styles.subTitle}>Alterar Senha</Text>
            </View>
            <ScrollView contentContainerStyle={styles.formPadding}>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>Senha Atual</Text><TextInput style={styles.textInput} placeholder="Digite sua senha atual" placeholderTextColor="#8596A0" secureTextEntry value={currentPassword} onChangeText={setCurrentPassword}/></View>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>Nova Senha</Text><TextInput style={styles.textInput} placeholder="Digite a nova senha" placeholderTextColor="#8596A0" secureTextEntry value={newPassword} onChangeText={setNewPassword}/></View>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>Confirmar Nova Senha</Text><TextInput style={styles.textInput} placeholder="Confirme a nova senha" placeholderTextColor="#8596A0" secureTextEntry value={confirmNewPassword} onChangeText={setConfirmNewPassword}/></View>
              <TouchableOpacity style={[styles.saveButton, updatingPassword && { opacity: 0.7 }]} onPress={handleChangePassword} disabled={updatingPassword}>{updatingPassword ? <ActivityIndicator color="#121B22" /> : <Text style={styles.saveButtonText}>Atualizar Senha</Text>}</TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        );
     }
     if (currentView === 'changeEmail') {
        return (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <View style={styles.subHeader}>
              <TouchableOpacity onPress={() => setCurrentView('menu')} style={styles.backButton}><Text style={styles.backButtonText}>← Voltar</Text></TouchableOpacity>
              <Text style={styles.subTitle}>Alterar E-mail</Text>
            </View>
            <ScrollView contentContainerStyle={styles.formPadding}>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>E-mail Atual</Text><TextInput style={[styles.textInput, { opacity: 0.6 }]} value={user.email} editable={false}/></View>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>Novo E-mail</Text><TextInput style={styles.textInput} placeholder="Digite o novo e-mail" placeholderTextColor="#8596A0" keyboardType="email-address" autoCapitalize="none" value={newEmail} onChangeText={setNewEmail}/></View>
              <TouchableOpacity style={[styles.saveButton, updatingEmail && { opacity: 0.7 }]} onPress={handleChangeEmail} disabled={updatingEmail}>{updatingEmail ? <ActivityIndicator color="#121B22" /> : <Text style={styles.saveButtonText}>Atualizar E-mail</Text>}</TouchableOpacity>
              <Text style={styles.infoNote}>Nota: Você precisará confirmar a alteração no link enviado para o novo e-mail.</Text>
            </ScrollView>
          </KeyboardAvoidingView>
        );
     }
  }

  // View Principal do Menu de Perfil
  return (
    <ScrollView style={styles.container}>
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
        <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentView('collection')}>
          <Text style={styles.menuIcon}>🐸</Text>
          <Text style={styles.menuText}>Minha Coleção ({observations.length})</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>PERFIL</Text>
        <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Em breve', 'Funcionalidade Bio em desenvolvimento.')}>
          <Text style={styles.menuIcon}>📝</Text>
          <Text style={styles.menuText}>Bio</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Em breve', 'Funcionalidade Informações Acadêmicas em desenvolvimento.')}>
          <Text style={styles.menuIcon}>🎓</Text>
          <Text style={styles.menuText}>Informações Acadêmicas</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentView('addPhoto')}>
          <Text style={styles.menuIcon}>📷</Text>
          <Text style={styles.menuText}>Foto de Perfil</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentView('changeEmail')}>
          <Text style={styles.menuIcon}>📧</Text>
          <Text style={styles.menuText}>Alterar E-mail</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentView('changePassword')}>
          <Text style={styles.menuIcon}>🔑</Text>
          <Text style={styles.menuText}>Alterar Senha</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>INTEGRAÇÃO</Text>
        <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Integração', 'Conecte seu Currículo Lattes.')}>
          <Text style={styles.menuIcon}>🔗</Text>
          <Text style={styles.menuText}>Currículo Lattes</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Integração', 'Conecte seu LinkedIn.')}>
          <Text style={styles.menuIcon}>💼</Text>
          <Text style={styles.menuText}>LinkedIn</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { opacity: 0.6 }]} disabled>
          <Text style={styles.menuIcon}>🎙️</Text>
          <Text style={styles.menuText}>Apps de Gravação (Em breve)</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121B22' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  profileHeader: { backgroundColor: '#1F2C34', padding: 24, paddingTop: 60, borderBottomWidth: 1, borderColor: '#2A3942' },
  profileMain: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#2ECC71', justifyContent: 'center', alignItems: 'center', marginRight: 16, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarLetter: { color: '#121B22', fontSize: 28, fontWeight: 'bold' },
  profileDetails: { flex: 1 },
  profileName: { color: '#E9EDEF', fontSize: 20, fontWeight: 'bold' },
  profileLevel: { color: '#2ECC71', fontSize: 14, marginTop: 2, fontWeight: '600' },
  xpText: { color: '#8596A0', fontSize: 12, marginTop: 4 },
  logoutButton: { paddingVertical: 8, paddingHorizontal: 12 },
  logoutButtonText: { color: '#E74C3C', fontSize: 14, fontWeight: 'bold' },
  menuContainer: { padding: 24 },
  sectionLabel: { color: '#2ECC71', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginTop: 24, marginBottom: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F2C34', padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#2A3942' },
  menuIcon: { fontSize: 20, marginRight: 12 },
  menuText: { flex: 1, color: '#E9EDEF', fontSize: 15, fontWeight: '500' },
  menuArrow: { color: '#8596A0', fontSize: 18 },
  subHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 16, paddingTop: 60, backgroundColor: '#1F2C34', borderBottomWidth: 1, borderColor: '#2A3942', position: 'relative' },
  backButton: { position: 'absolute', left: 24, top: 62, zIndex: 1 },
  backButtonText: { color: '#2ECC71', fontSize: 16, fontWeight: 'bold' },
  subTitle: { color: '#E9EDEF', fontSize: 20, fontWeight: 'bold' },
  listContent: { padding: 24, paddingBottom: 100 },
  obsCard: { backgroundColor: '#1F2C34', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#2A3942' },
  obsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  obsPopular: { color: '#E9EDEF', fontSize: 16, fontWeight: 'bold' },
  obsScientific: { color: '#8596A0', fontSize: 12, fontStyle: 'italic', marginTop: 2 },
  obsInfo: { color: '#8596A0', fontSize: 12, marginTop: 8 },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#8596A0', fontSize: 14 },
  guestContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  guestEmoji: { fontSize: 64, marginBottom: 20 },
  guestTitle: { fontSize: 24, fontWeight: 'bold', color: '#E9EDEF', marginBottom: 12 },
  guestSubtitle: { fontSize: 16, color: '#8596A0', textAlign: 'center', marginBottom: 32, lineHeight: 24 },
  guestLoginButton: { backgroundColor: '#2ECC71', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 32, alignItems: 'center' },
  guestLoginButtonText: { color: '#121B22', fontSize: 16, fontWeight: 'bold' },
  formPadding: { padding: 24, paddingBottom: 120 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { color: '#2ECC71', fontSize: 13, fontWeight: 'bold', marginBottom: 8, marginLeft: 4 },
  textInput: { backgroundColor: '#1F2C34', borderRadius: 12, padding: 16, color: '#E9EDEF', fontSize: 15, borderWidth: 1, borderColor: '#2A3942' },
  saveButton: { backgroundColor: '#2ECC71', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 12, shadowColor: '#2ECC71', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 6, minHeight: 56, justifyContent: 'center' },
  saveButtonText: { color: '#121B22', fontSize: 16, fontWeight: 'bold' },
  infoNote: { color: '#8596A0', fontSize: 13, textAlign: 'center', marginTop: 20, lineHeight: 18 },
  photoPreviewContainer: { alignItems: 'center', marginBottom: 32 },
  largeAvatarCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#1F2C34', borderWidth: 2, borderColor: '#2ECC71', justifyContent: 'center', alignItems: 'center', marginBottom: 12, overflow: 'hidden' },
  largeAvatarImage: { width: '100%', height: '100%' },
  largeAvatarLetter: { color: '#2ECC71', fontSize: 48, fontWeight: 'bold' },
  photoHint: { color: '#8596A0', fontSize: 14 },
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  optionMiniCard: { flex: 1, backgroundColor: '#1F2C34', padding: 16, borderRadius: 12, alignItems: 'center', marginHorizontal: 6, borderWidth: 1, borderColor: '#2A3942' },
  miniAvatar: { width: 50, height: 50, borderRadius: 25 },
  miniCardText: { color: '#E9EDEF', fontSize: 12, marginTop: 8, fontWeight: '600' },
});
