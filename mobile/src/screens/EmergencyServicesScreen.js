import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';
import { Button } from '../components/Button';

export const EmergencyServicesScreen = ({ navigation }) => {
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    serviceName: '',
    dialNumber: ''
  });
  const [feedback, setFeedback] = useState('');

  const services = [
    { name: 'Police Emergency Dispatch', number: '100', icon: '👮', desc: 'Direct law enforcement response & rapid patrol dispatch.', type: 'Police' },
    { name: 'Medical Ambulance Support', number: '108', icon: '🚑', desc: 'Paramedic dispatch & urgent healthcare transport.', type: 'Medical' },
    { name: 'National Emergency Helpline', number: '112', icon: '🚨', desc: 'Unified multi-agency public emergency hotline.', type: 'National' },
    { name: "Women's Safety SOS Helpline", number: '1091', icon: '🛡️', desc: 'Dedicated rapid response & women safety assistance.', type: 'Safety' },
    { name: 'Campus Security Control Room', number: '+1 (555) 019-1122', icon: '🏫', desc: 'On-campus verified safety dispatch post.', type: 'Campus' }
  ];

  const handleDialClick = (srv) => {
    setConfirmModal({
      visible: true,
      serviceName: srv.name,
      dialNumber: srv.number
    });
  };

  const handleConfirmDial = () => {
    const { serviceName, dialNumber } = confirmModal;
    setConfirmModal({ visible: false, serviceName: '', dialNumber: '' });
    setFeedback(`📞 SIMULATED: Calling ${serviceName} (${dialNumber})...`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Header
        title="Emergency Services"
        subtitle="Direct Hotline & Sanctuary Directory"
        showBack
        onBack={() => navigation.goBack()}
      />

      {feedback ? (
        <View style={styles.feedbackBanner}>
          <Text style={styles.feedbackText}>{feedback}</Text>
        </View>
      ) : null}

      <View style={styles.list}>
        {services.map((srv, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => handleDialClick(srv)}
            style={styles.serviceCard}
            activeOpacity={0.85}
          >
            <Text style={styles.serviceIcon}>{srv.icon}</Text>
            <View style={styles.serviceInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.serviceName}>{srv.name}</Text>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberText}>{srv.number}</Text>
                </View>
              </View>
              <Text style={styles.serviceDesc}>{srv.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Confirmation Modal */}
      <Modal
        visible={confirmModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfirmModal({ visible: false, serviceName: '', dialNumber: '' })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirm Emergency Call</Text>
            <Text style={styles.modalText}>
              Are you sure you want to dial <Text style={{ color: COLORS.dangerRed, fontWeight: '700' }}>{confirmModal.serviceName}</Text> at <Text style={{ color: COLORS.textPrimary, fontWeight: '700' }}>{confirmModal.dialNumber}</Text>?
            </Text>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setConfirmModal({ visible: false, serviceName: '', dialNumber: '' })}
                variant="secondary"
                style={{ flex: 1, marginHorizontal: 4 }}
              />
              <Button
                title="Call Now 📞"
                onPress={handleConfirmDial}
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
  feedbackBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: COLORS.dangerRed,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10
  },
  feedbackText: {
    color: COLORS.dangerRed,
    fontSize: 13,
    fontWeight: '700'
  },
  list: {
    marginTop: 4
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  serviceIcon: {
    fontSize: 28,
    marginRight: 14
  },
  serviceInfo: {
    flex: 1
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  serviceName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    flex: 1
  },
  numberBadge: {
    backgroundColor: COLORS.dangerRed,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginLeft: 6
  },
  numberText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800'
  },
  serviceDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 16
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 18,
    padding: 20,
    width: '100%',
    borderWidth: 1.5,
    borderColor: COLORS.dangerRed
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8
  },
  modalText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16
  },
  modalActions: {
    flexDirection: 'row'
  }
});
