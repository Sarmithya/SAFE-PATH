import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

export const ScoreBadge = ({ score, size = 'medium', label = 'Safety Score' }) => {
  const isHigh = score >= 80;
  const isMedium = score >= 65 && score < 80;
  
  const scoreColor = isHigh ? COLORS.safeGreen : (isMedium ? COLORS.warningYellow : COLORS.dangerRed);
  const bgColor = isHigh ? 'rgba(16, 185, 129, 0.15)' : (isMedium ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)');

  return (
    <View style={[styles.container, { backgroundColor: bgColor }, size === 'small' && styles.smallContainer]}>
      <Text style={[styles.scoreText, { color: scoreColor }, size === 'small' && styles.smallScore]}>
        {score}
      </Text>
      <Text style={styles.maxText}>/100</Text>
      {label ? <Text style={styles.labelText}>{label}</Text> : null}
    </View>
  );
};

export const ResilienceBadge = ({ status = 'PASS', maxTimeSeconds = 108, count = 5 }) => {
  const isPass = status.toUpperCase() === 'PASS';
  const tagColor = isPass ? COLORS.safeGreen : COLORS.warningYellow;
  const tagBg = isPass ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)';

  const formattedTime = maxTimeSeconds < 120 
    ? `${(maxTimeSeconds / 60).toFixed(1)} min` 
    : `${(maxTimeSeconds / 60).toFixed(0)} min`;

  return (
    <View style={styles.resilienceRow}>
      <View style={[styles.resilienceBadge, { backgroundColor: tagBg, borderColor: tagColor }]}>
        <Text style={[styles.resilienceText, { color: tagColor }]}>
          RESILIENCE: {isPass ? 'PASS ✓' : 'WARNING ⚠️'}
        </Text>
      </View>
      <Text style={styles.metricText}>
        Max Help: <Text style={{ color: COLORS.textPrimary, fontWeight: '700' }}>{formattedTime}</Text>
      </Text>
      <Text style={styles.metricText}>
        Havens: <Text style={{ color: COLORS.textPrimary, fontWeight: '700' }}>{count}</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  smallContainer: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8
  },
  scoreText: {
    fontSize: 24,
    fontWeight: '800'
  },
  smallScore: {
    fontSize: 16
  },
  maxText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600'
  },
  labelText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2
  },
  resilienceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 6
  },
  resilienceBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1
  },
  resilienceText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  metricText: {
    fontSize: 12,
    color: COLORS.textSecondary
  }
});
