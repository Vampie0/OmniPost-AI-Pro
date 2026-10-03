import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafePress } from '@/hooks/useSafePress';
import { useTheme } from '@/theme/ThemeProvider';
import { statusColors, withAlpha } from '@/theme/statusColors';
import { EmptyStateCard } from '@/components/atoms/EmptyStateCard';
import { useAuthStore } from '@/store/useAuthStore';
import { ScreenWrapper } from '@/components/templates/ScreenWrapper';
import { GlassCard } from '@/components/atoms';
import { useToast } from '@/components/atoms/CustomToast';
import { supabase, isPlaceholderUrl } from '@/services/supabase';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Trash2,
  Edit3,
  Share2,
  Instagram,
  Twitter,
  Linkedin,
  Video,
} from 'lucide-react-native';

interface ScheduledItem {
  id: string;
  title: string;
  content: string;
  platforms: string[];
  time: string;
  dayOffset: number;
}

// Fallback data when not connected
const FALLBACK_SCHEDULED_POSTS: ScheduledItem[] = [];

const PLATFORM_ICONS: Record<string, (c: string) => React.ReactNode> = {
  instagram: (c) => <Instagram size={14} color={c} />,
  twitter: (c) => <Twitter size={13} color={c} />,
  linkedin: (c) => <Linkedin size={13} color={c} />,
  tiktok: (c) => <Video size={13} color={c} />,
  facebook: (c) => <Share2 size={13} color={c} />,
};

