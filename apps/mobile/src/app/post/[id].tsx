import { useSafePress } from '@/hooks/useSafePress';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { ScreenWrapper } from '@/components/templates/ScreenWrapper';
import { GlassCard, AnimatedButton, CustomInput } from '@/components/atoms';
import { useToast } from '@/components/atoms/CustomToast';
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

export default function PostDetailScreen() {
  const router = useRouter();
  const { safePress } = useSafePress();
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [title, setTitle] = useState('5 Growth Tactics for 2026');
  const [content, setContent] = useState(
    'The future of social media is AI-accelerated workflows. Focus on authentic storytelling + automated distribution across multi-platform feeds.\n\nKey Takeaway: Consistency beats motivation every single time! #growth #strategy'
  );
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformType[]>(['instagram', 'linkedin']);
  const [scheduledSlot, setScheduledSlot] = useState('Tomorrow at 10:00 AM');
  const [mediaUrl, setMediaUrl] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const togglePlatform = (plat: PlatformType) => {
    setSelectedPlatforms((prev) =>
      prev.includes(plat)
        ? prev.length > 1
          ? prev.filter((p) => p !== plat)
          : prev
        : [...prev, plat]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSaving(false);
    showToast({ title: 'Post Updated!', message: 'Changes saved to schedule queue.', type: 'success' });
    router.back();
  };

  const handlePublishNow = async () => {
    setIsPublishing(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsPublishing(false);
    showToast({
      title: 'Published Successfully!',
      message: `Dispatched to ${selectedPlatforms.length} social channels.`,
      type: 'success',
    });
    router.back();
  };

  const handleDelete = () => {
    Alert.alert('Delete Post', 'Are you sure you want to permanently delete this post from queue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          showToast({ title: 'Post Deleted', type: 'info' });
          router.back();
        },
      },
    ]);
  };

  return (
    <ScreenWrapper scrollable contentContainerStyle={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={() => safePress(() => router.back())}
          style={[styles.backBtn, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
        >
          <ChevronLeft size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => safePress(handleDelete)}
          style={[styles.deleteBtn, { backgroundColor: 'rgba(244, 63, 94, 0.12)', borderColor: 'rgba(244, 63, 94, 0.3)' }]}
        >
          <Trash2 size={17} color="#F43F5E" />
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
            onPress={() => safePress(() => setShowDatePicker(true))}
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
      <View style={styles.sectionBlock}>
        <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
          Target Publishing Channels
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.platformRow}>
          {PLATFORMS.map((plat) => {
            const isSelected = selectedPlatforms.includes(plat.id);
            return (
              <TouchableOpacity
                key={plat.id}
                onPress={() => togglePlatform(plat.id)}
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

      {/* 3. Media Attachment Preview Card */}
      {mediaUrl ? (
        <GlassCard elevated style={styles.mediaCard}>
          <View style={styles.mediaHeader}>
            <View style={styles.mediaLabelGroup}>
              <ImageIcon size={16} color={theme.colors.primary} />
              <Text style={[styles.mediaHeading, { color: theme.colors.textPrimary }]}>
                Attached Visual Media
              </Text>
            </View>
            <TouchableOpacity onPress={() => setMediaUrl('')} style={styles.removeMediaBtn}>
              <X size={15} color="#F43F5E" />
              <Text style={styles.removeMediaText}>Remove</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mediaImageContainer}>
            <Image source={{ uri: mediaUrl }} style={styles.mediaPreviewImg} resizeMode="cover" />
          </View>
        </GlassCard>
      ) : null}

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
          placeholderTextColor="rgba(148, 163, 184, 0.4)"
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
        onClose={() => setShowDatePicker(false)}
        onConfirmSchedule={(slot) => setScheduledSlot(slot)}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
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
    color: '#F43F5E',
    fontSize: 11.5,
    fontWeight: '700',
  },
  mediaImageContainer: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
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
