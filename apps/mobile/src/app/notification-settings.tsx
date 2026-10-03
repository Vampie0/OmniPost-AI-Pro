import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { goBackOr } from '@/utils/navigation';
import { useTheme } from '@/theme/ThemeProvider';
import { ScreenWrapper } from '@/components/templates/ScreenWrapper';
import { GlassCard } from '@/components/atoms';
import { CustomToggle } from '@/components/atoms/CustomToggle';
import { useToast } from '@/components/atoms/CustomToast';
import * as SecureStore from '@/utils/secureStorage';
import { ChevronLeft, Calendar, Zap, BarChart3 } from 'lucide-react-native';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [postReminders, setPostReminders] = useState(true);
  const [creditAlerts, setCreditAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);

  useEffect(() => {
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

  return (
    <ScreenWrapper scrollable contentContainerStyle={styles.container}>
      <TouchableOpacity
        onPress={() => goBackOr(router)}
        style={[styles.backBtn, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
      >
        <ChevronLeft size={20} color={theme.colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Notification Settings</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Control push notifications and automated schedule reminders
        </Text>
      </View>

      <GlassCard elevated style={styles.settingsCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <View style={[styles.iconBox, { backgroundColor: theme.colors.badgeBg }]}>
              <Calendar size={17} color={theme.colors.primary} />
            </View>
            <View style={styles.settingTextGroup}>
              <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                Publish Reminders
              </Text>
              <Text style={[styles.settingDesc, { color: theme.colors.textSecondary }]}>
                Get notified 5 mins before scheduled auto-posts go live.
              </Text>
            </View>
          </View>
          <CustomToggle
            value={postReminders}
            onValueChange={(v) => handleToggle('pref_post_reminders', setPostReminders, v)}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <View style={[styles.iconBox, { backgroundColor: theme.colors.badgeBg }]}>
              <Zap size={17} color={theme.colors.primary} />
            </View>
            <View style={styles.settingTextGroup}>
              <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                Credit Balance Alerts
              </Text>
              <Text style={[styles.settingDesc, { color: theme.colors.textSecondary }]}>
                Alert when your AI generation credits drop below 5.
              </Text>
            </View>
          </View>
          <CustomToggle
            value={creditAlerts}
            onValueChange={(v) => handleToggle('pref_credit_alerts', setCreditAlerts, v)}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <View style={[styles.iconBox, { backgroundColor: theme.colors.badgeBg }]}>
              <BarChart3 size={17} color={theme.colors.primary} />
            </View>
            <View style={styles.settingTextGroup}>
              <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                Weekly Performance Summary
              </Text>
              <Text style={[styles.settingDesc, { color: theme.colors.textSecondary }]}>
                Receive weekly viral growth & reach recap.
              </Text>
            </View>
          </View>
          <CustomToggle
            value={weeklyReport}
            onValueChange={(v) => handleToggle('pref_weekly_report', setWeeklyReport, v)}
          />
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
    marginBottom: 6,
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
  settingsCard: {
    padding: 18,
    borderRadius: 24,
    gap: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTextGroup: {
    flex: 1,
    gap: 2,
    paddingRight: 8,
  },
  settingTitle: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  settingDesc: {
    fontSize: 11.5,
    lineHeight: 16,
  },
});
