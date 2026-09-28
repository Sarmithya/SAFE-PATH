import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useJourney } from '../context/JourneyContext';
import { ApiService } from '../services/api';

export const ShareTripScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { origin, destination, currentLocation, nearestHaven } = useJourney();

  const [liveShareEnabled, setLiveShareEnabled] = useState(true);
  const [selectedContacts, setSelectedContacts] = useState({
    1: true, // Sarah Rivera
    2: true, // Campus Security
    3: false // Jordan Lee
  });
  const [shareSuccess, setShareSuccess] = useState(false);

  const contactsList = [
    { id: 1, name: 'Sarah Rivera (Mother)', phone: '+1 (555) 019-9988', role: 'Primary Emergency' },
    { id: 2, name: 'Campus Security Dispatch', phone: '+1 (555) 019-1122', role: 'Campus Police' },
    { id: 3, name: 'Jordan Lee (Roommate)', phone: '+1 (555) 019-4455', role: 'Trusted Friend' }
  ];

  const toggleContact = (id) => {
    setSelectedContacts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleShare = async () => {
    await ApiService.shareLocation({
      user_id: user?.id,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      destination: destination,
      nearest_haven_name: nearestHaven?.haven?.name || 'City General Hospital'
    });
    setShareSuccess(true);
    setTimeout(() => {
      navigation.goBack();
    }, 1500);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Header
        title="Share My Trip"
        subtitle="Live safety telemetry broadcast"
        showBack
        onBack={() => navigation.goBack()}
      />

      {shareSuccess && (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>✓ Live trip link shared with selected contacts!</Text>
        </View>
      )}

      {/* Live Share Status Card */}
      <View style={styles.card}>
        <View style={styles.shareToggleRow}>
          <View>
            <Text style={styles.shareTitle}>Live Location Sharing</Text>
            <Text style={styles.shareSub}>Stream GPS coords & nearest haven data</Text>
          </View>
          <Switch
            value={liveShareEnabled}
            onValueChange={setLiveShareEnabled}
            trackColor={{ false: COLORS.surfaceElevated, true: COLORS.primary }}
          />
        </View>
      </View>

      {/* Trip Details Payload Preview */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Shared Payload Preview</Text>
        <View style={styles.payloadBox}>
          <Text style={styles.payloadLine}>📍 Destination: {destination}</Text>
          <Text style={styles.payloadLine}>⏱️ Status: Active SafeRoute Corridor</Text>
          <Text style={styles.payloadLine}>🏥 Nearest Safe Haven: {nearestHaven?.haven?.name || 'City General Hospital'}</Text>
          <Text style={styles.payloadLine}>🌐 Live Map URL: https://maps.google.com/?q={currentLocation.latitude},{currentLocation.longitude}</Text>
        </View>
      </View>

      {/* Trusted Contacts Selector */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Select Recipients</Text>
        {contactsList.map((contact) => (
          <TouchableOpacity
            key={contact.id}
            onPress={() => toggleContact(contact.id)}
            style={styles.contactRow}
          >
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.contactRole}>{contact.role} • {contact.phone}</Text>
            </View>
            <View style={[styles.checkbox, selectedContacts[contact.id] && styles.checkboxActive]}>
              {selectedContacts[contact.id] && <Text style={styles.checkIcon}>✓</Text>}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Button
        title="Broadcast Live Location 📡"
        onPress={handleShare}
        variant="primary"
        style={{ marginTop: 8 }}
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
  successBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: COLORS.safeGreen,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8
  },
  successText: {
    color: COLORS.safeGreen,
    fontSize: 13,
    fontWeight: '700'
  },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  shareToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  shareTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700'
  },
  shareSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8
  },
  payloadBox: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  payloadLine: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginVertical: 2
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  contactInfo: {
    flex: 1
  },
  contactName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600'
  },
  contactRole: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.textMuted,
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  checkIcon: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800'
  }
});
