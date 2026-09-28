import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors';
import { getHavenIcon, getHavenColor } from './SafeHavenMarker';

export const InteractiveMap = ({
  routes = [],
  selectedRoute = null,
  safeHavens = [],
  currentLocation = null,
  safetyStatus = 'GREEN',
  isDeviated = false,
  onHavenPress,
  height = 240,
  showControls = true
}) => {
  // Bounding box mapping for College to Central Library coordinates
  // Lat: ~12.9700 to 12.9880, Lon: ~77.5930 to 77.6070
  const minLat = 12.9700;
  const maxLat = 12.9870;
  const minLon = 77.5930;
  const maxLon = 77.6070;

  const projectCoord = (lat, lon) => {
    const yPct = 1.0 - (lat - minLat) / (maxLat - minLat);
    const xPct = (lon - minLon) / (maxLon - minLon);
    return {
      top: `${Math.max(5, Math.min(90, yPct * 100))}%`,
      left: `${Math.max(5, Math.min(90, xPct * 100))}%`
    };
  };

  return (
    <View style={[styles.mapContainer, { height }]}>
      {/* Grid Pattern / Map Background */}
      <View style={styles.gridOverlay}>
        <View style={styles.gridLineHorizontal} />
        <View style={[styles.gridLineHorizontal, { top: '50%' }]} />
        <View style={styles.gridLineVertical} />
        <View style={[styles.gridLineVertical, { left: '50%' }]} />
      </View>

      {/* Origin Landmark */}
      <View style={[styles.landmarkPin, projectCoord(12.9716, 77.5946)]}>
        <View style={styles.originDot} />
        <Text style={styles.landmarkLabel}>College (Origin)</Text>
      </View>

      {/* Destination Landmark */}
      <View style={[styles.landmarkPin, projectCoord(12.9850, 77.6050)]}>
        <View style={styles.destDot} />
        <Text style={styles.landmarkLabel}>Central Library</Text>
      </View>

      {/* Render Safe Haven Pins */}
      {safeHavens.map((haven) => {
        const pos = projectCoord(haven.latitude, haven.longitude);
        const icon = getHavenIcon(haven.type);
        const color = getHavenColor(haven.type);
        return (
          <TouchableOpacity
            key={haven.id}
            onPress={() => onHavenPress && onHavenPress(haven)}
            style={[styles.havenMarker, pos]}
            activeOpacity={0.7}
          >
            <View style={[styles.havenCircle, { borderColor: color }]}>
              <Text style={styles.havenEmoji}>{icon}</Text>
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Route Path Lines Indicator */}
      <View style={styles.corridorBadge}>
        <Text style={styles.corridorText}>
          {selectedRoute?.name || 'Safe Boulevard Corridor'}
        </Text>
      </View>

      {/* Current GPS Position Indicator */}
      {currentLocation && (
        <View
          style={[
            styles.userLocationMarker,
            projectCoord(currentLocation.latitude, currentLocation.longitude)
          ]}
        >
          <View
            style={[
              styles.userPulse,
              safetyStatus === 'RED' ? styles.pulseRed : styles.pulseGreen
            ]}
          />
          <View
            style={[
              styles.userDot,
              safetyStatus === 'RED' ? styles.dotRed : styles.dotGreen
            ]}
          />
          <Text style={styles.userLabel}>
            {isDeviated ? '⚠️ Deviated' : '👤 You'}
          </Text>
        </View>
      )}

      {/* Map Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <Text style={styles.legendEmoji}>🏥</Text>
          <Text style={styles.legendText}>Hospital</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendEmoji}>👮</Text>
          <Text style={styles.legendText}>Police</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendEmoji}>🏪</Text>
          <Text style={styles.legendText}>24/7 Store</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    backgroundColor: '#0B132B',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: 10
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.15
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '25%',
    height: 1,
    backgroundColor: '#60A5FA'
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '25%',
    width: 1,
    backgroundColor: '#60A5FA'
  },
  landmarkPin: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -10 }, { translateY: -10 }]
  },
  originDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 2,
    borderColor: '#FFFFFF'
  },
  destDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.safeGreen,
    borderWidth: 2,
    borderColor: '#FFFFFF'
  },
  landmarkLabel: {
    color: COLORS.textPrimary,
    fontSize: 9,
    fontWeight: '700',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginTop: 2
  },
  havenMarker: {
    position: 'absolute',
    transform: [{ translateX: -12 }, { translateY: -12 }]
  },
  havenCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 2
  },
  havenEmoji: {
    fontSize: 12
  },
  corridorBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  corridorText: {
    color: COLORS.primaryLight,
    fontSize: 10,
    fontWeight: '600'
  },
  userLocationMarker: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -10 }, { translateY: -10 }]
  },
  userPulse: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    opacity: 0.4
  },
  pulseGreen: {
    backgroundColor: COLORS.safeGreen
  },
  pulseRed: {
    backgroundColor: COLORS.dangerRed
  },
  userDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF'
  },
  dotGreen: {
    backgroundColor: COLORS.safeGreen
  },
  dotRed: {
    backgroundColor: COLORS.dangerRed
  },
  userLabel: {
    color: COLORS.textPrimary,
    fontSize: 9,
    fontWeight: '800',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginTop: 2
  },
  legend: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  legendEmoji: {
    fontSize: 10,
    marginRight: 2
  },
  legendText: {
    color: COLORS.textSecondary,
    fontSize: 9
  }
});
