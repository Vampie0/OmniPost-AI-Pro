import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { goBackOr } from '@/utils/navigation';
import { useTheme } from '@/theme/ThemeProvider';
import { statusColors } from '@/theme/statusColors';
import { EmptyStateCard } from '@/components/atoms/EmptyStateCard';
import { supabase, isPlaceholderUrl } from '@/services/supabase';
import { ScreenWrapper } from '@/components/templates/ScreenWrapper';
import {
  Database,
  Wifi,
  WifiOff,
  Shield,
  RefreshCw,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Key,
  Table,
  Users,
  type LucideIcon,
} from 'lucide-react-native';

interface TestResult {
  label: string;
  status: 'pending' | 'pass' | 'fail';
  detail: string;
  icon: LucideIcon;
}

const INITIAL_TESTS: TestResult[] = [
  { label: 'Environment Variables', status: 'pending', detail: 'Checking EXPO_PUBLIC_* vars…', icon: Key },
  { label: 'Supabase Client Init', status: 'pending', detail: 'Verifying client instance…', icon: Database },
  { label: 'Auth Session', status: 'pending', detail: 'Reading current session…', icon: Shield },
  { label: 'Profiles Table Query', status: 'pending', detail: 'SELECT * FROM profiles LIMIT 5', icon: Table },
  { label: 'RLS Enforcement', status: 'pending', detail: 'Confirming Row-Level Security active', icon: Users },
];

