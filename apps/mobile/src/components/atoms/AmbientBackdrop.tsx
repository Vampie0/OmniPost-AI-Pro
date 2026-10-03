import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface AmbientBackdropProps {
  /** Palette glow colour — hex, alpha is appended per layer. */
  glowColor: string;
  /** Palette secondary colour, so the wash has two hues rather than one flat tint. */
  secondaryColor: string;
  isDark: boolean;
}

/**
 * Drifting colour wash behind every screen.
 *
 * Two oversized gradient sheets move on opposite paths, which reads as depth
 * without a blur filter — `filter: blur()` on a full-screen layer re-rasterises
 * continuously and is exactly what makes this kind of effect jank on low-end
 * Android, so the softness comes from the gradient stops instead.
 */
export const AmbientBackdrop: React.FC<AmbientBackdropProps> = ({
  glowColor,
  secondaryColor,
  isDark,
}) => {
  const drift = useSharedValue(0);

  useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, { duration: 16000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const sheetA = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(drift.value, [0, 1], [-width * 0.18, width * 0.18]) },
      { translateY: interpolate(drift.value, [0, 1], [0, -height * 0.06]) },
      { scale: 1 + 0.1 * drift.value },
    ],
  }));

  const sheetB = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(drift.value, [0, 1], [width * 0.16, -width * 0.16]) },
      { translateY: interpolate(drift.value, [0, 1], [-height * 0.04, height * 0.05]) },
      { scale: 1.08 - 0.08 * drift.value },
    ],
  }));

  const glowAlpha = isDark ? '2E' : '18';
  const secondaryAlpha = isDark ? '22' : '12';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, sheetA]}>
        <LinearGradient
          colors={[`${glowColor}${glowAlpha}`, `${glowColor}00`]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.7, y: 0.65 }}
          style={styles.sheet}
        />
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, sheetB]}>
        <LinearGradient
          colors={[`${secondaryColor}${secondaryAlpha}`, `${secondaryColor}00`]}
          start={{ x: 0.9, y: 0.1 }}
          end={{ x: 0.2, y: 0.8 }}
          style={styles.sheet}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  sheet: {
    width: width * 1.5,
    height: height * 0.9,
    position: 'absolute',
    top: -height * 0.2,
    left: -width * 0.25,
  },
});
