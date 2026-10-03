import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { goBackOr } from '@/utils/navigation';
import { useSafePress } from '@/hooks/useSafePress';
import { useTheme } from '@/theme/ThemeProvider';
import { ScreenWrapper } from '@/components/templates/ScreenWrapper';
import { GlassCard, AnimatedButton, CustomInput } from '@/components/atoms';
import { useToast } from '@/components/atoms/CustomToast';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase, isPlaceholderUrl } from '@/services/supabase';
import {
  Crown,
  CheckCircle2,
  X,
  CreditCard,
  Lock,
} from 'lucide-react-native';

const PLANS = [
  {
    id: 'yearly',
    name: 'Annual VIP Studio',
    price: '$99.99',
    period: '/year',
    subText: 'Only $8.33/month — Billed annually',
    saveBadge: 'SAVE 45%',
    popular: true,
  },
  {
    id: 'monthly',
    name: 'Monthly Pro',
    price: '$19.99',
    period: '/month',
    subText: 'Billed monthly — Cancel anytime',
    saveBadge: null,
    popular: false,
  },
];

const FEATURES = [
  'Unlimited AI Copywriting (Gemini 1.5 Pro)',
  'High-Resolution AI Image Generation (SDXL)',
  'Multi-Platform Autonomous Scheduling',
  'Real-Time Viral Predictor & Growth Analytics',
  'Unlimited Connected Social Accounts',
  'Priority VIP Fast-Lane API Access',
];

type PaymentMethodType = 'card' | 'gpay' | 'paypal';

const PAYMENT_METHODS: { id: PaymentMethodType; label: string; iconLabel: string }[] = [
  { id: 'card', label: 'Credit/Debit Card', iconLabel: '💳' },
  { id: 'gpay', label: Platform.OS === 'ios' ? 'Apple Pay' : 'Google Pay', iconLabel: '⚡' },
  { id: 'paypal', label: 'PayPal', iconLabel: '🅿️' },
];

