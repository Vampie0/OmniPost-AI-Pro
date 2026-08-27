import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { ScreenWrapper } from '@/components/templates/ScreenWrapper';
import { AnimatedButton, CustomInput, GlassCard } from '@/components/atoms';
import { useToast } from '@/components/atoms/CustomToast';
import { supabase } from '@/services/supabase';
import { Mail, Lock, User, ChevronLeft, Sparkles } from 'lucide-react-native';
import { z } from 'zod';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export default function RegisterScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ fullName?: string; email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    setErrors({});
    const validation = registerSchema.safeParse({ fullName, email, password });

    if (!validation.success) {
      const formattedErrors: { fullName?: string; email?: string; password?: string } = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0] === 'fullName') formattedErrors.fullName = err.message;
        if (err.path[0] === 'email') formattedErrors.email = err.message;
        if (err.path[0] === 'password') formattedErrors.password = err.message;
      });
      setErrors(formattedErrors);
      showToast({
        title: 'Validation Notice',
        message: 'Please complete all required fields correctly.',
        type: 'error',
      });
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: 'user',
          },
        },
      });

      if (error) {
        showToast({
          title: 'Registration Error',
          message: error.message,
          type: 'error',
        });
      } else if (data.session) {
        showToast({
          title: 'Account Ready!',
          message: 'Welcome to SocialPilot AI.',
          type: 'success',
        });
        router.replace('/(tabs)');
      } else {
        showToast({
          title: 'Verification Sent',
          message: 'Please verify your email to continue.',
          type: 'info',
        });
        router.replace('/(auth)/login');
      }
    } catch {
      showToast({
        title: 'Network Error',
        message: 'Unable to reach authentication server.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenWrapper scrollable contentContainerStyle={styles.scrollContent}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <ChevronLeft size={22} color={theme.colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Get Started</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Create your account and unlock AI content automation
        </Text>
      </View>

      <GlassCard elevated style={styles.formCard}>
        <CustomInput
          label="Full Name"
          placeholder="Jane Doe"
          value={fullName}
          onChangeText={setFullName}
          error={errors.fullName}
          leftIcon={<User size={18} color={theme.colors.textMuted} />}
        />

        <CustomInput
          label="Email Address"
          placeholder="creator@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          leftIcon={<Mail size={18} color={theme.colors.textMuted} />}
        />

        <CustomInput
          label="Password (min 8 chars)"
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          leftIcon={<Lock size={18} color={theme.colors.textMuted} />}
        />

        <AnimatedButton
          title="Create Free Account"
          onPress={handleRegister}
          loading={isLoading}
          size="lg"
          icon={<Sparkles size={18} color="#FFFFFF" />}
          style={styles.submitButton}
        />
      </GlassCard>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
          Already have an account?{' '}
        </Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Text style={[styles.linkText, { color: theme.colors.primary }]}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 22,
    paddingVertical: 20,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    marginBottom: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
  },
  formCard: {
    padding: 24,
    borderRadius: 26,
  },
  submitButton: {
    marginTop: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 26,
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
