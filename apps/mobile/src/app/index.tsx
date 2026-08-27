import React from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function Index() {
  const { user, sessionChecked, isOnboarded, signOut } = useAuthStore();

  if (!sessionChecked) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
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
      <View style={styles.loadingContainer}>
        <View style={styles.suspendedCard}>
          <Text style={styles.suspendedTitle}>Account Suspended</Text>
          <Text style={styles.suspendedMessage}>
            Your account has been suspended by the administrator. Contact support for assistance.
          </Text>
          <TouchableOpacity
            onPress={() => {
              signOut();
            }}
            style={styles.signOutButton}
          >
            <Text style={styles.signOutText}>Sign Out</Text>
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
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suspendedCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    margin: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  suspendedTitle: {
    color: '#EF4444',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
  },
  suspendedMessage: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  signOutButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  signOutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
