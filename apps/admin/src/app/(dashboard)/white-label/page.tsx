'use client';

import React, { useEffect, useState } from 'react';
import {
  Palette,
  Save,
  Eye,
  RotateCcw,
  Type,
  Globe,
  Smartphone,
  Sparkles,
  Layers,
} from 'lucide-react';
import { supabase, isPlaceholderUrl } from '@/lib/supabase';
import { toast } from 'sonner';
import { AppConfig } from '@socialpilot/types';
import { Skeleton } from '@/components/ui/Skeleton';

const DEFAULT_CONFIG: AppConfig = {
  id: '00000000-0000-0000-0000-000000000001',
  app_name: 'SocialPilot AI',
  logo_url: '',
  primary_color: '#4F46E5',
  secondary_color: '#14B8A6',
  accent_color: '#F43F5E',
  support_email: 'support@socialpilot.ai',
  feature_flags: { revenuecat: true, social_login: true, ai_image: true, ai_text: true },
  legal_links: { terms: 'https://socialpilot.ai/terms', privacy: 'https://socialpilot.ai/privacy' },
  is_maintenance_mode: false,
  updated_at: new Date().toISOString(),
};

export default function WhiteLabelPage() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadConfig = async () => {
    try {
      setLoading(true);
      if (isPlaceholderUrl) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('app_config')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setConfig(data as AppConfig);
      }
    } catch {
      toast.error('Failed to load white-label configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();

    // Supabase Realtime Listener for app_config
    if (!isPlaceholderUrl) {
      const channel = supabase
        .channel('app-config-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'app_config' }, (payload) => {
          if (payload.new) {
            setConfig(payload.new as AppConfig);
            toast.info('App configuration updated via Realtime');
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
    return undefined;
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);

      if (isPlaceholderUrl) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        toast.success('Configuration saved & pushed to mobile apps via Realtime (Mock)');
        setIsSaving(false);
        return;
      }

      const { error } = await supabase
        .from('app_config')
        .upsert({
          ...config,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      toast.success('White-label configuration saved! Mobile clients synchronized.');
    } catch {
      toast.error('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setConfig(DEFAULT_CONFIG);
    toast.info('Reset form to baseline defaults');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
          <div className="lg:col-span-5">
            <Skeleton className="h-[600px] rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary flex items-center gap-3">
            <Palette className="w-7 h-7 text-primary" />
            <span>White-Label Customization Engine</span>
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Customize mobile app branding, color tokens, and features with real-time WebSocket client sync
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-surface-subtle hover:bg-surface border border-border rounded-xl font-bold text-xs text-text-secondary hover:text-text-primary transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Controls, Right Live Mobile Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Settings */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-6">
          {/* Brand Identity Card */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <Type className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                App Identity & Assets
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                  App Name *
                </label>
                <input
                  type="text"
                  required
                  value={config.app_name}
                  onChange={(e) => setConfig({ ...config, app_name: e.target.value })}
                  placeholder="SocialPilot AI"
                  className="w-full bg-input-bg border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-active transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                  Logo URL (PNG / SVG)
                </label>
                <input
                  type="url"
                  value={config.logo_url || ''}
                  onChange={(e) => setConfig({ ...config, logo_url: e.target.value })}
                  placeholder="https://your-domain.com/logo.png"
                  className="w-full bg-input-bg border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-active transition"
                />
              </div>
            </div>
          </div>

          {/* Color Palettes Card */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <Eye className="w-4 h-4 text-warning" />
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                Brand Color Tokens
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                  Primary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.primary_color}
                    onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                    className="w-10 h-10 rounded-xl border border-border cursor-pointer shrink-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={config.primary_color}
                    onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                    className="w-full bg-input-bg border border-border rounded-xl px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-active"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                  Secondary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.secondary_color}
                    onChange={(e) => setConfig({ ...config, secondary_color: e.target.value })}
                    className="w-10 h-10 rounded-xl border border-border cursor-pointer shrink-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={config.secondary_color}
                    onChange={(e) => setConfig({ ...config, secondary_color: e.target.value })}
                    className="w-full bg-input-bg border border-border rounded-xl px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-active"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                  Accent Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.accent_color}
                    onChange={(e) => setConfig({ ...config, accent_color: e.target.value })}
                    className="w-10 h-10 rounded-xl border border-border cursor-pointer shrink-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={config.accent_color}
                    onChange={(e) => setConfig({ ...config, accent_color: e.target.value })}
                    className="w-full bg-input-bg border border-border rounded-xl px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-active"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Legal & Support URLs */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <Globe className="w-4 h-4 text-success" />
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                Support & Policy Links
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                  Support Email
                </label>
                <input
                  type="email"
                  value={config.support_email}
                  onChange={(e) => setConfig({ ...config, support_email: e.target.value })}
                  className="w-full bg-input-bg border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-active transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                  Terms of Service
                </label>
                <input
                  type="url"
                  value={config.legal_links?.terms || ''}
                  onChange={(e) => setConfig({ ...config, legal_links: { ...config.legal_links, terms: e.target.value } })}
                  className="w-full bg-input-bg border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-active transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                  Privacy Policy
                </label>
                <input
                  type="url"
                  value={config.legal_links?.privacy || ''}
                  onChange={(e) => setConfig({ ...config, legal_links: { ...config.legal_links, privacy: e.target.value } })}
                  className="w-full bg-input-bg border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-active transition"
                />
              </div>
            </div>
          </div>

          {/* Feature Flags */}
          <div className="glass-panel rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <Layers className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                Platform Toggles
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface-subtle/60 cursor-pointer hover:border-active-50 transition">
                <span className="text-xs font-bold text-text-primary">RevenueCat IAP</span>
                <input
                  type="checkbox"
                  checked={config.feature_flags?.revenuecat ?? true}
                  onChange={(e) => setConfig({ ...config, feature_flags: { ...config.feature_flags, revenuecat: e.target.checked } })}
                  className="w-4 h-4 rounded text-primary"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface-subtle/60 cursor-pointer hover:border-active-50 transition">
                <span className="text-xs font-bold text-text-primary">Social Login</span>
                <input
                  type="checkbox"
                  checked={config.feature_flags?.social_login ?? true}
                  onChange={(e) => setConfig({ ...config, feature_flags: { ...config.feature_flags, social_login: e.target.checked } })}
                  className="w-4 h-4 rounded text-primary"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface-subtle/60 cursor-pointer hover:border-active-50 transition">
                <span className="text-xs font-bold text-danger">Maintenance Mode</span>
                <input
                  type="checkbox"
                  checked={config.is_maintenance_mode}
                  onChange={(e) => setConfig({ ...config, is_maintenance_mode: e.target.checked })}
                  className="w-4 h-4 rounded text-danger"
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-primary text-btn-text font-black text-sm rounded-xl shadow-xl shadow-glow/25 hover:opacity-95 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Synchronizing WebSockets...' : 'Save & Broadcast to Mobile App'}</span>
          </button>
        </form>

        {/* Right Live Interactive Smartphone Mockup */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-3 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-primary" />
            <span>Live Mobile Simulator Preview</span>
          </div>

          {/* Smartphone Frame */}
          <div className="w-[310px] h-[630px] rounded-[45px] bg-[#07080B] border-[6px] border-[#222738] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] p-3 relative overflow-hidden flex flex-col justify-between select-none">
            {/* Dynamic Island / Notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full z-30" />

            {/* Mobile Screen Content */}
            <div className="w-full h-full bg-[#0C0E17] rounded-[36px] overflow-hidden flex flex-col justify-between pt-8 pb-4 px-4 text-white relative">
              {/* Dynamic Gradient Header Bar */}
              <div
                className="absolute top-0 left-0 right-0 h-28 opacity-25 pointer-events-none"
                style={{
                  background: `linear-gradient(180deg, ${config.primary_color}, transparent)`,
                }}
              />

              {/* Mobile Top App Bar */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs"
                    style={{ backgroundColor: config.primary_color }}
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-extrabold tracking-tight truncate max-w-[130px]">
                    {config.app_name || 'SocialPilot AI'}
                  </span>
                </div>

                <div
                  className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: `${config.secondary_color}20`,
                    borderColor: config.secondary_color,
                    color: config.secondary_color,
                  }}
                >
                  PRO TIER
                </div>
              </div>

              {/* Mock Feed / Hero Card */}
              <div className="relative z-10 space-y-3 my-auto">
                <div className="p-3.5 rounded-2xl bg-[#141724] border border-white/10 space-y-2 shadow-lg">
                  <span className="text-[10px] font-bold text-slate-400">AI Copywriter</span>
                  <p className="text-[11.5px] leading-relaxed text-slate-200">
                    "Transforming your thoughts into high-converting Instagram reels & threads."
                  </p>
                  <button
                    type="button"
                    className="w-full py-2 rounded-xl text-xs font-black shadow-md transition"
                    style={{
                      backgroundColor: config.primary_color,
                      color: '#FFFFFF',
                    }}
                  >
                    Generate with AI
                  </button>
                </div>

                {/* Second Mock Widget */}
                <div className="p-3 rounded-2xl bg-[#141724] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center text-[10px]"
                      style={{ backgroundColor: `${config.accent_color}30`, color: config.accent_color }}
                    >
                      ★
                    </div>
                    <span className="text-[11px] font-bold">Credits Remaining</span>
                  </div>
                  <span
                    className="text-xs font-black"
                    style={{ color: config.secondary_color }}
                  >
                    1,850
                  </span>
                </div>

                {config.is_maintenance_mode && (
                  <div className="p-2 rounded-xl bg-rose-950/80 border border-rose-500/40 text-[10px] font-bold text-rose-300 text-center">
                    ⚠️ System Maintenance Mode Active
                  </div>
                )}
              </div>

              {/* Mobile Bottom Navigation Bar */}
              <div className="relative z-10 pt-2 border-t border-white/10 flex items-center justify-around text-slate-400">
                <span className="text-[10px] font-bold" style={{ color: config.primary_color }}>
                  Home
                </span>
                <span className="text-[10px] font-medium">Create</span>
                <span className="text-[10px] font-medium">Schedule</span>
                <span className="text-[10px] font-medium">Profile</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
