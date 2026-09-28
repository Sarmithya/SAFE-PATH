import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';

export const LoginScreen = ({ navigation }) => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('demo@saferoute.app');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    const res = await login(email, password);
    if (res.success) {
      navigation.navigate('MainTabs');
    } else {
      setError(res.error || 'Login failed');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Header title="Welcome Back" subtitle="Log in to access your trusted safety features" />

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>SafeRoute Account</Text>
        <Text style={styles.formSubtitle}>Default demo account credentials pre-loaded</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="name@example.com"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            selectTextOnFocus
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry
            selectTextOnFocus
          />
        </View>

        <Button
          title="Log In"
          onPress={handleLogin}
          loading={loading}
          style={{ marginTop: 10 }}
        />

        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkRow}>
          <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkHighlight}>Register</Text></Text>
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
    marginTop: 20,
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
  inputGroup: {
    marginBottom: 14
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6
  },
  input: {
    backgroundColor: COLORS.surfaceElevated,
    color: COLORS.textPrimary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  errorText: {
    color: COLORS.dangerRed,
    fontSize: 12,
    marginBottom: 10
  },
  linkRow: {
    marginTop: 16,
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
