import { useSafePress } from '@/hooks/useSafePress';
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { goBackOr } from '@/utils/navigation';
import { useTheme } from '@/theme/ThemeProvider';
import { statusColors, withAlpha } from '@/theme/statusColors';
import type { DynamicTheme } from '@/theme';
import { ScreenWrapper } from '@/components/templates/ScreenWrapper';
import { Skeleton } from '@/components/atoms/Skeleton';
import { GlassCard, AnimatedButton, CustomInput } from '@/components/atoms';
import { useToast } from '@/components/atoms/CustomToast';
import { supabase, isPlaceholderUrl } from '@/services/supabase';
import { ScheduleDatePickerSheet } from '@/components/organisms/ScheduleDatePickerSheet';
import { PlatformType } from '@socialpilot/types';
import {
  ChevronLeft,
  Clock,
  Trash2,
  Send,
  Image as ImageIcon,
  Instagram,
  Twitter,
  Linkedin,
  Video,
  Share2,
  X,
  Calendar,
} from 'lucide-react-native';

const PLATFORMS: { id: PlatformType; name: string; icon: (c: string) => React.ReactNode }[] = [
  { id: 'instagram', name: 'Instagram', icon: (c) => <Instagram size={17} color={c} /> },
  { id: 'twitter', name: 'Twitter/X', icon: (c) => <Twitter size={15} color={c} /> },
  { id: 'linkedin', name: 'LinkedIn', icon: (c) => <Linkedin size={15} color={c} /> },
  { id: 'tiktok', name: 'TikTok', icon: (c) => <Video size={15} color={c} /> },
  { id: 'facebook', name: 'Facebook', icon: (c) => <Share2 size={15} color={c} /> },
];

// ============================================================
// Perf: memoized sections — typing in the title/body editors
// re-renders the screen; these skip SVG pill icons and the
// remote media preview (identical JSX, stable props).
// ============================================================