export default function CalendarScreen() {
  const router = useRouter();
  const { safePress } = useSafePress();
  const { theme } = useTheme();
  const status = statusColors(theme.isDark);
  const { showToast } = useToast();
  const user = useAuthStore((state) => state.user);

  const [selectedDayOffset, setSelectedDayOffset] = useState(0);
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState('all');
  const [posts, setPosts] = useState<ScheduledItem[]>(FALLBACK_SCHEDULED_POSTS);

  const loadScheduledPosts = useCallback(async () => {
    if (isPlaceholderUrl || !user) return;

    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, content, platforms, scheduled_at, status')
        .eq('user_id', user.id)
        .in('status', ['scheduled', 'draft'])
        .order('scheduled_at', { ascending: true });

      if (error || !data) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const mapped: ScheduledItem[] = data
        .filter((p) => p.scheduled_at)
        .map((p) => {
          const schedDate = new Date(p.scheduled_at!);
          schedDate.setHours(0, 0, 0, 0);
          const diffMs = schedDate.getTime() - today.getTime();
          const dayOffset = Math.round(diffMs / (1000 * 60 * 60 * 24));
          const timeStr = new Date(p.scheduled_at!).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });
          return {
            id: p.id,
            title: p.title || 'Untitled Post',
            content: p.content,
            platforms: p.platforms || [],
            time: timeStr,
            dayOffset: Math.max(0, dayOffset),
          };
        })
        .filter((p) => p.dayOffset < 7);

      setPosts(mapped);
    } catch {
      // Silent fail
    }
  }, [user]);

  useEffect(() => {
    loadScheduledPosts();
  }, [loadScheduledPosts]);

  // Generate 7-day calendar strip
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const hasPosts = posts.some((p) => p.dayOffset === i);
    return {
      offset: i,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateNum: d.getDate(),
      hasPosts,
    };
  });

  const handleDelete = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    showToast({ title: 'Post Removed', message: 'Item deleted from scheduled queue.', type: 'info' });
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

  const activeDayPosts = posts.filter(
    (p) =>
      p.dayOffset === selectedDayOffset &&
      (selectedPlatformFilter === 'all' || p.platforms.includes(selectedPlatformFilter))
  );

  return (
    <ScreenWrapper scrollable contentContainerStyle={styles.container}>
      {/* 1. Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Content Calendar</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Timeline scheduler & autonomous publishing queue
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => safePress(() => router.push('/(tabs)/generate'))}
          activeOpacity={0.8}
          style={[styles.createPostQuickBtn, { backgroundColor: theme.colors.primary }]}
        >
          <Plus size={16} color={theme.colors.btnTextColor} />
          <Text style={[styles.createPostQuickText, { color: theme.colors.btnTextColor }]}>New Post</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Interactive Weekly Calendar Strip */}
      <View style={styles.calendarStripContainer}>
        {/* flexGrow 0: keep the row content-sized (RN-Web ScrollView defaults to flex:1) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.daysRow}>
          {days.map((item) => {
            const isSelected = selectedDayOffset === item.offset;
            return (
              <TouchableOpacity
                key={item.offset}
                onPress={() => setSelectedDayOffset(item.offset)}
                activeOpacity={0.8}
                style={[
                  styles.dayCard,
                  {
                    backgroundColor: isSelected ? theme.colors.surface : theme.colors.surfaceSubtle,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayName,
                    {
                      color: isSelected ? theme.colors.primary : theme.colors.textSecondary,
                      fontWeight: isSelected ? '800' : '600',
                    },
                  ]}
                >
                  {item.dayName}
                </Text>
                <Text
                  style={[
                    styles.dateNum,
                    {
                      color: isSelected ? theme.colors.primary : theme.colors.textPrimary,
                      fontWeight: isSelected ? '900' : '700',
                    },
                  ]}
                >
                  {item.dateNum}
                </Text>

                {/* Scheduled Content Indicator Dot */}
                <View
                  style={[
                    styles.postIndicatorDot,
                    {
                      backgroundColor: item.hasPosts
                        ? isSelected
                          ? theme.colors.primary
                          : theme.colors.secondaryGradient[0]
                        : 'transparent',
                    },
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Channel Filter Pills Bar */}
      <View style={styles.channelFilterRow}>
        {['all', 'instagram', 'twitter', 'linkedin'].map((filterKey) => {
          const isSelected = selectedPlatformFilter === filterKey;
          return (
            <TouchableOpacity
              key={filterKey}
              onPress={() => setSelectedPlatformFilter(filterKey)}
              style={[
                styles.channelFilterPill,
                {
                  backgroundColor: isSelected ? theme.colors.primary : theme.colors.surfaceSubtle,
                  borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.channelFilterText,
                  {
                    color: isSelected ? theme.colors.btnTextColor : theme.colors.textSecondary,
                    fontWeight: isSelected ? '800' : '600',
                  },
                ]}
              >
                {filterKey === 'all' ? 'All Channels' : filterKey.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 4. Timeline Schedule Queue (Vertical Timeline Flow) */}
      <View style={styles.timelineSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Scheduled Timeline</Text>
          <Text style={[styles.activeQueueCount, { color: theme.colors.primary }]}>
            {activeDayPosts.length} {activeDayPosts.length === 1 ? 'Post' : 'Posts'}
          </Text>
        </View>

        {activeDayPosts.length === 0 ? (
          <EmptyStateCard
            icon={CalendarIcon}
            title="No posts scheduled for this day"
            subtitle="Tap the (+ New Post) button above to plan your content for this slot."
            style={styles.emptyTimelineCard}
          />
        ) : (
          <View style={styles.timelineList}>
            {activeDayPosts.map((post, idx) => (
              <View key={post.id} style={styles.timelineItemWrapper}>
                {/* Left Timeline Axis */}
                <View style={styles.timelineAxis}>
                  <View style={[styles.timelineNode, { borderColor: theme.colors.primary, backgroundColor: theme.colors.surface }]}>
                    <View style={[styles.timelineNodeDot, { backgroundColor: theme.colors.primary }]} />
                  </View>
                  {idx < activeDayPosts.length - 1 && (
                    <View style={[styles.timelineConnectorLine, { backgroundColor: theme.colors.border }]} />
                  )}
                </View>

                {/* Right Post Card */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => safePress(() => openPostDetail(post.id))}
                  style={styles.cardTouchable}
                >
                  <GlassCard elevated style={styles.postTimelineCard}>
                    {/* Top Row with Time & Channels */}
                    <View style={styles.postTopHeader}>
                      <View style={[styles.timeBox, { backgroundColor: theme.colors.badgeBg }]}>
                        <Clock size={12} color={theme.colors.primary} />
                        <Text style={[styles.timeValue, { color: theme.colors.primary }]}>
                          {post.time}
                        </Text>
                      </View>

                      <View style={styles.cardHeaderActions}>
                        <TouchableOpacity
                          onPress={() => openPostDetail(post.id)}
                          style={[styles.actionIconBtn, { backgroundColor: theme.colors.surfaceSubtle }]}
                        >
                          <Edit3 size={13} color={theme.colors.primary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => safePress(() => handleDelete(post.id))}
                          style={[styles.actionIconBtn, { backgroundColor: withAlpha(status.danger, 0.12) }]}
                        >
                          <Trash2 size={13} color={status.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text style={[styles.postHeading, { color: theme.colors.textPrimary }]}>
                      {post.title}
                    </Text>

                    <Text numberOfLines={2} style={[styles.postBody, { color: theme.colors.textSecondary }]}>
                      {post.content}
                    </Text>

                    {/* Platform Icons Footers */}
                    <View style={[styles.postBottomRow, { borderTopColor: theme.colors.border }]}>
                      <View style={styles.platformIconsGroup}>
                        {post.platforms.map((plat) => (
                          <View
                            key={plat}
                            style={[
                              styles.platformMiniBadge,
                              {
                                backgroundColor: theme.colors.surfaceSubtle,
                                borderColor: theme.colors.border,
                              },
                            ]}
                          >
                            {PLATFORM_ICONS[plat] ? (
                              PLATFORM_ICONS[plat](theme.colors.primary)
                            ) : (
                              <Share2 size={12} color={theme.colors.primary} />
                            )}
                            <Text style={[styles.platMiniText, { color: theme.colors.textSecondary }]}>
                              {plat.toUpperCase()}
                            </Text>
                          </View>
                        ))}
                      </View>

                      <Text style={[styles.tapEditHint, { color: theme.colors.textMuted }]}>Edit Details →</Text>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
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
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12.5,
  },
  createPostQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 5,
  },
  createPostQuickText: {
    fontSize: 12,
    fontWeight: '800',
  },
  calendarStripContainer: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  daysRow: {
    gap: 10,
    paddingVertical: 2,
  },
  dayCard: {
    width: 62,
    height: 76,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  dayName: {
    fontSize: 11,
  },
  dateNum: {
    fontSize: 18,
  },
  postIndicatorDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 2,
  },
  channelFilterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  channelFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  channelFilterText: {
    fontSize: 11,
    textTransform: 'uppercase',
  },
  timelineSection: {
    gap: 12,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  activeQueueCount: {
    fontSize: 12,
    fontWeight: '800',
  },
  emptyTimelineCard: {
    alignItems: 'center',
    paddingVertical: 36,
    borderRadius: 22,
    gap: 4,
  },
  emptyTitle: {
    fontSize: 15.5,
    fontWeight: '800',
  },
  emptySubtitle: {
    fontSize: 12.5,
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 17,
  },
  timelineList: {
    gap: 12,
  },
  timelineItemWrapper: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineAxis: {
    width: 20,
    alignItems: 'center',
    paddingTop: 8,
  },
  timelineNode: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  timelineNodeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  timelineConnectorLine: {
    width: 1.5,
    flex: 1,
    marginTop: 4,
  },
  cardTouchable: {
    flex: 1,
  },
  postTimelineCard: {
    padding: 16,
    borderRadius: 22,
    gap: 8,
  },
  postTopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  timeValue: {
    fontSize: 11,
    fontWeight: '800',
  },
  cardHeaderActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postHeading: {
    fontSize: 15,
    fontWeight: '800',
  },
  postBody: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  postBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  platformIconsGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  platformMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  platMiniText: {
    fontSize: 10,
    fontWeight: '700',
  },
  tapEditHint: {
    fontSize: 11,
    fontWeight: '600',
  },
});
