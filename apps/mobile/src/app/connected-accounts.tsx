import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { goBackOr } from '@/utils/navigation';
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
  HelpCircle,
  X,
} from 'lucide-react-native';
import * as SecureStore from '@/utils/secureStorage';

const DEFAULT_CHANNELS: SocialChannelData[] = [
  {
    id: 'instagram',
    name: 'Instagram Business',
    account: 'Not Linked',
    icon: (c: string) => <Instagram size={22} color={c} />,
    connected: false,
    syncStatus: 'Disconnected',
    discoveredProfiles: [
      {
        id: 'ig-1',
        name: 'My Brand Page',
        handle: '@mybrand',
        type: 'Business',
        avatarUrl: 'https://ui-avatars.com/api/?name=My+Brand&background=E1306C&color=fff&size=100',
        followers: '12.4K followers',
        selected: false,
      },
      {
        id: 'ig-2',
        name: 'Personal Creator',
        handle: '@mycreator',
        type: 'Creator',
        avatarUrl: 'https://ui-avatars.com/api/?name=Creator&background=833AB4&color=fff&size=100',
        followers: '3.8K followers',
        selected: false,
      },
    ],
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    account: 'Not Linked',
    icon: (c: string) => <Twitter size={20} color={c} />,
    connected: false,
    syncStatus: 'Disconnected',
    discoveredProfiles: [
      {
        id: 'tw-1',
        name: 'My Account',
        handle: '@myhandle',
        type: 'Personal',
        avatarUrl: 'https://ui-avatars.com/api/?name=Twitter&background=1DA1F2&color=fff&size=100',
        followers: '5.2K followers',
        selected: false,
      },
    ],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Creator',
    account: 'Not Linked',
    icon: (c: string) => <Linkedin size={20} color={c} />,
    connected: false,
    syncStatus: 'Disconnected',
    discoveredProfiles: [
      {
        id: 'li-1',
        name: 'Professional Profile',
        handle: '/in/myprofile',
        type: 'Personal',
        avatarUrl: 'https://ui-avatars.com/api/?name=LinkedIn&background=0A66C2&color=fff&size=100',
        followers: '1.5K connections',
        selected: false,
      },
      {
        id: 'li-2',
        name: 'Company Page',
        handle: '/company/mycompany',
        type: 'Company',
        avatarUrl: 'https://ui-avatars.com/api/?name=Company&background=0A66C2&color=fff&size=100',
        followers: '820 followers',
        selected: false,
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
        id: 'tt-1',
        name: 'Creator Account',
        handle: '@mytiktok',
        type: 'Creator',
        avatarUrl: 'https://ui-avatars.com/api/?name=TikTok&background=010101&color=fff&size=100',
        followers: '24.1K followers',
        selected: false,
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
        id: 'fb-1',
        name: 'Business Page',
        handle: '/mybusiness',
        type: 'Page',
        avatarUrl: 'https://ui-avatars.com/api/?name=Facebook&background=1877F2&color=fff&size=100',
        followers: '6.7K likes',
        selected: false,
      },
    ],
  },
];

