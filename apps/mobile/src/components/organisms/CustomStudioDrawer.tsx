import React, { useEffect } from 'react';
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
import { useTheme } from '@/theme/ThemeProvider';
import { useAuthStore } from '@/store/useAuthStore';
import { useDrawerStore } from '@/store/useDrawerStore';
import { LUXURY_PALETTES, PaletteKey } from '@socialpilot/tokens';
import { APP_BRANDING } from '@/constants';
import { Badge } from '@/components/atoms';
import {
  Users,
  History,
  Share2,
  Moon,
  Sun,
  Monitor,
  Shield,
  Bell,
  LogOut,
  X,
  Sparkles,
  ChevronRight,
  Check,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(320, width * 0.82);

export const CustomStudioDrawer: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme, paletteKey, setPalette, themeMode, setThemeMode } = useTheme();
  const { signOut } = useAuthStore();
  const { isOpen, closeDrawer } = useDrawerStore();

  const translateX = useSharedValue(-DRAWER_WIDTH - 40);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      backdropOpacity.value = withTiming(1, { duration: 180 });
      translateX.value = withSpring(0, { damping: 18, stiffness: 280 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 160 });
      translateX.value = withSpring(-DRAWER_WIDTH - 40, { damping: 20, stiffness: 300 });
    }
  }, [isOpen]);

  const animatedDrawer = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const animatedBackdrop = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: backdropOpacity.value,
    };
  });

  const navigateTo = (route: any) => {
    closeDrawer();
    setTimeout(() => {
      router.push(route);
    }, 180);
  };

  const handleSignOut = async () => {
    closeDrawer();
    await signOut();
    router.replace('/(auth)/login');
  };

  const paletteEntries = Object.entries(LUXURY_PALETTES) as [PaletteKey, (typeof LUXURY_PALETTES)[PaletteKey]][];

  return (
    <View
      style={[StyleSheet.absoluteFillObject, { zIndex: 9999999 }]}
      pointerEvents={isOpen ? 'auto' : 'none'}
    >
      {/* 1. Backdrop (Tap to Close) */}
      <Animated.View style={[styles.backdrop, animatedBackdrop]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} />
      </Animated.View>

      {/* 2. Slide-In Glass Drawer Container */}
      <Animated.View
        style={[
          styles.drawerContainer,
          {
            width: DRAWER_WIDTH,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 16,
          },
          animatedDrawer,
        ]}
      >
        {/* Top Workspace Header */}
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

          <TouchableOpacity onPress={closeDrawer} style={styles.closeBtn}>
            <X size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drawerContent}>
          {/* Workspace Navigation Links */}
          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>WORKSPACE TOOLS</Text>

          <View style={styles.navGroup}>
            <TouchableOpacity
              onPress={() => navigateTo('/team')}
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
              onPress={() => navigateTo('/history')}
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
              onPress={() => navigateTo('/connected-accounts')}
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

            <TouchableOpacity
              onPress={() => navigateTo('/security')}
              activeOpacity={0.75}
              style={[styles.navItem, { backgroundColor: theme.colors.surfaceSubtle }]}
            >
              <View style={[styles.navIconBox, { backgroundColor: theme.colors.badgeBg }]}>
                <Shield size={16} color={theme.colors.primary} />
              </View>
              <Text style={[styles.navItemText, { color: theme.colors.textPrimary }]}>
                Security & Password
              </Text>
              <ChevronRight size={16} color={theme.colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigateTo('/notification-settings')}
              activeOpacity={0.75}
              style={[styles.navItem, { backgroundColor: theme.colors.surfaceSubtle }]}
            >
              <View style={[styles.navIconBox, { backgroundColor: theme.colors.badgeBg }]}>
                <Bell size={16} color={theme.colors.primary} />
              </View>
              <Text style={[styles.navItemText, { color: theme.colors.textPrimary }]}>
                Notification Alerts
              </Text>
              <ChevronRight size={16} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* 5 Luxury Theme Palettes Picker */}
          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted, marginTop: 14 }]}>
            STUDIO COLOR PALETTES
          </Text>

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
                      {isSelected && <Check size={10} color={pal.dark.btnTextColor} />}
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

          {/* Appearance Mode */}
          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted, marginTop: 14 }]}>
            APPEARANCE MODE
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
        </ScrollView>

        {/* Drawer Footer: Sign Out */}
        <View style={[styles.drawerFooter, { borderTopColor: theme.colors.border }]}>
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
            <LogOut size={16} color="#F43F5E" />
            <Text style={styles.signOutText}>Sign Out of Studio</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  drawerContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    height: '100%',
    borderRightWidth: 1.2,
    paddingHorizontal: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 28,
    elevation: 24,
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
    paddingVertical: 10,
    borderRadius: 14,
  },
  navItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navIconBox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemText: {
    fontSize: 13,
    fontWeight: '700',
  },
  palettesList: {
    gap: 4,
  },
  paletteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  paletteRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
