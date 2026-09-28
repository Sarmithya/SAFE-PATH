import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { useJourney } from '../context/JourneyContext';

export const TravelDetailsScreen = ({ navigation }) => {
  const { origin, destination, departureTime, vehicle, safetyPreference } = useJourney();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Header
        title="Travel Details"
        subtitle="Review journey settings & safety parameters"
        showBack
        onBack={() => navigation.goBack()}
      />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Journey Summary</Text>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Origin:</Text>
          <Text style={styles.value}>{origin}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Destination:</Text>
          <Text style={styles.value}>{destination}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Departure Time:</Text>
          <Text style={styles.value}>{departureTime}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Selected Mode:</Text>
          <Text style={styles.value}>{vehicle?.replace('_', ' ').toUpperCase()}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Safety Optimization:</Text>
          <Text style={[styles.value, { color: COLORS.safeGreen, fontWeight: '700' }]}>
            {safetyPreference?.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Safety Resilience Threshold</Text>
        <Text style={styles.desc}>
          SafeRoute evaluates real-time proximity to verified safe havens. The current resilience threshold is set to <Text style={{ color: COLORS.primaryLight, fontWeight: '700' }}>120 seconds (2.0 min)</Text>.
        </Text>
      </View>

      <Button
        title="Explore Safe Routes ›"
        onPress={() => navigation.navigate('RouteComparison')}
        style={{ marginTop: 12 }}
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
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 13
  },
  value: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600'
  },
  desc: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18
  }
});
