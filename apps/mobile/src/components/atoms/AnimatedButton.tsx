import React, { memo } from 'react';
import { StyleSheet, Text, ViewStyle, TextStyle, View } from 'react-native';
import { Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { LuminousOrbLoader } from './LuminousOrbLoader';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = memo(({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const lastPressRef = React.useRef(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.97, { damping: 15, stiffness: 350 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 350 });
  };

  const sizeStyles: Record<'sm' | 'md' | 'lg', ViewStyle> = {
    sm: { height: 40, paddingHorizontal: 16, borderRadius: 12 },
    md: { height: 50, paddingHorizontal: 22, borderRadius: 16 },
    lg: { height: 56, paddingHorizontal: 26, borderRadius: 18 },
  };

  const fontSizeStyles: Record<'sm' | 'md' | 'lg', TextStyle> = {
    sm: { fontSize: 13, fontWeight: '700' },
    md: { fontSize: 15, fontWeight: '700' },
    lg: { fontSize: 16, fontWeight: '800' },
  };

  const isGradient = variant === 'primary' || variant === 'secondary';
  const gradientColors =
    variant === 'secondary'
      ? theme.colors.secondaryGradient
      : theme.colors.primaryGradient;

  const textColor =
    variant === 'outline' || variant === 'ghost'
      ? theme.colors.textPrimary
      : theme.colors.btnTextColor;

  const loaderSize = size === 'sm' ? 16 : size === 'md' ? 20 : 22;

  return (
    <AnimatedPressable
      onPress={() => {
        const now = Date.now();
        if (now - lastPressRef.current < 600 || disabled || loading) return;
        lastPressRef.current = now;
        onPress();
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        animatedStyle,
        styles.base,
        sizeStyles[size],
        variant === 'outline' && {
          borderColor: theme.colors.border,
          borderWidth: 1.2,
          backgroundColor: theme.colors.surface,
        },
        disabled && styles.disabled,
        isGradient && !disabled && {
          shadowColor: theme.colors.glowColor,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
          elevation: 8,
        },
        style,
      ]}
    >
      {isGradient && !disabled ? (
        <>
          <LinearGradient
            colors={[...gradientColors]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, { borderRadius: sizeStyles[size].borderRadius }]}
          />
          <View style={styles.glossHighlight} />
        </>
      ) : null}

      {loading ? (
        <View style={styles.loadingRow}>
          <LuminousOrbLoader size={loaderSize} />
          {loadingText ? (
            <Text
              style={[
                styles.text,
                fontSizeStyles[size],
                { color: textColor, fontWeight: '800', marginLeft: 10 },
                textStyle,
              ]}
            >
              {loadingText}
            </Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.contentRow}>
          {icon ? <View style={styles.iconWrapper}>{icon}</View> : null}
          <Text
            style={[
              styles.text,
              fontSizeStyles[size],
              { color: textColor, fontWeight: '900' },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
});

AnimatedButton.displayName = 'AnimatedButton';

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    marginRight: 8,
  },
  text: {
    letterSpacing: 0.3,
  },
  glossHighlight: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1.2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  disabled: {
    opacity: 0.5,
    backgroundColor: 'rgba(100, 116, 139, 0.25)',
  },
});
