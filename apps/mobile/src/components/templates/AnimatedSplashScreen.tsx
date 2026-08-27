import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CosmicSocialLoader } from '@/components/atoms/CosmicSocialLoader';
import { LinearGradient } from 'expo-linear-gradient';
import { APP_BRANDING } from '@/constants';
import { useConfigStore } from '@/store/useConfigStore';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface AnimatedSplashScreenProps {
  onFinish: () => void;
}

export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({ onFinish }) => {
  const insets = useSafeAreaInsets();
  const opacity = useSharedValue(1);
  const appConfig = useConfigStore((state) => state.config);

  const appName = appConfig?.app_name || APP_BRANDING.appName;
  const tagline = APP_BRANDING.tagline;

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 450 }, (finished) => {
        if (finished) {
          runOnJS(onFinish)();
        }
      });
    }, 2400);

    return () => clearTimeout(timer);
  }, []);

  const animatedContainer = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: '#07080B' },
        animatedContainer,
      ]}
    >
      {/* Top Subtle Silver Mesh Glow */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.08)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.topGlow}
        pointerEvents="none"
      />

      {/* 100% Dead-Center 3D Celestial Galaxy */}
      <View style={styles.centerContent}>
        <CosmicSocialLoader />

        <View style={styles.textGroup}>
          <Text style={styles.brandTitle}>{appName}</Text>
          <Text style={styles.brandTagline}>{tagline}</Text>
        </View>
      </View>

      {/* Bottom Status Tag */}
      <View style={[styles.bottomStatus, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.statusPill}>
          <View style={styles.pulseDot} />
          <Text style={styles.statusText}>INITIALIZING CELESTIAL ENGINE...</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999999,
    width,
    height,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },
  textGroup: {
    alignItems: 'center',
    marginTop: 22,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandTagline: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
    marginTop: 4,
  },
  bottomStatus: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 5.5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    gap: 7,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
  },
  statusText: {
    color: '#E2E8F0',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
