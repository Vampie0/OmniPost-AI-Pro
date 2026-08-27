import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutChangeEvent, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafePress } from '@/hooks/useSafePress';
import { useTheme } from '@/theme/ThemeProvider';
import { useConfigStore } from '@/store/useConfigStore';
import { useAuthStore } from '@/store/useAuthStore';
import { APP_BRANDING } from '@/constants';
import { ScreenWrapper } from '@/components/templates/ScreenWrapper';
import { AnimatedButton, CustomInput } from '@/components/atoms';
import { useToast } from '@/components/atoms/CustomToast';
import { supabase, isPlaceholderUrl } from '@/services/supabase';
import { Mail, Lock, User, Sparkles, ShieldCheck, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { z } from 'zod';

const { width } = Dimensions.get('window');

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().optional(),
});

export default function AuthScreen() {
  const router = useRouter();
  const { safePress } = useSafePress();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const appConfig = useConfigStore((state) => state.config);
  const setOnboardingCompleted = useAuthStore((state) => state.setOnboardingCompleted);

  const appName = appConfig?.app_name || APP_BRANDING.appName;
  const tagline = APP_BRANDING.tagline;

  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const [tabWidth, setTabWidth] = useState(0);
  const pillTranslateX = useSharedValue(0);

  const onSwitcherLayout = (e: LayoutChangeEvent) => {
    const containerWidth = e.nativeEvent.layout.width;
    const exactInnerHalf = (containerWidth - 8) / 2;
    setTabWidth(exactInnerHalf);
    if (activeTab === 'signup') {
      pillTranslateX.value = exactInnerHalf;
    }
  };

  const switchTab = (tab: 'signin' | 'signup') => {
    setActiveTab(tab);
    setErrors({});
    pillTranslateX.value = withSpring(tab === 'signin' ? 0 : tabWidth, {
      damping: 18,
      stiffness: 300,
    });
  };

  const animatedPill = useAnimatedStyle(() => ({
    transform: [{ translateX: pillTranslateX.value }],
    width: tabWidth > 0 ? tabWidth : '49%',
  }));

  const handleAuth = async () => {
    setErrors({});
    const validation = authSchema.safeParse({ email, password, fullName });

    if (!validation.success) {
      const formatted: { email?: string; password?: string; fullName?: string } = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0] === 'email') formatted.email = err.message;
        if (err.path[0] === 'password') formatted.password = err.message;
        if (err.path[0] === 'fullName') formatted.fullName = err.message;
      });
      setErrors(formatted);
      showToast({ title: 'Input Required', message: 'Please complete all required fields.', type: 'error' });
      return;
    }

    try {
      setIsLoading(true);

      if (isPlaceholderUrl) {
        await new Promise((resolve) => setTimeout(resolve, 350));
        await setOnboardingCompleted();
        showToast({
          title: activeTab === 'signin' ? 'Welcome Back!' : 'Account Created!',
          message: 'Launching studio workspace...',
          type: 'success',
        });
        router.replace('/(tabs)');
        return;
      }

      if (activeTab === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          showToast({ title: 'Sign In Notice', message: error.message, type: 'error' });
        } else {
          showToast({ title: 'Welcome Back!', message: 'Launching workspace...', type: 'success' });
          router.replace('/(tabs)');
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() || 'Creator', role: 'user' },
          },
        });

        if (error) {
          showToast({ title: 'Sign Up Notice', message: error.message, type: 'error' });
        } else if (data.session) {
          showToast({ title: 'Account Initialized!', message: 'Entering studio...', type: 'success' });
          router.replace('/(tabs)');
        } else {
          showToast({ title: 'Verification Required', message: 'Check your email inbox to verify.', type: 'info' });
        }
      }
    } catch {
      showToast({ title: 'Connection Error', message: 'Unable to reach backend server.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenWrapper scrollable contentContainerStyle={styles.scrollContent}>
      <View style={styles.responsiveContainer}>
        {/* Header Hero */}
        <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.header}>
          <View style={styles.emblemContainer}>
            <LinearGradient
              colors={[...theme.colors.primaryGradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.emblem,
                {
                  shadowColor: theme.colors.glowColor,
                },
              ]}
            >
              <Sparkles size={30} color={theme.colors.btnTextColor} />
            </LinearGradient>
          </View>

          {/* Dynamic Feature Chip */}
          <View
            style={[
              styles.featureBadge,
              {
                backgroundColor: theme.colors.badgeBg,
                borderColor: theme.colors.badgeBorder,
              },
            ]}
          >
            <Zap size={13} color={theme.colors.badgeText} />
            <Text style={[styles.featureBadgeText, { color: theme.colors.badgeText }]}>
              {theme.paletteName.toUpperCase()} STUDIO
            </Text>
          </View>

          <Text style={[styles.brandTitle, { color: theme.colors.textPrimary }]}>
            {appName}
          </Text>
          <Text style={[styles.brandSubtitle, { color: theme.colors.textSecondary }]}>
            {tagline}
          </Text>
        </Animated.View>

        {/* Pixel-Perfect Floating Switcher */}
        <Animated.View
          entering={FadeInUp.delay(100).duration(500).springify()}
          style={[
            styles.switcherContainer,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
          onLayout={onSwitcherLayout}
        >
          <Animated.View style={[styles.slidingPill, animatedPill]}>
            <LinearGradient
              colors={[...theme.colors.primaryGradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          <TouchableOpacity
            onPress={() => safePress(() => switchTab('signin'))}
            activeOpacity={0.8}
            style={styles.tabButton}
          >
            <Text
              style={[
                styles.tabText,
                { color: theme.colors.textSecondary },
                activeTab === 'signin' && { color: theme.colors.btnTextColor, fontWeight: '900' },
              ]}
            >
              Sign In
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => safePress(() => switchTab('signup'))}
            activeOpacity={0.8}
            style={styles.tabButton}
          >
            <Text
              style={[
                styles.tabText,
                { color: theme.colors.textSecondary },
                activeTab === 'signup' && { color: theme.colors.btnTextColor, fontWeight: '900' },
              ]}
            >
              Create Account
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Form Content */}
        <Animated.View entering={FadeInUp.delay(180).duration(500).springify()} style={styles.formContainer}>
          {activeTab === 'signup' && (
            <CustomInput
              label="Full Name"
              placeholder="Alex Rivera"
              value={fullName}
              onChangeText={setFullName}
              error={errors.fullName}
              leftIcon={<User size={18} color={theme.colors.primary} />}
            />
          )}

          <CustomInput
            label="Work Email"
            placeholder="alex@company.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            leftIcon={<Mail size={18} color={theme.colors.primary} />}
          />

          <CustomInput
            label="Password"
            placeholder="••••••••••••"
            isPassword
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            leftIcon={<Lock size={18} color={theme.colors.primary} />}
          />

          {activeTab === 'signin' && (
            <TouchableOpacity
              onPress={() => safePress(() => router.push('/(auth)/forgot-password'))}
              style={styles.forgotBtn}
            >
              <Text style={[styles.forgotText, { color: theme.colors.primary }]}>
                Forgot password?
              </Text>
            </TouchableOpacity>
          )}

          {/* Clean Modern Button (No Outdated Arrows) */}
          <AnimatedButton
            title={activeTab === 'signin' ? 'Sign In to Workspace' : 'Create Free Account'}
            onPress={() => safePress(handleAuth)}
            loading={isLoading}
            size="lg"
            style={styles.actionBtn}
          />
        </Animated.View>

        {/* Trust Seal */}
        <Animated.View entering={FadeInUp.delay(260).duration(500)} style={styles.trustFooter}>
          <ShieldCheck size={15} color={theme.colors.primary} />
          <Text style={[styles.trustText, { color: theme.colors.textMuted }]}>
            Secured by PostgreSQL RLS & Realtime Engine
          </Text>
        </Animated.View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Math.min(24, width * 0.06),
    paddingTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  responsiveContainer: {
    width: '100%',
    maxWidth: 440,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  emblemContainer: {
    marginBottom: 12,
  },
  emblem: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4.5,
    gap: 6,
    marginBottom: 8,
  },
  featureBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 3,
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  switcherContainer: {
    flexDirection: 'row',
    borderRadius: 18,
    padding: 4,
    position: 'relative',
    marginBottom: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  slidingPill: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: 14,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabText: {
    fontSize: 13.5,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  formContainer: {
    marginBottom: 10,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 18,
    marginTop: -6,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionBtn: {
    width: '100%',
    marginTop: 4,
  },
  trustFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 20,
  },
  trustText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
