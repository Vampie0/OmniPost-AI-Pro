import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafePress } from '@/hooks/useSafePress';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuthStore } from '@/store/useAuthStore';
import { ScreenWrapper } from '@/components/templates/ScreenWrapper';
import { GlassCard, AnimatedButton, Badge } from '@/components/atoms';
import {
  User,
  Zap,
  Crown,
  ChevronRight,
  Edit3,
  Sparkles,
  ShieldCheck,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const router = useRouter();
  const { safePress } = useSafePress();
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const isNavigatingRef = React.useRef(false);

  const navigateSafe = (route: string) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    router.push(route as any);
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 600);
  };

  return (
    <ScreenWrapper scrollable contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Creator Profile</Text>
      </View>

      {/* 1. Creator Identity Card */}
      <GlassCard elevated style={styles.profileCard}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.badgeBg }]}>
          <User size={36} color={theme.colors.primary} />
        </View>
        <Text style={[styles.userName, { color: theme.colors.textPrimary }]}>
          {user?.full_name || 'Alex Rivera'}
        </Text>
        <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
          {user?.email || 'alex@company.com'}
        </Text>

        <View style={styles.tierBadge}>
          <Badge
            label={user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'admin' ? 'Admin' : 'Pro VIP Plan'}
            variant="primary"
          />
        </View>

        {/* Edit Profile Action */}
        <TouchableOpacity
          onPress={() => navigateSafe('/edit-profile')}
          style={[styles.editProfileBtn, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
        >
          <Edit3 size={14} color={theme.colors.primary} />
          <Text style={[styles.editProfileText, { color: theme.colors.textPrimary }]}>
            Edit Profile & Avatar
          </Text>
        </TouchableOpacity>
      </GlassCard>

      {/* 2. AI Engine Credits Meter */}
      <GlassCard elevated style={styles.creditsCard}>
        <View style={styles.creditsHeader}>
          <View style={styles.creditsTitleRow}>
            <View style={[styles.zapBox, { backgroundColor: theme.colors.badgeBg }]}>
              <Zap size={16} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={[styles.creditsTitle, { color: theme.colors.textPrimary }]}>AI Generation Credits</Text>
              <Text style={[styles.creditsSub, { color: theme.colors.textMuted }]}>Refills in 12 days</Text>
            </View>
          </View>
          <Text style={[styles.creditsRemaining, { color: theme.colors.primary }]}>
            {user?.credits_remaining ?? 50} / {user?.credits_limit ?? 50}
          </Text>
        </View>

        <View style={[styles.progressBarBg, { backgroundColor: theme.colors.surfaceSubtle }]}>
          <View
            style={[
              styles.progressBarFill,
              {
                backgroundColor: theme.colors.primary,
                width: `${Math.min(100, (((user?.credits_remaining ?? 50) / (user?.credits_limit ?? 50)) * 100))}%`,
              },
            ]}
          />
        </View>
      </GlassCard>

      {/* 3. VIP Studio Upgrade Banner */}
      <TouchableOpacity
        onPress={() => navigateSafe('/paywall')}
        activeOpacity={0.8}
        style={[styles.vipBanner, { borderColor: theme.colors.primary }]}
      >
        <LinearGradient
          colors={[...theme.colors.primaryGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.vipBannerContent}>
          <View style={styles.vipBannerLeft}>
            <Crown size={24} color={theme.colors.btnTextColor} />
            <View>
              <Text style={[styles.vipTitle, { color: theme.colors.btnTextColor }]}>
                Upgrade to VIP Studio
              </Text>
              <Text style={[styles.vipSubtitle, { color: theme.colors.btnTextColor, opacity: 0.85 }]}>
                Unlimited AI copy, 4K Diffusion & VIP speed
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color={theme.colors.btnTextColor} />
        </View>
      </TouchableOpacity>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 16,
  },
  header: {
    marginBottom: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 24,
    borderRadius: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 21,
    fontWeight: '900',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    marginBottom: 10,
  },
  tierBadge: {
    marginTop: 2,
    marginBottom: 16,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  editProfileText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  creditsCard: {
    padding: 18,
    borderRadius: 22,
    gap: 14,
  },
  creditsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creditsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  zapBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditsTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  creditsSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  creditsRemaining: {
    fontSize: 14,
    fontWeight: '900',
  },
  progressBarBg: {
    height: 7,
    borderRadius: 3.5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3.5,
  },
  vipBanner: {
    borderRadius: 22,
    padding: 18,
    overflow: 'hidden',
    borderWidth: 1.2,
  },
  vipBannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vipBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  vipTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  vipSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});
