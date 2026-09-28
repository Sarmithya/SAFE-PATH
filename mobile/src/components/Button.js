import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../theme/colors';

export const Button = ({
  title,
  onPress,
  variant = 'primary', // 'primary', 'secondary', 'danger', 'warning', 'outline'
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle
}) => {
  const getBackgroundColor = () => {
    if (disabled) return COLORS.surfaceElevated;
    switch (variant) {
      case 'danger': return COLORS.dangerRed;
      case 'warning': return COLORS.warningYellow;
      case 'secondary': return COLORS.surfaceElevated;
      case 'outline': return 'transparent';
      case 'primary':
      default:
        return COLORS.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return COLORS.textMuted;
    if (variant === 'warning') return '#000000';
    if (variant === 'outline') return COLORS.primaryLight;
    return '#FFFFFF';
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        variant === 'outline' && styles.outlineButton,
        style
      ]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginVertical: 6
  },
  outlineButton: {
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center'
  },
  icon: {
    fontSize: 16,
    marginRight: 8
  }
});
