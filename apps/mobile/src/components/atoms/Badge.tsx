import React, { memo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'neutral';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = memo(({ label, variant = 'primary', style }) => {
  const { theme } = useTheme();

  const getStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          bg: theme.isDark ? 'rgba(0, 245, 160, 0.12)' : 'rgba(5, 150, 105, 0.12)',
          border: theme.isDark ? 'rgba(0, 245, 160, 0.3)' : 'rgba(5, 150, 105, 0.3)',
          text: theme.isDark ? '#00F5A0' : '#059669',
        };
      case 'accent':
        return {
          bg: 'rgba(244, 63, 94, 0.12)',
          border: 'rgba(244, 63, 94, 0.3)',
          text: '#F43F5E',
        };
      case 'neutral':
        return {
          bg: theme.colors.surfaceSubtle,
          border: theme.colors.border,
          text: theme.colors.textSecondary,
        };
      default:
        return {
          bg: theme.colors.badgeBg,
          border: theme.colors.badgeBorder,
          text: theme.colors.badgeText,
        };
    }
  };

  const current = getStyles();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: current.bg,
          borderColor: current.border,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { color: current.text }]}>{label}</Text>
    </View>
  );
});

Badge.displayName = 'Badge';

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
