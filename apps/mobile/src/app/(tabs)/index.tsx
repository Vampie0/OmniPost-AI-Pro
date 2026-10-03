import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafePress } from '@/hooks/useSafePress';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationsStore } from '@/store/useNotificationsStore';
import { ScreenWrapper } from '@/components/templates/ScreenWrapper';
import { GlassCard, AnimatedButton, Badge } from '@/components/atoms';
import { supabase, isPlaceholderUrl } from '@/services/supabase';
import { PostItem } from '@socialpilot/types';
import { Sparkles, Clock, CheckCircle, Zap, Layers, Menu, Bell } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function DashboardScreen() {
  const router = useRouter();
  const { safePress } = useSafePress();
  const { theme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const unreadCount = useNotificationsStore((state) => state.unreadCount);

  const [posts, setPosts] = useState<PostItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalPosts: 0,
    scheduled: 0,
    published: 0,
  });

  const loadDashboardData = async () => {
    if (isPlaceholderUrl) {
      setPosts([
        {
          id: '1',
          user_id: 'mock',
          folder_id: null,
          title: '5 Growth Tactics for 2026',
          content: 'The future of social media is AI-accelerated workflows. Focus on authentic storytelling + automated distribution across multi-platform feeds.',
          hashtags: ['#growth', '#strategy'],
          media_urls: [],
          platforms: ['instagram', 'linkedin'],
          status: 'published',
          scheduled_at: null,
          published_at: new Date().toISOString(),
          analytics: { likes: 42, shares: 8 },
          error_message: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          user_id: 'mock',
          folder_id: null,
          title: 'Weekly Tech Breakdown Reel',
          content: 'Breaking down how diffusion models and LLMs are transforming modern creator economics.',
          hashtags: ['#reels', '#tech'],
          media_urls: [],
          platforms: ['tiktok', 'instagram'],
          status: 'scheduled',
          scheduled_at: new Date(Date.now() + 86400000).toISOString(),
          published_at: null,
          analytics: {},
          error_message: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
      return;
    }

    if (!user) return;
    try {
      await fetchProfile(user.id);

      // Exact counts via head queries (no 1000-row cap, no content payloads)
      // plus one small query for the 5-item recent feed.
      const [totalRes, schedRes, pubRes, feedRes] = await Promise.all([
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'scheduled'),
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'published'),
        supabase.from('posts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      ]);

      if (!totalRes.error && !feedRes.error) {
        setStats({
          totalPosts: totalRes.count ?? 0,
          scheduled: schedRes.count ?? 0,
          published: pubRes.count ?? 0,
        });
        setPosts((feedRes.data ?? []) as PostItem[]);
      }
    } catch (e) {
      console.warn('Dashboard error:', e);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const isNavigatingRef = React.useRef(false);
  const openPostDetail = (postId: string) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    router.push({ pathname: '/post/[id]', params: { id: postId } });
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 600);
  };

  return (
    <ScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {/* 1. Header with Native studio-menu Trigger */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View style={styles.headerLeftGroup}>
            <TouchableOpacity
              onPress={() => safePress(() => router.push('/studio-menu'))}
              style={[styles.menuBtn, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
            >
              <Menu size={19} color={theme.colors.textPrimary} />
            </TouchableOpacity>

            <View>
              <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>
                {theme.paletteName.toUpperCase()} STUDIO
              </Text>
              <Text style={[styles.userName, { color: theme.colors.textPrimary }]}>
                {user?.full_name || 'Creator Workspace'}
              </Text>
            </View>
          </View>

          <View style={styles.headerRightGroup}>
            {/* Notification Inbox Bell */}
            <TouchableOpacity
              onPress={() => safePress(() => router.push('/notifications'))}
              style={[styles.bellBtn, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
            >
              <Bell size={18} color={theme.colors.textPrimary} />
              {unreadCount > 0 && (
                <View style={[styles.bellBadge, { backgroundColor: theme.colors.primary }]}>
                  <Text style={[styles.bellBadgeText, { color: theme.colors.btnTextColor }]}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Credits Live Meter Pill */}
            <View
              style={[
                styles.creditsPill,
                {
                  backgroundColor: theme.colors.badgeBg,
                  borderColor: theme.colors.badgeBorder,
                },
              ]}
            >
              <Zap size={14} color={theme.colors.badgeText} />
              <Text style={[styles.creditsNumber, { color: theme.colors.badgeText }]}>
                {user?.credits_remaining ?? 50} Credits
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* 2. Glassmorphic 3-Column Metrics Grid */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.statsGrid}>
          <GlassCard style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: theme.colors.badgeBg }]}>
              <Layers size={18} color={theme.colors.primary} />
            </View>
            <Text style={[styles.statCount, { color: theme.colors.textPrimary }]}>{stats.totalPosts}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total Posts</Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: theme.colors.badgeBg }]}>
              <Clock size={18} color={theme.colors.primary} />
            </View>
            <Text style={[styles.statCount, { color: theme.colors.textPrimary }]}>{stats.scheduled}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Scheduled</Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: theme.colors.badgeBg }]}>
              <CheckCircle size={18} color={theme.colors.primary} />
            </View>
            <Text style={[styles.statCount, { color: theme.colors.textPrimary }]}>{stats.published}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Published</Text>
          </GlassCard>
        </Animated.View>

        {/* 3. Hero Quick Action Launch Card */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)}>
          <GlassCard elevated style={styles.heroActionCard}>
            <View style={styles.heroActionTop}>
              <View style={[styles.heroSparkBox, { backgroundColor: theme.colors.badgeBg }]}>
                <Sparkles size={22} color={theme.colors.primary} />
              </View>
              <Badge label="AI Multi-Platform" variant="primary" />
            </View>

            <Text style={[styles.heroActionTitle, { color: theme.colors.textPrimary }]}>
              Create High-Impact Content
            </Text>
            <Text style={[styles.heroActionDesc, { color: theme.colors.textSecondary }]}>
              Generate viral hooks, captions, and carousel scripts tailored for Instagram, Twitter & LinkedIn in seconds.
            </Text>

            <AnimatedButton
              title="Launch AI Studio"
              onPress={() => safePress(() => router.push('/(tabs)/generate'))}
              size="md"
              style={styles.heroBtn}
            />
          </GlassCard>
        </Animated.View>

        {/* 4. Recent Posts Stream Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Recent Activity</Text>
          <TouchableOpacity onPress={() => safePress(() => router.push('/(tabs)/calendar'))}>
            <Text style={[styles.sectionLink, { color: theme.colors.primary }]}>View Schedule</Text>
          </TouchableOpacity>
        </View>

        {/* 5. Clickable Posts Feed */}
        {posts.map((post) => (
          <TouchableOpacity
            key={post.id}
            activeOpacity={0.75}
            onPress={() => safePress(() => openPostDetail(post.id))}
          >
            <GlassCard style={styles.postItemCard}>
              <View style={styles.postTopRow}>
                <Text numberOfLines={1} style={[styles.postTitle, { color: theme.colors.textPrimary }]}>
                  {post.title}
                </Text>
                <Badge
                  label={post.status.toUpperCase()}
                  variant={post.status === 'published' ? 'secondary' : post.status === 'scheduled' ? 'primary' : 'neutral'}
                />
              </View>

              <Text numberOfLines={2} style={[styles.postSnippet, { color: theme.colors.textSecondary }]}>
                {post.content}
              </Text>

              <View style={[styles.postFooter, { borderTopColor: theme.colors.border }]}>
                <View style={styles.platformTags}>
                  {post.platforms.map((p) => (
                    <Text key={p} style={[styles.platTag, { color: theme.colors.textMuted }]}>
                      #{p}
                    </Text>
                  ))}
                </View>
                <Text style={[styles.postDate, { color: theme.colors.primary, fontWeight: '700' }]}>
                  Tap to Edit →
                </Text>
              </View>
            </GlassCard>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  userName: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginTop: 1,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  creditsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    gap: 5,
  },
  creditsNumber: {
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    borderRadius: 20,
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statCount: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  heroActionCard: {
    padding: 20,
    borderRadius: 24,
  },
  heroActionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroSparkBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroActionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  heroActionDesc: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  heroBtn: {
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionLink: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  postItemCard: {
    padding: 16,
    borderRadius: 18,
    gap: 8,
  },
  postTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    flex: 1,
    marginRight: 10,
  },
  postSnippet: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  platformTags: {
    flexDirection: 'row',
    gap: 6,
  },
  platTag: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  postDate: {
    fontSize: 11.5,
  },
});
