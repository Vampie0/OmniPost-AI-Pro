'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase, isPlaceholderUrl } from '@/lib/supabase';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
  Layers,
  Palette,
  CheckCircle2,
  Star,
  KeyRound,
  Fingerprint,
} from 'lucide-react';
import { CosmicSocialSplash } from '@/components/ui/CosmicSocialSplash';
import { ThemeModeToggle } from '@/components/ThemePicker';

// Zod Schemas
const passwordLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const otpLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  otpCode: z.string().optional(),
});

type PasswordLoginForm = z.infer<typeof passwordLoginSchema>;
type OtpLoginForm = z.infer<typeof otpLoginSchema>;

export default function SaaSAdminLandingPage() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // RHF for password login
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordLoginForm>({
    resolver: zodResolver(passwordLoginSchema),
    defaultValues: {
      email: 'admin@socialpilot.ai',
      password: 'password123',
    },
  });

  // RHF for OTP login
  const {
    register: registerOtp,
    handleSubmit: handleSubmitOtp,
    formState: { errors: otpErrors },
  } = useForm<OtpLoginForm>({
    resolver: zodResolver(otpLoginSchema),
    defaultValues: {
      email: 'admin@socialpilot.ai',
      otpCode: '',
    },
  });

  const handlePasswordLogin = async (data: PasswordLoginForm) => {
    try {
      setIsLoading(true);

      if (isPlaceholderUrl) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        toast.success('Welcome back, Super Admin! (Mock Session)');
        router.replace('/');
        return;
      }

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email.trim(),
        password: data.password,
      });

      if (error || !authData.user) {
        toast.error(error?.message || 'Invalid email or master password');
        setIsLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, is_suspended')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        toast.error('Could not verify admin security privileges.');
        setIsLoading(false);
        return;
      }

      if (profile.is_suspended) {
        await supabase.auth.signOut();
        toast.error('Your administrator account is suspended.');
        setIsLoading(false);
        return;
      }

      if (profile.role !== 'admin' && profile.role !== 'super_admin') {
        await supabase.auth.signOut();
        toast.error('Access Denied: Administrative role required.');
        setIsLoading(false);
        return;
      }

      toast.success('Welcome to SocialPilot Control Center');
      router.replace('/');
    } catch {
      toast.error('Connection error occurred while logging in.');
      setIsLoading(false);
    }
  };

  const handleOtpLogin = async (data: OtpLoginForm) => {
    try {
      setIsLoading(true);

      if (!otpSent) {
        // Send OTP / Magic link
        if (isPlaceholderUrl) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          setOtpSent(true);
          toast.success('Verification code sent to your email (Mock: Use code 123456)');
          setIsLoading(false);
          return;
        }

        const { error } = await supabase.auth.signInWithOtp({
          email: data.email.trim(),
          options: {
            shouldCreateUser: false,
          },
        });

        if (error) {
          toast.error(error.message || 'Failed to send OTP code');
          setIsLoading(false);
          return;
        }

        setOtpSent(true);
        toast.success(`Verification link & code dispatched to ${data.email}`);
        setIsLoading(false);
      } else {
        // Verify OTP
        const code = data.otpCode?.trim();
        if (!code) {
          toast.error('Please enter the 6-digit verification code');
          setIsLoading(false);
          return;
        }

        if (isPlaceholderUrl) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          toast.success('Identity verified. Entering workspace...');
          router.replace('/');
          return;
        }

        const { data: verifyData, error } = await supabase.auth.verifyOtp({
          email: data.email.trim(),
          token: code,
          type: 'email',
        });

        if (error || !verifyData.user) {
          toast.error(error?.message || 'Invalid or expired OTP code');
          setIsLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role, is_suspended')
          .eq('id', verifyData.user.id)
          .single();

        if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
          await supabase.auth.signOut();
          toast.error('Unauthorized: Admin credentials required.');
          setIsLoading(false);
          return;
        }

        toast.success('OTP Authentication Successful');
        router.replace('/');
      }
    } catch {
      toast.error('An unexpected authentication error occurred.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-bg text-text-primary relative selection:bg-primary selection:text-btn-text">
      {/* 1. Animated Cosmic Social Splash Screen */}
      {showSplash && (
        <CosmicSocialSplash
          durationMs={2000}
          onFinish={() => setShowSplash(false)}
          appName="SocialPilot AI Pro"
          tagline="Autonomous Multi-Platform Growth Engine"
        />
      )}

      {/* Global Background Grid & Glows */}
      <div
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(rgba(124, 58, 237, 0.18) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-primary opacity-15 blur-[120px] pointer-events-none rounded-full" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-glow/20">
              <Sparkles className="w-5 h-5 text-btn-text" />
            </div>
            <span className="text-lg font-black tracking-tight text-text-primary">
              SocialPilot<span className="text-primary font-bold">.AI</span>
            </span>
            <span className="hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider text-badge-text bg-badge-bg border border-badge-border px-2 py-0.5 rounded-full">
              Enterprise v3.0
            </span>
          </div>

          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-text-secondary">
              <a href="#features" className="hover:text-text-primary transition">
                Features
              </a>
              <a href="#pricing" className="hover:text-text-primary transition">
                Pricing
              </a>
              <a href="#testimonials" className="hover:text-text-primary transition">
                Wall of Love
              </a>
            </nav>
            <ThemeModeToggle />
            <a
              href="#auth-card"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-btn-text text-xs font-bold hover:opacity-95 transition shadow-sm"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Landing Flow */}
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-10 border border-border-active-30 text-primary text-xs font-bold"
              >
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span>Next-Gen Gemini 1.5 Pro & SDXL Multi-Platform AI</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-text-primary leading-[1.1]"
              >
                Sovereign AI Social Management for{' '}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Agencies & Creators
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-base sm:text-lg text-text-secondary max-w-xl leading-relaxed"
              >
                Generate multi-platform viral posts, visual creatives with SDXL,
                schedule with intelligent queueing, and deliver bespoke white-labeled
                mobile apps with real-time WebSocket dynamic theming.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap items-center gap-4 pt-2"
              >
                <a
                  href="#auth-card"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-primary text-btn-text font-extrabold text-sm shadow-xl shadow-glow/25 hover:opacity-95 transition"
                >
                  <span>Enter Admin Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-surface-subtle border border-border hover:border-active-50 text-text-primary font-semibold text-sm transition"
                >
                  <span>Explore Architecture</span>
                </a>
              </motion.div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-border/80 grid grid-cols-3 gap-4 max-w-md">
                <div>
                  <div className="text-2xl font-black text-text-primary">99.9%</div>
                  <div className="text-xs text-text-muted">Uptime SLA</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-primary">50M+</div>
                  <div className="text-xs text-text-muted">Tokens Generated</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-success">100%</div>
                  <div className="text-xs text-text-muted">White-Label Sync</div>
                </div>
              </div>
            </div>

            {/* Right Interactive Auth Portal Card */}
            <div id="auth-card" className="lg:col-span-5">
              <div className="glass-panel rounded-3xl p-7 sm:p-8 shadow-2xl border border-border relative overflow-hidden">
                {/* Top Subtle Light Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-primary" />

                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-extrabold text-text-primary">
                      Admin Portal Login
                    </h2>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Supabase Enterprise RBAC Protected
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-surface-subtle border border-border flex items-center justify-center text-primary">
                    <Fingerprint className="w-5 h-5" />
                  </div>
                </div>

                {/* Tab Switcher: Password vs OTP */}
                <div className="grid grid-cols-2 p-1 rounded-xl bg-surface-subtle border border-border mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('password');
                      setOtpSent(false);
                    }}
                    className={`py-2 text-xs font-bold rounded-lg transition ${
                      authMode === 'password'
                        ? 'bg-surface text-text-primary shadow-sm border border-border'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    Password Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('otp')}
                    className={`py-2 text-xs font-bold rounded-lg transition ${
                      authMode === 'otp'
                        ? 'bg-surface text-text-primary shadow-sm border border-border'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    OTP Magic Code
                  </button>
                </div>

                {/* Password Mode Form */}
                {authMode === 'password' && (
                  <form
                    onSubmit={handleSubmitPassword(handlePasswordLogin)}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                        Admin Email
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          {...registerPassword('email')}
                          placeholder="admin@socialpilot.ai"
                          className="w-full bg-input-bg border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-active transition"
                        />
                      </div>
                      {passwordErrors.email && (
                        <p className="text-xs text-danger mt-1">
                          {passwordErrors.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                        Master Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          {...registerPassword('password')}
                          placeholder="••••••••••••"
                          className="w-full bg-input-bg border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-active transition"
                        />
                      </div>
                      {passwordErrors.password && (
                        <p className="text-xs text-danger mt-1">
                          {passwordErrors.password.message}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-primary hover:opacity-95 text-btn-text font-extrabold py-3 px-4 rounded-xl shadow-lg shadow-glow/25 transition disabled:opacity-50 text-sm mt-3"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-btn-text border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Authenticate Session</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* OTP Mode Form */}
                {authMode === 'otp' && (
                  <form
                    onSubmit={handleSubmitOtp(handleOtpLogin)}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                        Admin Email
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          {...registerOtp('email')}
                          disabled={otpSent}
                          placeholder="admin@socialpilot.ai"
                          className="w-full bg-input-bg border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-active transition disabled:opacity-60"
                        />
                      </div>
                      {otpErrors.email && (
                        <p className="text-xs text-danger mt-1">
                          {otpErrors.email.message}
                        </p>
                      )}
                    </div>

                    {otpSent && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-1.5"
                      >
                        <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">
                          6-Digit OTP Code
                        </label>
                        <div className="relative">
                          <KeyRound className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            maxLength={6}
                            {...registerOtp('otpCode')}
                            placeholder="123456"
                            className="w-full bg-input-bg border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-active transition font-mono tracking-widest"
                          />
                        </div>
                      </motion.div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-primary hover:opacity-95 text-btn-text font-extrabold py-3 px-4 rounded-xl shadow-lg shadow-glow/25 transition disabled:opacity-50 text-sm mt-3"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-btn-text border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>
                            {otpSent ? 'Verify OTP & Enter' : 'Request OTP Code'}
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    {otpSent && (
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="w-full text-center text-xs text-text-muted hover:text-text-primary transition"
                      >
                        Change Email / Resend Code
                      </button>
                    )}
                  </form>
                )}

                <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-xs text-text-muted">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-success" />
                    <span>RLS Enabled</span>
                  </span>
                  <span>Super Admin Only</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-border">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary-10 px-3 py-1 rounded-full border border-border-active-30">
              Complete Control Suite
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight mt-3">
              Engineered for Scale and Sovereign Branding
            </h2>
            <p className="text-sm text-text-secondary mt-2">
              Everything required to manage high-volume social media operations and customer apps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="glass-panel rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary-10 text-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-text-primary">Gemini 1.5 Pro Copywriting</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Autonomous caption generation, hashtag optimization, and multi-turn social thread creation tailored per platform.
              </p>
            </div>

            <div className="glass-panel rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-success-10 text-success flex items-center justify-center">
                <Palette className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-text-primary">Realtime White-Label Engine</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Update colors, typography, logos, and features live. Connected mobile apps synchronize immediately over WebSockets.
              </p>
            </div>

            <div className="glass-panel rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-warning-10 text-warning flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-text-primary">Stability AI & SDXL Visuals</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Native text-to-image synthesis supporting custom aspect ratios, photorealistic styling, and prompt enhancements.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Tiers */}
        <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-border">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-success bg-success-10 px-3 py-1 rounded-full border border-success-30">
              Flexible Tiers
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight mt-3">
              Monetize with Confidence
            </h2>
            <p className="text-sm text-text-secondary mt-2">
              Integrated RevenueCat & Stripe ready subscriptions with automated token limit enforcement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { name: 'Free', price: '$0', credits: '50 Credits/mo', desc: 'Starter exploration' },
              { name: 'Starter', price: '$19', credits: '500 Credits/mo', desc: 'Solopreneurs & Creators' },
              { name: 'Pro', price: '$49', credits: '2,500 Credits/mo', desc: 'Growing businesses', popular: true },
              { name: 'Agency', price: '$199', credits: 'Unlimited Tokens', desc: 'White-label teams' },
            ].map((tier) => (
              <div
                key={tier.name}
                className={`glass-panel rounded-2xl p-6 flex flex-col justify-between relative ${
                  tier.popular ? 'border-active shadow-xl shadow-glow/10' : ''
                }`}
              >
                {tier.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-wider bg-gradient-primary text-btn-text px-3 py-0.5 rounded-full shadow">
                    Most Popular
                  </span>
                )}
                <div>
                  <h3 className="text-lg font-bold text-text-primary">{tier.name}</h3>
                  <div className="text-3xl font-black text-text-primary mt-2">
                    {tier.price}
                    <span className="text-xs font-semibold text-text-muted">/month</span>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">{tier.desc}</p>
                  <div className="mt-4 pt-4 border-t border-border space-y-2 text-xs text-text-secondary">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                      <span>{tier.credits}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                      <span>Multi-Platform Scheduling</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-border">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold text-text-primary">Trusted by 10,000+ Creators</h2>
            <div className="flex justify-center gap-1 mt-2 text-warning">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-warning" />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { quote: 'The white-label mobile app sync blew our clients away. Real-time updates without app store delays.', author: 'Sarah Jenkins', role: 'Agency Principal' },
              { quote: 'Gemini 1.5 integration creates captions that actually sound human. Tripled our post engagement.', author: 'Alex Rivera', role: 'Growth Lead' },
              { quote: 'Admin suite gives us instant moderation and credit distribution control in one fast UI.', author: 'Michael Chen', role: 'SaaS Founder' },
            ].map((t, idx) => (
              <div key={idx} className="glass-panel rounded-2xl p-6 space-y-3">
                <p className="text-xs text-text-secondary leading-relaxed italic">"{t.quote}"</p>
                <div className="pt-2">
                  <div className="text-xs font-bold text-text-primary">{t.author}</div>
                  <div className="text-[10px] text-text-muted">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <div>© 2026 SocialPilot AI Pro. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-text-primary transition">Privacy Policy</a>
            <a href="#" className="hover:text-text-primary transition">Terms of Service</a>
            <a href="#" className="hover:text-text-primary transition">Documentation</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
