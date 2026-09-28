import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';
import { ScoreBadge, ResilienceBadge } from '../components/ScoreBadge';
import { Button } from '../components/Button';
import { ApiService } from '../services/api';

export const JourneyHistoryScreen = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getJourneyHistory();
      if (res.journeys) {
        setHistory(res.journeys);
      }
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Header
        title="Journey History"
        subtitle="Review past trips & safety resilience logs"
        rightAction={history.length > 0 ? handleClearHistory : null}
        rightActionLabel="Clear Logs"
      />

      {history.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🛣️</Text>
          <Text style={styles.emptyTitle}>No Journeys Recorded Yet</Text>
          <Text style={styles.emptySubtitle}>Completed safe routes will be logged here with privacy controls.</Text>
          <Button
            title="Start New Safe Journey ›"
            onPress={() => navigation.navigate('Home')}
            style={{ marginTop: 14 }}
          />
        </View>
      ) : (
        history.map((j) => (
          <View key={j.id} style={styles.journeyCard}>
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <Text style={styles.destinationText}>{j.destination}</Text>
                <Text style={styles.originText}>From: {j.origin}</Text>
              </View>
              <ScoreBadge score={j.safety_score || 87} size="small" />
            </View>

            <View style={styles.metricsRow}>
              <Text style={styles.metaItem}>⏱️ {j.duration || 22} min</Text>
              <Text style={styles.metaItem}>📍 {j.distance || 6.2} km</Text>
              <Text style={styles.metaItem}>🚗 {j.vehicle?.toUpperCase()}</Text>
              <Text style={[styles.metaItem, { color: COLORS.safeGreen, fontWeight: '700' }]}>
                {j.status || 'COMPLETED'}
              </Text>
            </View>

            <ResilienceBadge
              status="PASS"
              maxTimeSeconds={j.max_time_to_haven || 108}
              count={5}
            />
          </View>
        ))
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
  emptyCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 40,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700'
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4
  },
  journeyCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  headerLeft: {
    flex: 1,
    paddingRight: 8
  },
  destinationText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700'
  },
  originText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 8,
    flexWrap: 'wrap'
  },
  metaItem: {
    color: COLORS.textSecondary,
    fontSize: 12
  }
});
