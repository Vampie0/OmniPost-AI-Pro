import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export default function Index() {
  const { user, sessionChecked, isOnboarded, signOut, passwordRecovery } = useAuthStore();
  const { theme } = useTheme();

  if (!sessionChecked) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Password-recovery session from the email link → force the new-password screen
  if (passwordRecovery && user) {
    return <Redirect href="/(auth)/update-password" />;
  }

  if (!isOnboarded) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // Suspended user — force logout with modal
  if (user.is_suspended) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.suspendedCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary }]}>
          <Text style={[styles.suspendedTitle, { color: theme.colors.primary }]}>Account Suspended</Text>
          <Text style={[styles.suspendedMessage, { color: theme.colors.textSecondary }]}>
            Your account has been suspended by the administrator. Contact support for assistance.
          </Text>
          {user.suspension_reason ? (
            <View
              style={[styles.reasonBox, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
            >
              <Text style={[styles.reasonLabel, { color: theme.colors.textMuted }]}>REASON PROVIDED BY ADMIN</Text>
              <Text style={[styles.reasonText, { color: theme.colors.textPrimary }]}>{user.suspension_reason}</Text>
            </View>
          ) : null}
          <TouchableOpacity
            onPress={() => {
              signOut();
            }}
            style={[styles.signOutButton, { backgroundColor: theme.colors.primary }]}
          >
            <Text style={[styles.signOutText, { color: theme.colors.btnTextColor }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suspendedCard: {
    borderRadius: 20,
    padding: 24,
    margin: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  suspendedTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
  },
  suspendedMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  reasonBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
    gap: 6,
    alignSelf: 'stretch',
  },
  reasonLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  reasonText: {
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'center',
  },
  signOutButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
