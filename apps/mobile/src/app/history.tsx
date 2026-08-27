import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { ScreenWrapper } from '@/components/templates/ScreenWrapper';
import { GlassCard, Badge } from '@/components/atoms';
import { useToast } from '@/components/atoms/CustomToast';
import { ChevronLeft, Sparkles, Copy, Share2, Bookmark, Layers } from 'lucide-react-native';

const HISTORY_ITEMS = [
  {
    id: '1',
    type: 'Caption & Hook',
    platform: 'Instagram',
    date: 'Today, 2:30 PM',
    content: 'Why 90% of content creators give up in month 2 (and how to build a 7-figure distribution engine).',
  },
  {
    id: '2',
    type: 'Twitter Thread',
    platform: 'Twitter / X',
    date: 'Yesterday',
    content: '5 lessons from building an autonomous social media architecture. 1/ Consistency > Luck. 2/ Automate the tedious parts...',
  },
  {
    id: '3',
    type: 'LinkedIn Thought Leadership',
    platform: 'LinkedIn',
    date: '3 days ago',
    content: 'The shift from manual copywriting to AI-accelerated distribution is not a trend; it is the new baseline for B2B founders.',
  },
];

export default function HistoryVaultScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [activeFilter, setActiveFilter] = useState<'all' | 'captions' | 'threads'>('all');

  const copyItem = (text: string) => {
    showToast({ title: 'Copied to Clipboard!', type: 'success' });
  };

  return (
    <ScreenWrapper scrollable contentContainerStyle={styles.container}>
      <TouchableOpacity
        onPress={() => router.back()}
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
        {HISTORY_ITEMS.map((item) => (
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
