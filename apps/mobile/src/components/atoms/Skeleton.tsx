import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle, DimensionValue } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeProvider';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Shimmer placeholder. A sweeping highlight reads as "content is arriving",
 * whereas a spinner reads as "nothing is happening yet" — and it lets the layout
 * hold its final shape so nothing jumps when the data lands.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 10,
  style,
}) => {
  const { theme } = useTheme();
  const sweep = useSharedValue(0);

  useEffect(() => {
    sweep.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
      -1,
      false
    );
  }, []);

  const shimmer = useAnimatedStyle(() => ({
    transform: [{ translateX: -160 + sweep.value * 460 }],
  }));

  return (
    <View
      style={[
        styles.base,
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.surfaceSubtle,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, styles.clip, shimmer]}>
        <LinearGradient
          colors={['transparent', `${theme.colors.textPrimary}14`, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.band}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  clip: {
    overflow: 'hidden',
  },
  band: {
    width: 160,
    height: '100%',
  },
});
