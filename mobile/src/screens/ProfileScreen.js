import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';

export const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Header title="My Profile" subtitle="Safety Settings & Emergency Contacts" />

      {/* User Info Card */}
      <View style={styles.card}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.full_name?.charAt(0) || 'A'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.full_name || 'Alex Rivera'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'demo@saferoute.app'}</Text>
            <Text style={styles.userPhone}>{user?.phone || '+1 (555) 019-2834'}</Text>
          </View>
        </View>
      </View>

      {/* Emergency Contacts */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Emergency Contacts (SOS)</Text>
        {user?.emergency_contacts?.map((c) => (
          <View key={c.id} style={styles.contactItem}>
            <View>
              <Text style={styles.contactName}>{c.name}</Text>
              <Text style={styles.contactRel}>{c.relationship} • {c.phone}</Text>
            </View>
            <View style={styles.verifiedTag}>
              <Text style={styles.verifiedText}>Active SOS</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Safety Preference Defaults */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Safety Engine Defaults</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Resilience Threshold</Text>
          <Text style={styles.settingValue}>120 seconds (2.0 min)</Text>
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Deviation Alert Sensitivity</Text>
          <Text style={styles.settingValue}>50 meters</Text>
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Default Preference</Text>
          <Text style={styles.settingValue}>Balanced</Text>
        </View>
      </View>

      {/* Logout */}
      <Button
        title="Log Out"
        onPress={() => {
          logout();
          navigation.replace('Login');
        }}
        variant="outline"
        style={{ marginTop: 10, borderColor: COLORS.dangerRed }}
        textStyle={{ color: COLORS.dangerRed }}
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
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  avatarText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800'
  },
  userInfo: {
    flex: 1
  },
  userName: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700'
  },
  userEmail: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2
  },
  userPhone: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  contactName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600'
  },
  contactRel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2
  },
  verifiedTag: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  verifiedText: {
    color: COLORS.dangerRed,
    fontSize: 11,
    fontWeight: '700'
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  settingLabel: {
    color: COLORS.textSecondary,
    fontSize: 13
  },
  settingValue: {
    color: COLORS.primaryLight,
    fontSize: 13,
    fontWeight: '600'
  }
});
