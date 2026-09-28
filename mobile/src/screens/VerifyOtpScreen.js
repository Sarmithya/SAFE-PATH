import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';

export const VerifyOtpScreen = ({ route, navigation }) => {
  const { verifyOtp, resendOtp, pendingIdentifier, loading } = useAuth();
  const [otp, setOtp] = useState(route?.params?.dev_otp || '');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    let timer = setInterval(() => {
      setCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP verification code.');
      return;
    }
    setError('');
    const res = await verifyOtp(otp);
    if (res.success) {
      if (!res.user?.onboarding_completed) {
        navigation.navigate('Onboarding');
      }
    } else {
      setError(res.error || 'Verification failed. Invalid or expired OTP code.');
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError('');
    const res = await resendOtp();
    if (res.success) {
      setSuccessMsg('A new 6-digit verification code has been sent.');
      setCooldown(60);
      if (res.dev_otp) setOtp(res.dev_otp);
    } else {
      setError(res.error || 'Failed to resend OTP code.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Header
        title="Verify Account"
        subtitle={`Enter the 6-digit code sent to ${pendingIdentifier || 'your email'}`}
        showBack
        onBack={() => navigation.goBack()}
      />

      <View style={styles.formCard}>
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {successMsg ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{successMsg}</Text>
          </View>
        ) : null}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>6-Digit OTP Code</Text>
          <TextInput
            style={styles.otpInput}
            value={otp}
            onChangeText={setOtp}
            placeholder="123456"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="number-pad"
            maxLength={6}
          />
        </View>

        <Button
          title="Verify & Activate Account ›"
          onPress={handleVerify}
          loading={loading}
          disabled={loading}
          variant="success"
          style={{ marginTop: 10 }}
        />

        <View style={styles.cooldownRow}>
          <Text style={styles.cooldownText}>
            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Did not receive code?'}
          </Text>
          <TouchableOpacity onPress={handleResend} disabled={cooldown > 0}>
            <Text style={[styles.resendBtnText, cooldown > 0 && { opacity: 0.5 }]}>Resend Code</Text>
          </TouchableOpacity>
        </View>
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
  successBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: COLORS.safeGreen,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14
  },
  successText: {
    color: '#6EE7B7',
    fontSize: 12,
    fontWeight: '600'
  },
  inputGroup: {
    marginBottom: 16
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center'
  },
  otpInput: {
    backgroundColor: '#090E1A',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    color: '#ffffff',
    padding: 14,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 8,
    textAlign: 'center'
  },
  cooldownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16
  },
  cooldownText: {
    color: COLORS.textMuted,
    fontSize: 12
  },
  resendBtnText: {
    color: COLORS.primaryLight,
    fontWeight: '700',
    fontSize: 12
  }
});
