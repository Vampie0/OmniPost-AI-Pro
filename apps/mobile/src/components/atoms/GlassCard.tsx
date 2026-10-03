import React, { memo } from 'react';
import { StyleSheet, ViewStyle, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import * as Haptics from 'expo-haptics';

interface GlassCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  elevated?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const GlassCard: React.FC<GlassCardProps> = memo(({
  children,
  onPress,
  style,
  elevated = false,
}) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, { damping: 15 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, { damping: 15 });
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.isDark ? theme.colors.cardGlass : 'transparent',
          borderColor: theme.colors.cardGlassBorder,
        },
        elevated && styles.shadow,
        animatedStyle,
        style,
      ]}
    >
      {children}
    </AnimatedPressable>
  );
});

GlassCard.displayName = 'GlassCard';

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  shadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
});
