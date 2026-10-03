import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { goBackOr } from '@/utils/navigation';
import { useSafePress } from '@/hooks/useSafePress';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuthStore } from '@/store/useAuthStore';
import { ScreenWrapper } from '@/components/templates/ScreenWrapper';
import { GlassCard, AnimatedButton, CustomInput } from '@/components/atoms';
import { PhoneInput } from '@/components/atoms/PhoneInput';
import { useToast } from '@/components/atoms/CustomToast';
import { supabase, isPlaceholderUrl } from '@/services/supabase';
import { ChevronLeft, Camera, User, Mail, FileText } from 'lucide-react-native';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop',
];

export default function EditProfileScreen() {
  const router = useRouter();
  const { safePress } = useSafePress();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const { user, fetchProfile } = useAuthStore();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email] = useState(user?.email || '');
  const [bio, setBio] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar_url || AVATAR_PRESETS[0]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      showToast({ title: 'Name Required', message: 'Please enter your full name.', type: 'error' });
      return;
    }

    try {
      setIsSaving(true);

      if (isPlaceholderUrl || !user) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        showToast({ title: 'Profile Updated!', message: 'Personal details saved successfully.', type: 'success' });
        goBackOr(router);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          avatar_url: selectedAvatar,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        showToast({ title: 'Update Failed', message: error.message, type: 'error' });
      } else {
        await fetchProfile(user.id);
        showToast({ title: 'Profile Saved!', message: 'Your changes are live.', type: 'success' });
        goBackOr(router);
      }
    } catch {
      showToast({ title: 'Connection Error', message: 'Unable to update profile.', type: 'error' });
    } finally {
      setIsSaving(false);
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
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Edit Profile</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Update your public creator identity and personal details
        </Text>
      </View>

      {/* 1. Avatar Studio Picker */}
      <GlassCard elevated style={styles.avatarCard}>
        <View style={styles.currentAvatarWrapper}>
          <Image source={{ uri: selectedAvatar }} style={styles.currentAvatarImg} />
          <View style={[styles.cameraBadge, { backgroundColor: theme.colors.primary, borderColor: theme.colors.surface }]}>
            <Camera size={14} color={theme.colors.btnTextColor} />
          </View>
        </View>

        <Text style={[styles.avatarHint, { color: theme.colors.textSecondary }]}>
          Choose Avatar Preset
        </Text>

        <View style={styles.presetsRow}>
          {AVATAR_PRESETS.map((uri, idx) => {
            const isSelected = selectedAvatar === uri;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedAvatar(uri)}
                style={[
                  styles.presetOption,
                  {
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                    borderWidth: isSelected ? 2.5 : 1,
                  },
                ]}
              >
                <Image source={{ uri }} style={styles.presetImg} />
              </TouchableOpacity>
            );
          })}
        </View>
      </GlassCard>

      {/* 2. Personal Information Fields */}
      <GlassCard elevated style={styles.formCard}>
        <CustomInput
          label="Full Name"
          placeholder="Enter your full name"
          value={fullName}
          onChangeText={setFullName}
          leftIcon={<User size={18} color={theme.colors.primary} />}
        />

        <CustomInput
          label="Email Address (Account Linked)"
          value={email}
          editable={false}
          leftIcon={<Mail size={18} color={theme.colors.textMuted} />}
          style={{ opacity: 0.6 }}
        />

        <PhoneInput
          label="Phone Number (Optional)"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />

        <CustomInput
          label="Creator Bio"
          placeholder="Write a brief tagline or bio..."
          multiline
          numberOfLines={2}
          value={bio}
          onChangeText={setBio}
          leftIcon={<FileText size={18} color={theme.colors.primary} />}
        />

        <AnimatedButton
          title={isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
          onPress={() => safePress(handleSaveProfile)}
          loading={isSaving}
          size="lg"
          style={styles.saveBtn}
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
  avatarCard: {
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 22,
    gap: 10,
  },
  currentAvatarWrapper: {
    position: 'relative',
    marginBottom: 4,
  },
  currentAvatarImg: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarHint: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  presetOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  presetImg: {
    width: '100%',
    height: '100%',
  },
  formCard: {
    padding: 20,
    borderRadius: 22,
    gap: 4,
  },
  saveBtn: {
    marginTop: 10,
  },
});
