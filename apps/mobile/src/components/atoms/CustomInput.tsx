import React, { memo, useState, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { Eye, EyeOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface CustomInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
}

export const CustomInput: React.FC<CustomInputProps> = memo(({
  label,
  error,
  leftIcon,
  isPassword = false,
  containerStyle,
  style,
  ...props
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const laserProgress = useSharedValue(0);

  useEffect(() => {
    laserProgress.value = withTiming(isFocused ? 1 : 0, { duration: 240 });
  }, [isFocused]);

  const togglePassword = () => {
    setShowPassword((p) => !p);
  };

  const animatedLaser = useAnimatedStyle(() => ({
    transform: [{ scaleX: laserProgress.value }],
    opacity: laserProgress.value,
  }));

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text
          style={[
            styles.label,
            { color: isFocused ? theme.colors.primary : theme.colors.textSecondary },
          ]}
        >
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.colors.inputBg,
            borderColor: error
              ? '#F43F5E'
              : isFocused
              ? theme.colors.borderActive
              : theme.colors.border,
          },
        ]}
      >
        {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}

        <TextInput
          placeholderTextColor={theme.colors.textMuted}
          style={[styles.input, { color: theme.colors.textPrimary }, style]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />

        {isPassword ? (
          <TouchableOpacity
            onPress={togglePassword}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.eyeBtn}
          >
            {showPassword ? (
              <EyeOff size={19} color={theme.colors.primary} />
            ) : (
              <Eye size={19} color={theme.colors.textMuted} />
            )}
          </TouchableOpacity>
        ) : null}

        {/* Dynamic Laser Line from Active Theme */}
        <Animated.View style={[styles.laserLine, animatedLaser]}>
          <LinearGradient
            colors={[...theme.colors.laserGlow]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
});

CustomInput.displayName = 'CustomInput';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 7,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.2,
    height: 54,
    paddingHorizontal: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
    fontWeight: '500',
  },
  iconLeft: {
    marginRight: 12,
  },
  eyeBtn: {
    padding: 6,
    marginLeft: 6,
  },
  laserLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
  },
  errorText: {
    color: '#F43F5E',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
});
