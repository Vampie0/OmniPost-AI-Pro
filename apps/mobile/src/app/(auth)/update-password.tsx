import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useSafePress } from '@/hooks/useSafePress';
import { useTheme } from '@/theme/ThemeProvider';
import { ScreenWrapper } from '@/components/templates/ScreenWrapper';
import { AnimatedButton, CustomInput, GlassCard } from '@/components/atoms';
import { useToast } from '@/components/atoms/CustomToast';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { Lock, ShieldCheck } from 'lucide-react-native';
import { z } from 'zod';

const updatePasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

/**
 * Landing screen for the Supabase password-recovery flow (web):
 * the email link redirects here with a recovery session active,
 * and updateUser() applies the new password.
 */
export default function UpdatePasswordScreen() {
  const router = useRouter();
  const { safePress } = useSafePress();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const user = useAuthStore((state) => state.user);
  const passwordRecovery = useAuthStore((state) => state.passwordRecovery);
  const clearPasswordRecovery = useAuthStore((state) => state.clearPasswordRecovery);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Requires the temporary recovery session created by the email link
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  const handleUpdate = async () => {
    setErrors({});
    const validation = updatePasswordSchema.safeParse({ password, confirm });

    if (!validation.success) {
      const formatted: { password?: string; confirm?: string } = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0] === 'password') formatted.password = err.message;
        if (err.path[0] === 'confirm') formatted.confirm = err.message;
      });
      setErrors(formatted);
      showToast({ title: 'Validation Notice', message: 'Please fix the highlighted fields.', type: 'error' });
      return;
    }

    try {
      setIsLoading(true);

      if (!passwordRecovery) {
        // Only a recovery session (from the email link) may set a new password
        showToast({
          title: 'Link Required',
          message: 'Open the reset link from your email to set a new password.',
          type: 'error',
        });
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        showToast({ title: 'Update Failed', message: error.message, type: 'error' });
        return;
      }

      clearPasswordRecovery();
      await fetchProfile(user.id);
      showToast({ title: 'Password Updated', message: 'You are signed in with your new password.', type: 'success' });
      router.replace('/(tabs)');
    } catch {
      showToast({ title: 'Connection Error', message: 'Unable to reach backend.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenWrapper scrollable contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Set New Password</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Choose a new password for <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>{user.email}</Text>. At least 8 characters.
        </Text>
      </View>

      <GlassCard elevated style={styles.formCard}>
        <CustomInput
          label="New Password"
          placeholder="••••••••"
          isPassword
          autoCapitalize="none"
          autoComplete="off"
          textContentType="none"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          leftIcon={<Lock size={18} color={theme.colors.primary} />}
        />

        <CustomInput
          label="Confirm New Password"
          placeholder="••••••••"
          isPassword
          autoCapitalize="none"
          autoComplete="off"
          textContentType="none"
          value={confirm}
          onChangeText={setConfirm}
          error={errors.confirm}
          leftIcon={<Lock size={18} color={theme.colors.primary} />}
        />

        <AnimatedButton
          title="Update Password"
          onPress={() => safePress(handleUpdate)}
          loading={isLoading}
          size="lg"
          icon={<ShieldCheck size={19} color={theme.colors.btnTextColor} />}
          style={styles.actionBtn}
        />
      </GlassCard>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  formCard: {
    padding: 22,
    borderRadius: 24,
  },
  actionBtn: {
    marginTop: 12,
  },
});
