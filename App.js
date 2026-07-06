// ─────────────────────────────────────────────────────────────────────────────
// RibbitApp — Main Entrypoint & Bottom Tab Navigation
// Location: C:\Ribbit\RibbitApp\App.js
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import SoundIdScreen from './src/screens/SoundIdScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import WizardScreen from './src/screens/WizardScreen';
import LifeListScreen from './src/screens/LifeListScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#121B22" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: '#2ECC71',
            tabBarInactiveTintColor: '#8596A0',
            tabBarStyle: {
              backgroundColor: '#1F2C34',
              borderTopWidth: 1,
              borderTopColor: '#2A3942',
              height: 64,
              paddingBottom: 10,
              paddingTop: 8,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: 'bold',
            },
            headerShown: false,
          }}
        >
          <Tab.Screen
            name="SoundID"
            component={SoundIdScreen}
            options={{
              tabBarLabel: '🎙️ Sound ID',
            }}
          />
          <Tab.Screen
            name="Explorar"
            component={ExploreScreen}
            options={{
              tabBarLabel: '🔍 Explorar',
            }}
          />
          <Tab.Screen
            name="Assistente"
            component={WizardScreen}
            options={{
              tabBarLabel: '🧙 Assistente',
            }}
          />
          <Tab.Screen
            name="MinhaLista"
            component={LifeListScreen}
            options={{
              tabBarLabel: '🐸 Minha Lista',
            }}
          />
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
