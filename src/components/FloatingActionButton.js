import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { theme } from '../utils/theme';

const FloatingActionButton = ({ onPress }) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.icon}>💬</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 120, // Above the tab bar
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.medium,
    // iOS specific shadow refinement
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  icon: {
    fontSize: 28,
  },
});

export default FloatingActionButton;