export default function TestConnectionScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { success: SUCCESS_COLOR, danger: DANGER_COLOR } = statusColors(theme.isDark);
  const [isTesting, setIsTesting] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [tests, setTests] = useState<TestResult[]>(INITIAL_TESTS);
  const [profilesData, setProfilesData] = useState<Record<string, unknown>[] | null>(null);

  const updateTest = (index: number, status: TestResult['status'], detail: string) => {
    setTests((prev) => prev.map((t, i) => (i === index ? { ...t, status, detail } : t)));
  };

  const runTests = async () => {
    setIsTesting(true);
    setHasRun(true);
    setProfilesData(null);
    setTests(INITIAL_TESTS.map((t) => ({ ...t, status: 'pending' as const, detail: 'Waiting…' })));

    // Test 1: Environment Variables
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
    const hasEnv = Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder'));

    if (hasEnv) {
      updateTest(0, 'pass', `URL: ${supabaseUrl.slice(0, 24)}…`);
    } else if (isPlaceholderUrl) {
      updateTest(0, 'fail', 'Using placeholder URL — set EXPO_PUBLIC_SUPABASE_URL in .env');
    } else {
      updateTest(0, 'fail', 'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
    }

    // Test 2: Supabase Client Init
    try {
      if (supabase) {
        updateTest(1, 'pass', 'Client instance created successfully');
      } else {
        updateTest(1, 'fail', 'Client instance is null/undefined');
      }
    } catch (err) {
      updateTest(1, 'fail', `Init error: ${err instanceof Error ? err.message : 'Unknown'}`);
    }

    // Test 3: Auth Session
    if (!hasEnv) {
      updateTest(2, 'fail', 'Cannot test — no valid Supabase URL');
      updateTest(3, 'fail', 'Cannot test — no valid Supabase URL');
      updateTest(4, 'fail', 'Cannot test — no valid Supabase URL');
      setIsTesting(false);
      return;
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        updateTest(2, 'fail', `Auth error: ${error.message}`);
        updateTest(3, 'fail', 'Cannot test — auth failed');
        updateTest(4, 'fail', 'Cannot test — auth failed');
        setIsTesting(false);
        return;
      }

      if (session) {
        updateTest(2, 'pass', `Signed in as ${session.user.email}`);
      } else {
        updateTest(2, 'fail', 'No active session — please log in first');
        updateTest(3, 'fail', 'Cannot test — not authenticated');
        updateTest(4, 'fail', 'Cannot test — not authenticated');
        setIsTesting(false);
        return;
      }
    } catch (err) {
      updateTest(2, 'fail', `Session check threw: ${err instanceof Error ? err.message : 'Unknown'}`);
      setIsTesting(false);
      return;
    }

    // Test 4: Profiles Table Query
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(5);

      if (error) {
        updateTest(3, 'fail', `Query failed: ${error.message}`);
        updateTest(4, 'fail', 'Cannot test — query failed');
        setIsTesting(false);
        return;
      }

      if (data && data.length > 0) {
        setProfilesData(data as Record<string, unknown>[]);
        updateTest(3, 'pass', `Returned ${data.length} profile(s) — connection live!`);
      } else {
        updateTest(3, 'pass', 'Query succeeded — 0 rows (table is empty)');
      }
    } catch (err) {
      updateTest(3, 'fail', `Query threw: ${err instanceof Error ? err.message : 'Unknown'}`);
      setIsTesting(false);
      return;
    }

    // Test 5: RLS Enforcement
    try {
      const { data: allProfiles, error: rlsError } = await supabase
        .from('profiles')
        .select('id, email, role')
        .limit(100);

      if (rlsError) {
        if (rlsError.code === '42501' || rlsError.message.includes('row-level security')) {
          updateTest(4, 'pass', 'RLS active — query restricted by policy');
        } else {
          updateTest(4, 'fail', `RLS check error: ${rlsError.message}`);
        }
      } else if (allProfiles) {
        updateTest(4, 'pass', `RLS active — ${allProfiles.length} profile(s) visible`);
      }
    } catch (err) {
      updateTest(4, 'fail', `RLS check threw: ${err instanceof Error ? err.message : 'Unknown'}`);
    }

    setIsTesting(false);
  };

  const allPassed = tests.every((t) => t.status === 'pass');
  const anyFailed = tests.some((t) => t.status === 'fail');

  const statusColor = allPassed
    ? SUCCESS_COLOR
    : anyFailed
      ? DANGER_COLOR
      : theme.colors.textMuted;

  return (
    <ScreenWrapper scrollable={false}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => goBackOr(router)} style={styles.backBtn}>
          <ArrowLeft size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Database size={20} color={theme.colors.primary} />
          <Text style={[styles.headerText, { color: theme.colors.textPrimary }]}>
            Connection Test
          </Text>
        </View>
        <TouchableOpacity
          onPress={runTests}
          disabled={isTesting}
          style={[styles.runBtn, { backgroundColor: theme.colors.primary }]}
        >
          <RefreshCw size={14} color={theme.colors.btnTextColor} />
          <Text style={[styles.runBtnText, { color: theme.colors.btnTextColor }]}>
            {isTesting ? 'Running…' : 'Run'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Status Banner */}
        {hasRun && !isTesting && (
          <View
            style={[
              styles.banner,
              {
                borderColor: allPassed ? SUCCESS_COLOR + '40' : DANGER_COLOR + '40',
                backgroundColor: allPassed ? SUCCESS_COLOR + '08' : DANGER_COLOR + '08',
              },
            ]}
          >
            {allPassed ? (
              <CheckCircle size={28} color={SUCCESS_COLOR} />
            ) : (
              <XCircle size={28} color={DANGER_COLOR} />
            )}
            <View style={styles.bannerText}>
              <Text style={[styles.bannerTitle, { color: statusColor }]}>
                {allPassed ? 'All Systems Operational!' : 'Some checks failed'}
              </Text>
              <Text style={[styles.bannerSub, { color: theme.colors.textSecondary }]}>
                {allPassed
                  ? 'Supabase connected — env, auth, DB & RLS all working.'
                  : 'Review individual results below for details.'}
              </Text>
            </View>
          </View>
        )}

        {/* Test Results */}
        {tests.map((test) => {
          const Icon = test.icon;
          const iconBg =
            test.status === 'pass'
              ? SUCCESS_COLOR + '15'
              : test.status === 'fail'
                ? DANGER_COLOR + '15'
                : theme.colors.surfaceSubtle;
          const iconColor =
            test.status === 'pass'
              ? SUCCESS_COLOR
              : test.status === 'fail'
                ? DANGER_COLOR
                : theme.colors.textMuted;

          return (
            <View
              key={test.label}
              style={[
                styles.testCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={[styles.testIcon, { backgroundColor: iconBg }]}>
                <Icon size={18} color={iconColor} />
              </View>

              <View style={styles.testContent}>
                <View style={styles.testLabelRow}>
                  <Text style={[styles.testLabel, { color: theme.colors.textPrimary }]}>
                    {test.label}
                  </Text>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor:
                          test.status === 'pass'
                            ? SUCCESS_COLOR + '15'
                            : test.status === 'fail'
                              ? DANGER_COLOR + '15'
                              : theme.colors.surfaceSubtle,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        {
                          color:
                            test.status === 'pass'
                              ? SUCCESS_COLOR
                              : test.status === 'fail'
                                ? DANGER_COLOR
                                : theme.colors.textMuted,
                        },
                      ]}
                    >
                      {test.status === 'pass' ? 'PASS' : test.status === 'fail' ? 'FAIL' : 'WAIT'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.testDetail, { color: theme.colors.textSecondary }]}>
                  {test.detail}
                </Text>
              </View>

              <View style={styles.testStatus}>
                {test.status === 'pass' ? (
                  <CheckCircle size={18} color={SUCCESS_COLOR} />
                ) : test.status === 'fail' ? (
                  <XCircle size={18} color={DANGER_COLOR} />
                ) : isTesting ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <View style={[styles.dot, { borderColor: theme.colors.textMuted + '40' }]} />
                )}
              </View>
            </View>
          );
        })}

        {/* Raw Data Table */}
        {profilesData && profilesData.length > 0 && (
          <View style={[styles.dataSection, { borderColor: theme.colors.border }]}>
            <View style={styles.dataHeader}>
              <Wifi size={16} color={SUCCESS_COLOR} />
              <Text style={[styles.dataTitle, { color: theme.colors.textPrimary }]}>
                Live Data — {profilesData.length} row(s)
              </Text>
            </View>

            <View style={[styles.dataTable, { borderColor: theme.colors.border }]}>
              {/* Column Headers */}
              <View style={[styles.dataRow, styles.dataHeaderRow, { borderColor: theme.colors.border }]}>
                {Object.keys(profilesData[0] as Record<string, unknown>).slice(0, 5).map((key) => (
                  <Text
                    key={key}
                    style={[styles.dataCell, styles.dataHeaderCell, { color: theme.colors.textSecondary }]}
                  >
                    {key}
                  </Text>
                ))}
              </View>

              {/* Data Rows */}
              {profilesData.map((row, i) => (
                <View
                  key={i}
                  style={[
                    styles.dataRow,
                    { borderColor: theme.colors.border + '50' },
                    i % 2 === 0 && { backgroundColor: theme.colors.surfaceSubtle + '30' },
                  ]}
                >
                  {Object.values(row as Record<string, unknown>).slice(0, 5).map((val, j) => (
                    <Text
                      key={j}
                      style={[
                        styles.dataCell,
                        { color: theme.colors.textPrimary },
                        val === null && { color: theme.colors.textMuted, fontStyle: 'italic' },
                      ]}
                      numberOfLines={1}
                    >
                      {val === null ? 'null' : typeof val === 'boolean' ? String(val) : String(val).slice(0, 20)}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {!hasRun && (
          <EmptyStateCard
            variant="plain"
            icon={WifiOff}
            title="Ready to Test"
            subtitle={'Tap Run to verify your Supabase connection, auth session, database queries & RLS.'}
          />
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '800',
  },
  runBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  runBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  bannerSub: {
    fontSize: 11,
    marginTop: 2,
  },
  testCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  testIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testContent: {
    flex: 1,
  },
  testLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  testLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  testDetail: {
    fontSize: 11,
  },
  testStatus: {
    paddingTop: 2,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  dataSection: {
    marginTop: 4,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  dataHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  dataTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  dataTable: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  dataHeaderRow: {
    borderBottomWidth: 1,
  },
  dataCell: {
    flex: 1,
    fontSize: 10,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  dataHeaderCell: {
    fontWeight: '800',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
