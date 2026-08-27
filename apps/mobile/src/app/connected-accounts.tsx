import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafePress } from '@/hooks/useSafePress';
import { useTheme } from '@/theme/ThemeProvider';
import { ScreenWrapper } from '@/components/templates/ScreenWrapper';
import { GlassCard, Badge } from '@/components/atoms';
import { useToast } from '@/components/atoms/CustomToast';
import {
  SocialConnectSheet,
  SocialChannelData,
  DiscoveredProfile,
} from '@/components/organisms/SocialConnectSheet';
import {
  Instagram,
  Twitter,
  Linkedin,
  Video,
  Share2,
  ChevronLeft,
  Layers,
  Crown,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const CHANNELS: SocialChannelData[] = [
  {
    id: 'instagram',
    name: 'Instagram Business',
    account: '@creator.studio',
    icon: (c: string) => <Instagram size={22} color={c} />,
    connected: true,
    syncStatus: 'Active Auto-Publish',
    discoveredProfiles: [
      {
        id: 'ig_1',
        name: 'Creator Studio Brand',
        handle: '@creator.studio',
        type: 'Instagram Business',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
        followers: '124k',
        selected: true,
      },
      {
        id: 'ig_2',
        name: 'Studio Merch Shop',
        handle: '@studio.merch',
        type: 'Instagram Creator',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
        followers: '32k',
        selected: false,
      },
    ],
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    account: '@alex_creator',
    icon: (c: string) => <Twitter size={20} color={c} />,
    connected: true,
    syncStatus: 'Active Auto-Publish',
    discoveredProfiles: [
      {
        id: 'tw_1',
        name: 'Alex Rivera (Verified)',
        handle: '@alex_creator',
        type: 'Personal Creator',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
        followers: '48k',
        selected: true,
      },
    ],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Creator',
    account: 'Alex Rivera (Personal)',
    icon: (c: string) => <Linkedin size={20} color={c} />,
    connected: true,
    syncStatus: 'Active Auto-Publish',
    discoveredProfiles: [
      {
        id: 'li_1',
        name: 'Alex Rivera',
        handle: 'alex-rivera-pro',
        type: 'Personal Profile',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
        followers: '18k',
        selected: true,
      },
    ],
  },
  {
    id: 'tiktok',
    name: 'TikTok Creator Hub',
    account: 'Not Linked',
    icon: (c: string) => <Video size={20} color={c} />,
    connected: false,
    syncStatus: 'Disconnected',
    discoveredProfiles: [
      {
        id: 'tt_1',
        name: 'Alex Rivera TikTok',
        handle: '@alex.reels',
        type: 'Creator Account',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
        followers: '85k',
        selected: true,
      },
    ],
  },
  {
    id: 'facebook',
    name: 'Facebook Page',
    account: 'Not Linked',
    icon: (c: string) => <Share2 size={20} color={c} />,
    connected: false,
    syncStatus: 'Disconnected',
    discoveredProfiles: [
      {
        id: 'fb_1',
        name: 'Studio Official Page',
        handle: 'fb.com/creatorstudio',
        type: 'Facebook Business Page',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
        followers: '210k',
        selected: true,
      },
    ],
  },
];

export default function ConnectedAccountsScreen() {
  const router = useRouter();
  const { safePress } = useSafePress();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [channels, setChannels] = useState(CHANNELS);
  const [selectedChannel, setSelectedChannel] = useState<SocialChannelData | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const openChannelSheet = (channel: SocialChannelData) => {
    setSelectedChannel(channel);
    setSheetVisible(true);
  };

  const handleConfirmConnect = (selectedProfiles: DiscoveredProfile[]) => {
    if (!selectedChannel) return;
    const channelId = selectedChannel.id;
    const channelName = selectedChannel.name;
    const firstHandle = selectedProfiles[0]?.handle || '@creator.studio';

    setChannels((prev) =>
      prev.map((ch) =>
        ch.id === channelId
          ? {
              ...ch,
              connected: true,
              account: selectedProfiles.length > 1 ? `${firstHandle} (+${selectedProfiles.length - 1})` : firstHandle,
              syncStatus: 'Active Auto-Publish',
            }
          : ch
      )
    );

    setSheetVisible(false);
    showToast({
      title: 'Channel Linked!',
      message: `${selectedProfiles.length} profile(s) connected to ${channelName}.`,
      type: 'success',
    });
  };

  const handleConfirmDisconnect = () => {
    if (!selectedChannel) return;
    const channelId = selectedChannel.id;
    const channelName = selectedChannel.name;

    setChannels((prev) =>
      prev.map((ch) =>
        ch.id === channelId
          ? {
              ...ch,
              connected: false,
              account: 'Not Linked',
              syncStatus: 'Disconnected',
            }
          : ch
      )
    );

    setSheetVisible(false);
    showToast({
      title: 'Channel Disconnected',
      message: `Tokens revoked for ${channelName}.`,
      type: 'info',
    });
  };

  const connectedCount = channels.filter((c) => c.connected).length;

  return (
    <ScreenWrapper scrollable contentContainerStyle={styles.container}>
      <TouchableOpacity
        onPress={() => safePress(() => router.back())}
        style={[styles.backBtn, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
      >
        <ChevronLeft size={20} color={theme.colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Connected Channels</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          OAuth 2.0 authenticated profiles for verified multi-platform publishing
        </Text>
      </View>

      {/* Channel Usage Counter Card */}
      <GlassCard elevated style={styles.usageCounterCard}>
        <View style={styles.usageTop}>
          <View style={styles.usageLeft}>
            <View style={[styles.usageIconBox, { backgroundColor: theme.colors.badgeBg }]}>
              <Layers size={17} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={[styles.usageTitle, { color: theme.colors.textPrimary }]}>
                Channel Capacity
              </Text>
              <Text style={[styles.usageSubtitle, { color: theme.colors.textSecondary }]}>
                {connectedCount} of 10 Profiles Connected
              </Text>
            </View>
          </View>
          <Badge label="Pro VIP Plan" variant="primary" />
        </View>

        <View style={[styles.usageBarBg, { backgroundColor: theme.colors.surfaceSubtle }]}>
          <View
            style={[
              styles.usageBarFill,
              {
                backgroundColor: theme.colors.primary,
                width: `${(connectedCount / 10) * 100}%`,
              },
            ]}
          />
        </View>
      </GlassCard>

      {/* Channels List */}
      <View style={styles.channelsList}>
        {channels.map((channel) => (
          <GlassCard key={channel.id} elevated style={styles.channelCard}>
            <View style={styles.channelLeft}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: channel.connected ? theme.colors.badgeBg : theme.colors.surfaceSubtle,
                  },
                ]}
              >
                {channel.icon(channel.connected ? theme.colors.primary : theme.colors.textMuted)}
              </View>

              <View style={styles.channelDetails}>
                <Text style={[styles.channelName, { color: theme.colors.textPrimary }]}>
                  {channel.name}
                </Text>
                <Text style={[styles.channelAccount, { color: theme.colors.textSecondary }]}>
                  {channel.account}
                </Text>
                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: channel.connected ? '#00F5A0' : '#64748B' },
                    ]}
                  />
                  <Text
                    style={[
                      styles.syncStatusText,
                      { color: channel.connected ? '#00F5A0' : theme.colors.textMuted },
                    ]}
                  >
                    {channel.syncStatus}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => openChannelSheet(channel)}
              style={[
                styles.actionPill,
                {
                  backgroundColor: channel.connected ? 'rgba(244, 63, 94, 0.12)' : theme.colors.badgeBg,
                  borderColor: channel.connected ? 'rgba(244, 63, 94, 0.3)' : theme.colors.badgeBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.actionPillText,
                  { color: channel.connected ? '#F43F5E' : theme.colors.badgeText },
                ]}
              >
                {channel.connected ? 'Manage' : 'Connect'}
              </Text>
            </TouchableOpacity>
          </GlassCard>
        ))}
      </View>

      {/* Permission & Multi-Account Discovery Sheet */}
      <SocialConnectSheet
        visible={sheetVisible}
        channel={selectedChannel}
        onClose={() => setSheetVisible(false)}
        onConfirmConnect={handleConfirmConnect}
        onConfirmDisconnect={handleConfirmDisconnect}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  header: {
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  usageCounterCard: {
    padding: 16,
    borderRadius: 20,
    gap: 12,
  },
  usageTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  usageIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  usageTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  usageSubtitle: {
    fontSize: 11.5,
    marginTop: 1,
  },
  usageBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  usageBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  channelsList: {
    gap: 12,
  },
  channelCard: {
    padding: 16,
    borderRadius: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  channelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelDetails: {
    gap: 2,
    flex: 1,
  },
  channelName: {
    fontSize: 15,
    fontWeight: '800',
  },
  channelAccount: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  syncStatusText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  actionPill: {
    paddingHorizontal: 12,
    paddingVertical: 6.5,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
