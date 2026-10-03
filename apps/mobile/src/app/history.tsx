import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { goBackOr } from '@/utils/navigation';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuthStore } from '@/store/useAuthStore';
import { ScreenWrapper } from '@/components/templates/ScreenWrapper';
import { GlassCard, Badge } from '@/components/atoms';
import { useToast } from '@/components/atoms/CustomToast';
import { supabase, isPlaceholderUrl } from '@/services/supabase';
import * as Clipboard from 'expo-clipboard';
import { ChevronLeft, Copy } from 'lucide-react-native';

interface HistoryItem {
  id: string;
  type: string;
  platform: string;
  date: string;
  content: string;
}

const FALLBACK_HISTORY: HistoryItem[] = [];

export default function HistoryVaultScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const user = useAuthStore((state) => state.user);

  const [historyItems, setHistoryItems] = useState<HistoryItem[]>(FALLBACK_HISTORY);

  const loadHistory = useCallback(async () => {
    if (isPlaceholderUrl || !user) return;

    try {
      const { data, error } = await supabase
        .from('ai_logs')
        .select('id, prompt, response, tokens_used, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error || !data) return;

      const items: HistoryItem[] = data.map((log) => ({
        id: log.id,
        type: 'AI Generation',
        platform: 'All Platforms',
        date: new Date(log.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        content: log.response || log.prompt,
      }));

      setHistoryItems(items);
    } catch {
      // Silent fail
    }
  }, [user]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const copyItem = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      showToast({ title: 'Copied to Clipboard!', type: 'success' });
    } catch {
      showToast({ title: 'Copy Failed', message: 'Could not access the clipboard.', type: 'error' });
    }
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
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>AI Generation Vault</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Browse, search, and reuse your previously generated AI content
        </Text>
      </View>

      {/* History Feed */}
      <View style={styles.historyList}>
        {historyItems.length === 0 ? (
          <GlassCard style={styles.historyCard}>
            <Text style={{ color: theme.colors.textMuted, textAlign: 'center', paddingVertical: 20 }}>
              No AI generation history yet. Create some content first!
            </Text>
          </GlassCard>
        ) : historyItems.map((item) => (
          <GlassCard key={item.id} elevated style={styles.historyCard}>
            <View style={styles.cardTop}>
              <View style={styles.badgeRow}>
                <Badge label={item.platform} variant="primary" />
                <Text style={[styles.dateText, { color: theme.colors.textMuted }]}>{item.date}</Text>
              </View>
              <TouchableOpacity onPress={() => copyItem(item.content)} style={styles.copyBtn}>
                <Copy size={16} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.contentText, { color: theme.colors.textPrimary }]}>
              {item.content}
            </Text>
          </GlassCard>
        ))}
      </View>
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
    marginBottom: 8,
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
  historyList: {
    gap: 12,
  },
  historyCard: {
    padding: 16,
    borderRadius: 20,
    gap: 10,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  copyBtn: {
    padding: 4,
  },
  contentText: {
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: '500',
  },
});
