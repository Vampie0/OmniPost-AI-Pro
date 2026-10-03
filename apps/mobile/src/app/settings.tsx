import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { goBackOr } from '@/utils/navigation';
import { useTheme } from '@/theme/ThemeProvider';
import { useConfigStore } from '@/store/useConfigStore';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase, isPlaceholderUrl } from '@/services/supabase';
import { ScreenWrapper } from '@/components/templates/ScreenWrapper';
import { GlassCard, Badge } from '@/components/atoms';
import { CustomToggle } from '@/components/atoms/CustomToggle';
import { useToast } from '@/components/atoms/CustomToast';
import { LUXURY_PALETTES, PaletteKey } from '@socialpilot/tokens';
import { APP_BRANDING } from '@/constants';
import * as SecureStore from '@/utils/secureStorage';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import {
  ChevronLeft,
  Palette,
  Moon,
  Sun,
  Monitor,
  Bell,
  Shield,
  Check,
  ChevronRight,
  Camera,
  Trash2,
  User,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Extract the storage object path from a public avatars URL so the old
// object can be removed when the avatar is replaced or deleted.
const avatarPathFromUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  const marker = '/object/public/avatars/';
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const path = url.slice(idx + marker.length).split('?')[0];
  return path ? decodeURIComponent(path) : null;
};

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, paletteKey, setPalette, themeMode, setThemeMode } = useTheme();
  const { showToast } = useToast();
  const appConfig = useConfigStore((state) => state.config);
  const user = useAuthStore((s) => s.user);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const isNavigatingRef = React.useRef(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const displayName = user?.full_name || 'User';
  const displayEmail = user?.email || '';
  const avatarUri = user?.avatar_url || null;

  const handlePickAvatar = async () => {
    if (isPlaceholderUrl) {
      showToast({ title: 'Not available in demo mode', type: 'info' });
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to change your profile picture.',
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setAvatarUploading(true);
    try {
      // Derive extension from the picker's MIME type (URIs like content:// have no dot)
      const ext = (asset.mimeType?.split('/')[1] ?? 'jpg').replace(/[^a-z0-9]/g, '') || 'jpg';
      const filePath = `${user!.id}/avatar.${ext}`;
      const oldPath = avatarPathFromUrl(user?.avatar_url);
      const resp = await fetch(asset.uri);
      const blob = await resp.blob();
      // Upload guard: only common image types, max 5 MB (storage policy
      // additionally restricts uploads to the user's own folder).
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (asset.mimeType && !allowedTypes.includes(asset.mimeType)) {
        Alert.alert('Unsupported Image', 'Please choose a JPG, PNG or WEBP image.');
        return;
      }
      if (blob.size > 5 * 1024 * 1024) {
        Alert.alert('Photo Too Large', 'Please choose an image smaller than 5 MB.');
        return;
      }
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, { upsert: true, contentType: asset.mimeType || 'image/jpeg' });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user!.id);
      if (updateError) throw updateError;
      // Remove the previous object if the key changed (avatar.png → avatar.jpg)
      if (oldPath && oldPath !== filePath) {
        await supabase.storage.from('avatars').remove([oldPath]);
      }
      await fetchProfile(user!.id);
      showToast({ title: 'Profile picture updated', type: 'info' });
    } catch {
      Alert.alert('Upload Failed', 'Could not upload your photo. Please try again.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (isPlaceholderUrl) {
      showToast({ title: 'Not available in demo mode', type: 'info' });
      return;
    }
    Alert.alert('Remove Photo', 'Are you sure you want to remove your profile picture?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            const oldPath = avatarPathFromUrl(user?.avatar_url);
            await supabase
              .from('profiles')
              .update({ avatar_url: null })
              .eq('id', user!.id);
            // Delete the stored object too — otherwise the photo stays
            // publicly downloadable from the (public) avatars bucket.
            if (oldPath) {
              await supabase.storage.from('avatars').remove([oldPath]);
            }
            await fetchProfile(user!.id);
            showToast({ title: 'Photo removed', type: 'info' });
          } catch {
            Alert.alert('Error', 'Could not remove photo.');
          }
        },
      },
    ]);
  };

  const navigateSafe = (route: string) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    router.push(route as any);
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 600);
  };

  const appName = appConfig?.app_name || APP_BRANDING.appName;

  // Persistent Notification Preferences
  const [postReminders, setPostReminders] = useState(true);
  const [creditAlerts, setCreditAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);

  useEffect(() => {
    // Load persisted toggle states
    Promise.all([
      SecureStore.getItemAsync('pref_post_reminders'),
      SecureStore.getItemAsync('pref_credit_alerts'),
      SecureStore.getItemAsync('pref_weekly_report'),
    ]).then(([rem, cred, week]) => {
      if (rem !== null) setPostReminders(rem === 'true');
      if (cred !== null) setCreditAlerts(cred === 'true');
      if (week !== null) setWeeklyReport(week === 'true');
    });
  }, []);

  const handleToggle = async (key: string, setter: React.Dispatch<React.SetStateAction<boolean>>, value: boolean) => {
    setter(value);
    await SecureStore.setItemAsync(key, value ? 'true' : 'false');
    showToast({ title: 'Preference Saved', type: 'info' });
  };

  const paletteEntries = Object.entries(LUXURY_PALETTES) as [PaletteKey, (typeof LUXURY_PALETTES)[PaletteKey]][];

  return (
    <ScreenWrapper scrollable contentContainerStyle={styles.container}>
      {/* Top Bar */}
      <TouchableOpacity
        onPress={() => goBackOr(router)}
        style={[styles.backBtn, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
      >
        <ChevronLeft size={20} color={theme.colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Studio Settings</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Manage themes, appearance, security, and notification preferences
        </Text>
      </View>

      {/* SECTION 1: PROFILE */}
      <GlassCard elevated style={styles.sectionCard}>
        <View style={styles.profileContent}>
          <View style={styles.avatarContainer}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatar}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: theme.colors.badgeBg }]}>
                <User size={32} color={theme.colors.primary} />
              </View>
            )}
            {avatarUploading && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            )}
          </View>
          <Text style={[styles.profileName, { color: theme.colors.textPrimary }]}>{displayName}</Text>
          {displayEmail ? (
            <Text style={[styles.profileEmail, { color: theme.colors.textSecondary }]}>{displayEmail}</Text>
          ) : null}
          <View style={styles.profileBtnRow}>
            <TouchableOpacity
              onPress={handlePickAvatar}
              disabled={avatarUploading}
              style={[styles.profileBtn, { backgroundColor: theme.colors.primary }]}
            >
              <Camera size={14} color={theme.colors.btnTextColor} />
              <Text style={[styles.profileBtnText, { color: theme.colors.btnTextColor }]}>
                {avatarUploading ? 'Uploading…' : 'Change Photo'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleRemoveAvatar}
              disabled={avatarUploading || !avatarUri}
              style={[
                styles.profileBtnOutline,
                { borderColor: theme.colors.border },
                (!avatarUri || avatarUploading) && { opacity: 0.4 },
              ]}
            >
              <Trash2 size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.profileBtnOutlineText, { color: theme.colors.textSecondary }]}>
                Remove
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </GlassCard>

      {/* SECTION 2: 5 LUXURY THEME PALETTES */}
      <GlassCard elevated style={styles.sectionCard}>
        <View style={styles.sectionHeadingRow}>
          <View style={[styles.iconBox, { backgroundColor: theme.colors.badgeBg }]}>
            <Palette size={16} color={theme.colors.primary} />
          </View>
          <View>
            <Text style={[styles.sectionHeading, { color: theme.colors.textPrimary }]}>
              Color Palettes
            </Text>
            <Text style={[styles.sectionSub, { color: theme.colors.textMuted }]}>
              Active: {theme.paletteName}
            </Text>
          </View>
        </View>

        <View style={styles.palettesList}>
          {paletteEntries.map(([key, pal]) => {
            const isSelected = paletteKey === key;
            const previewColors = theme.isDark ? pal.dark.primaryGradient : pal.light.primaryGradient;

            return (
              <TouchableOpacity
                key={key}
                onPress={() => setPalette(key)}
                activeOpacity={0.8}
                style={[
                  styles.paletteRow,
                  {
                    backgroundColor: isSelected ? theme.colors.surfaceSubtle : 'transparent',
                    borderColor: isSelected ? theme.colors.primary : 'transparent',
                    borderWidth: isSelected ? 1 : 0,
                  },
                ]}
              >
                <View style={styles.paletteRowLeft}>
                  <LinearGradient
                    colors={[...previewColors]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.paletteCircle}
                  >
                    {isSelected && <Check size={10} color={theme.colors.btnTextColor} />}
                  </LinearGradient>
                  <Text
                    style={[
                      styles.paletteLabel,
                      {
                        color: isSelected ? theme.colors.primary : theme.colors.textSecondary,
                        fontWeight: isSelected ? '800' : '600',
                      },
                    ]}
                  >
                    {pal.name}
                  </Text>
                </View>
                {isSelected && <Badge label="ACTIVE" variant="primary" />}
              </TouchableOpacity>
            );
          })}
        </View>
      </GlassCard>

      {/* SECTION 2: APPEARANCE MODE */}
      <GlassCard elevated style={styles.sectionCard}>
        <Text style={[styles.sectionHeading, { color: theme.colors.textPrimary }]}>
          Appearance Mode
        </Text>

        <View style={[styles.themePillTrack, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}>
          <TouchableOpacity
            onPress={() => setThemeMode('dark')}
            style={[
              styles.themePillBtn,
              themeMode === 'dark' && { backgroundColor: theme.colors.primary },
            ]}
          >
            <Moon size={14} color={themeMode === 'dark' ? theme.colors.btnTextColor : theme.colors.textSecondary} />
            <Text style={[styles.themePillText, { color: themeMode === 'dark' ? theme.colors.btnTextColor : theme.colors.textSecondary }]}>
              Dark
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setThemeMode('light')}
            style={[
              styles.themePillBtn,
              themeMode === 'light' && { backgroundColor: theme.colors.primary },
            ]}
          >
            <Sun size={14} color={themeMode === 'light' ? theme.colors.btnTextColor : theme.colors.textSecondary} />
            <Text style={[styles.themePillText, { color: themeMode === 'light' ? theme.colors.btnTextColor : theme.colors.textSecondary }]}>
              Light
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setThemeMode('system')}
            style={[
              styles.themePillBtn,
              themeMode === 'system' && { backgroundColor: theme.colors.primary },
            ]}
          >
            <Monitor size={14} color={themeMode === 'system' ? theme.colors.btnTextColor : theme.colors.textSecondary} />
            <Text style={[styles.themePillText, { color: themeMode === 'system' ? theme.colors.btnTextColor : theme.colors.textSecondary }]}>
              Auto
            </Text>
          </TouchableOpacity>
        </View>
      </GlassCard>

      {/* SECTION 3: NOTIFICATION ALERTS WITH CUSTOM TOGGLE */}
      <GlassCard elevated style={styles.sectionCard}>
        <View style={styles.sectionHeadingRow}>
          <View style={[styles.iconBox, { backgroundColor: theme.colors.badgeBg }]}>
            <Bell size={16} color={theme.colors.primary} />
          </View>
          <View>
            <Text style={[styles.sectionHeading, { color: theme.colors.textPrimary }]}>
              Notification Alerts
            </Text>
            <Text style={[styles.sectionSub, { color: theme.colors.textMuted }]}>
              Automated push reminders & alerts
            </Text>
          </View>
        </View>

        <View style={styles.switchList}>
          <View style={styles.switchRow}>
            <View style={styles.switchTextGroup}>
              <Text style={[styles.switchTitle, { color: theme.colors.textPrimary }]}>
                Publish Reminders
              </Text>
              <Text style={[styles.switchDesc, { color: theme.colors.textSecondary }]}>
                Alert 5 mins before scheduled auto-posts go live.
              </Text>
            </View>
            <CustomToggle
              value={postReminders}
              onValueChange={(v) => handleToggle('pref_post_reminders', setPostReminders, v)}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchTextGroup}>
              <Text style={[styles.switchTitle, { color: theme.colors.textPrimary }]}>
                Credit Balance Warnings
              </Text>
              <Text style={[styles.switchDesc, { color: theme.colors.textSecondary }]}>
                Notify when AI generation credits drop below 5.
              </Text>
            </View>
            <CustomToggle
              value={creditAlerts}
              onValueChange={(v) => handleToggle('pref_credit_alerts', setCreditAlerts, v)}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchTextGroup}>
              <Text style={[styles.switchTitle, { color: theme.colors.textPrimary }]}>
                Weekly Performance Recap
              </Text>
              <Text style={[styles.switchDesc, { color: theme.colors.textSecondary }]}>
                Weekly viral growth and engagement summary.
              </Text>
            </View>
            <CustomToggle
              value={weeklyReport}
              onValueChange={(v) => handleToggle('pref_weekly_report', setWeeklyReport, v)}
            />
          </View>
        </View>
      </GlassCard>

      {/* SECTION 4: SECURITY & CREDENTIALS (Clean Press - Zero Light Mode Glitch) */}
      <TouchableOpacity
        onPress={() => navigateSafe('/security')}
        activeOpacity={0.7}
      >
        <GlassCard elevated style={styles.navRowCard}>
          <View style={styles.navRowLeft}>
            <View style={[styles.iconBox, { backgroundColor: theme.colors.badgeBg }]}>
              <Shield size={16} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={[styles.navRowTitle, { color: theme.colors.textPrimary }]}>
                Security & Password
              </Text>
              <Text
                style={[styles.navRowSubtitle, { color: theme.colors.textSecondary }]}
                numberOfLines={2}
              >
                Change account password & security credentials
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={theme.colors.textMuted} />
        </GlassCard>
      </TouchableOpacity>

      {/* SECTION 5: APP INFO & LEGAL */}
      <GlassCard elevated style={styles.aboutCard}>
        <View style={styles.aboutRow}>
          <Text style={[styles.aboutLabel, { color: theme.colors.textSecondary }]}>Application</Text>
          <Text style={[styles.aboutValue, { color: theme.colors.textPrimary }]}>{appName} v1.0.0</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={[styles.aboutLabel, { color: theme.colors.textSecondary }]}>Support</Text>
          <Text style={[styles.aboutValue, { color: theme.colors.primary }]}>
            {appConfig?.support_email || APP_BRANDING.supportEmail}
          </Text>
        </View>
      </GlassCard>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 16,
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
  sectionCard: {
    padding: 18,
    borderRadius: 22,
    gap: 14,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeading: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  sectionSub: {
    fontSize: 11.5,
    marginTop: 1,
  },
  palettesList: {
    gap: 6,
  },
  paletteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 13,
  },
  paletteRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  paletteCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteLabel: {
    fontSize: 12.5,
  },
  themePillTrack: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    gap: 4,
  },
  themePillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 11,
    gap: 5,
  },
  themePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  switchList: {
    gap: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  switchTextGroup: {
    flex: 1,
    gap: 2,
    paddingRight: 8,
  },
  switchTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  switchDesc: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  navRowCard: {
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  navRowTitle: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  navRowSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
    flexShrink: 1,
  },
  aboutCard: {
    padding: 16,
    borderRadius: 20,
    gap: 10,
    marginBottom: 20,
  },
  profileContent: {
    alignItems: 'center',
    gap: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 2,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 44,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '800',
  },
  profileEmail: {
    fontSize: 12.5,
    marginTop: -4,
  },
  profileBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
  },
  profileBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  profileBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  profileBtnOutlineText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  aboutLabel: {
    fontSize: 13,
    flexShrink: 0,
  },
  aboutValue: {
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
});
