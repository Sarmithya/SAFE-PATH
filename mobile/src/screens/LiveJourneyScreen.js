import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { InteractiveMap } from '../components/InteractiveMap';
import { HavenCard } from '../components/SafeHavenMarker';
import { SafetyCheckModal } from './SafetyCheckModal';
import { useJourney } from '../context/JourneyContext';
import { ApiService } from '../services/api';

export const LiveJourneyScreen = ({ navigation }) => {
  const {
    activeJourney,
    selectedRoute,
    safeHavens,
    currentLocation,
    safetyStatus,
    statusMessage,
    isDeviated,
    showSafetyModal,
    setShowSafetyModal,
    nearestHaven,
    stepNextGpsPoint,
    simulateDeviation,
    resetDeviation,
    handleSafetyCheckResponse
  } = useJourney();

  const handleManualSafetyCheck = () => {
    setShowSafetyModal(true);
  };

  const handleEndJourney = async () => {
    if (activeJourney?.id) {
      await ApiService.completeJourney(activeJourney.id);
    }
    navigation.navigate('JourneyHistory');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Header
        title="Active Journey"
        subtitle={`En route to ${activeJourney?.destination || 'Central Library'}`}
        rightAction={() => navigation.navigate('ShareTrip')}
        rightActionLabel="Share Trip 📍"
      />

      {/* Safety Status Banner */}
      <View
        style={[
          styles.statusBanner,
          safetyStatus === 'RED' ? styles.bannerRed : (safetyStatus === 'YELLOW' ? styles.bannerYellow : styles.bannerGreen)
        ]}
      >
        <Text style={styles.bannerEmoji}>
          {safetyStatus === 'RED' ? '🚨' : (safetyStatus === 'YELLOW' ? '⚠️' : '🛡️')}
        </Text>
        <View style={styles.bannerTextCol}>
          <Text style={styles.bannerTitle}>
            {safetyStatus === 'RED' ? 'ALERT: ROUTE DEVIATION' : (safetyStatus === 'YELLOW' ? 'CAUTION ZONE' : 'SAFETY STATUS: OPTIMAL')}
          </Text>
          <Text style={styles.bannerSub}>{statusMessage}</Text>
        </View>
      </View>

      {/* Live Map */}
      <InteractiveMap
        selectedRoute={selectedRoute}
        safeHavens={safeHavens}
        currentLocation={currentLocation}
        safetyStatus={safetyStatus}
        isDeviated={isDeviated}
        height={220}
      />

      {/* Trip Metric Bar */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>ETA Remaining</Text>
          <Text style={styles.metricValue}>14 min</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Distance Left</Text>
          <Text style={styles.metricValue}>3.8 km</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Haven Proximity</Text>
          <Text style={[styles.metricValue, { color: COLORS.safeGreen }]}>90s Help</Text>
        </View>
      </View>

      {/* Nearest Safe Haven Live Card */}
      <View style={styles.havenSection}>
        <Text style={styles.havenSectionHeader}>NEAREST SAFE HAVEN AT CURRENT LOCATION</Text>
        <HavenCard
          haven={nearestHaven?.haven || safeHavens[0]}
          estimatedTime={nearestHaven?.formatted_time || '90 seconds'}
          distanceMeters={nearestHaven?.distance_meters || 110}
          onNavigate={() => navigation.navigate('EmergencyAssistance')}
        />
      </View>

      {/* Primary Emergency Action Bar */}
      <View style={styles.actionCard}>
        <Button
          title="ARE YOU SAFE? 🛡️"
          onPress={handleManualSafetyCheck}
          variant="warning"
          style={styles.safetyButton}
        />

        <Button
          title="Emergency Assistance 🚨"
          onPress={() => navigation.navigate('EmergencyAssistance')}
          variant="danger"
          style={{ marginTop: 6 }}
        />
      </View>

      {/* Dedicated Demo Mode Simulation Controls */}
      <View style={styles.demoControlCard}>
        <Text style={styles.demoControlTitle}>⚡ DEMO SIMULATION CONTROLS</Text>
        <Text style={styles.demoControlDesc}>
          Simulate real-time GPS progression or trigger an instant route deviation event for testing:
        </Text>

        <View style={styles.demoButtonsRow}>
          <Button
            title="Simulate GPS Step"
            onPress={stepNextGpsPoint}
            variant="secondary"
            style={{ flex: 1, marginHorizontal: 4 }}
          />

          {!isDeviated ? (
            <Button
              title="SIMULATE DEVIATION ⚠️"
              onPress={simulateDeviation}
              variant="danger"
              style={{ flex: 1, marginHorizontal: 4 }}
            />
          ) : (
            <Button
              title="Reset to Safe Route"
              onPress={resetDeviation}
              variant="outline"
              style={{ flex: 1, marginHorizontal: 4 }}
            />
          )}
        </View>

        <Button
          title="Complete Journey ✓"
          onPress={handleEndJourney}
          variant="outline"
          style={{ marginTop: 8 }}
        />
      </View>

      {/* "Are You Safe?" Modal */}
      <SafetyCheckModal
        visible={showSafetyModal}
        onConfirmSafe={() => handleSafetyCheckResponse(true)}
        onTriggerEmergency={() => {
          handleSafetyCheckResponse(false);
          navigation.navigate('EmergencyAssistance');
        }}
        nearestHavenName={nearestHaven?.haven?.name || 'City General Hospital'}
        timeToHaven={nearestHaven?.formatted_time || '90 seconds'}
        reason={isDeviated ? 'Route deviation detected (120m off planned path)' : 'Safety check prompt'}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  scrollContent: {
    padding: 16
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1.5
  },
  bannerGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: COLORS.safeGreen
  },
  bannerYellow: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: COLORS.warningYellow
  },
  bannerRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: COLORS.dangerRed
  },
  bannerEmoji: {
    fontSize: 22,
    marginRight: 10
  },
  bannerTextCol: {
    flex: 1
  },
  bannerTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  bannerSub: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 1
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 6
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border
  },
  metricLabel: {
    color: COLORS.textMuted,
    fontSize: 10
  },
  metricValue: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2
  },
  havenSection: {
    marginTop: 8
  },
  havenSectionHeader: {
    color: COLORS.primaryLight,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2
  },
  actionCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  safetyButton: {
    paddingVertical: 16
  },
  demoControlCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)'
  },
  demoControlTitle: {
    color: COLORS.warningYellow,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  demoControlDesc: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginVertical: 6,
    lineHeight: 15
  },
  demoButtonsRow: {
    flexDirection: 'row',
    marginHorizontal: -4
  }
});
