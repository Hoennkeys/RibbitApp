// ─────────────────────────────────────────────────────────────────────────────
// Ribbit — Login Screen
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
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import supabase from '../services/supabaseClient';

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

      // O App.js vai detectar a mudança de sessão automaticamente via onAuthStateChange
      // mas chamamos o onLogin caso haja alguma lógica local
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
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            placeholderTextColor="#8596A0"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor="#8596A0"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#121B22" />
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
    backgroundColor: '#121B22',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoEmoji: {
    fontSize: 64,
    marginBottom: 10,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2ECC71',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 14,
    color: '#8596A0',
    marginTop: 4,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#1F2C34',
    borderRadius: 12,
    padding: 16,
    color: '#E9EDEF',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A3942',
  },
  loginButton: {
    backgroundColor: '#2ECC71',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  loginButtonText: {
    color: '#121B22',
    fontSize: 16,
    fontWeight: 'bold',
  },
  guestButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  guestButtonText: {
    color: '#8596A0',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  footerText: {
    color: '#8596A0',
    fontSize: 14,
  },
  signUpText: {
    color: '#2ECC71',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
