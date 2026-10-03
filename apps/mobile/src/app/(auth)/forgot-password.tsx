import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { goBackOr } from '@/utils/navigation';
import { useSafePress } from '@/hooks/useSafePress';
import { useTheme } from '@/theme/ThemeProvider';
import { ScreenWrapper } from '@/components/templates/ScreenWrapper';
import { AnimatedButton, CustomInput, GlassCard } from '@/components/atoms';
import { useToast } from '@/components/atoms/CustomToast';
import { supabase, isPlaceholderUrl } from '@/services/supabase';
import { Mail, ChevronLeft, CheckCircle2, ArrowRight } from 'lucide-react-native';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { safePress } = useSafePress();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleReset = async () => {
    setError(undefined);
    const validation = forgotPasswordSchema.safeParse({ email });

    if (!validation.success) {
      setError(validation.error.issues[0]?.message);
      showToast({ title: 'Invalid Email', message: 'Enter a valid email address.', type: 'error' });
      return;
    }

    try {
      setIsLoading(true);

      if (isPlaceholderUrl) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        setIsSuccess(true);
        showToast({ title: 'Recovery Dispatched', message: 'Instructions sent successfully.', type: 'success' });
        return;
      }

      // Web: send the recovery redirect back to this app's own origin so the
      // update-password screen receives the recovery session. (Native falls
      // back to the project Site URL configured in Supabase.)
      const redirectTo =
        Platform.OS === 'web' && typeof window !== 'undefined'
          ? window.location.origin
          : undefined;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        redirectTo ? { redirectTo } : undefined
      );

      if (resetError) {
        showToast({ title: 'Reset Failed', message: resetError.message, type: 'error' });
      } else {
        setIsSuccess(true);
        showToast({ title: 'Instructions Sent', message: 'Check your email inbox.', type: 'success' });
      }
    } catch {
      showToast({ title: 'Connection Error', message: 'Unable to reach backend.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenWrapper scrollable contentContainerStyle={styles.scrollContent}>
      <TouchableOpacity
        onPress={() => safePress(() => goBackOr(router, '/login'))}
        style={[styles.backBtn, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
      >
        <ChevronLeft size={20} color={theme.colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Reset Password</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Enter your registered email and we will send you password recovery instructions
        </Text>
      </View>

      <GlassCard elevated style={styles.formCard}>
        {isSuccess ? (
          <View style={styles.successState}>
            <View style={[styles.successIconBox, { backgroundColor: theme.colors.badgeBg }]}>
              <CheckCircle2 size={36} color={theme.colors.primary} />
            </View>
            <Text style={[styles.successTitle, { color: theme.colors.textPrimary }]}>Instructions Sent!</Text>
            <Text style={[styles.successText, { color: theme.colors.textSecondary }]}>
              We have dispatched recovery details to <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>{email}</Text>.
            </Text>
            <AnimatedButton
              title="Return to Sign In"
              onPress={() => safePress(() => router.replace('/(auth)/login'))}
              size="md"
              style={styles.returnBtn}
            />
          </View>
        ) : (
          <>
            <CustomInput
              label="Account Email"
              placeholder="alex@company.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="off"
              textContentType="none"
              value={email}
              onChangeText={setEmail}
              error={error}
              leftIcon={<Mail size={18} color={theme.colors.primary} />}
            />

            <AnimatedButton
              title="Send Recovery Email"
              onPress={() => safePress(handleReset)}
              loading={isLoading}
              size="lg"
              icon={<ArrowRight size={19} color={theme.colors.btnTextColor} />}
              style={styles.actionBtn}
            />
          </>
        )}
      </GlassCard>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
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
    marginTop: 8,
  },
  successState: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  successIconBox: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  successText: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
    paddingHorizontal: 8,
  },
  returnBtn: {
    width: '100%',
  },
});
