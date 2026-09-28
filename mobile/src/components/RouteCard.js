import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors';
import { ScoreBadge, ResilienceBadge } from './ScoreBadge';

export const RouteCard = ({
  route,
  isSelected = false,
  onSelect,
  onViewDetails
}) => {
  if (!route) return null;

  return (
    <TouchableOpacity
      onPress={onSelect}
      activeOpacity={0.9}
      style={[
        styles.container,
        isSelected && styles.selectedContainer,
        route.is_recommended && styles.recommendedContainer
      ]}
    >
      {/* Recommended Ribbon */}
      {route.is_recommended && (
        <View style={styles.ribbon}>
          <Text style={styles.ribbonText}>RECOMMENDED SAFE ROUTE 🛡️</Text>
        </View>
      )}

      {/* Header Row: Title, Duration & Safety Score */}
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <Text style={styles.routeName}>{route.name}</Text>
          <Text style={styles.metaText}>
            ⏱️ {route.duration_min} min • 📍 {route.distance_km} km • {route.vehicle?.replace('_', ' ').toUpperCase()}
          </Text>
        </View>

        <ScoreBadge score={route.safety_score} size="medium" />
      </View>

      {/* Resilience Metrics Row */}
      <ResilienceBadge
        status={route.resilience_status || 'PASS'}
        maxTimeSeconds={route.max_time_to_haven_seconds || 108}
        count={route.havens_count || 5}
      />

      {/* Why This Route? (Explanations) */}
      {route.explanations && route.explanations.length > 0 && (
        <View style={styles.explanationsBox}>
          <Text style={styles.sectionHeader}>WHY THIS ROUTE?</Text>
          {route.explanations.map((exp, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{exp}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Transparent Tradeoff Box */}
      {route.tradeoff ? (
        <View style={styles.tradeoffBox}>
          <Text style={styles.tradeoffLabel}>TRADEOFF:</Text>
          <Text style={styles.tradeoffText}>{route.tradeoff}</Text>
        </View>
      ) : null}

      {/* Card Action Buttons */}
      <View style={styles.actionRow}>
        {onViewDetails && (
          <TouchableOpacity onPress={onViewDetails} style={styles.detailsBtn}>
            <Text style={styles.detailsBtnText}>Route Breakdown ›</Text>
          </TouchableOpacity>
        )}

        <View style={[styles.selectIndicator, isSelected && styles.selectIndicatorActive]}>
          <Text style={[styles.selectIndicatorText, isSelected && styles.selectIndicatorTextActive]}>
            {isSelected ? 'Selected ✓' : 'Select Route'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3
  },
  selectedContainer: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: '#1E293B'
  },
  recommendedContainer: {
    borderColor: COLORS.safeGreen,
    borderWidth: 2
  },
  ribbon: {
    backgroundColor: COLORS.safeGreen,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8
  },
  ribbonText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  titleCol: {
    flex: 1,
    paddingRight: 12
  },
  routeName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700'
  },
  metaText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 3
  },
  explanationsBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  sectionHeader: {
    color: COLORS.primaryLight,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 2
  },
  bulletDot: {
    color: COLORS.safeGreen,
    fontSize: 14,
    marginRight: 6,
    lineHeight: 16
  },
  bulletText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    flex: 1,
    lineHeight: 16
  },
  tradeoffBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warningYellow
  },
  tradeoffLabel: {
    color: COLORS.warningYellow,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 1
  },
  tradeoffText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 15
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  detailsBtn: {
    paddingVertical: 4
  },
  detailsBtnText: {
    color: COLORS.primaryLight,
    fontSize: 12,
    fontWeight: '600'
  },
  selectIndicator: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceElevated
  },
  selectIndicatorActive: {
    backgroundColor: COLORS.primary
  },
  selectIndicatorText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700'
  },
  selectIndicatorTextActive: {
    color: '#FFFFFF'
  }
});
