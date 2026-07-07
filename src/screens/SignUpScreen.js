// ─────────────────────────────────────────────────────────────────────────────
// Ribbit — Sign Up Screen (Apple Design System)
// Location: C:\Ribbit\RibbitApp\src\screens\SignUpScreen.js
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import supabase from '../services/supabaseClient';
import { theme } from '../utils/theme';

export default function SignUpScreen({ onBack, onSignUpSuccess }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !name || !confirmPassword) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) throw error;

      Alert.alert(
        'Sucesso!',
        'Sua conta foi criada. Verifique seu e-mail para confirmar o cadastro.',
        [{ text: 'OK', onPress: onSignUpSuccess }]
      );
    } catch (error) {
      Alert.alert('Erro ao criar conta', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>‹ Voltar</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Criar Conta</Text>
          <Text style={styles.subtitle}>Junte-se à nossa comunidade de observadores</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Nome Completo"
              placeholderTextColor={theme.colors.textSecondary}
              value={name}
              onChangeText={setName}
            />
            <View style={styles.separator} />
            <TextInput
              style={styles.input}
              placeholder="E-mail"
              placeholderTextColor={theme.colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.separator} />
            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor={theme.colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <View style={styles.separator} />
            <TextInput
              style={styles.input}
              placeholder="Confirmar Senha"
              placeholderTextColor={theme.colors.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={styles.signUpButton}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.signUpButtonText}>Cadastrar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
  },
  backButtonText: {
    color: theme.colors.accent,
    fontSize: 17,
    fontWeight: '500',
  },
  header: {
    marginBottom: 48,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 8,
    fontWeight: '400',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    marginBottom: 24,
    overflow: 'hidden',
    ...theme.shadows.soft,
  },
  input: {
    padding: 16,
    color: theme.colors.textPrimary,
    fontSize: 17,
    height: 56,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.background,
    marginHorizontal: 16,
  },
  signUpButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    height: 56,
    justifyContent: 'center',
    ...theme.shadows.medium,
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
