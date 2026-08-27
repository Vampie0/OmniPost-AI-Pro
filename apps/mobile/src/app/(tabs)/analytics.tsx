import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuthStore } from '@/store/useAuthStore';
import { ScreenWrapper } from '@/components/templates/ScreenWrapper';
import { GlassCard, Badge } from '@/components/atoms';
import {
  TrendingUp,
  Sparkles,
  Zap,
  Award,
  BarChart3,
  Instagram,
  Twitter,
  Linkedin,
  Video,
  ArrowUpRight,
  Clock,
  Share2,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const PLATFORM_METRICS = [
  {
    id: 'instagram',
    name: 'Instagram Business',
    reach: '78.4K',
    growth: '+24%',
    share: 55,
    icon: (c: string) => <Instagram size={18} color={c} />,
  },
  {
    id: 'twitter',
    name: 'Twitter / X Feed',
    reach: '42.1K',
    growth: '+18%',
    share: 30,
    icon: (c: string) => <Twitter size={16} color={c} />,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Creator',
    reach: '22.3K',
    growth: '+12%',
    share: 15,
    icon: (c: string) => <Linkedin size={16} color={c} />,
  },
];

export default function AnalyticsScreen() {
  const { theme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  return (
    <ScreenWrapper scrollable contentContainerStyle={styles.container}>
      {/* 1. Header & Time Filter Range */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Performance Insights</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Real-time viral reach, cadence & distribution metrics
          </Text>
        </View>

        {/* Time Range Selector Capsule */}
        <View style={[styles.timeCapsule, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {(['7d', '30d', '90d'] as const).map((range) => {
            const isSelected = timeRange === range;
            return (
              <TouchableOpacity
                key={range}
                onPress={() => setTimeRange(range)}
                style={[
                  styles.timeCapsuleBtn,
                  isSelected && { backgroundColor: theme.colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.timeCapsuleText,
                    { color: isSelected ? theme.colors.btnTextColor : theme.colors.textSecondary },
                  ]}
                >
                  {range.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 2. Hero Viral Score Bento Card */}
      <GlassCard elevated style={styles.heroScoreCard}>
        <View style={styles.heroTop}>
          <View style={styles.heroBadgeGroup}>
            <View style={[styles.heroIconBox, { backgroundColor: theme.colors.badgeBg }]}>
              <Award size={22} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={[styles.heroCardTitle, { color: theme.colors.textPrimary }]}>
                Viral Probability Score
              </Text>
              <Text style={[styles.heroCardSub, { color: theme.colors.textSecondary }]}>
                Algorithm Distribution Health
              </Text>
            </View>
          </View>
          <Badge label="OPTIMAL" variant="primary" />
        </View>

        <View style={styles.scoreRow}>
          <Text style={[styles.scoreValue, { color: theme.colors.textPrimary }]}>94.8%</Text>
          <View style={[styles.growthPill, { backgroundColor: 'rgba(0, 245, 160, 0.12)', borderColor: 'rgba(0, 245, 160, 0.3)' }]}>
            <ArrowUpRight size={14} color="#00F5A0" />
            <Text style={styles.growthPillText}>+18.4% vs last period</Text>
          </View>
        </View>

        <Text style={[styles.heroExplainer, { color: theme.colors.textMuted }]}>
          Based on consistent posting cadence, multi-format hooks, and peak engagement scheduling slots.
        </Text>
      </GlassCard>

      {/* 3. Asymmetric 3-Tile Performance Bento */}
      <View style={styles.bentoRow}>
        {/* Tile 1: Total Reach (Wide Left) */}
        <GlassCard elevated style={styles.bentoTileLarge}>
          <View style={[styles.bentoIconBox, { backgroundColor: theme.colors.badgeBg }]}>
            <TrendingUp size={16} color={theme.colors.primary} />
          </View>
          <Text style={[styles.bentoValue, { color: theme.colors.textPrimary }]}>142.8K</Text>
          <Text style={[styles.bentoLabel, { color: theme.colors.textSecondary }]}>Audience Reach</Text>
          <Text style={[styles.bentoSubLabel, { color: theme.colors.primary }]}>+32% Organic</Text>
        </GlassCard>

        {/* Tile 2 & 3: Hours Saved & Active Cadence (Right Stack) */}
        <View style={styles.bentoStackRight}>
          <GlassCard style={styles.bentoTileSmall}>
            <View style={styles.smallTileHeader}>
              <View style={[styles.bentoMiniIcon, { backgroundColor: theme.colors.badgeBg }]}>
                <Clock size={13} color={theme.colors.primary} />
              </View>
              <Text style={[styles.bentoSmallValue, { color: theme.colors.textPrimary }]}>38.5 hrs</Text>
            </View>
            <Text style={[styles.bentoSmallLabel, { color: theme.colors.textSecondary }]}>Time Saved by AI</Text>
          </GlassCard>

          <GlassCard style={styles.bentoTileSmall}>
            <View style={styles.smallTileHeader}>
              <View style={[styles.bentoMiniIcon, { backgroundColor: theme.colors.badgeBg }]}>
                <Zap size={13} color={theme.colors.primary} />
              </View>
              <Text style={[styles.bentoSmallValue, { color: theme.colors.textPrimary }]}>4.8 / wk</Text>
            </View>
            <Text style={[styles.bentoSmallLabel, { color: theme.colors.textSecondary }]}>Posting Cadence</Text>
          </GlassCard>
        </View>
      </View>

      {/* 4. Platform Performance Matrix */}
      <GlassCard elevated style={styles.platformsCard}>
        <View style={styles.platformCardHeader}>
          <View style={styles.platformHeaderLeft}>
            <BarChart3 size={17} color={theme.colors.primary} />
            <Text style={[styles.cardHeading, { color: theme.colors.textPrimary }]}>
              Channel Distribution & Reach
            </Text>
          </View>
          <Badge label="3 Active" variant="neutral" />
        </View>

        <View style={styles.platformsList}>
          {PLATFORM_METRICS.map((plat) => (
            <View key={plat.id} style={styles.platformRowItem}>
              <View style={styles.platformInfoTop}>
                <View style={styles.platformBrandGroup}>
                  <View style={[styles.platformIconCircle, { backgroundColor: theme.colors.surfaceSubtle }]}>
                    {plat.icon(theme.colors.primary)}
                  </View>
                  <View>
                    <Text style={[styles.platformName, { color: theme.colors.textPrimary }]}>
                      {plat.name}
                    </Text>
                    <Text style={[styles.platformReach, { color: theme.colors.textMuted }]}>
                      {plat.reach} impressions
                    </Text>
                  </View>
                </View>

                <View style={styles.platformStatsRight}>
                  <Text style={[styles.platformShare, { color: theme.colors.textPrimary }]}>
                    {plat.share}%
                  </Text>
                  <Text style={styles.platformGrowthText}>{plat.growth}</Text>
                </View>
              </View>

              {/* Dynamic Gradient Distribution Bar */}
              <View style={[styles.barTrack, { backgroundColor: theme.colors.surfaceSubtle }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      backgroundColor: theme.colors.primary,
                      width: `${plat.share}%`,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </GlassCard>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  headerLeft: {
    flex: 1,
    gap: 2,
    paddingRight: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12.5,
  },
  timeCapsule: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    gap: 2,
  },
  timeCapsuleBtn: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9,
  },
  timeCapsuleText: {
    fontSize: 11,
    fontWeight: '800',
  },
  heroScoreCard: {
    padding: 20,
    borderRadius: 24,
    gap: 10,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroIconBox: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  heroCardSub: {
    fontSize: 11.5,
    marginTop: 1,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
    marginTop: 2,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  growthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  growthPillText: {
    color: '#00F5A0',
    fontSize: 11,
    fontWeight: '800',
  },
  heroExplainer: {
    fontSize: 12,
    lineHeight: 17,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  bentoTileLarge: {
    flex: 1,
    padding: 16,
    borderRadius: 22,
    gap: 4,
    justifyContent: 'center',
  },
  bentoIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  bentoValue: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  bentoLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  bentoSubLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  bentoStackRight: {
    flex: 1,
    gap: 10,
  },
  bentoTileSmall: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    gap: 4,
    justifyContent: 'center',
  },
  smallTileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bentoMiniIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoSmallValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  bentoSmallLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  platformsCard: {
    padding: 18,
    borderRadius: 24,
    gap: 14,
  },
  platformCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  platformHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardHeading: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  platformsList: {
    gap: 14,
  },
  platformRowItem: {
    gap: 6,
  },
  platformInfoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  platformBrandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  platformIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformName: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  platformReach: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  platformStatsRight: {
    alignItems: 'flex-end',
  },
  platformShare: {
    fontSize: 13,
    fontWeight: '800',
  },
  platformGrowthText: {
    color: '#00F5A0',
    fontSize: 10.5,
    fontWeight: '800',
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
});
