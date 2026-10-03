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
      // Status accents are pulled from the palette's own gradient stops so they
      // re-tint with the palette and mode instead of being pinned to one scheme.
      case 'secondary': {
        const c = theme.colors.secondaryGradient[0];
        return { bg: `${c}1F`, border: `${c}4D`, text: c };
      }
      case 'accent': {
        const c = theme.colors.accentGradient[0];
        return { bg: `${c}1F`, border: `${c}4D`, text: c };
      }
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
