import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CosmicSocialLoader } from '@/components/atoms/CosmicSocialLoader';
import { LinearGradient } from 'expo-linear-gradient';
import { APP_BRANDING } from '@/constants';
import { useConfigStore } from '@/store/useConfigStore';
import { useTheme } from '@/theme/ThemeProvider';
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
  const { theme } = useTheme();

  const appName = appConfig?.app_name || APP_BRANDING.appName;
  const tagline = APP_BRANDING.tagline;

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 520 }, (finished) => {
        if (finished) {
          runOnJS(onFinish)();
        }
      });
    }, 3600);

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
        { backgroundColor: theme.colors.background },
        animatedContainer,
      ]}
    >
      {/* Top Ambient Mesh Glow — tinted by the active palette */}
      <View style={styles.topGlow} pointerEvents="none">
        <LinearGradient
          colors={[`${theme.colors.glowColor}26`, 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* 100% Dead-Center 3D Celestial Galaxy */}
      <View style={styles.centerContent}>
        <CosmicSocialLoader />

        <View style={styles.textGroup}>
          <View style={styles.brandTitleRow}>
            <Text style={[styles.brandTitle, { color: theme.colors.textPrimary }]}>{appName}</Text>
            <View
              style={[
                styles.enterpriseBadge,
                {
                  backgroundColor: theme.colors.badgeBg,
                  borderColor: theme.colors.badgeBorder,
                },
              ]}
            >
              <Text style={[styles.enterpriseText, { color: theme.colors.badgeText }]}>
                ENTERPRISE
              </Text>
            </View>
          </View>
          <Text style={[styles.brandTagline, { color: theme.colors.textSecondary }]}>
            {tagline}
          </Text>
        </View>
      </View>

      {/* Bottom Status Tag */}
      <View style={[styles.bottomStatus, { paddingBottom: insets.bottom + 24 }]}>
        <View
          style={[
            styles.statusPill,
            { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={[styles.pulseDot, { backgroundColor: theme.colors.primary }]} />
          <Text style={[styles.statusText, { color: theme.colors.textPrimary }]}>
            INITIALIZING CELESTIAL ENGINE...
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 999999,
    width,
    height,
    alignItems: 'center',
    justifyContent: 'center',
    // The orrery is tall enough that a centred column pushes the wordmark into
    // the absolutely-positioned status pill without this clearance.
    paddingBottom: 150,
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
    marginTop: 6,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  enterpriseBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  enterpriseText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  brandTagline: {
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
    gap: 7,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
