// ─────────────────────────────────────────────────────────────────────────────
// Ribbit — Profile & Menu Screen (Apple Design System)
// Location: C:\Ribbit\RibbitApp\src\screens\LifeListScreen.js
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
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
  BackHandler,
  Modal,
  Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { dataService } from '../services/dataService';
import { theme } from '../utils/theme';
import { useLanguage } from '../utils/i18n';

const sanitizeLevel = (level) => {
  if (!level) return 'Bronze';
  let sanitized = level.replace(/Coaxador de\s+/i, '').replace(/Coaxador\s+/i, '');
  sanitized = sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
  return sanitized;
};

const getAttribution = (user, profile) => {
  if (!user) return 'Explorer';
  const email = (user.email || '').toLowerCase();
  const name = (profile?.full_name || user.user_metadata?.full_name || '').toLowerCase();

  if (email.includes('admin') || name === 'lucas' || email === 'lucas@ribbit.com') {
    return 'Frogger';
  }
  if (email.includes('founder') || email.includes('creator') || email === 'founder@ribbit.com') {
    return 'Founder';
  }
  if (user.created_at) {
    const signupDate = new Date(user.created_at);
    const alphaCutoff = new Date('2026-07-15T00:00:00Z');
    const betaCutoff = new Date('2026-09-01T00:00:00Z');

    if (signupDate < alphaCutoff) {
      return 'Alpha';
    } else if (signupDate < betaCutoff) {
      return 'Beta';
    }
  }
  return 'Explorer';
};

const getXpProgressInfo = (xp) => {
  let currentTierMin = 0;
  let nextTierMin = 200;
  let currentTierName = 'Bronze';
  
  if (xp >= 2000) {
    currentTierMin = 2000;
    nextTierMin = 2000;
    currentTierName = 'Diamante';
  } else if (xp >= 1000) {
    currentTierMin = 1000;
    nextTierMin = 2000;
    currentTierName = 'Platina';
  } else if (xp >= 500) {
    currentTierMin = 500;
    nextTierMin = 1000;
    currentTierName = 'Ouro';
  } else if (xp >= 200) {
    currentTierMin = 200;
    nextTierMin = 500;
    currentTierName = 'Prata';
  }
  
  const denominator = nextTierMin - currentTierMin;
  const progress = denominator > 0 ? (xp - currentTierMin) / denominator : 1;
  
  return {
    progress: Math.min(1, Math.max(0, progress)),
    currentTierMin,
    nextTierMin,
    currentTierName
  };
};

const ProgressBar = ({ xp }) => {
  const { t } = useLanguage();
  const { progress, nextTierMin } = getXpProgressInfo(xp);
  
  return (
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
      <Text style={styles.progressBarText}>
        {t('xp_progress').replace('{current}', xp.toString()).replace('{next}', nextTierMin === xp ? 'MAX' : nextTierMin.toString())}
      </Text>
    </View>
  );
};

