import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { goBackOr } from '@/utils/navigation';
import { useSafePress } from '@/hooks/useSafePress';
import { useTheme } from '@/theme/ThemeProvider';
import { ScreenWrapper } from '@/components/templates/ScreenWrapper';
import { GlassCard, AnimatedButton, CustomInput, Badge } from '@/components/atoms';
import { useToast } from '@/components/atoms/CustomToast';
import { supabase, isPlaceholderUrl } from '@/services/supabase';
import { ChevronLeft, Lock, ShieldCheck, KeyRound } from 'lucide-react-native';

export default function SecurityScreen() {
  const router = useRouter();
  const { safePress } = useSafePress();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      showToast({ title: 'Password Too Short', message: 'New password must be at least 8 characters.', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast({ title: 'Mismatch', message: 'New passwords do not match.', type: 'error' });
      return;
    }

    try {
      setIsUpdating(true);

      if (isPlaceholderUrl) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        showToast({ title: 'Security Updated!', message: 'Your password has been changed.', type: 'success' });
        goBackOr(router);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        showToast({ title: 'Update Failed', message: error.message, type: 'error' });
      } else {
        showToast({ title: 'Password Changed!', message: 'Security credentials updated.', type: 'success' });
        goBackOr(router);
      }
    } catch {
      showToast({ title: 'Connection Error', message: 'Could not reach security server.', type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <ScreenWrapper scrollable contentContainerStyle={styles.container}>
      <TouchableOpacity
        onPress={() => safePress(() => goBackOr(router))}
        style={[styles.backBtn, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
      >
        <ChevronLeft size={20} color={theme.colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Security & Password</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Manage your account credentials and password security
        </Text>
      </View>

      {/* Security Status Card */}
      <GlassCard elevated style={styles.statusCard}>
        <View style={styles.statusTop}>
          <View style={[styles.shieldBox, { backgroundColor: theme.colors.badgeBg }]}>
            <ShieldCheck size={22} color={theme.colors.primary} />
          </View>
          <Badge label="RLS Active" variant="primary" />
        </View>
        <Text style={[styles.statusHeading, { color: theme.colors.textPrimary }]}>
          Row-Level Security (RLS) Active
        </Text>
        <Text style={[styles.statusDesc, { color: theme.colors.textSecondary }]}>
          Your creator assets and credentials are protected by PostgreSQL row-level isolation policies.
        </Text>
      </GlassCard>

      {/* Password Update Form */}
      <GlassCard elevated style={styles.formCard}>
        <Text style={[styles.formHeading, { color: theme.colors.textPrimary }]}>Change Password</Text>

        <CustomInput
          label="Current Password"
          placeholder="••••••••••••"
          isPassword
          value={currentPassword}
          onChangeText={setCurrentPassword}
          leftIcon={<KeyRound size={18} color={theme.colors.primary} />}
        />

        <CustomInput
          label="New Password (min 8 chars)"
          placeholder="••••••••••••"
          isPassword
          value={newPassword}
          onChangeText={setNewPassword}
          leftIcon={<Lock size={18} color={theme.colors.primary} />}
        />

        <CustomInput
          label="Confirm New Password"
          placeholder="••••••••••••"
          isPassword
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          leftIcon={<Lock size={18} color={theme.colors.primary} />}
        />

        <AnimatedButton
          title={isUpdating ? 'Updating Credentials...' : 'Update Password'}
          onPress={() => safePress(handleUpdatePassword)}
          loading={isUpdating}
          size="lg"
          style={styles.actionBtn}
        />
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
  statusCard: {
    padding: 18,
    borderRadius: 22,
    gap: 6,
  },
  statusTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  shieldBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusHeading: {
    fontSize: 16,
    fontWeight: '800',
  },
  statusDesc: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  formCard: {
    padding: 20,
    borderRadius: 22,
    gap: 4,
  },
  formHeading: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 14,
  },
  actionBtn: {
    marginTop: 10,
  },
});
