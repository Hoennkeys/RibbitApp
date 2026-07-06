// ─────────────────────────────────────────────────────────────────────────────
// RibbitApp — Shared Spectrogram Component
// Location: C:\Ribbit\RibbitApp\src\components\Spectrogram.js
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export default function Spectrogram({ isActive, color = '#2ECC71', barCount = 28 }) {
  const [heights] = useState(() => 
    Array.from({ length: barCount }, () => new Animated.Value(6))
  );

  useEffect(() => {
    let intervalId;
    if (isActive) {
      intervalId = setInterval(() => {
        heights.forEach((anim) => {
          Animated.timing(anim, {
            toValue: Math.floor(Math.random() * 85) + 12,
            duration: 90,
            useNativeDriver: false,
          }).start();
        });
      }, 95);
    } else {
      heights.forEach((anim) => {
        Animated.timing(anim, {
          toValue: 6,
          duration: 350,
          useNativeDriver: false,
        }).start();
      });
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isActive, heights]);

  return (
    <View style={styles.spectrogramContainer}>
      {heights.map((anim, idx) => (
        <Animated.View
          key={idx}
          style={[
            styles.bar,
            {
              backgroundColor: color,
              height: anim,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  spectrogramContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 120,
    width: '100%',
    backgroundColor: '#1E252B',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#2F3C47',
  },
  bar: {
    width: 6,
    borderRadius: 3,
    marginHorizontal: 1,
  },
});