export default function ConnectedAccountsScreen() {
  const router = useRouter();
  const { safePress } = useSafePress();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [channels, setChannels] = useState<SocialChannelData[]>(DEFAULT_CHANNELS);

  // Load persisted channel connections on mount
  useEffect(() => {
    SecureStore.getItemAsync('connected_channels').then((saved) => {
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setChannels((prev) =>
              prev.map((ch) => {
                const savedCh = parsed.find((s: SocialChannelData) => s.id === ch.id);
                return savedCh ? { ...ch, ...savedCh } : ch;
              })
            );
          }
        } catch {}
      }
    });
  }, []);
  const [selectedChannel, setSelectedChannel] = useState<SocialChannelData | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);

  const openChannelSheet = (channel: SocialChannelData) => {
    setSelectedChannel(channel);
    setSheetVisible(true);
  };

  const persistChannels = async (updated: SocialChannelData[]) => {
    try {
      await SecureStore.setItemAsync('connected_channels', JSON.stringify(updated));
    } catch {}
  };

  const handleConfirmConnect = (selectedProfiles: DiscoveredProfile[]) => {
    if (!selectedChannel) return;
    const channelId = selectedChannel.id;
    const channelName = selectedChannel.name;
    const firstHandle = selectedProfiles[0]?.handle || '@myaccount';

    // Compute outside the updater: persistChannels is a side effect and must
    // not run inside setChannels (double-invoked under StrictMode).
    const updated = channels.map((ch) =>
      ch.id === channelId
        ? {
            ...ch,
            connected: true,
            account: selectedProfiles.length > 1 ? `${firstHandle} (+${selectedProfiles.length - 1})` : firstHandle,
            syncStatus: 'Active Auto-Publish',
            discoveredProfiles: selectedProfiles,
          }
        : ch
    );
    setChannels(updated);
    void persistChannels(updated);

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

    const updated = channels.map((ch) =>
      ch.id === channelId
        ? {
            ...ch,
            connected: false,
            account: 'Not Linked',
            syncStatus: 'Disconnected',
            discoveredProfiles: [],
          }
        : ch
    );
    setChannels(updated);
    void persistChannels(updated);

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
        onPress={() => safePress(() => goBackOr(router))}
        style={[styles.backBtn, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
      >
        <ChevronLeft size={20} color={theme.colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Connected Channels</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Link your social media accounts to publish directly from the app
        </Text>
      </View>

      {/* Help Button */}
      <TouchableOpacity
        onPress={() => setHelpVisible(true)}
        style={[styles.helpBtn, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
      >
        <HelpCircle size={16} color={theme.colors.primary} />
        <Text style={[styles.helpBtnText, { color: theme.colors.textPrimary }]}>How to Connect Your Accounts</Text>
      </TouchableOpacity>

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
          <Badge label="Up to 10 Profiles" variant="primary" />
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

      {/* Channels List — horizontal scrollable row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.channelsScrollRow}
      >
        {channels.map((channel) => (
          <GlassCard key={channel.id} elevated style={styles.channelCard}>
            <View style={styles.channelInner}>
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

              <Text style={[styles.channelName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                {channel.name}
              </Text>
              <Text style={[styles.channelAccount, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {channel.account}
              </Text>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: channel.connected ? theme.colors.primary : theme.colors.textMuted },
                  ]}
                />
                <Text
                  style={[
                    styles.syncStatusText,
                    { color: channel.connected ? theme.colors.primary : theme.colors.textMuted },
                  ]}
                >
                  {channel.connected ? 'Active' : 'Off'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => openChannelSheet(channel)}
                style={[
                  styles.actionPill,
                  {
                    backgroundColor: channel.connected ? theme.colors.badgeBg : theme.colors.surfaceSubtle,
                    borderColor: channel.connected ? theme.colors.badgeBorder : theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.actionPillText,
                    { color: channel.connected ? theme.colors.primary : theme.colors.textSecondary },
                  ]}
                >
                  {channel.connected ? 'Manage' : 'Connect'}
                </Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        ))}
      </ScrollView>

      {/* Permission & Multi-Account Discovery Sheet */}
      <SocialConnectSheet
        visible={sheetVisible}
        channel={selectedChannel}
        onClose={() => setSheetVisible(false)}
        onConfirmConnect={handleConfirmConnect}
        onConfirmDisconnect={handleConfirmDisconnect}
      />

      {/* Help Modal */}
      <Modal visible={helpVisible} animationType="slide" transparent onRequestClose={() => setHelpVisible(false)}>
        <View style={styles.helpBackdrop}>
          <View style={[styles.helpSheet, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.helpHeader}>
              <Text style={[styles.helpTitle, { color: theme.colors.textPrimary }]}>Connecting Your Accounts</Text>
              <TouchableOpacity onPress={() => setHelpVisible(false)}>
                <X size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
                To connect a social media channel, follow these steps:
              </Text>
              <View style={[styles.helpStep, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}>
                <Text style={[styles.helpStepNum, { color: theme.colors.primary }]}>1</Text>
                <Text style={[styles.helpStepText, { color: theme.colors.textPrimary }]}>Tap on any channel card (Instagram, Twitter, LinkedIn, etc.)</Text>
              </View>
              <View style={[styles.helpStep, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}>
                <Text style={[styles.helpStepNum, { color: theme.colors.primary }]}>2</Text>
                <Text style={[styles.helpStepText, { color: theme.colors.textPrimary }]}>Tap "Connect" and select your profile from the discovered accounts</Text>
              </View>
              <View style={[styles.helpStep, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}>
                <Text style={[styles.helpStepNum, { color: theme.colors.primary }]}>3</Text>
                <Text style={[styles.helpStepText, { color: theme.colors.textPrimary }]}>Allow access when the platform asks for permission</Text>
              </View>
              <View style={[styles.helpStep, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}>
                <Text style={[styles.helpStepNum, { color: theme.colors.primary }]}>4</Text>
                <Text style={[styles.helpStepText, { color: theme.colors.textPrimary }]}>Your channel is now active and ready for auto-publishing</Text>
              </View>
              <Text style={[styles.helpText, { color: theme.colors.textMuted }]}>
                To remove a connected account, tap "Manage" on the channel card and select "Disconnect". This revokes all tokens and stops auto-publishing.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  channelsScrollRow: {
    gap: 12,
    paddingVertical: 2,
  },
  channelCard: {
    width: 140,
    padding: 14,
    borderRadius: 20,
  },
  channelInner: {
    alignItems: 'center',
    gap: 6,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  channelName: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  channelAccount: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
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
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 2,
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  helpBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  helpBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  helpSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 22,
    maxHeight: '75%',
    gap: 10,
  },
  helpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  helpText: {
    fontSize: 13,
    lineHeight: 19,
  },
  helpStep: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  helpStepNum: {
    fontSize: 16,
    fontWeight: '900',
    width: 24,
    textAlign: 'center',
  },
  helpStepText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});
