import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors';

export const Card = ({ children, style, onPress, selected = false, highlighted = false }) => {
  const CardContainer = onPress ? TouchableOpacity : View;

  return (
    <CardContainer
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.card,
        selected && styles.selectedCard,
        highlighted && styles.highlightedCard,
        style
      ]}
    >
      {children}
    </CardContainer>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  selectedCard: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: '#1E293B'
  },
  highlightedCard: {
    borderColor: COLORS.safeGreen,
    borderWidth: 1.5,
    backgroundColor: '#0F291E'
  }
});
