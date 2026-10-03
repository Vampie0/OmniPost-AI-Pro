import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { AlertCircle } from 'lucide-react-native';

export default function NotFoundScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AlertCircle size={64} color={theme.colors.primary} style={styles.icon} />
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Page Not Found</Text>
      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
        The screen you are looking for does not exist or has been moved.
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.replace('/')}
      >
        <Text style={[styles.buttonText, { color: theme.colors.btnTextColor }]}>Go to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
