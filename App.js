// ─────────────────────────────────────────────────────────────────────────────
// Ribbit — Main Entrypoint & Bottom Tab Navigation
// Location: C:\Ribbit\RibbitApp\App.js
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { StatusBar, StyleSheet, Text, View, Image, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import supabase from './src/services/supabaseClient';
import { theme } from './src/utils/theme';

import SoundIdScreen from './src/screens/SoundIdScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import WizardScreen from './src/screens/WizardScreen';
import LifeListScreen from './src/screens/LifeListScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ChatScreen from './src/screens/ChatScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import { LanguageProvider, useLanguage } from './src/utils/i18n';

const Tab = createBottomTabNavigator();

function AppContent() {
  const { t } = useLanguage();
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
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      <NavigationContainer>
        <View style={{ flex: 1 }}>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarActiveTintColor: theme.colors.primary,
              tabBarInactiveTintColor: theme.colors.textSecondary,
              tabBarStyle: {
                backgroundColor: 'rgb(15, 23, 42)',
                borderTopWidth: 1,
                borderTopColor: 'rgba(249, 250, 251, 0.08)',
                height: Platform.OS === 'ios' ? 88 : 65,
                paddingBottom: Platform.OS === 'ios' ? 30 : 10,
                paddingTop: 10,
              },
              tabBarLabelStyle: {
                fontSize: 10,
                fontWeight: '500',
              },
              tabBarIcon: ({ color, size }) => {
                if (route.name === 'Perfil') {
                  return (
                    <Image
                      source={require('./src/assets/images/logo_transparent.png')}
                      style={{
                        width: 24,
                        height: 24,
                        opacity: color === theme.colors.primary ? 1 : 0.6,
                      }}
                      resizeMode="contain"
                    />
                  );
                }

                let icon;
                if (route.name === 'Dashboard') icon = '📊';
                else if (route.name === 'SoundID') icon = '🎙️';
                else if (route.name === 'Chat') icon = '💬';
                else if (route.name === 'Explorar') icon = '🔍';
                else if (route.name === 'Assistente') icon = '🧙';

                return <Text style={{ fontSize: 22, opacity: color === theme.colors.primary ? 1 : 0.6 }}>{icon}</Text>;
              },
              headerShown: false,
            })}
          >
            <Tab.Screen
              name="Dashboard"
              component={DashboardScreen}
              options={{
                tabBarLabel: t('tab_dashboard'),
              }}
            />
            <Tab.Screen
              name="SoundID"
              component={SoundIdScreen}
              options={{
                tabBarLabel: t('tab_soundid'),
              }}
            />
            <Tab.Screen
              name="Chat"
              component={ChatScreen}
              options={{
                tabBarLabel: t('tab_chat'),
              }}
            />
            <Tab.Screen
              name="Explorar"
              component={ExploreScreen}
              options={{
                tabBarLabel: t('tab_explore'),
              }}
            />
            <Tab.Screen
              name="Assistente"
              component={WizardScreen}
              options={{
                tabBarLabel: t('tab_wizard'),
              }}
            />
            <Tab.Screen
              name="Perfil"
              options={{
                tabBarLabel: t('tab_profile'),
              }}
            >
              {({ navigation, route }) => (
                <LifeListScreen
                  isGuest={isGuest}
                  user={session?.user}
                  onLogout={handleLogout}
                  onLogin={() => {
                    setIsGuest(false);
                  }}
                  navigation={navigation}
                  route={route}
                />
              )}
            </Tab.Screen>
          </Tab.Navigator>
        </View>
      </NavigationContainer>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
