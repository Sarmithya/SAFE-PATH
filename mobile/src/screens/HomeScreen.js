import React from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { InteractiveMap } from '../components/InteractiveMap';
import { useJourney } from '../context/JourneyContext';

export const HomeScreen = ({ navigation }) => {
  const {
    origin, setOrigin,
    destination, setDestination,
    vehicle, setVehicle,
    departureTime, setDepartureTime,
    safetyPreference, setSafetyPreference,
    additionalPrefs, setAdditionalPrefs,
    fetchRoutes, isLoadingRoutes
  } = useJourney();

  const vehicles = [
    { id: 'walking', label: 'Walking', icon: '🚶' },
    { id: 'personal_vehicle', label: 'Car/Bike', icon: '🚗' },
    { id: 'bus', label: 'Bus', icon: '🚌' },
    { id: 'cab', label: 'Cab', icon: '🚕' },
    { id: 'auto', label: 'Auto', icon: '🛺' }
  ];

  const handleFindRoutes = async () => {
    await fetchRoutes(origin, destination, vehicle);
    navigation.navigate('RouteComparison');
  };

  const togglePref = (key) => {
    setAdditionalPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Header
        title="SafeRoute"
        subtitle="Safety-Resilient Journey Planning"
        rightAction={() => navigation.navigate('AIAssistant')}
        rightActionLabel="AI Assistant ✨"
      />

      {/* Map Overview */}
      <InteractiveMap height={160} />

      {/* Destination & Origin Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Where are you heading?</Text>

        <View style={styles.locationInputRow}>
          <Text style={styles.inputIcon}>🟢</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.miniLabel}>START POINT</Text>
            <TextInput
              style={styles.textInput}
              value={origin}
              onChangeText={setOrigin}
              placeholder="Origin location"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
        </View>

        <View style={styles.locationInputRow}>
          <Text style={styles.inputIcon}>🔴</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.miniLabel}>DESTINATION</Text>
            <TextInput
              style={styles.textInput}
              value={destination}
              onChangeText={setDestination}
              placeholder="Where to?"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
        </View>

        {/* Departure Time */}
        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>⏱️ Departure Time:</Text>
          <View style={styles.timeChips}>
            {['Now', '15 mins', '30 mins', 'Night'].map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setDepartureTime(t)}
                style={[styles.timeChip, departureTime === t && styles.timeChipActive]}
              >
                <Text style={[styles.timeChipText, departureTime === t && styles.timeChipTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Transport Mode / Vehicle Selection */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Transport Mode</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vehicleScroll}>
          {vehicles.map((v) => (
            <TouchableOpacity
              key={v.id}
              onPress={() => setVehicle(v.id)}
              style={[styles.vehicleButton, vehicle === v.id && styles.vehicleButtonActive]}
            >
              <Text style={styles.vehicleIcon}>{v.icon}</Text>
              <Text style={[styles.vehicleLabel, vehicle === v.id && styles.vehicleLabelActive]}>
                {v.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Safety Preference Optimization Mode */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Safety Resilience Preference</Text>
        
        <View style={styles.preferenceSelector}>
          {[
            { id: 'fastest', label: 'FASTEST', sub: 'Min duration' },
            { id: 'balanced', label: 'BALANCED', sub: 'Standard' },
            { id: 'safest', label: 'SAFEST', sub: 'Max Haven & Light' }
          ].map((p) => (
            <TouchableOpacity
              key={p.id}
              onPress={() => setSafetyPreference(p.id)}
              style={[
                styles.preferenceTab,
                safetyPreference === p.id && styles.preferenceTabActive
              ]}
            >
              <Text style={[styles.prefText, safetyPreference === p.id && styles.prefTextActive]}>
                {p.label}
              </Text>
              <Text style={styles.prefSub}>{p.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Additional Safety Toggles */}
        <View style={styles.togglesContainer}>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleText}>💡 Prefer well-lit streets</Text>
            <Switch
              value={additionalPrefs.wellLit}
              onValueChange={() => togglePref('wellLit')}
              trackColor={{ false: COLORS.surfaceElevated, true: COLORS.primary }}
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleText}>👥 Prefer high foot traffic</Text>
            <Switch
              value={additionalPrefs.highFootTraffic}
              onValueChange={() => togglePref('highFootTraffic')}
              trackColor={{ false: COLORS.surfaceElevated, true: COLORS.primary }}
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleText}>🏥 Prefer emergency service proximity</Text>
            <Switch
              value={additionalPrefs.emergencyProximity}
              onValueChange={() => togglePref('emergencyProximity')}
              trackColor={{ false: COLORS.surfaceElevated, true: COLORS.primary }}
            />
          </View>
        </View>
      </View>

      {/* Find Safe Routes Action Button */}
      <Button
        title="Find Safe Routes 🛡️"
        onPress={handleFindRoutes}
        loading={isLoadingRoutes}
        style={{ marginTop: 8, marginBottom: 24 }}
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
    marginVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12
  },
  locationInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  inputIcon: {
    fontSize: 12,
    marginRight: 10
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  miniLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '700'
  },
  textInput: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 2
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  timeLabel: {
    color: COLORS.textSecondary,
    fontSize: 12
  },
  timeChips: {
    flexDirection: 'row',
    gap: 6
  },
  timeChip: {
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  timeChipActive: {
    backgroundColor: COLORS.primary
  },
  timeChipText: {
    color: COLORS.textSecondary,
    fontSize: 11
  },
  timeChipTextActive: {
    color: '#FFF',
    fontWeight: '700'
  },
  vehicleScroll: {
    flexDirection: 'row',
    marginHorizontal: -4
  },
  vehicleButton: {
    backgroundColor: COLORS.surfaceElevated,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 70
  },
  vehicleButtonActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: COLORS.primary,
    borderWidth: 1.5
  },
  vehicleIcon: {
    fontSize: 22,
    marginBottom: 4
  },
  vehicleLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600'
  },
  vehicleLabelActive: {
    color: COLORS.primaryLight,
    fontWeight: '700'
  },
  preferenceSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 10,
    padding: 3,
    marginBottom: 12
  },
  preferenceTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8
  },
  preferenceTabActive: {
    backgroundColor: COLORS.primary
  },
  prefText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700'
  },
  prefTextActive: {
    color: '#FFF'
  },
  prefSub: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 1
  },
  togglesContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  toggleText: {
    color: COLORS.textSecondary,
    fontSize: 13
  }
});
