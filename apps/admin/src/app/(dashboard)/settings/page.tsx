'use client';

import React, { useEffect, useState } from 'react';
import {
  Settings,
  Shield,
  Code,
  AlertTriangle,
  Save,
  Palette,
  CreditCard,
  Key,
  Download,
  Eye,
  X,
  FileCode,
} from 'lucide-react';
import { supabase, isPlaceholderUrl } from '@/lib/supabase';
import { toast } from 'sonner';
import { ThemePicker } from '@/components/ThemePicker';
import { exportToCsv } from '@/lib/csv';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_resource: string;
  details: Record<string, unknown>;
  created_at: string;
}

const MOCK_AUDIT_LOGS: AdminAuditLog[] = [
  {
    id: 'log_1',
    admin_id: 'superadmin@socialpilot.ai',
    action: 'template_created',
    target_resource: 'templates/tpl_1',
    details: { title: 'High-Converting Instagram Carousel Caption', category: 'Social Media' },
    created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
  {
    id: 'log_2',
    admin_id: 'superadmin@socialpilot.ai',
    action: 'user_suspended',
    target_resource: 'profiles/usr_4',
    details: { reason: 'Phishing spam detected in queued post' },
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'log_3',
    admin_id: 'superadmin@socialpilot.ai',
    action: 'ai_config_updated',
    target_resource: 'ai_config/00000000-0000-0000-0000-000000000001',
    details: { model: 'gemini-1.5-pro', temperature: 0.7 },
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'log_4',
    admin_id: 'superadmin@socialpilot.ai',
    action: 'credits_granted',
    target_resource: 'profiles/usr_2',
    details: { amount_granted: 1000, new_balance: 8500 },
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
];

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'integrations' | 'audit' | 'appearance'>('general');
  const [loading, setLoading] = useState(false);

  // General Settings Form
  const [generalSettings, setGeneralSettings] = useState({
    platformName: 'SocialPilot AI Pro',
    supportEmail: 'support@socialpilot.ai',
    rateLimitRpm: 60,
    rateLimitRpd: 1000,
    maintenanceMode: false,
    debugMode: false,
  });

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<AdminAuditLog | null>(null);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      if (isPlaceholderUrl) {
        setAuditLogs(MOCK_AUDIT_LOGS);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setAuditLogs((data as AdminAuditLog[]) || []);
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit') {
      loadAuditLogs();
    }
  }, [activeTab]);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('System configuration parameters updated successfully');
  };

  const handleExportAuditLogs = () => {
    exportToCsv('admin_audit_logs', auditLogs, {
      id: 'Log ID',
      admin_id: 'Admin Actor',
      action: 'Action Taken',
      target_resource: 'Target Resource',
      created_at: 'Timestamp',
    });
    toast.success('Audit logs exported to CSV');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary flex items-center gap-3">
            <Settings className="w-7 h-7 text-primary" />
            <span>System Governance & Settings</span>
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Global environment controls, API integrations, security audit trail, and luxury themes
          </p>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex border-b border-border gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'general', label: 'General & Security', icon: Settings },
          { id: 'integrations', label: 'Billing & APIs', icon: Key },
          { id: 'audit', label: 'Audit Trail Logs', icon: AlertTriangle },
          { id: 'appearance', label: 'Luxury Appearance', icon: Palette },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                isActive
                  ? 'border-primary text-text-primary bg-surface-subtle/40 rounded-t-xl'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-text-muted'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: General & Security */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveGeneral} className="space-y-6 max-w-4xl">
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <Shield className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                Platform Parameters
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                  Platform Name
                </label>
                <input
                  type="text"
                  value={generalSettings.platformName}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, platformName: e.target.value })
                  }
                  className="w-full bg-input-bg border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-active"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                  Master Support Email
                </label>
                <input
                  type="email"
                  value={generalSettings.supportEmail}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, supportEmail: e.target.value })
                  }
                  className="w-full bg-input-bg border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-active"
                />
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <Code className="w-4 h-4 text-warning" />
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                API Rate Limiting (Protection)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                  Requests Per Minute (RPM)
                </label>
                <input
                  type="number"
                  value={generalSettings.rateLimitRpm}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, rateLimitRpm: parseInt(e.target.value) || 0 })
                  }
                  className="w-full bg-input-bg border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-active"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                  Daily Generation Limit (RPD)
                </label>
                <input
                  type="number"
                  value={generalSettings.rateLimitRpd}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, rateLimitRpd: parseInt(e.target.value) || 0 })
                  }
                  className="w-full bg-input-bg border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-active"
                />
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-2">
              System State Controls
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface-subtle/50 cursor-pointer hover:border-active-50 transition">
                <div>
                  <div className="text-xs font-bold text-text-primary">Maintenance Mode</div>
                  <div className="text-[11px] text-text-muted">Temporarily disable client generation</div>
                </div>
                <input
                  type="checkbox"
                  checked={generalSettings.maintenanceMode}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, maintenanceMode: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-danger"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface-subtle/50 cursor-pointer hover:border-active-50 transition">
                <div>
                  <div className="text-xs font-bold text-text-primary">Debug & Verbose Logging</div>
                  <div className="text-[11px] text-text-muted">Record full payload in admin audit logs</div>
                </div>
                <input
                  type="checkbox"
                  checked={generalSettings.debugMode}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, debugMode: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-primary"
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3.5 bg-gradient-primary text-btn-text font-black text-sm rounded-xl shadow-xl shadow-glow/25 hover:opacity-95 transition"
          >
            <Save className="w-4 h-4" />
            <span>Save System Parameters</span>
          </button>
        </form>
      )}

      {/* Tab 2: Billing & API Integrations */}
      {activeTab === 'integrations' && (
        <div className="space-y-6 max-w-4xl">
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                  RevenueCat Mobile Subscriptions
                </h2>
              </div>
              <span className="text-xs font-bold text-success bg-success-10 px-2.5 py-0.5 rounded-full border border-success-30">
                Connected
              </span>
            </div>

            <div className="text-xs text-text-secondary space-y-2 leading-relaxed">
              <p>• Webhook Endpoint: <code className="text-primary font-mono">https://api.socialpilot.ai/functions/v1/revenuecat-webhook</code></p>
              <p>• Automatic subscription tier provisioning and monthly AI credit replenishment.</p>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-warning" />
                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                  AI Provider Key Infrastructure
                </h2>
              </div>
              <span className="text-xs font-bold text-success bg-success-10 px-2.5 py-0.5 rounded-full border border-success-30">
                Active Vault
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-subtle/70 border border-border">
                <span className="font-bold text-text-primary">Google Gemini API Key</span>
                <span className="font-mono text-text-muted">••••••••••••••••AIzaSy34</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-subtle/70 border border-border">
                <span className="font-bold text-text-primary">Stability AI / Replicate API Key</span>
                <span className="font-mono text-text-muted">••••••••••••••••r8_Live77</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Audit Trail Logs */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-text-secondary">
              Immutable record of all administrative actions and security modifications
            </p>
            <button
              onClick={handleExportAuditLogs}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-primary text-btn-text text-xs font-bold shadow-md shadow-glow/20 hover:opacity-95 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Audit CSV</span>
            </button>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden border border-border">
            {loading ? (
              <div className="p-6">
                <TableSkeleton rows={4} cols={4} />
              </div>
            ) : auditLogs.length === 0 ? (
              <EmptyState
                title="No Audit Logs Recorded"
                description="Administrative actions will be automatically logged here."
                icon={AlertTriangle}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border bg-surface-subtle/70">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-black uppercase tracking-wider text-text-secondary">
                        Action
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-black uppercase tracking-wider text-text-secondary">
                        Administrator
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-black uppercase tracking-wider text-text-secondary">
                        Target Resource
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-black uppercase tracking-wider text-text-secondary">
                        Timestamp
                      </th>
                      <th className="px-6 py-3.5 text-right text-xs font-black uppercase tracking-wider text-text-secondary">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-surface-subtle/40 transition">
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-text-primary font-mono bg-surface-subtle px-2 py-0.5 rounded border border-border">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-text-secondary">
                          {log.admin_id}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-text-muted">
                          {log.target_resource}
                        </td>
                        <td className="px-6 py-4 text-xs text-text-muted">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="p-1.5 rounded-lg border border-border bg-surface-subtle hover:bg-surface text-text-primary transition"
                            title="Inspect Payload"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Luxury Theme & Appearance */}
      {activeTab === 'appearance' && (
        <div className="glass-panel rounded-2xl p-6 space-y-6 max-w-3xl">
          <div>
            <h2 className="text-base font-extrabold text-text-primary">
              Luxury Palette & Mode Customizer
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Switch themes across Sunset Ember, Cyber Mint, Cyberpunk Velvet, Titanium Azure, and Stealth
            </p>
          </div>
          <ThemePicker />
        </div>
      )}

      {/* JSON Payload Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-primary" />
                <h2 className="text-base font-bold text-text-primary">Audit Log Metadata</h2>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <div><strong>Action:</strong> {selectedLog.action}</div>
              <div><strong>Actor:</strong> {selectedLog.admin_id}</div>
              <div><strong>Target:</strong> {selectedLog.target_resource}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-subtle/80 border border-border font-mono text-xs text-text-primary overflow-x-auto max-h-60">
              <pre>{JSON.stringify(selectedLog.details, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
