// ─────────────────────────────────────────────────────────────────────────────
// Ribbit — Login Screen (Apple Design System)
// Location: C:\Ribbit\RibbitApp\src\screens\LoginScreen.js
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

export default function LoginScreen({ onLogin, onGuest, onGoToSignUp }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (onLogin) onLogin(data.user);
    } catch (error) {
      Alert.alert('Erro no Login', error.message);
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
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>🐸</Text>
          <Text style={styles.logoText}>Ribbit</Text>
          <Text style={styles.tagline}>Identificação Científica de Anfíbios</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
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
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.guestButton} onPress={onGuest} disabled={loading}>
            <Text style={styles.guestButtonText}>Continuar como Visitante</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Não tem uma conta?</Text>
          <TouchableOpacity onPress={onGoToSignUp} disabled={loading}>
            <Text style={styles.signUpText}> Criar conta</Text>
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
    justifyContent: 'center',
    padding: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 64,
  },
  logoEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -1,
  },
  tagline: {
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
  loginButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    height: 56,
    justifyContent: 'center',
    ...theme.shadows.medium,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  guestButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  guestButtonText: {
    color: theme.colors.accent,
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 48,
  },
  footerText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
  },
  signUpText: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});
