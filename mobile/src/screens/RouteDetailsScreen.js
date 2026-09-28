import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';
import { ScoreBadge, ResilienceBadge } from '../components/ScoreBadge';
import { Button } from '../components/Button';
import { useJourney } from '../context/JourneyContext';

export const RouteDetailsScreen = ({ route: navRoute, navigation }) => {
  const { selectedRoute, startJourney } = useJourney();
  const routeData = navRoute.params?.route || selectedRoute;

  const scoreComponents = [
    { label: 'Street Lighting Coverage', score: routeData?.lighting_score || 92, weight: '30%', icon: '💡' },
    { label: 'Incident Safety Signal', score: routeData?.incident_safety_score || 90, weight: '25%', icon: '🛡️' },
    { label: 'Foot Traffic & Pedestrian Density', score: routeData?.foot_traffic_score || 88, weight: '25%', icon: '👥' },
    { label: 'Emergency Service Proximity', score: routeData?.emergency_proximity_score || 86, weight: '20%', icon: '🏥' }
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Header
        title="Route Breakdown"
        subtitle={routeData?.name || 'Detailed Safety Metrics'}
        showBack
        onBack={() => navigation.goBack()}
      />

      <View style={styles.mainScoreCard}>
        <View style={styles.scoreRow}>
          <View>
            <Text style={styles.scoreTitle}>Composite Safety Score</Text>
            <Text style={styles.scoreSub}>Multi-signal algorithm analysis</Text>
          </View>
          <ScoreBadge score={routeData?.safety_score || 87} size="large" />
        </View>

        <ResilienceBadge
          status={routeData?.resilience_status || 'PASS'}
          maxTimeSeconds={routeData?.max_time_to_haven_seconds || 108}
          count={routeData?.havens_count || 5}
        />
      </View>

      {/* Breakdown by Component */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Signal Component Breakdown</Text>

        {scoreComponents.map((item, idx) => (
          <View key={idx} style={styles.componentRow}>
            <View style={styles.componentLeft}>
              <Text style={styles.compIcon}>{item.icon}</Text>
              <View>
                <Text style={styles.compLabel}>{item.label}</Text>
                <Text style={styles.compWeight}>Algorithm Weight: {item.weight}</Text>
              </View>
            </View>
            <View style={styles.scorePill}>
              <Text style={styles.compScore}>{item.score}/100</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Disclaimers & Advisory Note */}
      <View style={styles.disclaimerCard}>
        <Text style={styles.disclaimerTitle}>⚖️ Advisory Notice</Text>
        <Text style={styles.disclaimerText}>
          SafeRoute calculations represent statistical risk estimations and proximity thresholds based on environmental sensors and public records. They do not constitute an absolute personal safety guarantee.
        </Text>
      </View>

      <Button
        title="Start Journey with This Route 🚀"
        onPress={() => {
          startJourney(routeData);
          navigation.navigate('LiveJourney');
        }}
        style={{ marginTop: 12, marginBottom: 20 }}
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
  mainScoreCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: 18,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  scoreTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700'
  },
  scoreSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2
  },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12
  },
  componentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  componentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8
  },
  compIcon: {
    fontSize: 18,
    marginRight: 10
  },
  compLabel: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600'
  },
  compWeight: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 1
  },
  scorePill: {
    backgroundColor: COLORS.surfaceElevated,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8
  },
  compScore: {
    color: COLORS.safeGreen,
    fontSize: 13,
    fontWeight: '700'
  },
  disclaimerCard: {
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  disclaimerTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 3
  },
  disclaimerText: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 15
  }
});
