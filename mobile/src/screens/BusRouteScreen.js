import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { useJourney } from '../context/JourneyContext';

export const BusRouteScreen = ({ navigation }) => {
  const { fetchRoutes } = useJourney();

  const mockSchedules = [
    {
      routeNumber: '335-E',
      name: 'College Gate → Central Library Corridor',
      frequency: 'Every 12 mins',
      safetyScore: 91,
      cctv: true,
      panicAlarm: true,
      stops: [
        { name: 'College Gate', haven: 'Campus Security Station' },
        { name: 'Downtown Transit Hub', haven: 'Transit Police Post' },
        { name: 'City Hospital West', haven: 'General Hospital' },
        { name: 'Central Library', haven: "St. Mary's Urgent Care" }
      ]
    },
    {
      routeNumber: '201-R',
      name: 'Express Ring Road Route',
      frequency: 'Every 25 mins',
      safetyScore: 78,
      cctv: true,
      panicAlarm: false,
      stops: [
        { name: 'College South', haven: 'None' },
        { name: 'By-Pass Crossing', haven: 'Northside Police Post' },
        { name: 'Central Library', haven: "St. Mary's Urgent Care" }
      ]
    }
  ];

  const handleSelectBusRoute = async (bus) => {
    await fetchRoutes('College Gate', 'Central Library', 'bus');
    navigation.navigate('RouteComparison');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Header
        title="Verified Bus Routes"
        subtitle="Public transit lines with active safety monitoring"
        showBack
        onBack={() => navigation.goBack()}
      />

      <View style={styles.list}>
        {mockSchedules.map((bus, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => handleSelectBusRoute(bus)}
            activeOpacity={0.85}
            style={styles.busCard}
          >
            <View style={styles.headerRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>🚌 BUS {bus.routeNumber}</Text>
              </View>
              <Text style={styles.scoreText}>Safety: {bus.safetyScore}/100</Text>
            </View>

            <Text style={styles.busName}>{bus.name}</Text>
            <Text style={styles.metaText}>⏱️ {bus.frequency} • CCTV Monitored</Text>

            <View style={styles.stopsBox}>
              <Text style={styles.stopsTitle}>VERIFIED SAFE STOPS:</Text>
              {bus.stops.map((stop, sIdx) => (
                <View key={sIdx} style={styles.stopRow}>
                  <Text style={styles.stopDot}>📍</Text>
                  <Text style={styles.stopName}>{stop.name}</Text>
                  <Text style={styles.stopHaven}>({stop.haven})</Text>
                </View>
              ))}
            </View>

            <Button
              title="Select This Bus Route ›"
              onPress={() => handleSelectBusRoute(bus)}
              variant="outline"
              style={{ marginTop: 10 }}
            />
          </TouchableOpacity>
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
  list: {
    marginTop: 10
  },
  busCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  badge: {
    backgroundColor: COLORS.primaryDark,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800'
  },
  scoreText: {
    color: COLORS.safeGreen,
    fontSize: 13,
    fontWeight: '700'
  },
  busName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8
  },
  metaText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2
  },
  stopsBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  stopsTitle: {
    color: COLORS.primaryLight,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 4
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2
  },
  stopDot: {
    fontSize: 10,
    marginRight: 6
  },
  stopName: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600'
  },
  stopHaven: {
    color: COLORS.safeGreen,
    fontSize: 11,
    marginLeft: 4
  }
});
