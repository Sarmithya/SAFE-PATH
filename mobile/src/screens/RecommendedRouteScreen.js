import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { InteractiveMap } from '../components/InteractiveMap';
import { ScoreBadge, ResilienceBadge } from '../components/ScoreBadge';
import { HavenCard } from '../components/SafeHavenMarker';
import { useJourney } from '../context/JourneyContext';

export const RecommendedRouteScreen = ({ navigation }) => {
  const {
    origin,
    destination,
    selectedRoute,
    safeHavens,
    startJourney
  } = useJourney();

  const handleStartJourney = async () => {
    await startJourney(selectedRoute);
    navigation.navigate('LiveJourney');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Header
        title="Recommended Safe Route"
        subtitle={`${origin} → ${destination}`}
        showBack
        onBack={() => navigation.goBack()}
      />

      {/* Map with Route & Safe Havens */}
      <InteractiveMap
        selectedRoute={selectedRoute}
        safeHavens={safeHavens}
        height={200}
      />

      {/* Primary Route Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View>
            <Text style={styles.routeName}>{selectedRoute?.name || 'Route A'}</Text>
            <Text style={styles.metaText}>
              ⏱️ {selectedRoute?.duration_min || 22} min • 📍 {selectedRoute?.distance_km || 6.2} km
            </Text>
          </View>
          <ScoreBadge score={selectedRoute?.safety_score || 87} size="medium" />
        </View>

        <ResilienceBadge
          status={selectedRoute?.resilience_status || 'PASS'}
          maxTimeSeconds={selectedRoute?.max_time_to_haven_seconds || 108}
          count={selectedRoute?.havens_count || 5}
        />

        {/* Action Button */}
        <Button
          title="Start Safe Journey 🚀"
          onPress={handleStartJourney}
          variant="primary"
          style={{ marginTop: 14 }}
        />
      </View>

      {/* Verified Safe Havens Along Route */}
      <View style={styles.havensSection}>
        <Text style={styles.sectionTitle}>
          Verified Safe Havens on Route ({safeHavens.length})
        </Text>
        <Text style={styles.sectionSubtitle}>
          These locations are accessible within your configured resilience threshold:
        </Text>

        {safeHavens.slice(0, 3).map((haven) => (
          <HavenCard
            key={haven.id}
            haven={haven}
            estimatedTime="Within 2.0 min"
          />
        ))}
      </View>
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
  summaryCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1.5,
    borderColor: COLORS.safeGreen
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  routeName: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '700'
  },
  metaText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4
  },
  havensSection: {
    marginTop: 12
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700'
  },
  sectionSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 8
  }
});
