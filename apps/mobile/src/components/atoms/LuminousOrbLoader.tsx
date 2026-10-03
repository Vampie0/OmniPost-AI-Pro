import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeProvider';

interface LuminousOrbLoaderProps {
  size?: number;
}

export const LuminousOrbLoader: React.FC<LuminousOrbLoaderProps> = ({ size = 24 }) => {
  const { theme } = useTheme();

  const spin = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(
      withTiming(360, { duration: 1600, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  // Scale + Opacity layers simulating web CSS blur()
  // Perf: 3 layers instead of 4 — the removed 1.15-scale layer sat visually
  // between the 1.35 and 1.0 falloff steps and is imperceptible without it.
  const layer1Style = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ rotate: `${spin.value}deg` }, { scale: 1.6 }],
      opacity: 0.35,
    };
  });

  const layer2Style = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ rotate: `${spin.value}deg` }, { scale: 1.35 }],
      opacity: 0.55,
    };
  });

  const layer3Style = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ rotate: `${spin.value}deg` }, { scale: 1.0 }],
      opacity: 1.0,
    };
  });

  const gradientColors = [
    theme.colors.primary,
    theme.colors.secondaryGradient[0],
    theme.colors.accentGradient[0],
  ] as const;

  const coreSize = size * 0.65;

  return (
    <View style={[styles.container, { width: size * 1.8, height: size * 1.8 }]}>
      {/* Layer 1: Blur ~50px equivalent (scale 1.6, opacity 0.35) */}
      <Animated.View
        style={[
          styles.glowLayer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          layer1Style,
        ]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
        />
      </Animated.View>

      {/* Layer 2: Blur ~25px equivalent (scale 1.35, opacity 0.55) */}
      <Animated.View
        style={[
          styles.glowLayer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          layer2Style,
        ]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
        />
      </Animated.View>

      {/* Layer 3: Core disc (scale 1.0, opacity 1.0) */}
      <Animated.View
        style={[
          styles.glowLayer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          layer3Style,
        ]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
        />
      </Animated.View>

      {/* Center Pure White Disc */}
      <View
        style={[
          styles.centerWhiteDisc,
          {
            width: coreSize,
            height: coreSize,
            borderRadius: coreSize / 2,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowLayer: {
    position: 'absolute',
  },
  centerWhiteDisc: {
    backgroundColor: '#FFFFFF',
    position: 'relative',
    zIndex: 10,
  },
});