const PlatformDock = React.memo(function PlatformDock({
  theme,
  selectedPlatforms,
  onToggle,
}: {
  theme: DynamicTheme;
  selectedPlatforms: PlatformType[];
  onToggle: (p: PlatformType) => void;
}) {
  return (
    <View style={styles.sectionBlock}>
      <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
        Target Publishing Channels
      </Text>
      {/* flexGrow 0: keep the row content-sized (RN-Web ScrollView defaults to flex:1) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.platformRow}>
        {PLATFORMS.map((plat) => {
          const isSelected = selectedPlatforms.includes(plat.id);
          return (
            <TouchableOpacity
              key={plat.id}
              onPress={() => onToggle(plat.id)}
              activeOpacity={0.75}
              style={[
                styles.platPill,
                {
                  backgroundColor: isSelected ? theme.colors.surface : theme.colors.surfaceSubtle,
                  borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                  borderWidth: isSelected ? 1.8 : 1,
                },
              ]}
            >
              {plat.icon(isSelected ? theme.colors.primary : theme.colors.textMuted)}
              <Text
                style={[
                  styles.platPillText,
                  {
                    color: isSelected ? theme.colors.primary : theme.colors.textSecondary,
                    fontWeight: isSelected ? '800' : '600',
                  },
                ]}
              >
                {plat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
});

const MediaCard = React.memo(function MediaCard({
  theme,
  mediaUrl,
  onRemove,
}: {
  theme: DynamicTheme;
  mediaUrl: string;
  onRemove: () => void;
}) {
  const status = statusColors(theme.isDark);

  return (
    <GlassCard elevated style={styles.mediaCard}>
      <View style={styles.mediaHeader}>
        <View style={styles.mediaLabelGroup}>
          <ImageIcon size={16} color={theme.colors.primary} />
          <Text style={[styles.mediaHeading, { color: theme.colors.textPrimary }]}>
            Attached Visual Media
          </Text>
        </View>
        <TouchableOpacity onPress={onRemove} style={styles.removeMediaBtn}>
          <X size={15} color={status.danger} />
          <Text style={[styles.removeMediaText, { color: status.danger }]}>Remove</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.mediaImageContainer, { backgroundColor: theme.colors.surfaceSubtle }]}>
        <Image source={{ uri: mediaUrl }} style={styles.mediaPreviewImg} resizeMode="cover" />
      </View>
    </GlassCard>
  );
});

export default function PostDetailScreen() {
  const router = useRouter();
  const { safePress } = useSafePress();
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();
  const status = statusColors(theme.isDark);
  const { showToast } = useToast();

  const postId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : undefined;
  const isDemo = isPlaceholderUrl;

  // Demo mode keeps the seeded sample content; real mode starts EMPTY and is
  // only editable after the row loads — a failed load must never let the user
  // save fabricated copy over a real post.
  const [loadState, setLoadState] = useState<'loading' | 'ok' | 'missing' | 'error'>(
    isDemo || !postId ? 'ok' : 'loading'
  );
  const [title, setTitle] = useState(isDemo ? '5 Growth Tactics for 2026' : '');
  const [content, setContent] = useState(
    isDemo
      ? 'The future of social media is AI-accelerated workflows. Focus on authentic storytelling + automated distribution across multi-platform feeds.\n\nKey Takeaway: Consistency beats motivation every single time! #growth #strategy'
      : ''
  );
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformType[]>(
    isDemo ? ['instagram', 'linkedin'] : []
  );
  const [scheduledSlot, setScheduledSlot] = useState(isDemo ? 'Tomorrow at 10:00 AM' : '');
  const [scheduledIso, setScheduledIso] = useState('');
  const [scheduleDirty, setScheduleDirty] = useState(false);
  const [mediaUrl, setMediaUrl] = useState(
    isDemo
      ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop'
      : ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Load the real post from Supabase (dashboard "Tap to Edit" links here by id).
  useEffect(() => {
    if (isDemo || !postId) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setLoadState('error');
        return;
      }
      if (!data) {
        setLoadState('missing');
        return;
      }
      setTitle((data.title as string) ?? '');
      setContent((data.content as string) ?? '');
      if (Array.isArray(data.platforms) && data.platforms.length > 0) {
        setSelectedPlatforms(data.platforms as PlatformType[]);
      }
      if (data.scheduled_at) {
        setScheduledIso(new Date(data.scheduled_at as string).toISOString());
        setScheduledSlot(new Date(data.scheduled_at as string).toLocaleString());
      }
      setMediaUrl(Array.isArray(data.media_urls) && data.media_urls[0] ? (data.media_urls[0] as string) : '');
      setLoadState('ok');
    })();
    return () => {
      cancelled = true;
    };
  }, [postId, isDemo]);

  const togglePlatform = useCallback((plat: PlatformType) => {
    setSelectedPlatforms((prev) =>
      prev.includes(plat)
        ? prev.length > 1
          ? prev.filter((p) => p !== plat)
          : prev
        : [...prev, plat]
    );
  }, []);

  // Stable sheet/media handlers so memoized children skip keystroke re-renders
  const openDatePicker = useCallback(() => setShowDatePicker(true), []);
  const closeDatePicker = useCallback(() => setShowDatePicker(false), []);
  const confirmSchedule = useCallback((slot: string, iso: string) => {
    setScheduledSlot(slot);
    setScheduledIso(iso);
    setScheduleDirty(true);
  }, []);
  const removeMedia = useCallback(() => setMediaUrl(''), []);

  const handleSave = async () => {
    if (loadState !== 'ok') {
      showToast({ title: 'Not Ready', message: 'The post has not loaded — nothing to save.', type: 'error' });
      return;
    }
    setIsSaving(true);
    try {
      if (!isDemo && postId) {
        const payload: Record<string, unknown> = {
          title,
          content,
          platforms: selectedPlatforms,
          media_urls: mediaUrl ? [mediaUrl] : [],
          updated_at: new Date().toISOString(),
        };
        // The date sheet provides a genuine ISO timestamp; the display label
        // alone is not reliably parseable (e.g. "… at 10:00 AM" → Invalid Date).
        if (scheduledIso) {
          payload.scheduled_at = scheduledIso;
          if (scheduleDirty) payload.status = 'scheduled';
        }
        // .select() makes "0 rows matched" (deleted row / RLS denial) detectable
        const { data: updated, error } = await supabase
          .from('posts')
          .update(payload)
          .eq('id', postId)
          .select('id');
        if (error) throw error;
        if (!updated || updated.length === 0) throw new Error('Post no longer exists');
      } else {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      showToast({ title: 'Post Updated!', message: 'Changes saved to schedule queue.', type: 'success' });
      goBackOr(router);
    } catch {
      showToast({ title: 'Save Failed', message: 'Could not update the post.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishNow = async () => {
    if (loadState !== 'ok') {
      showToast({ title: 'Not Ready', message: 'The post has not loaded — nothing to publish.', type: 'error' });
      return;
    }
    setIsPublishing(true);
    try {
      if (!isDemo && postId) {
        const { data: published, error } = await supabase
          .from('posts')
          .update({
            title,
            content,
            platforms: selectedPlatforms,
            status: 'published',
            published_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', postId)
          .select('id');
        if (error) throw error;
        if (!published || published.length === 0) throw new Error('Post no longer exists');
      } else {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
      showToast({
        title: 'Published Successfully!',
        message: `Dispatched to ${selectedPlatforms.length} social channels.`,
        type: 'success',
      });
      goBackOr(router);
    } catch {
      showToast({ title: 'Publish Failed', message: 'Could not publish the post.', type: 'error' });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Post', 'Are you sure you want to permanently delete this post from queue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (loadState !== 'ok') {
            showToast({ title: 'Not Ready', message: 'The post has not loaded — nothing to delete.', type: 'error' });
            return;
          }
          try {
            if (!isDemo && postId) {
              const { data: deleted, error } = await supabase
                .from('posts')
                .delete()
                .eq('id', postId)
                .select('id');
              if (error) throw error;
              if (!deleted || deleted.length === 0) throw new Error('Post was already deleted or inaccessible');
            }
            showToast({ title: 'Post Deleted', type: 'info' });
            goBackOr(router);
          } catch {
            showToast({ title: 'Delete Failed', message: 'Could not delete the post.', type: 'error' });
          }
        },
      },
    ]);
  };

  // Loading / failed-load screen: the editor (and all destructive actions) are
  // unreachable until the real row is confirmed loaded.
  if (loadState !== 'ok') {
    return (
      <ScreenWrapper contentContainerStyle={styles.container}>
        <View style={styles.loadStateBox}>
          {loadState === 'loading' ? (
            <View style={{ gap: 14 }}>
              <Skeleton height={168} borderRadius={20} />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Skeleton width={112} height={30} borderRadius={15} />
                <Skeleton width={92} height={30} borderRadius={15} />
              </View>
              <Skeleton height={22} width="78%" />
              <Skeleton height={14} />
              <Skeleton height={14} />
              <Skeleton height={14} width="62%" />
              <Skeleton height={96} borderRadius={18} style={{ marginTop: 6 }} />
            </View>
          ) : (
            <>
              <Text style={[styles.loadStateTitle, { color: theme.colors.textPrimary }]}>
                {loadState === 'missing' ? 'Post Not Found' : 'Could Not Load Post'}
              </Text>
              <Text style={[styles.loadStateText, { color: theme.colors.textSecondary }]}>
                {loadState === 'missing'
                  ? 'This post no longer exists or belongs to a different account.'
                  : 'A network error occurred while loading the latest version. Try again later.'}
              </Text>
              <TouchableOpacity
                onPress={() => safePress(() => goBackOr(router))}
                style={[styles.loadStateBtn, { backgroundColor: theme.colors.primary }]}
              >
                <Text style={[styles.loadStateBtnText, { color: theme.colors.btnTextColor }]}>Go Back</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scrollable contentContainerStyle={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={() => safePress(() => goBackOr(router))}
          style={[styles.backBtn, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
        >
          <ChevronLeft size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => safePress(handleDelete)}
          style={[styles.deleteBtn, { backgroundColor: withAlpha(status.danger, 0.12), borderColor: withAlpha(status.danger, 0.3) }]}
        >
          <Trash2 size={17} color={status.danger} />
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Edit Post Details</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Modify post content, media attachments, and publishing schedule
        </Text>
      </View>

      {/* 1. Clean Rebuilt Schedule Card */}
      <GlassCard elevated style={styles.scheduleSlotCard}>
        <View style={styles.scheduleSlotTopRow}>
          <View style={styles.scheduleSlotLeft}>
            <View style={[styles.clockIconBox, { backgroundColor: theme.colors.badgeBg }]}>
              <Clock size={16} color={theme.colors.primary} />
            </View>
            <Text style={[styles.slotCardLabel, { color: theme.colors.textMuted }]}>
              PUBLISHING SCHEDULE
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => safePress(openDatePicker)}
            activeOpacity={0.8}
            style={[styles.changeSlotBtn, { backgroundColor: theme.colors.badgeBg, borderColor: theme.colors.badgeBorder }]}
          >
            <Calendar size={13} color={theme.colors.badgeText} />
            <Text style={[styles.changeSlotText, { color: theme.colors.badgeText }]}>
              Change Slot
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.slotCardTime, { color: theme.colors.textPrimary }]}>
          {scheduledSlot}
        </Text>
      </GlassCard>

      {/* 2. Target Platforms Dock */}
      <PlatformDock
        theme={theme}
        selectedPlatforms={selectedPlatforms}
        onToggle={togglePlatform}
      />

      {/* 3. Media Attachment Preview Card */}
      {mediaUrl ? <MediaCard theme={theme} mediaUrl={mediaUrl} onRemove={removeMedia} /> : null}

      {/* 4. Post Content Editor Canvas */}
      <GlassCard elevated style={styles.editorCanvas}>
        <CustomInput
          label="Post Headline"
          value={title}
          onChangeText={setTitle}
        />

        <View style={styles.canvasHeader}>
          <Text style={[styles.canvasLabel, { color: theme.colors.textSecondary }]}>
            Post Copy & Hashtags
          </Text>
          <Text style={[styles.charCount, { color: theme.colors.textMuted }]}>
            {content.length} chars
          </Text>
        </View>

        <TextInput
          placeholder="Enter post body..."
          placeholderTextColor={theme.colors.textMuted}
          multiline
          numberOfLines={6}
          style={[styles.canvasInput, { color: theme.colors.textPrimary }]}
          value={content}
          onChangeText={setContent}
        />
      </GlassCard>

      {/* 5. Dual Action Buttons */}
      <View style={styles.actionRow}>
        <AnimatedButton
          title={isSaving ? 'Saving...' : 'Save Draft Changes'}
          variant="outline"
          size="lg"
          onPress={() => safePress(handleSave)}
          loading={isSaving}
          style={{ flex: 1 }}
        />

        <AnimatedButton
          title={isPublishing ? 'Publishing...' : 'Publish Now'}
          size="lg"
          onPress={() => safePress(handlePublishNow)}
          loading={isPublishing}
          icon={<Send size={16} color={theme.colors.btnTextColor} />}
          style={{ flex: 1 }}
        />
      </View>

      {/* Full-Month Interactive Date & Time Picker */}
      <ScheduleDatePickerSheet
        visible={showDatePicker}
        onClose={closeDatePicker}
        onConfirmSchedule={confirmSchedule}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loadStateBox: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  loadStateTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  loadStateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadStateBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loadStateBtnText: {

    fontSize: 15,
    fontWeight: '700',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 16,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    gap: 2,
    marginBottom: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12.5,
  },
  scheduleSlotCard: {
    padding: 16,
    borderRadius: 22,
    gap: 8,
  },
  scheduleSlotTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleSlotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clockIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotCardLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  changeSlotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    gap: 5,
  },
  changeSlotText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  slotCardTime: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
    marginTop: 2,
  },
  sectionBlock: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  platformRow: {
    gap: 8,
    paddingVertical: 2,
  },
  platPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 6,
  },
  platPillText: {
    fontSize: 12,
  },
  mediaCard: {
    padding: 16,
    borderRadius: 22,
    gap: 12,
  },
  mediaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mediaLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mediaHeading: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  removeMediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  removeMediaText: {

    fontSize: 11.5,
    fontWeight: '700',
  },
  mediaImageContainer: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',

  },
  mediaPreviewImg: {
    width: '100%',
    height: '100%',
  },
  editorCanvas: {
    padding: 18,
    borderRadius: 24,
    gap: 8,
  },
  canvasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  canvasLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  charCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  canvasInput: {
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 14.5,
    lineHeight: 22,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
});
