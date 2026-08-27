import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { useConfigStore } from '@/store/useConfigStore';
import { ScreenWrapper } from '@/components/templates/ScreenWrapper';
import { GlassCard, Badge } from '@/components/atoms';
import { CustomToggle } from '@/components/atoms/CustomToggle';
import { useToast } from '@/components/atoms/CustomToast';
import { LUXURY_PALETTES, PaletteKey } from '@socialpilot/tokens';
import { APP_BRANDING } from '@/constants';
import * as SecureStore from 'expo-secure-store';
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
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, paletteKey, setPalette, themeMode, setThemeMode } = useTheme();
  const { showToast } = useToast();
  const appConfig = useConfigStore((state) => state.config);
  const isNavigatingRef = React.useRef(false);

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
        onPress={() => router.back()}
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

      {/* SECTION 1: 5 LUXURY THEME PALETTES */}
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
            <Text style={[styles.themePillText, { color: themeMode === 'dark' ? theme.colors.btnTextColor : theme.colors.textPrimary }]}>
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
            <Text style={[styles.themePillText, { color: themeMode === 'light' ? theme.colors.btnTextColor : theme.colors.textPrimary }]}>
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
              <Text style={[styles.navRowSubtitle, { color: theme.colors.textSecondary }]}>
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
          <Text style={[styles.aboutValue, { color: theme.colors.primary }]}>{APP_BRANDING.supportEmail}</Text>
        </View>
      </GlassCard>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
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
  },
  aboutCard: {
    padding: 16,
    borderRadius: 20,
    gap: 10,
    marginBottom: 20,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aboutLabel: {
    fontSize: 13,
  },
  aboutValue: {
    fontSize: 13,
    fontWeight: '700',
  },
});
