import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, Dimensions, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/ThemeProvider';

const { width } = Dimensions.get('window');

type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  title: string;
  message?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [toastData, setToastData] = useState<ToastOptions | null>(null);

  const translateY = useSharedValue(-130);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    translateY.value = withTiming(-130, { duration: 180 }, () => {
      runOnJS(setToastData)(null);
    });
    opacity.value = withTiming(0, { duration: 160 });
  }, [translateY, opacity]);

  const showToast = useCallback(
    ({ title, message, type = 'info', duration = 3200 }: ToastOptions) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      setToastData({ title, message, type });

      const haptic =
        type === 'success'
          ? Haptics.NotificationFeedbackType.Success
          : type === 'error'
            ? Haptics.NotificationFeedbackType.Error
            : Haptics.NotificationFeedbackType.Warning;
      Haptics.notificationAsync(haptic).catch(() => {});

      // Controlled Sweet-Spot Micro-Bounce Physics (3-5px soft rebound)
      opacity.value = withTiming(1, { duration: 150 });
      translateY.value = withSpring(insets.top + 8, {
        damping: 18,
        stiffness: 260,
        mass: 0.9,
      });

      // Subtle elastic pop
      scale.value = withSequence(
        withTiming(0.96, { duration: 80 }),
        withSpring(1, { damping: 15, stiffness: 280 })
      );

      timerRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    },
    [insets.top, translateY, opacity, scale, hideToast]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  /**
   * Status accents come from the active palette rather than fixed hexes, so a toast
   * reads correctly in all five palettes and in both light and dark.
   */
  const accent =
    toastData?.type === 'success'
      ? theme.colors.secondaryGradient[0]
      : toastData?.type === 'error'
        ? theme.colors.accentGradient[0]
        : theme.colors.primary;

  const StatusIcon =
    toastData?.type === 'success' ? CheckCircle2 : toastData?.type === 'error' ? AlertCircle : Info;

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toastData && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              borderColor: `${accent}8C`,
              backgroundColor: theme.colors.surface,
              shadowColor: theme.colors.background,
            },
            animatedStyle,
          ]}
        >
          <View style={[styles.iconWrapper, { backgroundColor: `${accent}1F` }]}>
            <StatusIcon size={19} color={accent} />
          </View>

          <View style={styles.textContainer}>
            <Text numberOfLines={1} style={[styles.title, { color: theme.colors.textPrimary }]}>
              {toastData.title}
            </Text>
            {toastData.message ? (
              <Text numberOfLines={2} style={[styles.message, { color: theme.colors.textSecondary }]}>
                {toastData.message}
              </Text>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={hideToast}
            activeOpacity={0.5}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.closeButton}
          >
            <X size={16} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    width: width - 36,
    borderRadius: 18,
    borderWidth: 1.2,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 16,
    zIndex: 999999,
  },
  iconWrapper: {
    marginRight: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  closeButton: {
    padding: 4,
  },
});
