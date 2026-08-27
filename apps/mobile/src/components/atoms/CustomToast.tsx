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

  const getBorderColor = () => {
    switch (toastData?.type) {
      case 'success':
        return 'rgba(0, 245, 160, 0.55)';
      case 'error':
        return 'rgba(244, 63, 94, 0.65)';
      default:
        return 'rgba(56, 189, 248, 0.5)';
    }
  };

  const getIcon = () => {
    switch (toastData?.type) {
      case 'success':
        return <CheckCircle2 size={19} color="#00F5A0" />;
      case 'error':
        return <AlertCircle size={19} color="#F43F5E" />;
      default:
        return <Info size={20} color="#38BDF8" />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toastData && (
        <Animated.View
          style={[
            styles.toastContainer,
            { borderColor: getBorderColor() },
            animatedStyle,
          ]}
        >
          <View style={styles.iconWrapper}>{getIcon()}</View>

          <View style={styles.textContainer}>
            <Text numberOfLines={1} style={styles.title}>{toastData.title}</Text>
            {toastData.message ? (
              <Text numberOfLines={2} style={styles.message}>{toastData.message}</Text>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={hideToast}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.closeButton}
          >
            <X size={16} color="rgba(148, 163, 184, 0.7)" />
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
    backgroundColor: '#0C0E17',
    borderRadius: 18,
    borderWidth: 1.2,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 16,
    zIndex: 999999,
  },
  iconWrapper: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  message: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  closeButton: {
    padding: 4,
  },
});
