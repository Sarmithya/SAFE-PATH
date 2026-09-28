import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { InteractiveMap } from '../components/InteractiveMap';
import { RouteCard } from '../components/RouteCard';
import { useJourney } from '../context/JourneyContext';

export const RouteComparisonScreen = ({ navigation }) => {
  const {
    origin,
    destination,
    comparedRoutes,
    safeHavens,
    selectedRoute,
    setSelectedRoute,
    startJourney
  } = useJourney();

  const handleSelectRoute = (route) => {
    setSelectedRoute(route);
  };

  const handleProceed = () => {
    if (selectedRoute) {
      navigation.navigate('RecommendedRoute');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Header
        title="Route Comparison"
        subtitle={`${origin} → ${destination}`}
        showBack
        onBack={() => navigation.goBack()}
      />

      {/* Interactive Map Visualizer */}
      <InteractiveMap
        routes={comparedRoutes}
        selectedRoute={selectedRoute}
        safeHavens={safeHavens}
        height={180}
      />

      <View style={styles.advisoryCard}>
        <Text style={styles.advisoryTitle}>🛡️ Safety Resilience Analysis</Text>
        <Text style={styles.advisoryText}>
          Comparing candidates by street illumination, foot traffic density, emergency service proximity, and maximum time required to reach a verified safe haven.
        </Text>
      </View>

      {/* Candidate Route Cards */}
      <View style={styles.routesList}>
        {comparedRoutes.map((r) => (
          <RouteCard
            key={r.route_id}
            route={r}
            isSelected={selectedRoute?.route_id === r.route_id}
            onSelect={() => handleSelectRoute(r)}
            onViewDetails={() => {
              setSelectedRoute(r);
              navigation.navigate('RouteDetails', { route: r });
            }}
          />
        ))}
      </View>

      {/* Selected Action Bar */}
      <View style={styles.actionCard}>
        <View style={styles.actionHeader}>
          <Text style={styles.selectedLabel}>Selected Route:</Text>
          <Text style={styles.selectedName}>{selectedRoute?.name || 'Route A'}</Text>
        </View>

        <Button
          title="Proceed with Selected Route ›"
          onPress={handleProceed}
          variant="primary"
          style={{ marginTop: 8 }}
        />
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
  advisoryCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)'
  },
  advisoryTitle: {
    color: COLORS.primaryLight,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4
  },
  advisoryText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 16
  },
  routesList: {
    marginTop: 6
  },
  actionCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  selectedLabel: {
    color: COLORS.textSecondary,
    fontSize: 12
  },
  selectedName: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700'
  }
});
