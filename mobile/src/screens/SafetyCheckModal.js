import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors';
import { Button } from '../components/Button';

export const SafetyCheckModal = ({
  visible,
  onConfirmSafe,
  onTriggerEmergency,
  nearestHavenName = 'City General Hospital',
  timeToHaven = '90 seconds',
  reason = 'Route deviation detected'
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onConfirmSafe}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.warningIcon}>
            <Text style={styles.warningEmoji}>⚠️</Text>
          </View>

          <Text style={styles.modalTitle}>ARE YOU SAFE?</Text>
          <Text style={styles.reasonText}>{reason}</Text>

          <View style={styles.havenBox}>
            <Text style={styles.havenLabel}>NEAREST SAFE HAVEN:</Text>
            <Text style={styles.havenName}>🏥 {nearestHavenName}</Text>
            <Text style={styles.havenTime}>Estimated reach time: <Text style={{ color: COLORS.safeGreen, fontWeight: '700' }}>{timeToHaven}</Text></Text>
          </View>

          <View style={styles.actions}>
            <Button
              title="YES, I AM SAFE"
              onPress={onConfirmSafe}
              variant="secondary"
              style={{ backgroundColor: COLORS.surfaceElevated }}
            />

            <Button
              title="NO, I'M NOT SAFE 🚨"
              onPress={onTriggerEmergency}
              variant="danger"
              style={{ marginTop: 8 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.dangerRed,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8
  },
  warningIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  warningEmoji: {
    fontSize: 32
  },
  modalTitle: {
    color: COLORS.dangerRed,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1
  },
  reasonText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16
  },
  havenBox: {
    width: '100%',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  havenLabel: {
    color: COLORS.primaryLight,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  havenName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 3
  },
  havenTime: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4
  },
  actions: {
    width: '100%'
  }
});
