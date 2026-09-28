import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../theme/colors';

export const SplashScreen = ({ navigation }) => {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true
    }).start();

    const timer = setTimeout(() => {
      navigation.replace('MainTabs');
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.shieldIcon}>
          <Text style={styles.shieldEmoji}>🛡️</Text>
        </View>
        <Text style={styles.appName}>SafeRoute</Text>
        <Text style={styles.tagline}>"Navigate Safer, Not Just Faster."</Text>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>Safety Resilience Engine v1.0</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  content: {
    alignItems: 'center'
  },
  shieldIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.primaryLight
  },
  shieldEmoji: {
    fontSize: 48
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 1
  },
  tagline: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center'
  },
  badge: {
    marginTop: 30,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: COLORS.primary,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20
  },
  badgeText: {
    color: COLORS.primaryLight,
    fontSize: 12,
    fontWeight: '700'
  }
});
