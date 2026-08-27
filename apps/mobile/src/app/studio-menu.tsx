import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSafePress } from '@/hooks/useSafePress';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuthStore } from '@/store/useAuthStore';
import { APP_BRANDING } from '@/constants';
import {
  Users,
  History,
  Share2,
  StickyNote,
  Settings,
  LogOut,
  X,
  Sparkles,
  ChevronRight,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(320, width * 0.82);

export default function StudioMenuScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { safePress } = useSafePress();
  const { theme } = useTheme();
  const { signOut } = useAuthStore();

  const navigateTo = (route: any) => {
    router.back();
    setTimeout(() => {
      router.push(route);
    }, 150);
  };

  const handleSignOut = async () => {
    router.back();
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.screenOverlay}>
      {/* Left-Docked Glass Drawer */}
      <View
        style={[
          styles.drawerContainer,
          {
            width: DRAWER_WIDTH,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        {/* Workspace Brand Header */}
        <View style={styles.drawerHeader}>
          <View style={styles.headerBrandRow}>
            <LinearGradient
              colors={[...theme.colors.primaryGradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.brandIcon}
            >
              <Sparkles size={16} color={theme.colors.btnTextColor} />
            </LinearGradient>
            <View style={styles.headerTextGroup}>
              <Text numberOfLines={1} style={[styles.brandTitle, { color: theme.colors.textPrimary }]}>
                {APP_BRANDING.appName}
              </Text>
              <Text style={[styles.workspaceTag, { color: theme.colors.primary }]}>
                {theme.paletteName.toUpperCase()} WORKSPACE
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => safePress(() => router.back())} style={styles.closeBtn}>
            <X size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drawerContent}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>WORKSPACE TOOLS</Text>

          <View style={styles.navGroup}>
            <TouchableOpacity
              onPress={() => safePress(() => navigateTo('/team'))}
              activeOpacity={0.75}
              style={[styles.navItem, { backgroundColor: theme.colors.surfaceSubtle }]}
            >
              <View style={styles.navItemLeft}>
                <View style={[styles.navIconBox, { backgroundColor: theme.colors.badgeBg }]}>
                  <Users size={16} color={theme.colors.primary} />
                </View>
                <Text style={[styles.navItemText, { color: theme.colors.textPrimary }]}>
                  Team & Collaborators
                </Text>
              </View>
              <ChevronRight size={16} color={theme.colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => safePress(() => navigateTo('/history'))}
              activeOpacity={0.75}
              style={[styles.navItem, { backgroundColor: theme.colors.surfaceSubtle }]}
            >
              <View style={styles.navItemLeft}>
                <View style={[styles.navIconBox, { backgroundColor: theme.colors.badgeBg }]}>
                  <History size={16} color={theme.colors.primary} />
                </View>
                <Text style={[styles.navItemText, { color: theme.colors.textPrimary }]}>
                  AI Generation Vault
                </Text>
              </View>
              <ChevronRight size={16} color={theme.colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => safePress(() => navigateTo('/notes'))}
              activeOpacity={0.75}
              style={[styles.navItem, { backgroundColor: theme.colors.surfaceSubtle }]}
            >
              <View style={styles.navItemLeft}>
                <View style={[styles.navIconBox, { backgroundColor: theme.colors.badgeBg }]}>
                  <StickyNote size={16} color={theme.colors.primary} />
                </View>
                <Text style={[styles.navItemText, { color: theme.colors.textPrimary }]}>
                  Creator Scratchpad & Notes
                </Text>
              </View>
              <ChevronRight size={16} color={theme.colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => safePress(() => navigateTo('/connected-accounts'))}
              activeOpacity={0.75}
              style={[styles.navItem, { backgroundColor: theme.colors.surfaceSubtle }]}
            >
              <View style={styles.navItemLeft}>
                <View style={[styles.navIconBox, { backgroundColor: theme.colors.badgeBg }]}>
                  <Share2 size={16} color={theme.colors.primary} />
                </View>
                <Text style={[styles.navItemText, { color: theme.colors.textPrimary }]}>
                  Connected Channels
                </Text>
              </View>
              <ChevronRight size={16} color={theme.colors.textMuted} />
            </TouchableOpacity>

            {/* Master Settings Hub Trigger */}
            <TouchableOpacity
              onPress={() => safePress(() => navigateTo('/settings'))}
              activeOpacity={0.75}
              style={[styles.navItem, { backgroundColor: theme.colors.surfaceSubtle }]}
            >
              <View style={styles.navItemLeft}>
                <View style={[styles.navIconBox, { backgroundColor: theme.colors.badgeBg }]}>
                  <Settings size={16} color={theme.colors.primary} />
                </View>
                <Text style={[styles.navItemText, { color: theme.colors.textPrimary }]}>
                  Studio Settings
                </Text>
              </View>
              <ChevronRight size={16} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Drawer Footer: Sign Out */}
        <View style={[styles.drawerFooter, { borderTopColor: theme.colors.border }]}>
          <TouchableOpacity onPress={() => safePress(handleSignOut)} style={styles.signOutBtn}>
            <LogOut size={16} color="#F43F5E" />
            <Text style={styles.signOutText}>Sign Out of Studio</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Backdrop (Tap to Close) */}
      <Pressable style={styles.backdrop} onPress={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  screenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    flexDirection: 'row',
  },
  drawerContainer: {
    height: '100%',
    borderRightWidth: 1.2,
    paddingHorizontal: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 28,
    elevation: 24,
  },
  backdrop: {
    flex: 1,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextGroup: {
    flex: 1,
    gap: 1,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  workspaceTag: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  closeBtn: {
    padding: 4,
  },
  drawerContent: {
    gap: 8,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  navGroup: {
    gap: 6,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 14,
  },
  navItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  drawerFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  signOutText: {
    color: '#F43F5E',
    fontSize: 13,
    fontWeight: '700',
  },
});
