import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { goBackOr } from '@/utils/navigation';
import { useTheme } from '@/theme/ThemeProvider';
import { EmptyStateCard } from '@/components/atoms/EmptyStateCard';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationsStore, InboxNotification, NotificationKind } from '@/store/useNotificationsStore';
import { ScreenWrapper } from '@/components/templates/ScreenWrapper';
import { GlassCard } from '@/components/atoms';
import {
  ChevronLeft,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Megaphone,
  Settings,
  BellOff,
  CheckCheck,
} from 'lucide-react-native';

const TYPE_ICON: Record<NotificationKind, typeof Info> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  promo: Megaphone,
  system: Settings,
};

const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const user = useAuthStore((state) => state.user);

  const items = useNotificationsStore((state) => state.items);
  const unreadCount = useNotificationsStore((state) => state.unreadCount);
  const isLoading = useNotificationsStore((state) => state.isLoading);
  const fetchNotifications = useNotificationsStore((state) => state.fetchNotifications);
  const markRead = useNotificationsStore((state) => state.markRead);
  const markAllRead = useNotificationsStore((state) => state.markAllRead);

  // Refresh the inbox every time this screen mounts (realtime inserts already
  // land live via the store subscription while the app is open).
  useEffect(() => {
    if (user?.id) fetchNotifications(user.id);
  }, [user?.id]);

  const handleTapNotification = (item: InboxNotification) => {
    markRead(item.id);
    // Deep-link known notification kinds to their source screen
    const kind = item.metadata?.kind;
    if (kind === 'team_invite') router.push('/team');
  };

  return (
    <ScreenWrapper scrollable contentContainerStyle={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity
          onPress={() => goBackOr(router)}
          style={[styles.backBtn, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
        >
          <ChevronLeft size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Notifications</Text>
        {unreadCount > 0 && user?.id ? (
          <TouchableOpacity
            onPress={() => markAllRead(user.id)}
            style={[styles.markAllBtn, { backgroundColor: theme.colors.badgeBg, borderColor: theme.colors.badgeBorder }]}
          >
            <CheckCheck size={14} color={theme.colors.badgeText} />
            <Text style={[styles.markAllText, { color: theme.colors.badgeText }]}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.markAllPlaceholder} />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => user?.id && fetchNotifications(user.id)}
            tintColor={theme.colors.primary}
          />
        }
      >
        {items.length === 0 && !isLoading ? (
          <EmptyStateCard
            variant="plain"
            icon={BellOff}
            title="All caught up"
            subtitle="Team invites, admin alerts and account updates will appear here."
          />
        ) : (
          items.map((item) => {
            const Icon = TYPE_ICON[item.type] ?? Info;
            return (
              <GlassCard key={item.id} elevated style={styles.itemCard}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleTapNotification(item)}
                  style={styles.itemRow}
                >
                  <View style={[styles.iconBox, { backgroundColor: theme.colors.badgeBg }]}>
                    <Icon size={18} color={theme.colors.primary} />
                  </View>
                  <View style={styles.itemBody}>
                    <View style={styles.itemTitleRow}>
                      <Text style={[styles.itemTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      {!item.is_read && (
                        <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />
                      )}
                    </View>
                    <Text style={[styles.itemBodyText, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                      {item.body}
                    </Text>
                    <Text style={[styles.itemTime, { color: theme.colors.textMuted }]}>
                      {timeAgo(item.created_at)}
                    </Text>
                  </View>
                </TouchableOpacity>
              </GlassCard>
            );
          })
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
    flex: 1,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '800',
  },
  markAllPlaceholder: {
    width: 110,
  },
  listContainer: {
    gap: 10,
    paddingBottom: 30,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyDesc: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 24,
  },
  itemCard: {
    padding: 0,
    borderRadius: 20,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: {
    flex: 1,
    gap: 3,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  itemBodyText: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  itemTime: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
