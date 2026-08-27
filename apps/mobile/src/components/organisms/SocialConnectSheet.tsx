import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { GlassCard, AnimatedButton, Badge } from '@/components/atoms';
import {
  ShieldCheck,
  CheckCircle2,
  X,
  Check,
  HelpCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export interface DiscoveredProfile {
  id: string;
  name: string;
  handle: string;
  type: string;
  avatarUrl: string;
  followers: string;
  selected: boolean;
}

export interface SocialChannelData {
  id: string;
  name: string;
  account: string;
  icon: (c: string) => React.ReactNode;
  connected: boolean;
  syncStatus: string;
  discoveredProfiles: DiscoveredProfile[];
  helperGuide?: string;
}

interface SocialConnectSheetProps {
  visible: boolean;
  channel: SocialChannelData | null;
  onClose: () => void;
  onConfirmConnect: (selectedProfiles: DiscoveredProfile[]) => void;
  onConfirmDisconnect: () => void;
}

export const SocialConnectSheet: React.FC<SocialConnectSheetProps> = ({
  visible,
  channel,
  onClose,
  onConfirmConnect,
  onConfirmDisconnect,
}) => {
  const { theme } = useTheme();
  const [profiles, setProfiles] = useState<DiscoveredProfile[]>([]);
  const [showHelper, setShowHelper] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize discovered profiles on open
  React.useEffect(() => {
    if (channel) {
      setProfiles(channel.discoveredProfiles || []);
    }
  }, [channel]);

  if (!channel) return null;

  const toggleSelectProfile = (id: string) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  };

  const handleConnectSelected = async () => {
    const selected = profiles.filter((p) => p.selected);
    if (selected.length === 0) {
      return;
    }

    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsProcessing(false);

    onConfirmConnect(selected);
  };

  const handleDisconnect = async () => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    setIsProcessing(false);
    onConfirmDisconnect();
  };

  const selectedCount = profiles.filter((p) => p.selected).length;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBackdrop}>
        <View style={[styles.sheetContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconBox, { backgroundColor: theme.colors.badgeBg }]}>
                {channel.icon(theme.colors.primary)}
              </View>
              <View>
                <Text style={[styles.sheetTitle, { color: theme.colors.textPrimary }]}>
                  {channel.connected ? `Manage ${channel.name}` : `Connect ${channel.name}`}
                </Text>
                <Text style={[styles.sheetSubtitle, { color: theme.colors.textSecondary }]}>
                  {channel.connected ? 'Active profiles & channel sync settings' : 'Select profiles to link with your studio'}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
            {channel.connected ? (
              // Connected View with Token Health & Disconnect
              <View style={styles.connectedManager}>
                <View style={[styles.tokenHealthBox, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}>
                  <View style={styles.tokenHealthTop}>
                    <View style={styles.tokenHealthStatus}>
                      <View style={[styles.greenDot, { backgroundColor: '#00F5A0' }]} />
                      <Text style={[styles.tokenHealthTitle, { color: theme.colors.textPrimary }]}>
                        Auto-Publish Sync Active
                      </Text>
                    </View>
                    <Badge label="Healthy" variant="primary" />
                  </View>
                  <Text style={[styles.tokenHealthDesc, { color: theme.colors.textSecondary }]}>
                    OAuth tokens are securely authenticated and ready for background scheduled publishing.
                  </Text>
                </View>

                {/* Warning on Disconnect */}
                <View style={styles.warningAlert}>
                  <AlertTriangle size={18} color="#F43F5E" />
                  <Text style={styles.warningText}>
                    Disconnecting will un-schedule pending posts for this channel.
                  </Text>
                </View>

                <AnimatedButton
                  title={isProcessing ? 'Revoking Access...' : 'Disconnect Channel'}
                  onPress={handleDisconnect}
                  loading={isProcessing}
                  variant="outline"
                  size="lg"
                  textStyle={{ color: '#F43F5E' }}
                  style={{ borderColor: 'rgba(244, 63, 94, 0.4)', marginTop: 8 }}
                />
              </View>
            ) : (
              // Discovery & Selection Flow (Multi-Page / Multi-Profile)
              <>
                {/* Expandable Helper Guide */}
                <TouchableOpacity
                  onPress={() => setShowHelper((prev) => !prev)}
                  style={[styles.helperBanner, { backgroundColor: theme.colors.badgeBg, borderColor: theme.colors.badgeBorder }]}
                >
                  <View style={styles.helperBannerLeft}>
                    <HelpCircle size={15} color={theme.colors.badgeText} />
                    <Text style={[styles.helperBannerText, { color: theme.colors.badgeText }]}>
                      How to link Instagram / Meta correctly?
                    </Text>
                  </View>
                  <Text style={[styles.helperToggleText, { color: theme.colors.badgeText }]}>
                    {showHelper ? 'Hide' : 'View'}
                  </Text>
                </TouchableOpacity>

                {showHelper && (
                  <View style={[styles.helperContentBox, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}>
                    <Text style={[styles.helperStep, { color: theme.colors.textPrimary }]}>
                      1. Make sure your Instagram is a <Text style={{ fontWeight: '800' }}>Professional / Creator Account</Text>.
                    </Text>
                    <Text style={[styles.helperStep, { color: theme.colors.textPrimary }]}>
                      2. Connect it to a <Text style={{ fontWeight: '800' }}>Facebook Page</Text> you manage.
                    </Text>
                    <Text style={[styles.helperStep, { color: theme.colors.textPrimary }]}>
                      3. Select your brand from the list below and tap Link.
                    </Text>
                  </View>
                )}

                {/* Discovered Profiles List */}
                <Text style={[styles.sectionHeading, { color: theme.colors.textPrimary }]}>
                  Found Profiles Under Your Login:
                </Text>

                <View style={styles.profilesList}>
                  {profiles.map((profile) => (
                    <TouchableOpacity
                      key={profile.id}
                      onPress={() => toggleSelectProfile(profile.id)}
                      activeOpacity={0.8}
                      style={[
                        styles.profileSelectItem,
                        {
                          backgroundColor: profile.selected ? theme.colors.surfaceSubtle : theme.colors.surface,
                          borderColor: profile.selected ? theme.colors.primary : theme.colors.border,
                          borderWidth: profile.selected ? 1.8 : 1,
                        },
                      ]}
                    >
                      <Image source={{ uri: profile.avatarUrl }} style={styles.profileAvatar} />

                      <View style={styles.profileInfo}>
                        <View style={styles.profileNameRow}>
                          <Text style={[styles.profileName, { color: theme.colors.textPrimary }]}>
                            {profile.name}
                          </Text>
                          <Text style={[styles.profileFollowers, { color: theme.colors.textMuted }]}>
                            {profile.followers}
                          </Text>
                        </View>
                        <Text style={[styles.profileHandle, { color: theme.colors.textSecondary }]}>
                          {profile.handle} • <Text style={{ color: theme.colors.primary }}>{profile.type}</Text>
                        </Text>
                      </View>

                      {/* Custom Checkbox */}
                      <View
                        style={[
                          styles.checkbox,
                          {
                            backgroundColor: profile.selected ? theme.colors.primary : 'transparent',
                            borderColor: profile.selected ? theme.colors.primary : theme.colors.border,
                          },
                        ]}
                      >
                        {profile.selected && <Check size={13} color={theme.colors.btnTextColor} />}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Security Seal */}
                <View style={styles.securitySeal}>
                  <ShieldCheck size={16} color="#00F5A0" />
                  <Text style={styles.securitySealText}>
                    Direct Meta Graph OAuth 2.0. No passwords stored.
                  </Text>
                </View>

                {/* Connect Action Button */}
                <AnimatedButton
                  title={
                    isProcessing
                      ? 'Linking Channels...'
                      : selectedCount > 0
                      ? `Link ${selectedCount} Selected ${selectedCount > 1 ? 'Profiles' : 'Profile'}`
                      : 'Select at least 1 profile'
                  }
                  onPress={handleConnectSelected}
                  loading={isProcessing}
                  disabled={selectedCount === 0}
                  size="lg"
                  style={styles.connectBtn}
                />
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 22,
    maxHeight: '88%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 16.5,
    fontWeight: '900',
  },
  sheetSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  sheetContent: {
    gap: 12,
    paddingBottom: 20,
  },
  helperBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  helperBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  helperBannerText: {
    fontSize: 12,
    fontWeight: '800',
  },
  helperToggleText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  helperContentBox: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  helperStep: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  profilesList: {
    gap: 10,
  },
  profileSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    gap: 12,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E293B',
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 8,
  },
  profileName: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  profileFollowers: {
    fontSize: 11,
    fontWeight: '700',
  },
  profileHandle: {
    fontSize: 12,
    fontWeight: '500',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securitySeal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    marginTop: 2,
  },
  securitySealText: {
    fontSize: 11.5,
    color: '#94A3B8',
    lineHeight: 16,
    flex: 1,
  },
  connectBtn: {
    marginTop: 6,
  },
  connectedManager: {
    gap: 12,
    paddingVertical: 4,
  },
  tokenHealthBox: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
  },
  tokenHealthTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenHealthStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tokenHealthTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  tokenHealthDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  warningAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderColor: 'rgba(244, 63, 94, 0.3)',
    borderWidth: 1,
    gap: 10,
  },
  warningText: {
    color: '#F43F5E',
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '600',
    flex: 1,
  },
});
