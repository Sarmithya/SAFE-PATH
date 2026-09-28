import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Modal, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { HavenCard } from '../components/SafeHavenMarker';
import { useJourney } from '../context/JourneyContext';
import { useAuth } from '../context/AuthContext';
import { ApiService } from '../services/api';

export const EmergencyAssistanceScreen = ({ navigation }) => {
  const { nearestHaven, currentLocation, destination, safeHavens } = useJourney();
  const { user } = useAuth();

  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: '',
    message: '',
    action: null
  });
  const [statusFeedback, setStatusFeedback] = useState('');

  const havenData = nearestHaven?.haven || safeHavens[0] || {
    name: 'City General Hospital',
    type: 'hospital',
    address: '104 Healthcare Blvd',
    operating_hours: '24/7'
  };

  const handleActionClick = (title, message, action) => {
    setConfirmModal({
      visible: true,
      title,
      message,
      action
    });
  };

  const executeConfirmedAction = async () => {
    const act = confirmModal.action;
    setConfirmModal({ visible: false, title: '', message: '', action: null });

    if (act === 'police') {
      setStatusFeedback('🚨 SIMULATED: Police Dispatch (100) alerted with live coordinates!');
    } else if (act === 'ambulance') {
      setStatusFeedback('🚑 SIMULATED: Ambulance Dispatch (108) requested to your location!');
    } else if (act === 'contact') {
      setStatusFeedback('📞 SIMULATED: Emergency Contact (Sarah Rivera) dialed.');
    } else if (act === 'share') {
      const res = await ApiService.shareLocation({
        user_id: user?.id,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        destination: destination,
        nearest_haven_name: havenData.name
      });
      setStatusFeedback('📍 SIMULATED: Live GPS location & Safe Haven shared with trusted contacts!');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Header
        title="Emergency Assistance"
        subtitle="Immediate Haven Routing & Support"
        showBack
        onBack={() => navigation.goBack()}
      />

      {/* Emergency Header Banner */}
      <View style={styles.emergencyHeader}>
        <Text style={styles.emergencyIcon}>🚨</Text>
        <Text style={styles.emergencyTitle}>EMERGENCY PROTOCOL ACTIVE</Text>
        <Text style={styles.emergencySubtitle}>
          Immediate guidance to nearest verified sanctuary
        </Text>
      </View>

      {/* Feedback Banner */}
      {statusFeedback ? (
        <View style={styles.feedbackBanner}>
          <Text style={styles.feedbackText}>{statusFeedback}</Text>
        </View>
      ) : null}

      {/* Nearest Safe Haven Card */}
      <View style={styles.havenCardContainer}>
        <Text style={styles.sectionHeader}>PRIMARY ESCAPE HAVEN</Text>
        <HavenCard
          haven={havenData}
          estimatedTime={nearestHaven?.formatted_time || '90 seconds'}
          distanceMeters={nearestHaven?.distance_meters || 110}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <Button
          title="NAVIGATE TO SAFE HAVEN 🏥"
          onPress={() => {
            setStatusFeedback(`📍 Turn-by-turn navigation started to ${havenData.name} (Estimated: 90s).`);
          }}
          variant="primary"
          style={styles.bigButton}
        />

        <Button
          title="CALL EMERGENCY CONTACT 📞"
          onPress={() => handleActionClick(
            'Call Emergency Contact',
            'Connect call to Sarah Rivera (Mother) at +1 (555) 019-9988?',
            'contact'
          )}
          variant="secondary"
          style={styles.actionBtn}
        />

        <Button
          title="CALL POLICE (100) 👮"
          onPress={() => handleActionClick(
            'Emergency Police Dispatch',
            'Initiate direct call to Central Police Emergency Services (100)?',
            'police'
          )}
          variant="danger"
          style={styles.actionBtn}
        />

        <Button
          title="CALL AMBULANCE (108) 🚑"
          onPress={() => handleActionClick(
            'Medical Emergency Ambulance',
            'Initiate call to Emergency Ambulance Dispatch (108)?',
            'ambulance'
          )}
          variant="danger"
          style={styles.actionBtn}
        />

        <Button
          title="SHARE LIVE LOCATION 📍"
          onPress={() => handleActionClick(
            'Share Live GPS Location',
            'Broadcast your current GPS coordinates, destination, and nearest safe haven to trusted contacts?',
            'share'
          )}
          variant="outline"
          style={styles.actionBtn}
        />
      </View>

      {/* Confirmation Modal */}
      <Modal
        visible={confirmModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfirmModal({ visible: false, title: '', message: '', action: null })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>{confirmModal.title}</Text>
            <Text style={styles.confirmMsg}>{confirmModal.message}</Text>

            <View style={styles.confirmActions}>
              <Button
                title="Cancel"
                onPress={() => setConfirmModal({ visible: false, title: '', message: '', action: null })}
                variant="secondary"
                style={{ flex: 1, marginHorizontal: 4 }}
              />
              <Button
                title="Confirm & Proceed"
                onPress={executeConfirmedAction}
                variant="danger"
                style={{ flex: 1, marginHorizontal: 4 }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  emergencyHeader: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: COLORS.dangerRed,
    borderWidth: 2,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginVertical: 8
  },
  emergencyIcon: {
    fontSize: 32,
    marginBottom: 4
  },
  emergencyTitle: {
    color: COLORS.dangerRed,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  emergencySubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2
  },
  feedbackBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: COLORS.safeGreen,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginVertical: 6
  },
  feedbackText: {
    color: COLORS.safeGreen,
    fontSize: 12,
    fontWeight: '700'
  },
  havenCardContainer: {
    marginVertical: 6
  },
  sectionHeader: {
    color: COLORS.primaryLight,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4
  },
  actionContainer: {
    marginTop: 8,
    marginBottom: 20
  },
  bigButton: {
    paddingVertical: 16,
    marginBottom: 8
  },
  actionBtn: {
    marginVertical: 4
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  confirmCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 18,
    padding: 20,
    width: '100%',
    borderWidth: 1.5,
    borderColor: COLORS.border
  },
  confirmTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8
  },
  confirmMsg: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16
  },
  confirmActions: {
    flexDirection: 'row'
  }
});
