import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, ViewToken, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafePress } from '@/hooks/useSafePress';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuthStore } from '@/store/useAuthStore';
import { useConfigStore } from '@/store/useConfigStore';
import { APP_BRANDING } from '@/constants';
import { ScreenWrapper } from '@/components/templates/ScreenWrapper';
import { AnimatedButton, GlassCard } from '@/components/atoms';
import { Sparkles, Calendar, TrendingUp, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface Slide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  icon: (color: string) => React.ReactNode;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    badge: 'AUTONOMOUS CREATION',
    title: 'AI Content Engine',
    subtitle: 'Generate high-converting captions, viral hooks, and multi-platform thread ideas in seconds with Gemini AI.',
    icon: (color) => <Sparkles size={38} color={color} />,
  },
  {
    id: '2',
    badge: 'CROSS-PLATFORM QUEUE',
    title: 'Smart Scheduling',
    subtitle: 'Plan, organize, and automate posts for Instagram, Twitter, LinkedIn, and TikTok from one single command center.',
    icon: (color) => <Calendar size={38} color={color} />,
  },
  {
    id: '3',
    badge: 'VIRAL PREDICTIVE DATA',
    title: 'Growth Analytics',
    subtitle: 'Track engagement scores, consistency metrics, and optimize your social media reach with real-time insights.',
    icon: (color) => <TrendingUp size={38} color={color} />,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { safePress } = useSafePress();
  const { theme } = useTheme();
  const setOnboardingCompleted = useAuthStore((state) => state.setOnboardingCompleted);
  const appConfig = useConfigStore((state) => state.config);
  const appName = appConfig?.app_name || APP_BRANDING.appName;

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0]?.index !== undefined && viewableItems[0]?.index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const handleFinish = async () => {
    await setOnboardingCompleted();
    router.replace('/(auth)/login');
  };

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      await handleFinish();
    }
  };

  return (
    <ScreenWrapper withBottomInset={false}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <LinearGradient
            colors={[...theme.colors.primaryGradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoDot}
          >
            <Sparkles size={14} color={theme.colors.btnTextColor} />
          </LinearGradient>
          <Text style={[styles.brandTitle, { color: theme.colors.textPrimary }]}>{appName}</Text>
        </View>

        <TouchableOpacity onPress={() => safePress(handleFinish)} style={styles.skipBtn}>
          <Text style={[styles.skipText, { color: theme.colors.textMuted }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slide Carousel */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View style={[styles.slideContainer, { width }]}>
            <GlassCard elevated style={styles.slideCard}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: theme.colors.badgeBg,
                    shadowColor: theme.colors.glowColor,
                  },
                ]}
              >
                {item.icon(theme.colors.primary)}
              </View>

              <View
                style={[
                  styles.badgePill,
                  {
                    backgroundColor: theme.colors.badgeBg,
                    borderColor: theme.colors.badgeBorder,
                  },
                ]}
              >
                <Zap size={12} color={theme.colors.badgeText} />
                <Text style={[styles.badgeText, { color: theme.colors.badgeText }]}>{item.badge}</Text>
              </View>

              <Text style={[styles.slideTitle, { color: theme.colors.textPrimary }]}>{item.title}</Text>
              <Text style={[styles.slideSubtitle, { color: theme.colors.textSecondary }]}>{item.subtitle}</Text>
            </GlassCard>
          </View>
        )}
      />

      {/* Footer Controls */}
      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    currentIndex === index ? theme.colors.primary : theme.colors.surfaceSubtle,
                  width: currentIndex === index ? 26 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* Clean Action Button without Arrow */}
        <AnimatedButton
          title={currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
          onPress={() => safePress(handleNext)}
          size="lg"
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoDot: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  slideContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  slideCard: {
    alignItems: 'center',
    paddingVertical: 44,
    paddingHorizontal: 24,
    borderRadius: 28,
  },
  iconBox: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4.5,
    borderRadius: 999,
    borderWidth: 1,
    gap: 5,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.4,
  },
  slideSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    gap: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
