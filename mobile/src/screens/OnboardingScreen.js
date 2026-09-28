import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';

export const OnboardingScreen = ({ navigation }) => {
  const { updateProfileSetup, loading } = useAuth();
  const [ecName, setEcName] = useState('');
  const [ecPhone, setEcPhone] = useState('+91 ');
  const [ecRel, setEcRel] = useState('Family');
  const [error, setError] = useState('');

  const handleSaveSetup = async () => {
    setError('');
    const res = await updateProfileSetup({
      emergency_contact_name: ecName.trim(),
      emergency_contact_phone: ecPhone.trim(),
      emergency_contact_rel: ecRel
    });

    if (res.success) {
      navigation.navigate('MainTabs');
    } else {
      setError(res.error || 'Failed to save setup');
    }
  };

  const handleSkip = () => {
    navigation.navigate('MainTabs');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Header
        title="Safety Setup"
        subtitle="Configure your primary emergency contact for instant SOS alerts"
      />

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Trusted Emergency Contact</Text>
        <Text style={styles.formSubtitle}>This contact will receive live GPS tracking links during emergency SOS alerts</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contact Full Name</Text>
          <TextInput
            style={styles.input}
            value={ecName}
            onChangeText={setEcName}
            placeholder="e.g. Ramesh Sharma"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mobile Phone Number</Text>
          <TextInput
            style={styles.input}
            value={ecPhone}
            onChangeText={setEcPhone}
            placeholder="+91 9876543210"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Relationship</Text>
          <TextInput
            style={styles.input}
            value={ecRel}
            onChangeText={setEcRel}
            placeholder="Parent, Friend, Spouse, etc."
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        <Button
          title="Save & Continue to SafeRoute ›"
          onPress={handleSaveSetup}
          loading={loading}
          disabled={loading}
          variant="success"
          style={{ marginTop: 10 }}
        />

        <Button
          title="Skip for Now"
          onPress={handleSkip}
          variant="secondary"
          disabled={loading}
          style={{ marginTop: 10 }}
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
  formCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  formTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700'
  },
  formSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: COLORS.dangerRed,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '600'
  },
  inputGroup: {
    marginBottom: 14
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6
  },
  input: {
    backgroundColor: '#090E1A',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    color: '#ffffff',
    padding: 12,
    fontSize: 14
  }
});
