import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors';

export const Header = ({ title, subtitle, showBack, onBack, rightAction, rightActionLabel }) => {
  return (
    <View style={styles.container}>
      {/* Top Banner: DEMO MODE INDICATOR */}
      <View style={styles.demoBanner}>
        <View style={styles.demoDot} />
        <Text style={styles.demoText}>DEMO MODE • Real-time Safety Resilience</Text>
      </View>

      <View style={styles.headerContent}>
        <View style={styles.leftSection}>
          {showBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton} accessibilityLabel="Go back">
              <Text style={styles.backText}>‹</Text>
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        </View>

        {rightAction && (
          <TouchableOpacity onPress={rightAction} style={styles.rightButton}>
            <Text style={styles.rightActionText}>{rightActionLabel || 'Action'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 16
  },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginBottom: 8,
    alignSelf: 'flex-start'
  },
  demoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.warningYellow,
    marginRight: 6
  },
  demoText: {
    color: COLORS.warningYellow,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  backText: {
    color: COLORS.textPrimary,
    fontSize: 26,
    lineHeight: 28,
    fontWeight: '300'
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700'
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 1
  },
  rightButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 8
  },
  rightActionText: {
    color: COLORS.primaryLight,
    fontSize: 13,
    fontWeight: '600'
  }
});
