import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';

export const RegisterScreen = ({ navigation }) => {
  const { register, loading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('+91 ');
  const [emergencyRel, setEmergencyRel] = useState('Parent');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');

  // Password requirement flags
  const hasLen = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNum = /[0-9]/.test(password);
  const hasSpec = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields (Name, Email, Password).');
      return;
    }
    if (!emergencyName.trim() || !emergencyPhone.trim()) {
      setError('Please provide your Primary Emergency Contact Name & Number.');
      return;
    }
    if (!termsAccepted) {
      setError('You must accept the Terms of Service & Privacy Policy.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!hasLen || !hasUpper || !hasLower || !hasNum || !hasSpec) {
      setError('Password does not meet all complexity requirements.');
      return;
    }

    setError('');
    const res = await register({
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
      confirm_password: confirmPassword,
      emergency_contact_name: emergencyName.trim(),
      emergency_contact_phone: emergencyPhone.trim(),
      emergency_contact_rel: emergencyRel,
      terms_accepted: termsAccepted
    });

    if (res.success) {
      navigation.navigate('VerifyOtp', { dev_otp: res.dev_otp });
    } else {
      setError(res.error || 'Registration failed.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Header
        title="Create Account"
        subtitle="Set up your SafeRoute account to start navigating safely"
        showBack
        onBack={() => navigation.goBack()}
      />

      <View style={styles.formCard}>
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="e.g. Alex Rivera"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address *</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="name@example.com"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mobile Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+91 9876543210"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Create Password *</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 8 characters"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <!-- Dynamic Password Strength Checklist -->
        <View style={styles.checklistCard}>
          <Text style={[styles.reqItem, hasLen && styles.reqValid]}>{hasLen ? '✔' : '✖'} 8+ characters</Text>
          <Text style={[styles.reqItem, hasUpper && styles.reqValid]}>{hasUpper ? '✔' : '✖'} At least 1 uppercase letter (A-Z)</Text>
          <Text style={[styles.reqItem, hasLower && styles.reqValid]}>{hasLower ? '✔' : '✖'} At least 1 lowercase letter (a-z)</Text>
          <Text style={[styles.reqItem, hasNum && styles.reqValid]}>{hasNum ? '✔' : '✖'} At least 1 number (0-9)</Text>
          <Text style={[styles.reqItem, hasSpec && styles.reqValid]}>{hasSpec ? '✔' : '✖'} At least 1 special char (!@#$%^&*)</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm Password *</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter password"
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry={!showPassword}
          />
          {confirmPassword ? (
            <Text style={{ fontSize: 11, marginTop: 4, color: password === confirmPassword ? COLORS.safeGreen : COLORS.dangerRed }}>
              {password === confirmPassword ? '✔ Passwords match' : '✖ Passwords do not match'}
            </Text>
          ) : null}
        </View>

        <View style={{ borderTopWidth: 1, borderTopColor: COLORS.border, marginVertical: 14, paddingTop: 10 }}>
          <Text style={[styles.label, { color: COLORS.primaryLight }]}>PRIMARY EMERGENCY CONTACT *</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Emergency Contact Name *</Text>
          <TextInput
            style={styles.input}
            value={emergencyName}
            onChangeText={setEmergencyName}
            placeholder="e.g. Sarah Rivera"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Emergency Contact Phone *</Text>
          <TextInput
            style={styles.input}
            value={emergencyPhone}
            onChangeText={setEmergencyPhone}
            placeholder="+91 9876543210"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Relationship *</Text>
          <TextInput
            style={styles.input}
            value={emergencyRel}
            onChangeText={setEmergencyRel}
            placeholder="e.g. Parent, Spouse, Sibling, Friend, Guardian"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        <TouchableOpacity
          style={styles.termsRow}
          onPress={() => setTermsAccepted(!termsAccepted)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
            {termsAccepted ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
          <Text style={styles.termsText}>
            I agree to the <Text style={styles.termsLink}>Terms of Service</Text> & <Text style={styles.termsLink}>Privacy Policy</Text>.
          </Text>
        </TouchableOpacity>

        <Button
          title="Create Account & Send Code ›"
          onPress={handleRegister}
          loading={loading}
          disabled={loading}
          variant="success"
          style={{ marginTop: 10 }}
        />

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkRow}>
          <Text style={styles.linkText}>Already have an account? <Text style={styles.linkHighlight}>Log In</Text></Text>
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
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative'
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    padding: 4
  },
  eyeIcon: {
    fontSize: 16
  },
  checklistCard: {
    backgroundColor: '#090E1A',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14
  },
  reqItem: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 2
  },
  reqValid: {
    color: COLORS.safeGreen,
    fontWeight: '700'
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800'
  },
  termsText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    flex: 1
  },
  termsLink: {
    color: COLORS.primaryLight,
    fontWeight: '700'
  },
  linkRow: {
    marginTop: 20,
    alignItems: 'center'
  },
  linkText: {
    color: COLORS.textSecondary,
    fontSize: 13
  },
  linkHighlight: {
    color: COLORS.primaryLight,
    fontWeight: '700'
  }
});
