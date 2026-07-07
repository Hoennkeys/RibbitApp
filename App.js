// ─────────────────────────────────────────────────────────────────────────────
// Ribbit — Main Entrypoint & Bottom Tab Navigation
// Location: C:\Ribbit\RibbitApp\App.js
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import supabase from './src/services/supabaseClient';

import SoundIdScreen from './src/screens/SoundIdScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import WizardScreen from './src/screens/WizardScreen';
import LifeListScreen from './src/screens/LifeListScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [session, setSession] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);

  useEffect(() => {
    // Verifica sessão atual ao abrir o app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Escuta mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setIsGuest(false); // Se logou, não é mais guest
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsGuest(false);
  };

  // Fluxo de Cadastro
  if (isSigningUp) {
    return (
      <SignUpScreen
        onBack={() => setIsSigningUp(false)}
        onSignUpSuccess={() => setIsSigningUp(false)}
      />
    );
  }

  // Fluxo de Autenticação (Se não houver sessão E não for Guest)
  if (!session && !isGuest) {
    return (
      <LoginScreen
        onLogin={(user) => {}} // O onAuthStateChange cuidará disso
        onGuest={() => setIsGuest(true)}
        onGoToSignUp={() => setIsSigningUp(true)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#121B22" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarActiveTintColor: '#2ECC71',
            tabBarInactiveTintColor: '#8596A0',
            tabBarStyle: {
              backgroundColor: '#1F2C34',
              borderTopWidth: 0,
              height: 70,
              paddingBottom: 12,
              paddingTop: 8,
              position: 'absolute',
              bottom: 16,
              left: 16,
              right: 16,
              borderRadius: 20,
              elevation: 5,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
              marginTop: -4,
            },
            tabBarIcon: ({ color, size }) => {
              let icon;
              if (route.name === 'SoundID') icon = '🎙️';
              else if (route.name === 'Explorar') icon = '🔍';
              else if (route.name === 'Assistente') icon = '🧙';
              else if (route.name === 'Perfil') icon = '🐸';

              return <Text style={{ fontSize: 24 }}>{icon}</Text>;
            },
            headerShown: false,
          })}
        >
          <Tab.Screen
            name="SoundID"
            component={SoundIdScreen}
            options={{
              tabBarLabel: 'Sound ID',
            }}
          />
          <Tab.Screen
            name="Explorar"
            component={ExploreScreen}
            options={{
              tabBarLabel: 'Explorar',
            }}
          />
          <Tab.Screen
            name="Assistente"
            component={WizardScreen}
            options={{
              tabBarLabel: 'Assistente',
            }}
          />
          <Tab.Screen
            name="Perfil"
          >
            {() => (
              <LifeListScreen
                isGuest={isGuest}
                user={session?.user}
                onLogout={handleLogout}
                onLogin={() => {
                  setIsGuest(false);
                }}
              />
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121B22',
  },
});
