// ─────────────────────────────────────────────────────────────────────────────
// Ribbit — Main Entrypoint & Bottom Tab Navigation
// Location: C:\Ribbit\RibbitApp\App.js
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import supabase from './src/services/supabaseClient';
import { theme } from './src/utils/theme';

import SoundIdScreen from './src/screens/SoundIdScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import WizardScreen from './src/screens/WizardScreen';
import LifeListScreen from './src/screens/LifeListScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import FloatingActionButton from './src/components/FloatingActionButton';

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
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <NavigationContainer>
        <View style={{ flex: 1 }}>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarActiveTintColor: theme.colors.primary,
              tabBarInactiveTintColor: theme.colors.textSecondary,
              tabBarStyle: {
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderTopWidth: 0,
                height: 85,
                paddingBottom: 25,
                paddingTop: 10,
                position: 'absolute',
                bottom: 20,
                left: 20,
                right: 20,
                borderRadius: 30,
                ...theme.shadows.medium,
              },
              tabBarLabelStyle: {
                fontSize: 12,
                fontWeight: '500',
              },
              tabBarIcon: ({ color, size }) => {
                let icon;
                if (route.name === 'SoundID') icon = '🎙️';
                else if (route.name === 'Explorar') icon = '🔍';
                else if (route.name === 'Assistente') icon = '🧙';
                else if (route.name === 'Perfil') icon = '🐸';

                return <Text style={{ fontSize: 22, opacity: color === theme.colors.primary ? 1 : 0.6 }}>{icon}</Text>;
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

          <FloatingActionButton />
        </View>
      </NavigationContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});