export default function PaywallScreen() {
  const router = useRouter();
  const { safePress } = useSafePress();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const { user } = useAuthStore();

  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('card');
  const [isProcessing, setIsProcessing] = useState(false);

  // Card Input States
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 16);
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    setCardNumber(formatted);
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 3) {
      setCardExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`);
    } else {
      setCardExpiry(cleaned);
    }
  };

  const currentPlan = PLANS.find((p) => p.id === selectedPlan) || PLANS[0]!;

  const handleSubscribe = async () => {
    if (selectedMethod === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 16) {
        showToast({ title: 'Invalid Card', message: 'Enter a valid 16-digit card number.', type: 'error' });
        return;
      }
      if (cardExpiry.length < 5) {
        showToast({ title: 'Invalid Expiry', message: 'Enter MM/YY expiry date.', type: 'error' });
        return;
      }
      if (cardCvc.length < 3) {
        showToast({ title: 'Invalid CVC', message: 'Enter 3-digit security code.', type: 'error' });
        return;
      }
    }

    setIsProcessing(true);
    try {
      if (isPlaceholderUrl || !user) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setIsProcessing(false);
        showToast({
          title: 'VIP Studio Unlocked!',
          message: `Payment of ${currentPlan.price} processed successfully via ${selectedMethod.toUpperCase()}.`,
          type: 'success',
        });
        goBackOr(router);
        return;
      }

      // Real mode: persist the activation to Supabase (payments themselves are
      // simulated in this template — no PSP is wired; the DB record is real).
      const periodDays = currentPlan.id === 'yearly' ? 365 : 30;
      const periodEnd = new Date(Date.now() + periodDays * 86400000);
      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          tier: 'pro',
          status: 'active',
          current_period_end: periodEnd.toISOString(),
        })
        .select('id');
      if (subError) throw subError;
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ subscription_tier: 'pro' })
        .eq('id', user.id);
      if (profileError) throw profileError;

      setIsProcessing(false);
      showToast({
        title: 'Plan Activated!',
        message: `${currentPlan.name} is active until ${periodEnd.toLocaleDateString()}.`,
        type: 'success',
      });
      goBackOr(router);
    } catch (err) {
      setIsProcessing(false);
      showToast({
        title: 'Subscription Failed',
        message: err instanceof Error ? err.message : 'Please try again.',
        type: 'error',
      });
    }
  };

  return (
    <ScreenWrapper scrollable contentContainerStyle={styles.container}>
      {/* Top Dismiss Button */}
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={() => safePress(() => goBackOr(router))}
          style={[styles.closeBtn, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
        >
          <X size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Hero Crown Header */}
      <View style={styles.header}>
        <View
          style={[
            styles.crownWrapper,
            {
              backgroundColor: theme.colors.badgeBg,
              shadowColor: theme.colors.glowColor,
            },
          ]}
        >
          <Crown size={38} color={theme.colors.primary} />
        </View>

        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          Unlock SocialPilot VIP
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Limitless AI generation, 4K visual synthesis, and automated multi-platform distribution
        </Text>
      </View>

      {/* Feature Checklist */}
      <GlassCard elevated style={styles.featuresCard}>
        <Text style={[styles.featuresHeading, { color: theme.colors.textPrimary }]}>
          Everything Included in VIP:
        </Text>
        <View style={styles.featureList}>
          {FEATURES.map((feat, index) => (
            <View key={index} style={styles.featureRow}>
              <CheckCircle2 size={18} color={theme.colors.primary} />
              <Text style={[styles.featureText, { color: theme.colors.textPrimary }]}>
                {feat}
              </Text>
            </View>
          ))}
        </View>
      </GlassCard>

      {/* Plan Selector Cards */}
      <View style={styles.plansContainer}>
        {PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          return (
            <TouchableOpacity
              key={plan.id}
              onPress={() => setSelectedPlan(plan.id)}
              activeOpacity={0.8}
              style={[
                styles.planCard,
                {
                  backgroundColor: isSelected ? theme.colors.surface : theme.colors.surfaceSubtle,
                  borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
            >
              {plan.popular && (
                <View style={[styles.popularBadge, { backgroundColor: theme.colors.primary }]}>
                  <Text style={[styles.popularBadgeText, { color: theme.colors.btnTextColor }]}>
                    MOST POPULAR
                  </Text>
                </View>
              )}

              <View style={styles.planCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.planName, { color: theme.colors.textPrimary }]}>
                    {plan.name}
                  </Text>
                  <Text style={[styles.planSub, { color: theme.colors.textMuted }]}>
                    {plan.subText}
                  </Text>
                </View>

                {plan.saveBadge && (
                  <View style={[styles.savePill, { backgroundColor: theme.colors.badgeBg, borderColor: theme.colors.badgeBorder }]}>
                    <Text style={[styles.savePillText, { color: theme.colors.badgeText }]}>
                      {plan.saveBadge}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.priceRow}>
                <Text style={[styles.priceValue, { color: theme.colors.textPrimary }]}>
                  {plan.price}
                </Text>
                <Text style={[styles.pricePeriod, { color: theme.colors.textSecondary }]}>
                  {plan.period}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Interactive Payment Method Selector */}
      <View style={styles.paymentSection}>
        <Text style={[styles.paymentSectionTitle, { color: theme.colors.textSecondary }]}>
          Select Payment Method
        </Text>

        <View style={styles.methodsRow}>
          {PAYMENT_METHODS.map((method) => {
            const isSelected = selectedMethod === method.id;
            return (
              <TouchableOpacity
                key={method.id}
                onPress={() => setSelectedMethod(method.id)}
                activeOpacity={0.8}
                style={[
                  styles.methodCard,
                  {
                    backgroundColor: isSelected ? theme.colors.surface : theme.colors.surfaceSubtle,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                    borderWidth: isSelected ? 1.8 : 1,
                  },
                ]}
              >
                <Text style={styles.methodIcon}>{method.iconLabel}</Text>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.methodName,
                    {
                      color: isSelected ? theme.colors.primary : theme.colors.textSecondary,
                      fontWeight: isSelected ? '800' : '600',
                    },
                  ]}
                >
                  {method.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Credit / Debit Card Details Form */}
      {selectedMethod === 'card' && (
        <GlassCard elevated style={styles.cardInputContainer}>
          <CustomInput
            label="Card Number"
            placeholder="4242 4242 4242 4242"
            keyboardType="number-pad"
            value={cardNumber}
            onChangeText={formatCardNumber}
            leftIcon={<CreditCard size={18} color={theme.colors.primary} />}
          />

          <View style={styles.cardDetailsRow}>
            <View style={{ flex: 1 }}>
              <CustomInput
                label="Expiry Date"
                placeholder="MM/YY"
                keyboardType="number-pad"
                value={cardExpiry}
                onChangeText={formatExpiry}
              />
            </View>
            <View style={{ flex: 1 }}>
              <CustomInput
                label="Security CVC"
                placeholder="CVC"
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
                value={cardCvc}
                onChangeText={setCardCvc}
                leftIcon={<Lock size={16} color={theme.colors.primary} />}
              />
            </View>
          </View>
        </GlassCard>
      )}

      {/* Dynamic Subscribe Action Button */}
      <AnimatedButton
        title={
          isProcessing
            ? 'Processing Secure Payment...'
            : selectedMethod === 'card'
            ? `Pay ${currentPlan.price} with Card`
            : selectedMethod === 'gpay'
            ? `Pay ${currentPlan.price} with ${Platform.OS === 'ios' ? 'Apple Pay' : 'Google Pay'}`
            : `Continue to PayPal (${currentPlan.price})`
        }
        onPress={() => safePress(handleSubscribe)}
        loading={isProcessing}
        size="lg"
        style={styles.subscribeBtn}
      />

      {/* Trust & Legal Links */}
      <View style={styles.footerLinks}>
        <TouchableOpacity onPress={() => showToast({ title: 'Purchases Restored', type: 'info' })}>
          <Text style={[styles.footerLinkText, { color: theme.colors.textMuted }]}>Restore Purchases</Text>
        </TouchableOpacity>
        <Text style={{ color: theme.colors.textMuted }}>•</Text>
        <TouchableOpacity onPress={() => showToast({ title: 'Terms & Conditions', type: 'info' })}>
          <Text style={[styles.footerLinkText, { color: theme.colors.textMuted }]}>Terms of Service</Text>
        </TouchableOpacity>
        <Text style={{ color: theme.colors.textMuted }}>•</Text>
        <TouchableOpacity onPress={() => showToast({ title: 'Privacy Policy', type: 'info' })}>
          <Text style={[styles.footerLinkText, { color: theme.colors.textMuted }]}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 2,
  },
  crownWrapper: {
    width: 76,
    height: 76,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  featuresCard: {
    padding: 16,
    borderRadius: 22,
    gap: 10,
  },
  featuresHeading: {
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  featureList: {
    gap: 9,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  featureText: {
    fontSize: 12.5,
    fontWeight: '600',
    flex: 1,
  },
  plansContainer: {
    gap: 10,
  },
  planCard: {
    padding: 16,
    borderRadius: 22,
    position: 'relative',
    gap: 6,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 18,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  popularBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planName: {
    fontSize: 15.5,
    fontWeight: '800',
  },
  planSub: {
    fontSize: 11.5,
    marginTop: 2,
  },
  savePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  savePillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  priceValue: {
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  pricePeriod: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  paymentSection: {
    gap: 8,
  },
  paymentSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  methodsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  methodCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 6,
    borderRadius: 14,
    gap: 4,
  },
  methodIcon: {
    fontSize: 18,
  },
  methodName: {
    fontSize: 11.5,
  },
  cardInputContainer: {
    padding: 16,
    borderRadius: 20,
    gap: 2,
  },
  cardDetailsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  subscribeBtn: {
    width: '100%',
    marginTop: 4,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
    paddingBottom: 20,
  },
  footerLinkText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
