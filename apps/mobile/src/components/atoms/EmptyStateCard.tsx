import React, { useEffect } from 'react';
import { StyleSheet, Text, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { GlassCard } from './GlassCard';
import { useTheme } from '@/theme/ThemeProvider';

interface EmptyStateCardProps {
  icon: React.ComponentType<any>;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  /** 'card' wraps in GlassCard; 'plain' keeps the bare centred layout some screens use. */
  variant?: 'card' | 'plain';
  style?: ViewStyle;
}

/**
 * Shared empty state.
 *
 * Previously each screen's empty state popped into existence with no motion at
 * all, which made an empty list feel more broken than a loading one. The card
 * fades and rises in, then the icon breathes slowly so the panel reads as alive
 * rather than as a dead layout.
 */
export const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  icon: Icon,
  title,
  subtitle,
  action,
  variant = 'card',
  style,
}) => {
  const { theme } = useTheme();
  const enter = useSharedValue(0);
  const breathe = useSharedValue(0);

  useEffect(() => {
    enter.value = withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) });
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: (1 - enter.value) * 12 }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -4 * breathe.value }, { scale: withSpringOffset(breathe.value) }],
  }));

  const body = (
    <>
      <Animated.View style={[styles.iconWrap, iconStyle]}>
        <Icon size={36} color={theme.colors.textMuted} />
      </Animated.View>
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
      ) : null}
      {action}
    </>
  );

  if (variant === 'plain') {
    return (
      <Animated.View style={[styles.plain, cardStyle, style]}>{body}</Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.cardOuter, cardStyle, style]}>
      <GlassCard style={styles.card}>{body}</GlassCard>
    </Animated.View>
  );
};

/** Keeps the icon pop subtle — a 6% scale at the top of each breath. */
function withSpringOffset(t: number) {
  'worklet';
  return 1 + 0.06 * t;
}

const styles = StyleSheet.create({
  cardOuter: { width: '100%' },
  card: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 22 },
  plain: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 22 },
  iconWrap: { marginBottom: 12 },
  title: { fontSize: 15, fontWeight: '800', textAlign: 'center', letterSpacing: -0.2 },
  subtitle: {
    fontSize: 12.5,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 300,
  },
});