export default function LifeListScreen({ isGuest, user, onLogin, onLogout }) {
  const { t, locale, changeLanguage } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('menu'); // 'menu', 'collection', 'changePassword', 'changeEmail', 'addPhoto', 'language'

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

  // States para Bio, Status, Instituição e Experiências
  const [bioText, setBioText] = useState('');
  const [statusText, setStatusText] = useState('');
  const [instituicaoText, setInstituicaoText] = useState('');
  const [experiences, setExperiences] = useState([]);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [savingBio, setSavingBio] = useState(false);
  const [savingAcademic, setSavingAcademic] = useState(false);
  const [editingExpId, setEditingExpId] = useState(null);

  // Level Up Modal States
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpName, setLevelUpName] = useState('');

  // States para Nova Experiência
  const [newExpTitle, setNewExpTitle] = useState('');
  const [newExpInst, setNewExpInst] = useState('');
  const [newExpDesc, setNewExpDesc] = useState('');
  const [newExpPeriod, setNewExpPeriod] = useState('');

  // States para Links do Lattes e LinkedIn
  const [lattesLink, setLattesLink] = useState('');
  const [linkedinLink, setLinkedinLink] = useState('');
  const [importingLattes, setImportingLattes] = useState(false);
  const [importingLinkedin, setImportingLinkedin] = useState(false);

  useEffect(() => {
    if (!isGuest && user) {
      loadProfileAndData();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuest, user]);

  // Reseta para o menu principal ao focar a aba Perfil
  useFocusEffect(
    useCallback(() => {
      setCurrentView('menu');
    }, [])
  );

  // Intercepta botão voltar do Android para retornar ao menu do perfil
  useEffect(() => {
    const backAction = () => {
      if (currentView !== 'menu') {
        setCurrentView('menu');
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [currentView]);

  const loadProfileAndData = async (checkLevelUp = false) => {
    setLoading(true);
    try {
      const profileData = await dataService.getProfile(user.id);
      if (profileData) {
        // Check for level up
        if (checkLevelUp && profile && profile.nivel && profileData.nivel && profile.nivel !== profileData.nivel) {
          const levelOrder = ['Bronze', 'Prata', 'Ouro', 'Platina', 'Diamante'];
          const prevIndex = levelOrder.indexOf(profile.nivel);
          const newIndex = levelOrder.indexOf(profileData.nivel);
          if (newIndex > prevIndex) {
            setLevelUpName(profileData.nivel);
            setShowLevelUpModal(true);
          }
        }
        
        setProfile(profileData);
        if (profileData.avatar_url) setAvatarUrl(profileData.avatar_url);
        
        try {
          if (profileData.bio) {
            const parsed = JSON.parse(profileData.bio);
            setBioText(parsed.bioText || '');
            setStatusText(parsed.statusText || '');
            setInstituicaoText(parsed.instituicaoText || '');
            setExperiences(parsed.experiences || []);
            setLattesLink(parsed.lattesLink || '');
            setLinkedinLink(parsed.linkedinLink || '');
          } else {
            setBioText('');
            setStatusText('');
            setInstituicaoText('');
            setExperiences([]);
            setLattesLink('');
            setLinkedinLink('');
          }
        } catch (e) {
          setBioText(profileData.bio || '');
          setStatusText('');
          setInstituicaoText('');
          setExperiences([]);
          setLattesLink('');
          setLinkedinLink('');
        }
      } else {
        setProfile({
          full_name: user.user_metadata?.full_name || user.email.split('@')[0],
          xp: 0,
          nivel: 'Bronze'
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

  const handleUpdateBio = async () => {
    setSavingBio(true);
    try {
      const bioPayload = JSON.stringify({
        bioText,
        statusText,
        instituicaoText,
        experiences,
        lattesLink,
        linkedinLink
      });
      await dataService.updateBio(user.id, bioPayload);
      Alert.alert('Sucesso', 'Alterações salvas!');
      await loadProfileAndData(true);
      setCurrentView('menu');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    } finally {
      setSavingBio(false);
    }
  };

  const handleSaveExperiences = async (updatedExps, updatedLattes = lattesLink, updatedLinkedin = linkedinLink, showSuccessAlert = false) => {
    setSavingAcademic(true);
    try {
      let prevBio = null;
      try {
        if (profile && profile.bio) {
          prevBio = JSON.parse(profile.bio);
        }
      } catch (e) {}

      let xpChange = 0;
      
      const prevLattes = prevBio?.lattesLink || '';
      const prevLinkedin = prevBio?.linkedinLink || '';
      const prevInst = prevBio?.instituicaoText || '';
      
      if (!prevLattes && updatedLattes) xpChange += 100;
      else if (prevLattes && !updatedLattes) xpChange -= 100;
      
      if (!prevLinkedin && updatedLinkedin) xpChange += 100;
      else if (prevLinkedin && !updatedLinkedin) xpChange -= 100;
      
      if (!prevInst && instituicaoText) xpChange += 50;
      else if (prevInst && !instituicaoText) xpChange -= 50;

      const prevExps = prevBio?.experiences || [];
      const expCountDiff = updatedExps.length - prevExps.length;
      xpChange += expCountDiff * 150;

      let xpResult = null;
      if (xpChange !== 0) {
        xpResult = await dataService.updateXp(user.id, xpChange);
      }

      const bioPayload = JSON.stringify({
        bioText,
        statusText,
        instituicaoText,
        experiences: updatedExps,
        lattesLink: updatedLattes,
        linkedinLink: updatedLinkedin
      });
      await dataService.updateBio(user.id, bioPayload);
      await loadProfileAndData(true);

      if (showSuccessAlert) {
        Alert.alert('Sucesso', t('success_save_academic'));
      }

      if (xpResult && xpResult.xpAdded !== 0) {
        Alert.alert('XP!', t('earned_xp').replace('{xp}', xpResult.xpAdded.toString()));
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar as informações.');
    } finally {
      setSavingAcademic(false);
    }
  };

  const handleOpenLink = async (type) => {
    const url = type === 'lattes' ? lattesLink : linkedinLink;
    if (url) {
      try {
        const cleanUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;
        const supported = await Linking.canOpenURL(cleanUrl);
        if (supported) {
          await Linking.openURL(cleanUrl);
        } else {
          Alert.alert('Erro', 'Não foi possível abrir o link informado.');
        }
      } catch (e) {
        Alert.alert('Erro', 'Não foi possível abrir o link.');
      }
    } else {
      Alert.alert(
        'Link não cadastrado',
        `Por favor, configure seu link nas Informações Acadêmicas para poder acessar por aqui.`,
        [
          { text: 'Configurar', onPress: () => setCurrentView('academicInfo') },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
    }
  };

  const handleOpenCardLink = async (url) => {
    if (url) {
      try {
        const cleanUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;
        const supported = await Linking.canOpenURL(cleanUrl);
        if (supported) {
          await Linking.openURL(cleanUrl);
        }
      } catch (e) {
        Alert.alert('Erro', 'Não foi possível abrir o link.');
      }
    }
  };

  const handleImportLattes = () => {
    if (!lattesLink.trim()) {
      Alert.alert('Erro', 'Por favor, insira o link do seu Currículo Lattes.');
      return;
    }
    setImportingLattes(true);
    setTimeout(() => {
      setImportingLattes(false);
      if (lattesLink.toLowerCase().includes('lattes.cnpq.br')) {
        const importedExp = {
          id: Date.now().toString(),
          title: 'Pesquisador em Bioacústica de Anfíbios',
          institution: 'Laboratório de Herpetologia - USP',
          description: 'Mapeamento acústico de espécies da Mata Atlântica e análise espectrográfica automatizada.',
          period: '2023 - Presente'
        };
        const updated = [...experiences, importedExp];
        setExperiences(updated);
        handleSaveExperiences(updated, lattesLink, linkedinLink);
        Alert.alert('Sucesso', 'Experiência importada do CNPq Lattes com sucesso!');
      } else {
        Alert.alert(
          'Importação Direta Indisponível',
          'Não foi possível extrair dados automaticamente deste link. Por favor, insira suas experiências manualmente.'
        );
      }
    }, 1500);
  };

  const handleImportLinkedin = () => {
    if (!linkedinLink.trim()) {
      Alert.alert('Erro', 'Por favor, insira o link do seu perfil do LinkedIn.');
      return;
    }
    setImportingLinkedin(true);
    setTimeout(() => {
      setImportingLinkedin(false);
      if (linkedinLink.toLowerCase().includes('linkedin.com')) {
        const importedExp = {
          id: Date.now().toString(),
          title: 'Biólogo de Campo Senior',
          institution: 'Instituto de Pesquisas Ambientais',
          description: 'Coleta de dados biológicos em campo e consultoria em conservação de ecossistemas.',
          period: '2021 - Presente'
        };
        const updated = [...experiences, importedExp];
        setExperiences(updated);
        handleSaveExperiences(updated, lattesLink, linkedinLink);
        Alert.alert('Sucesso', 'Experiência importada do LinkedIn com sucesso!');
      } else {
        Alert.alert(
          'Importação Direta Indisponível',
          'Não foi possível extrair dados automaticamente deste link. Por favor, insira suas experiências manualmente.'
        );
      }
    }, 1500);
  };

  const handleAddExperience = () => {
    if (!newExpTitle.trim() || !newExpInst.trim()) {
      Alert.alert('Erro', 'Por favor, preencha pelo menos Título e Instituição.');
      return;
    }
    
    let updated;
    if (editingExpId) {
      updated = experiences.map(exp => {
        if (exp.id === editingExpId) {
          return {
            ...exp,
            title: newExpTitle,
            institution: newExpInst,
            description: newExpDesc,
            period: newExpPeriod
          };
        }
        return exp;
      });
      setEditingExpId(null);
    } else {
      const newExp = {
        id: Date.now().toString(),
        title: newExpTitle,
        institution: newExpInst,
        description: newExpDesc,
        period: newExpPeriod
      };
      updated = [...experiences, newExp];
    }
    setExperiences(updated);
    
    // Clear inputs
    setNewExpTitle('');
    setNewExpInst('');
    setNewExpDesc('');
    setNewExpPeriod('');
    
    handleSaveExperiences(updated);
  };

  const handleStartEditExperience = (exp) => {
    setEditingExpId(exp.id);
    setNewExpTitle(exp.title || '');
    setNewExpInst(exp.institution || '');
    setNewExpDesc(exp.description || '');
    setNewExpPeriod(exp.period || '');
  };

  const handleCancelEditExperience = () => {
    setEditingExpId(null);
    setNewExpTitle('');
    setNewExpInst('');
    setNewExpDesc('');
    setNewExpPeriod('');
  };

  const handleDeleteExperience = (expId) => {
    if (editingExpId === expId) {
      handleCancelEditExperience();
    }
    const updated = experiences.filter(exp => exp.id !== expId);
    setExperiences(updated);
    handleSaveExperiences(updated);
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
      const res = await dataService.updateAvatar(user.id, avatarUrl);
      Alert.alert('Sucesso', 'Foto atualizada!');
      await loadProfileAndData(true);
      if (res && res.xpResult && res.xpResult.xpAdded > 0) {
        Alert.alert('XP!', t('earned_xp').replace('{xp}', res.xpResult.xpAdded.toString()));
      }
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
      const res = await dataService.updateAvatar(user.id, publicUrl);
      setAvatarUrl(publicUrl);
      await loadProfileAndData(true);
      if (res && res.xpResult && res.xpResult.xpAdded > 0) {
        Alert.alert('XP!', t('earned_xp').replace('{xp}', res.xpResult.xpAdded.toString()));
      }
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
          <Text style={styles.guestTitle}>{t('restricted_area')}</Text>
          <Text style={styles.guestSubtitle}>{t('restricted_desc')}</Text>
          <TouchableOpacity style={styles.guestLoginButton} onPress={onLogin}>
            <Text style={styles.guestLoginButtonText}>{t('login_create')}</Text>
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
            <Text style={styles.backButtonText}>{t('back')}</Text>
          </TouchableOpacity>
          <Text style={styles.subTitle}>{t('my_collection')}</Text>
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
            <Text style={styles.backButtonText}>{t('back')}</Text>
          </TouchableOpacity>
          <Text style={styles.subTitle}>{t('profile_photo')}</Text>
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
            <Text style={styles.backButtonText}>{t('back')}</Text>
          </TouchableOpacity>
          <Text style={styles.subTitle}>{t('change_email')}</Text>
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
            <Text style={styles.backButtonText}>{t('back')}</Text>
          </TouchableOpacity>
          <Text style={styles.subTitle}>{t('change_password')}</Text>
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

  if (currentView === 'language') {
    const LANGUAGES = [
      { code: 'pt', label: 'Português' },
      { code: 'en', label: 'English' },
      { code: 'es', label: 'Español' },
      { code: 'fr', label: 'Français' },
      { code: 'it', label: 'Italiano' },
      { code: 'zh', label: '简体中文' },
      { code: 'ko', label: '한국어' }
    ];

    return (
      <View style={styles.container}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setCurrentView('menu')} style={styles.backButton}>
            <Text style={styles.backButtonText}>{t('back')}</Text>
          </TouchableOpacity>
          <Text style={styles.subTitle}>{t('change_language_title')}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.formPadding}>
          <View style={styles.groupContainer}>
            {LANGUAGES.map((lang, index) => (
              <View key={lang.code}>
                <TouchableOpacity
                  style={styles.languageItem}
                  onPress={() => changeLanguage(lang.code)}
                >
                  <Text style={styles.languageLabel}>{lang.label}</Text>
                  {locale === lang.code && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
                {index < LANGUAGES.length - 1 && <View style={styles.separator} />}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (currentView === 'bio') {
    const STATUS_PRESETS = [
      { emoji: '🐸', label: 'Estudando Anfíbios' },
      { emoji: '🔍', label: 'Em Campo' },
      { emoji: '🧬', label: 'Pesquisa Genética' },
      { emoji: '🌿', label: 'Conservação' },
      { emoji: '📚', label: 'Estudante' },
      { emoji: '💻', label: 'Codando Biologia' },
    ];

    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setCurrentView('menu')} style={styles.backButton}>
            <Text style={styles.backButtonText}>{t('back')}</Text>
          </TouchableOpacity>
          <Text style={styles.subTitle}>{t('edit_bio_title')}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.formPadding} keyboardShouldPersistTaps="handled">
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('bio')}</Text>
            <TextInput
              style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]}
              placeholder={t('bio_placeholder')}
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              value={bioText}
              onChangeText={setBioText}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('status_label')}</Text>
            <View style={styles.statusRow}>
              {STATUS_PRESETS.map((item) => (
                <TouchableOpacity
                  key={item.emoji}
                  style={[
                    styles.statusBadgeItem,
                    statusText === `${item.emoji} ${item.label}` && styles.statusBadgeItemSelected
                  ]}
                  onPress={() => setStatusText(prev => prev === `${item.emoji} ${item.label}` ? '' : `${item.emoji} ${item.label}`)}
                >
                  <Text style={styles.statusBadgeEmoji}>{item.emoji}</Text>
                  <Text style={styles.statusBadgeText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleUpdateBio} disabled={savingBio}>
            {savingBio ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>{t('save_profile')}</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (currentView === 'academicInfo') {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setCurrentView('menu')} style={styles.backButton}>
            <Text style={styles.backButtonText}>{t('back')}</Text>
          </TouchableOpacity>
          <Text style={styles.subTitle}>{t('academic_experiences_title')}</Text>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.formPadding} keyboardShouldPersistTaps="handled">
          
          <View style={styles.linksCard}>
            <Text style={styles.linksCardTitle}>{t('connect_curriculum_title')}</Text>
            
            <View style={styles.linkInputRow}>
              <TextInput
                style={[styles.experienceInput, { flex: 1, marginBottom: 0 }]}
                placeholder={t('lattes_link_placeholder')}
                placeholderTextColor={theme.colors.textSecondary}
                value={lattesLink}
                onChangeText={setLattesLink}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.importButton}
                onPress={handleImportLattes}
                disabled={importingLattes}
              >
                {importingLattes ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.importButtonText}>{t('import_btn')}</Text>}
              </TouchableOpacity>
            </View>

            <View style={[styles.linkInputRow, { marginTop: 12 }]}>
              <TextInput
                style={[styles.experienceInput, { flex: 1, marginBottom: 0 }]}
                placeholder={t('linkedin_link_placeholder')}
                placeholderTextColor={theme.colors.textSecondary}
                value={linkedinLink}
                onChangeText={setLinkedinLink}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.importButton}
                onPress={handleImportLinkedin}
                disabled={importingLinkedin}
              >
                {importingLinkedin ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.importButtonText}>{t('import_btn')}</Text>}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.saveLinksButton}
              onPress={() => handleSaveExperiences(experiences, lattesLink, linkedinLink, true)}
              disabled={savingAcademic}
            >
              {savingAcademic ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveLinksButtonText}>{t('save_links_btn')}</Text>}
            </TouchableOpacity>
          </View>

          <View style={[styles.experienceFormCard, { marginTop: 20 }]}>
            <Text style={styles.experienceFormTitle}>
              {editingExpId ? t('edit_experience') : t('add_experience')}
            </Text>
            
            <TextInput
              style={styles.experienceInput}
              placeholder={t('exp_title_placeholder')}
              placeholderTextColor={theme.colors.textSecondary}
              value={newExpTitle}
              onChangeText={setNewExpTitle}
            />

            <TextInput
              style={styles.experienceInput}
              placeholder={t('exp_inst_placeholder')}
              placeholderTextColor={theme.colors.textSecondary}
              value={newExpInst}
              onChangeText={setNewExpInst}
            />

            <TextInput
              style={styles.experienceInput}
              placeholder={t('exp_period_placeholder')}
              placeholderTextColor={theme.colors.textSecondary}
              value={newExpPeriod}
              onChangeText={setNewExpPeriod}
            />

            <TextInput
              style={[styles.experienceInput, { height: 60, textAlignVertical: 'top' }]}
              placeholder={t('exp_desc_placeholder')}
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              value={newExpDesc}
              onChangeText={setNewExpDesc}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                style={[styles.experienceAddButton, { flex: 1, marginRight: editingExpId ? 8 : 0 }]}
                onPress={handleAddExperience}
                disabled={savingAcademic}
              >
                {savingAcademic ? <ActivityIndicator color="#FFF" /> : (
                  <Text style={styles.experienceAddButtonText}>
                    {editingExpId ? t('save_changes') : t('add_experience')}
                  </Text>
                )}
              </TouchableOpacity>

              {editingExpId && (
                <TouchableOpacity
                  style={[styles.experienceCancelButton, { flex: 1, marginLeft: 8 }]}
                  onPress={handleCancelEditExperience}
                >
                  <Text style={styles.experienceCancelButtonText}>{t('cancel')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={{ marginTop: 24, paddingBottom: 60 }}>
            {experiences.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t('no_experiences')}</Text>
              </View>
            ) : (
              experiences.map((exp) => (
                <View key={exp.id} style={styles.experienceCard}>
                  <View style={styles.experienceCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.experienceCardTitle}>{exp.title}</Text>
                      <Text style={styles.experienceCardInstitution}>{exp.institution}</Text>
                      {exp.period ? <Text style={styles.experienceCardPeriod}>{exp.period}</Text> : null}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TouchableOpacity style={styles.experienceEditButton} onPress={() => handleStartEditExperience(exp)}>
                        <Text style={styles.experienceEditButtonText}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.experienceDeleteButton} onPress={() => handleDeleteExperience(exp.id)}>
                        <Text style={styles.experienceDeleteButtonText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {exp.description ? <Text style={styles.experienceCardDesc}>{exp.description}</Text> : null}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // --- MAIN MENU VIEW ---

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.profileMain}>
            <TouchableOpacity style={styles.avatarCircle} onPress={() => setShowProfileCard(true)} activeOpacity={0.7}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarLetter}>
                  {profile?.full_name ? profile.full_name[0].toUpperCase() : 'U'}
                </Text>
              )}
            </TouchableOpacity>
            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>{profile?.full_name || t('tab_profile')}</Text>
              <Text style={styles.profileLevel}>
                🏆 {sanitizeLevel(profile?.nivel)} • {getAttribution(user, profile)}
              </Text>
              <ProgressBar xp={profile?.xp || 0} />
              <Text style={styles.xpText}>{profile?.xp || 0} {t('xp_accumulated')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.menuContainer}>
          <Text style={styles.sectionLabel}>{t('activity_section')}</Text>
          <View style={styles.groupContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentView('collection')}>
              <Image
                source={require('../assets/images/logo_transparent.png')}
                style={styles.menuIconImage}
                resizeMode="contain"
              />
              <Text style={styles.menuText}>{t('my_collection')} ({observations.length})</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>{t('profile_section')}</Text>
          <View style={styles.groupContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentView('bio')}>
              <Text style={styles.menuIcon}>📝</Text>
              <Text style={styles.menuText}>{t('bio')}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentView('academicInfo')}>
              <Text style={styles.menuIcon}>🎓</Text>
              <Text style={styles.menuText}>{t('academic_info')}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentView('addPhoto')}>
            <Text style={styles.menuIcon}>📷</Text>
            <Text style={styles.menuText}>{t('profile_photo')}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentView('changeEmail')}>
            <Text style={styles.menuIcon}>📧</Text>
            <Text style={styles.menuText}>{t('change_email')}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentView('changePassword')}>
            <Text style={styles.menuIcon}>🔑</Text>
            <Text style={styles.menuText}>{t('change_password')}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentView('language')}>
            <Text style={styles.menuIcon}>🌐</Text>
            <Text style={styles.menuText}>{t('language_option')}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.menuItem} onPress={onLogout}>
            <Text style={[styles.menuIcon, { color: '#FF3B30' }]}>🚪</Text>
            <Text style={[styles.menuText, { color: '#FF3B30', fontWeight: '600' }]}>{t('logout')}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>{t('connect_section')}</Text>
        <View style={styles.groupContainer}>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleOpenLink('lattes')}>
            <Text style={styles.menuIcon}>🔗</Text>
            <Text style={styles.menuText}>Currículo Lattes</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.menuItem} onPress={() => handleOpenLink('linkedin')}>
            <Text style={styles.menuIcon}>💼</Text>
            <Text style={styles.menuText}>LinkedIn</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ height: 180 }} />
    </ScrollView>

      <Modal
        visible={showProfileCard}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProfileCard(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.profileCard}>
            <TouchableOpacity style={styles.closeCardButton} onPress={() => setShowProfileCard(false)}>
              <Text style={styles.closeCardText}>✕</Text>
            </TouchableOpacity>

            <View style={styles.cardHeader}>
              <View style={styles.cardAvatarCircle}>
                {profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.cardAvatarImage} />
                ) : (
                  <Text style={styles.cardAvatarLetter}>
                    {profile?.full_name ? profile.full_name[0].toUpperCase() : 'U'}
                  </Text>
                )}
              </View>
              <Text style={styles.cardName}>{profile?.full_name || t('tab_profile')}</Text>
              
              {statusText ? (
                <View style={styles.cardStatusBadge}>
                  <Text style={styles.cardStatusText}>{statusText}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.cardDetails}>
              {instituicaoText ? (
                <View style={styles.cardDetailRow}>
                  <Text style={styles.cardDetailLabel}>🎓 {t('institution_label')}</Text>
                  <Text style={styles.cardDetailValue}>{instituicaoText}</Text>
                </View>
              ) : null}

              <View style={styles.cardDetailRow}>
                <Text style={styles.cardDetailLabel}>🏆 {t('level_label')}</Text>
                <Text style={styles.cardDetailValue}>
                  {sanitizeLevel(profile?.nivel)} • {getAttribution(user, profile)}
                </Text>
              </View>

              <View style={[styles.cardDetailRow, { flexDirection: 'column', alignItems: 'stretch' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={styles.cardDetailLabel}>⚡ {t('xp_label')}</Text>
                  <Text style={styles.cardDetailValue}>{profile?.xp || 0} XP</Text>
                </View>
                <ProgressBar xp={profile?.xp || 0} />
              </View>

              {experiences.length > 0 ? (
                <View style={styles.cardExperiencesSection}>
                  <Text style={styles.cardDetailLabel}>💼 {t('academic_experiences_title')}</Text>
                  {experiences.map((exp) => (
                    <View key={exp.id} style={styles.cardExperienceItem}>
                      <Text style={styles.cardExperienceTitle}>{exp.title} @ {exp.institution}</Text>
                      {exp.period ? <Text style={styles.cardExperiencePeriod}>{exp.period}</Text> : null}
                      {exp.description ? <Text style={styles.cardExperienceDesc}>{exp.description}</Text> : null}
                    </View>
                  ))}
                </View>
              ) : null}

              {bioText ? (
                <View style={styles.cardBioSection}>
                  <Text style={styles.cardBioLabel}>📝 Bio</Text>
                  <Text style={styles.cardBioText}>{bioText}</Text>
                </View>
              ) : null}

              {(lattesLink || linkedinLink) ? (
                <View style={styles.cardSocialRow}>
                  {lattesLink ? (
                    <TouchableOpacity
                      style={[styles.cardSocialButton, { backgroundColor: '#0071E3' }]}
                      onPress={() => handleOpenCardLink(lattesLink)}
                    >
                      <Text style={styles.cardSocialButtonText}>🔗 Lattes</Text>
                    </TouchableOpacity>
                  ) : null}

                  {linkedinLink ? (
                    <TouchableOpacity
                      style={[styles.cardSocialButton, { backgroundColor: '#0072b1' }]}
                      onPress={() => handleOpenCardLink(linkedinLink)}
                    >
                      <Text style={styles.cardSocialButtonText}>💼 LinkedIn</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showLevelUpModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLevelUpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.profileCard, { alignItems: 'center', paddingVertical: 32 }]}>
            <Text style={{ fontSize: 64, marginBottom: 16 }}>🐸🎉</Text>
            <Text style={[styles.cardName, { color: theme.colors.primary, fontSize: 24 }]}>
              {t('level_up_title')}
            </Text>
            <Text style={[styles.cardDetailValue, { fontSize: 16, marginTop: 12, textAlign: 'center', color: theme.colors.textPrimary }]}>
              {t('level_up_desc').replace('{level}', sanitizeLevel(levelUpName))}
            </Text>
            
            <TouchableOpacity
              style={[styles.saveButton, { marginTop: 32, width: '80%' }]}
              onPress={() => setShowLevelUpModal(false)}
            >
              <Text style={styles.saveButtonText}>{t('close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  profileHeader: { backgroundColor: theme.colors.surface, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32, ...theme.shadows.soft },
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
  menuIconImage: { width: 22, height: 22, marginRight: 12 },
  menuText: { flex: 1, color: theme.colors.textPrimary, fontSize: 17, fontWeight: '400' },
  menuArrow: { color: theme.colors.border, fontSize: 20 },
  subHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16, backgroundColor: theme.colors.surface },
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
  languageItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  languageLabel: { color: theme.colors.textPrimary, fontSize: 17, fontWeight: '500' },
  checkmark: { color: theme.colors.primary, fontSize: 18, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.75)', justifyContent: 'center', alignItems: 'center' },
  profileCard: { backgroundColor: theme.colors.surface, borderRadius: 24, padding: 24, width: '85%', maxWidth: 360, borderWidth: 1, borderColor: 'rgba(249, 250, 251, 0.08)', ...theme.shadows.medium },
  closeCardButton: { position: 'absolute', right: 16, top: 16, zIndex: 10 },
  closeCardText: { color: theme.colors.textSecondary, fontSize: 18, fontWeight: 'bold' },
  cardHeader: { alignItems: 'center', marginBottom: 20 },
  cardAvatarCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', marginBottom: 12, overflow: 'hidden' },
  cardAvatarImage: { width: '100%', height: '100%' },
  cardAvatarLetter: { color: theme.colors.primary, fontSize: 36, fontWeight: '800' },
  cardName: { color: theme.colors.textPrimary, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  cardStatusBadge: { backgroundColor: 'rgba(52, 199, 89, 0.1)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, marginTop: 8 },
  cardStatusText: { color: theme.colors.primary, fontSize: 14, fontWeight: '600' },
  cardDetails: { width: '100%' },
  cardDetailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.background },
  cardDetailLabel: { color: theme.colors.textSecondary, fontSize: 14 },
  cardDetailValue: { color: theme.colors.textPrimary, fontSize: 14, fontWeight: '600' },
  cardBioSection: { marginTop: 16 },
  cardBioLabel: { color: theme.colors.textSecondary, fontSize: 14, marginBottom: 6 },
  cardBioText: { color: theme.colors.textPrimary, fontSize: 14, lineHeight: 20 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  statusBadgeItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12, margin: 4 },
  statusBadgeItemSelected: { borderColor: theme.colors.primary, backgroundColor: 'rgba(52, 199, 89, 0.1)' },
  statusBadgeEmoji: { fontSize: 16, marginRight: 6 },
  statusBadgeText: { color: theme.colors.textPrimary, fontSize: 13, fontWeight: '500' },
  linksCard: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, ...theme.shadows.soft },
  linksCardTitle: { color: theme.colors.textPrimary, fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  linkInputRow: { flexDirection: 'row', alignItems: 'center' },
  importButton: { backgroundColor: theme.colors.primary, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 16, marginLeft: 8, justifyContent: 'center', alignItems: 'center' },
  importButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  saveLinksButton: { backgroundColor: theme.colors.accent, borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 14 },
  saveLinksButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  experienceFormCard: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, ...theme.shadows.soft },
  experienceFormTitle: { color: theme.colors.textPrimary, fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  experienceInput: { backgroundColor: theme.colors.background, borderRadius: 8, padding: 12, color: theme.colors.textPrimary, fontSize: 15, marginBottom: 10 },
  experienceAddButton: { backgroundColor: theme.colors.primary, borderRadius: 8, padding: 12, alignItems: 'center' },
  experienceAddButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  experienceCard: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, ...theme.shadows.soft },
  experienceCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  experienceCardTitle: { color: theme.colors.textPrimary, fontSize: 16, fontWeight: 'bold' },
  experienceCardInstitution: { color: theme.colors.primary, fontSize: 14, fontWeight: '500', marginTop: 2 },
  experienceCardPeriod: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 },
  experienceCardDesc: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 10, borderTopWidth: 1, borderTopColor: theme.colors.background, paddingTop: 8 },
  experienceDeleteButton: { padding: 4 },
  experienceDeleteButtonText: { color: '#FF3B30', fontSize: 16, fontWeight: 'bold' },
  experienceEditButton: { padding: 4, marginRight: 10 },
  experienceEditButtonText: { fontSize: 16 },
  experienceCancelButton: { backgroundColor: '#8E8E93', borderRadius: 8, padding: 12, alignItems: 'center' },
  experienceCancelButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  cardExperiencesSection: { marginTop: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.background, paddingBottom: 16 },
  cardExperienceItem: { marginTop: 10 },
  cardExperienceTitle: { color: theme.colors.textPrimary, fontSize: 13, fontWeight: '600' },
  cardExperiencePeriod: { color: theme.colors.textSecondary, fontSize: 11, marginTop: 1 },
  cardExperienceDesc: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 },
  cardSocialRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, width: '100%' },
  cardSocialButton: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginHorizontal: 5, ...theme.shadows.soft },
  cardSocialButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  progressBarContainer: {
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 7,
    overflow: 'hidden',
    marginTop: 8,
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 7,
  },
  progressBarText: {
    position: 'absolute',
    alignSelf: 'center',
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});
