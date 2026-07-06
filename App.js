import React, { useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
} from 'react-native';
import FrogIcon from './src/assets/images/frog.svg';

export default function App() {
  const [croaks, setCroaks] = useState(0);

  const handleCroak = () => {
    setCroaks(prev => prev + 1);
    Alert.alert(
      '🐸 Ribbit!',
      'Você enviou um coaxar com sucesso para a rede!',
      [{ text: 'OK', onPress: () => console.log('Croaked!') }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121B22" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ribbit</Text>
        <Text style={styles.headerSubtitle}>Conectando a lagoa</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <FrogIcon width={130} height={130} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bem-vindo ao RibbitApp!</Text>
          <Text style={styles.cardText}>
            A estrutura de pastas e as dependências foram configuradas com sucesso.
          </Text>
          
          <View style={styles.statusList}>
            <View style={styles.statusItem}>
              <Text style={styles.statusDot}>✓</Text>
              <Text style={styles.statusText}>Metro SVG Bundler Configurado</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusDot}>✓</Text>
              <Text style={styles.statusText}>Estrutura de Pastas /src Criada</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusDot}>✓</Text>
              <Text style={styles.statusText}>Git Repositório Inicializado</Text>
            </View>
          </View>
        </View>

        <View style={styles.interactionContainer}>
          <Text style={styles.counterText}>Coaxares Enviados: {croaks}</Text>
          <TouchableOpacity style={styles.button} onPress={handleCroak} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Dar um Coaxar 🐸</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>RibbitApp v1.0.0 • Google DeepMind</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121B22',
  },
  header: {
    paddingTop: 30,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2ECC71',
    letterSpacing: 1.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8596A0',
    marginTop: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    marginBottom: 30,
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
  },
  card: {
    backgroundColor: '#1F2C34',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#2A3942',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  cardText: {
    fontSize: 14,
    color: '#8596A0',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  statusList: {
    borderTopWidth: 1,
    borderTopColor: '#2A3942',
    paddingTop: 16,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusDot: {
    color: '#2ECC71',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 10,
  },
  statusText: {
    color: '#E9EDEF',
    fontSize: 14,
  },
  interactionContainer: {
    marginTop: 30,
    alignItems: 'center',
    width: '100%',
  },
  counterText: {
    color: '#E9EDEF',
    fontSize: 16,
    marginBottom: 12,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#2ECC71',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonText: {
    color: '#121B22',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#667781',
  },
});
