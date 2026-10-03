import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuthStore } from '@/store/useAuthStore';
import { ScreenWrapper } from '@/components/templates/ScreenWrapper';
import { GlassCard, Badge } from '@/components/atoms';
import { supabase, isPlaceholderUrl } from '@/services/supabase';
import {
  TrendingUp,
  Zap,
  Award,
  BarChart3,
  Instagram,
  Twitter,
  Linkedin,
  ArrowUpRight,
  Clock,
} from 'lucide-react-native';



interface LiveMetrics {
  totalPosts: number;
  publishedPosts: number;
  scheduledPosts: number;
  totalAiGenerations: number;
  totalCreditsUsed: number;
  platformCounts: Record<string, number>;
  publicationRate: number;
}

const RANGE_DAYS: Record<'7d' | '30d' | '90d', number> = { '7d': 7, '30d': 30, '90d': 90 };

export default function AnalyticsScreen() {
  const { theme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<LiveMetrics>({
    totalPosts: 0,
    publishedPosts: 0,
    scheduledPosts: 0,
    totalAiGenerations: 0,
    totalCreditsUsed: 0,
    platformCounts: {},
    publicationRate: 0,
  });

  const loadMetrics = useCallback(async () => {
    if (isPlaceholderUrl || !user) return;

    // Selected time range actually scopes every query below
    const sinceIso = new Date(Date.now() - RANGE_DAYS[timeRange] * 86400000).toISOString();
    const sinceDate = sinceIso.slice(0, 10); // analytics.date is a plain DATE column

    try {
      // Fetch user's posts for platform and status stats
      const { data: posts } = await supabase
        .from('posts')
        .select('status, platforms, created_at')
        .eq('user_id', user.id)
        .gte('created_at', sinceIso);

      // Fetch user's analytics for AI generation stats
      const { data: analytics } = await supabase
        .from('analytics')
        .select('total_ai_generations, credits_used, date')
        .eq('user_id', user.id)
        .gte('date', sinceDate)
        .order('date', { ascending: false });

      const postList = posts || [];
      const analyticsList = analytics || [];

      // Count platforms
      const platformCounts: Record<string, number> = {};
      postList.forEach((p) => {
        (p.platforms || []).forEach((plat: string) => {
          platformCounts[plat] = (platformCounts[plat] || 0) + 1;
        });
      });

      const totalAi = analyticsList.reduce((sum, a) => sum + (a.total_ai_generations || 0), 0);
      const totalCredits = analyticsList.reduce((sum, a) => sum + (a.credits_used || 0), 0);
      const published = postList.filter((p) => p.status === 'published').length;
      const scheduled = postList.filter((p) => p.status === 'scheduled').length;
      // Honest metric: share of created posts that actually went live
      const publicationRate = postList.length > 0 ? Math.round((published / postList.length) * 1000) / 10 : 0;

      setMetrics({
        totalPosts: postList.length,
        publishedPosts: published,
        scheduledPosts: scheduled,
        totalAiGenerations: totalAi,
        totalCreditsUsed: totalCredits,
        platformCounts,
        publicationRate,
      });
    } catch {
      // Silently fail - show zeros
    }
  }, [user, timeRange]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMetrics();
    setRefreshing(false);
  };

  // Build live platform metrics from real data — post counts only;
  // reach/impressions need connected platform accounts, so we never invent them
  const totalPlatformPosts = Object.values(metrics.platformCounts).reduce((s, v) => s + v, 0) || 1;
  const livePlatformMetrics = [
    {
      id: 'instagram',
      name: 'Instagram Business',
      reach: `${metrics.platformCounts['instagram'] || 0} posts`,
      growth: '',
      share: Math.round(((metrics.platformCounts['instagram'] || 0) / totalPlatformPosts) * 100),
      icon: (c: string) => <Instagram size={18} color={c} />,
    },
    {
      id: 'twitter',
      name: 'Twitter / X Feed',
      reach: `${metrics.platformCounts['twitter'] || 0} posts`,
      growth: '',
      share: Math.round(((metrics.platformCounts['twitter'] || 0) / totalPlatformPosts) * 100),
      icon: (c: string) => <Twitter size={16} color={c} />,
    },
    {
      id: 'linkedin',
      name: 'LinkedIn Creator',
      reach: `${metrics.platformCounts['linkedin'] || 0} posts`,
      growth: '',
      share: Math.round(((metrics.platformCounts['linkedin'] || 0) / totalPlatformPosts) * 100),
      icon: (c: string) => <Linkedin size={16} color={c} />,
    },
  ];

  return (
    <ScreenWrapper scrollable={false}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
      {/* 1. Header & Time Filter Range */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Performance Insights</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Post cadence & distribution metrics for the selected period
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
                Publication Rate
              </Text>
              <Text style={[styles.heroCardSub, { color: theme.colors.textSecondary }]}>
                Share of created posts that went live
              </Text>
            </View>
          </View>
          <Badge
            label={
              isPlaceholderUrl
                ? 'OPTIMAL'
                : metrics.totalPosts === 0
                  ? 'NO DATA'
                  : metrics.publicationRate >= 80
                    ? 'STRONG'
                    : 'GROWING'
            }
            variant="primary"
          />
        </View>

        <View style={styles.scoreRow}>
          <Text style={[styles.scoreValue, { color: theme.colors.textPrimary }]}>{metrics.publicationRate}%</Text>
          {isPlaceholderUrl ? (
            <View style={[styles.growthPill, { backgroundColor: theme.colors.primary + '1F', borderColor: theme.colors.primary + '4D' }]}>
              <ArrowUpRight size={14} color={theme.colors.primary} />
              <Text style={[styles.growthPillText, { color: theme.colors.primary }]}>+18.4% vs last period</Text>
            </View>
          ) : metrics.totalPosts > 0 ? (
            <View style={[styles.growthPill, { backgroundColor: theme.colors.primary + '1F', borderColor: theme.colors.primary + '4D' }]}>
              <ArrowUpRight size={14} color={theme.colors.primary} />
              <Text style={[styles.growthPillText, { color: theme.colors.primary }]}>{metrics.publishedPosts} of {metrics.totalPosts} published</Text>
            </View>
          ) : null}
        </View>

        <Text style={[styles.heroExplainer, { color: theme.colors.textMuted }]}>
          Published posts divided by posts created in the selected period. Reach and engagement
          metrics require connected platform accounts.
        </Text>
      </GlassCard>

      {/* 3. Asymmetric 3-Tile Performance Bento */}
      <View style={styles.bentoRow}>
        {/* Tile 1: Total Reach (Wide Left) */}
        <GlassCard elevated style={styles.bentoTileLarge}>
          <View style={[styles.bentoIconBox, { backgroundColor: theme.colors.badgeBg }]}>
            <TrendingUp size={16} color={theme.colors.primary} />
          </View>
          <Text style={[styles.bentoValue, { color: theme.colors.textPrimary }]}>{metrics.totalPosts}</Text>
          <Text style={[styles.bentoLabel, { color: theme.colors.textSecondary }]}>Total Posts</Text>
          <Text style={[styles.bentoSubLabel, { color: theme.colors.primary }]}>{metrics.publishedPosts} Published</Text>
        </GlassCard>

        {/* Tile 2 & 3: Hours Saved & Active Cadence (Right Stack) */}
        <View style={styles.bentoStackRight}>
          <GlassCard style={styles.bentoTileSmall}>
            <View style={styles.smallTileHeader}>
              <View style={[styles.bentoMiniIcon, { backgroundColor: theme.colors.badgeBg }]}>
                <Clock size={13} color={theme.colors.primary} />
              </View>
              <Text style={[styles.bentoSmallValue, { color: theme.colors.textPrimary }]}>{metrics.totalAiGenerations}</Text>
            </View>
            <Text style={[styles.bentoSmallLabel, { color: theme.colors.textSecondary }]}>AI Generations</Text>
          </GlassCard>

          <GlassCard style={styles.bentoTileSmall}>
            <View style={styles.smallTileHeader}>
              <View style={[styles.bentoMiniIcon, { backgroundColor: theme.colors.badgeBg }]}>
                <Zap size={13} color={theme.colors.primary} />
              </View>
              <Text style={[styles.bentoSmallValue, { color: theme.colors.textPrimary }]}>{metrics.totalCreditsUsed}</Text>
            </View>
            <Text style={[styles.bentoSmallLabel, { color: theme.colors.textSecondary }]}>Credits Used</Text>
          </GlassCard>
        </View>
      </View>

      {/* 4. Platform Performance Matrix */}
      <GlassCard elevated style={styles.platformsCard}>
        <View style={styles.platformCardHeader}>
          <View style={styles.platformHeaderLeft}>
            <BarChart3 size={17} color={theme.colors.primary} />
            <Text style={[styles.cardHeading, { color: theme.colors.textPrimary }]}>
              Channel Distribution
            </Text>
          </View>
          <Badge label={`${Object.keys(metrics.platformCounts).length} Active`} variant="neutral" />
        </View>

        <View style={styles.platformsList}>
          {livePlatformMetrics.map((plat) => (
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
                      {plat.reach}
                    </Text>
                  </View>
                </View>

                <View style={styles.platformStatsRight}>
                  <Text style={[styles.platformShare, { color: theme.colors.textPrimary }]}>
                    {plat.share}%
                  </Text>
                  {plat.growth ? (
                    <Text style={[styles.platformGrowthText, { color: theme.colors.primary }]}>{plat.growth}</Text>
                  ) : null}
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
      </ScrollView>
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
