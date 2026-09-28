import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors';

export const getHavenIcon = (type) => {
  switch (type) {
    case 'hospital': return '🏥';
    case 'police_station': return '👮';
    case 'verified_24_7_store': return '🏪';
    case 'crowded_area': return '👥';
    default: return '📍';
  }
};

export const getHavenColor = (type) => {
  switch (type) {
    case 'hospital': return COLORS.havenHospital;
    case 'police_station': return COLORS.havenPolice;
    case 'verified_24_7_store': return COLORS.havenStore;
    case 'crowded_area': return COLORS.havenTransit;
    default: return COLORS.primary;
  }
};

export const SafeHavenMarker = ({ haven, isNearest = false, onPress }) => {
  const icon = getHavenIcon(haven?.type);
  const color = getHavenColor(haven?.type);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.markerContainer}>
      <View style={[styles.pin, { borderColor: color }, isNearest && styles.nearestPin]}>
        <Text style={styles.pinIcon}>{icon}</Text>
      </View>
      {isNearest && (
        <View style={styles.nearestBadge}>
          <Text style={styles.nearestText}>NEAREST</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export const HavenCard = ({ haven, estimatedTime, distanceMeters, onNavigate }) => {
  if (!haven) return null;
  const icon = getHavenIcon(haven.type);
  const color = getHavenColor(haven.type);

  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>{icon}</Text>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{haven.name}</Text>
          <Text style={styles.cardType}>
            {haven.type?.replace(/_/g, ' ').toUpperCase()} • {haven.operating_hours || '24/7'}
          </Text>
        </View>
      </View>

      <Text style={styles.cardAddress}>{haven.address || 'Verified Safe Location'}</Text>

      <View style={styles.cardFooter}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Time to Haven</Text>
          <Text style={[styles.metricValue, { color: COLORS.safeGreen }]}>
            {estimatedTime || '90 seconds'}
          </Text>
        </View>
        {distanceMeters ? (
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Distance</Text>
            <Text style={styles.metricValue}>{distanceMeters}m away</Text>
          </View>
        ) : null}
        {onNavigate && (
          <TouchableOpacity onPress={onNavigate} style={styles.navButton}>
            <Text style={styles.navButtonText}>Directions ›</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    margin: 4
  },
  pin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3
  },
  nearestPin: {
    borderColor: COLORS.dangerRed,
    borderWidth: 3,
    transform: [{ scale: 1.15 }]
  },
  pinIcon: {
    fontSize: 16
  },
  nearestBadge: {
    backgroundColor: COLORS.dangerRed,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2
  },
  nearestText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '800'
  },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 12,
    padding: 14,
    marginVertical: 6,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 10
  },
  cardInfo: {
    flex: 1
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary
  },
  cardType: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1
  },
  cardAddress: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 6
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  metricItem: {
    flexDirection: 'column'
  },
  metricLabel: {
    fontSize: 10,
    color: COLORS.textMuted
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary
  },
  navButton: {
    backgroundColor: COLORS.primaryDark,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6
  },
  navButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600'
  }
});
