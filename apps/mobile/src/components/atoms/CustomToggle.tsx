import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/ThemeProvider';
import { withAlpha } from '@/theme/statusColors';

interface CustomToggleProps {
  value: boolean;
  onValueChange: (newValue: boolean) => void;
  disabled?: boolean;
}

export const CustomToggle: React.FC<CustomToggleProps> = ({
  value,
  onValueChange,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const translateX = useSharedValue(value ? 22 : 2);

  useEffect(() => {
    translateX.value = withSpring(value ? 22 : 2, {
      damping: 18,
      stiffness: 300,
      mass: 0.8,
    });
  }, [value]);

  const animatedThumb = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onValueChange(!value);
      }}
      style={[
        styles.track,
        {
          backgroundColor: value ? 'transparent' : theme.colors.surfaceSubtle,
          borderColor: value ? theme.colors.primary : theme.colors.border,
        },
      ]}
    >
      {/* Active Gradient Fill */}
      {value && (
        <LinearGradient
          colors={[...theme.colors.primaryGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* 60fps Sliding Thumb Disc */}
      <Animated.View
        style={[
          styles.thumb,
          {
            backgroundColor: value ? theme.colors.btnTextColor : theme.colors.textMuted,
          },
          animatedThumb,
        ]}
      >
        {/* Contrasts the thumb in both modes — white-on-white in stealth light. */}
        <View
          style={[styles.thumbCenterDot, { backgroundColor: withAlpha(theme.colors.background, 0.35) }]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  track: {
    width: 50,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.2,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  thumbCenterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
