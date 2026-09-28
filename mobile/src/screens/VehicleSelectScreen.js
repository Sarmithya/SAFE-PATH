import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { useJourney } from '../context/JourneyContext';

export const VehicleSelectScreen = ({ navigation }) => {
  const { vehicle, setVehicle, fetchRoutes } = useJourney();

  const options = [
    { id: 'walking', name: 'Walking (Pedestrian)', icon: '🚶', desc: 'Highest vulnerability weighting, prioritizes well-lit corridors & high foot traffic.' },
    { id: 'personal_vehicle', name: 'Personal Vehicle / Two-Wheeler', icon: '🚗', desc: 'Optimal balance of speed & arterial road safety with 24/7 haven coverage.' },
    { id: 'bus', name: 'Public Bus Transit', icon: '🚌', desc: 'Monitored routes with verified CCTV stops and transit security stations.' },
    { id: 'cab', name: 'Cab / Ride-Hailing', icon: '🚕', desc: 'Direct routes with live trip sharing options.' },
    { id: 'auto', name: 'Auto-Rickshaw', icon: '🛺', desc: 'Short to medium range urban transit.' }
  ];

  const handleSelect = async (vId) => {
    setVehicle(vId);
    if (vId === 'bus') {
      navigation.navigate('BusRoute');
    } else {
      await fetchRoutes(null, null, vId);
      navigation.navigate('RouteComparison');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Header
        title="Select Transport Mode"
        subtitle="Safety algorithms adapt to your vehicle type"
        showBack
        onBack={() => navigation.goBack()}
      />

      <View style={styles.optionsList}>
        {options.map((opt) => {
          const isSelected = vehicle === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              onPress={() => handleSelect(opt.id)}
              activeOpacity={0.85}
              style={[styles.optionCard, isSelected && styles.optionCardActive]}
            >
              <Text style={styles.icon}>{opt.icon}</Text>
              <View style={styles.textContainer}>
                <Text style={styles.name}>{opt.name}</Text>
                <Text style={styles.desc}>{opt.desc}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          );
        })}
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
  optionsList: {
    marginTop: 10
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1.5,
    borderColor: COLORS.border
  },
  optionCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#1E293B'
  },
  icon: {
    fontSize: 28,
    marginRight: 14
  },
  textContainer: {
    flex: 1
  },
  name: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700'
  },
  desc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16
  },
  arrow: {
    color: COLORS.textMuted,
    fontSize: 22,
    marginLeft: 8
  }
});
