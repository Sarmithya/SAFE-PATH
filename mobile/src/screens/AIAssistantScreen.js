import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { useJourney } from '../context/JourneyContext';
import { ApiService } from '../services/api';

export const AIAssistantScreen = ({ navigation }) => {
  const {
    setOrigin,
    setDestination,
    setVehicle,
    setDepartureTime,
    setSafetyPreference,
    fetchRoutes
  } = useJourney();

  const [prompt, setPrompt] = useState('I need to reach college by 10 AM and I want a safer route.');
  const [loading, setLoading] = useState(false);
  const [parsedResult, setParsedResult] = useState(null);

  const samplePrompts = [
    'I need to reach Central Library by 10 AM with maximum safety.',
    'Find safest walking route to College Gate tonight.',
    'Safest bus route to Downtown Transit Plaza.'
  ];

  const handleParse = async (queryText) => {
    const textToParse = queryText || prompt;
    if (!textToParse) return;
    setLoading(true);
    try {
      const res = await ApiService.parseIntent(textToParse);
      if (res.result) {
        setParsedResult(res.result);
      }
    } catch (err) {
      console.error('Error parsing intent:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAndSearch = async () => {
    if (!parsedResult) return;
    setDestination(parsedResult.destination || 'Central Library');
    setDepartureTime(parsedResult.arrival_time || 'Now');
    setSafetyPreference(parsedResult.safety_preference || 'safest');
    setVehicle(parsedResult.vehicle || 'walking');

    await fetchRoutes(
      'College Gate',
      parsedResult.destination || 'Central Library',
      parsedResult.vehicle || 'walking'
    );
    navigation.navigate('RouteComparison');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Header
        title="AI Assistant"
        subtitle="Conversational Safety Navigation"
        showBack
        onBack={() => navigation.goBack()}
      />

      <View style={styles.inputCard}>
        <Text style={styles.inputTitle}>Ask SafeRoute in Plain English ✨</Text>
        <TextInput
          style={styles.textInput}
          value={prompt}
          onChangeText={setPrompt}
          placeholder="e.g. Find safest walking route to library by 10 PM..."
          placeholderTextColor={COLORS.textMuted}
          multiline
          numberOfLines={3}
        />

        <Button
          title="Analyze Request ✨"
          onPress={() => handleParse()}
          loading={loading}
          variant="primary"
          style={{ marginTop: 8 }}
        />
      </View>

      {/* Sample Quick Prompts */}
      <View style={styles.samplesSection}>
        <Text style={styles.samplesTitle}>EXAMPLE PROMPTS:</Text>
        {samplePrompts.map((p, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => {
              setPrompt(p);
              handleParse(p);
            }}
            style={styles.sampleChip}
          >
            <Text style={styles.sampleChipText}>💬 "{p}"</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Structured Output Card */}
      {parsedResult && (
        <View style={styles.resultCard}>
          <Text style={styles.resultHeader}>PARSED ROUTE INTENT ✓</Text>
          <Text style={styles.summaryText}>{parsedResult.summary}</Text>

          <View style={styles.paramsGrid}>
            <View style={styles.paramItem}>
              <Text style={styles.paramLabel}>Destination</Text>
              <Text style={styles.paramValue}>{parsedResult.destination}</Text>
            </View>
            <View style={styles.paramItem}>
              <Text style={styles.paramLabel}>Time</Text>
              <Text style={styles.paramValue}>{parsedResult.arrival_time}</Text>
            </View>
            <View style={styles.paramItem}>
              <Text style={styles.paramLabel}>Mode</Text>
              <Text style={styles.paramValue}>{parsedResult.vehicle?.toUpperCase()}</Text>
            </View>
            <View style={styles.paramItem}>
              <Text style={styles.paramLabel}>Safety Opt</Text>
              <Text style={[styles.paramValue, { color: COLORS.safeGreen }]}>
                {parsedResult.safety_preference?.toUpperCase()}
              </Text>
            </View>
          </View>

          <Button
            title="Search This Safe Route ›"
            onPress={handleApplyAndSearch}
            variant="primary"
            style={{ marginTop: 12 }}
          />
        </View>
      )}
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
  inputCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  inputTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8
  },
  textInput: {
    backgroundColor: COLORS.surfaceElevated,
    color: COLORS.textPrimary,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.border
  },
  samplesSection: {
    marginVertical: 10
  },
  samplesTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6
  },
  sampleChip: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 10,
    padding: 10,
    marginVertical: 3,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  sampleChipText: {
    color: COLORS.primaryLight,
    fontSize: 12
  },
  resultCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: COLORS.safeGreen
  },
  resultHeader: {
    color: COLORS.safeGreen,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  summaryText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    marginVertical: 8,
    fontWeight: '600'
  },
  paramsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 6
  },
  paramItem: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 8,
    padding: 8,
    minWidth: '45%',
    flex: 1
  },
  paramLabel: {
    color: COLORS.textMuted,
    fontSize: 10
  },
  paramValue: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2
  }
});
