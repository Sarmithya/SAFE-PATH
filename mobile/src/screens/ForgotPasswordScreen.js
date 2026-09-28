import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';

export const ForgotPasswordScreen = ({ navigation }) => {
  const { forgotPassword, resetPassword, loading } = useAuth();
  const [step, setStep] = useState(1); // 1 = Request OTP, 2 = Reset Password
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRequestOtp = async () => {
    if (!identifier.trim()) {
      setError('Please enter your email address or mobile number.');
      return;
    }
    setError('');
    const res = await forgotPassword(identifier.trim());
    if (res.success) {
      setStep(2);
      setSuccessMsg('Reset code sent! Enter code and new password.');
      if (res.dev_otp) setOtp(res.dev_otp);
    } else {
      setError(res.error || 'Failed to process forgot password request.');
    }
  };

  const handleReset = async () => {
    if (!otp || !newPassword) {
      setError('Please enter the OTP code and new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    const res = await resetPassword(otp, newPassword, confirmPassword);
    if (res.success) {
      navigation.navigate('Login', { message: 'Password updated successfully! Please log in.' });
    } else {
      setError(res.error || 'Failed to reset password.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Header
        title="Reset Password"
        subtitle={step === 1 ? 'Enter your registered details to receive a reset code' : 'Set a new password for your account'}
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

        {step === 1 ? (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email or Mobile Number</Text>
              <TextInput
                style={styles.input}
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="name@example.com or +919876543210"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Button
              title="Send Reset Code ›"
              onPress={handleRequestOtp}
              loading={loading}
              disabled={loading}
              style={{ marginTop: 10 }}
            />
          </>
        ) : (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Reset OTP Code</Text>
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Min. 8 characters"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter new password"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry
              />
            </View>

            <Button
              title="Update Password & Sign In ›"
              onPress={handleReset}
              loading={loading}
              disabled={loading}
              variant="success"
              style={{ marginTop: 10 }}
            />
          </>
        )}

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkRow}>
          <Text style={styles.linkHighlight}>‹ Back to Log In</Text>
        </TouchableOpacity>
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
  },
  otpInput: {
    backgroundColor: '#090E1A',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    color: '#ffffff',
    padding: 12,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 6,
    textAlign: 'center'
  },
  linkRow: {
    marginTop: 20,
    alignItems: 'center'
  },
  linkHighlight: {
    color: COLORS.primaryLight,
    fontWeight: '700',
    fontSize: 13
  }
});
