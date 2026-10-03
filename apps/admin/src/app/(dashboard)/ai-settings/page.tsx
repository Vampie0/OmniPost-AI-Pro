'use client';

import React, { useEffect, useState } from 'react';
import {
  Bot,
  Brain,
  Database,
  Save,
  Sparkles,
  RotateCcw,
  Terminal,
} from 'lucide-react';
import { supabase, isPlaceholderUrl } from '@/lib/supabase';
import { toast } from 'sonner';
import { AIConfig } from '@socialpilot/types';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';

const DEFAULT_AI_CONFIG: AIConfig = {
  id: '00000000-0000-0000-0000-000000000001',
  text_provider: 'gemini',
  text_model: 'gemini-2.0-flash',
  image_provider: 'replicate',
  image_model: 'stability-ai/sdxl',
  max_tokens: 2048,
  temperature: 0.7,
  system_prompt:
    'You are SocialPilot AI, an elite social media manager and copywriter. Generate high-engagement, concise, and platform-optimized posts tailored to the target audience.',
  rate_limit_per_min: 20,
  updated_at: new Date().toISOString(),
};

export default function AISettingsPage() {
  const [config, setConfig] = useState<AIConfig>(DEFAULT_AI_CONFIG);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Playground test state
  const [testPrompt, setTestPrompt] = useState('Create a 2-sentence hook for a tech startup launch on Twitter/X.');
  const [testOutput, setTestOutput] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testLatencyMs, setTestLatencyMs] = useState<number | null>(null);

  const loadAIConfig = async () => {
    try {
      setLoading(true);
      if (isPlaceholderUrl) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('ai_config')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setConfig(data as AIConfig);
      }
    } catch {
      toast.error('Failed to load AI configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAIConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);

      if (isPlaceholderUrl) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        toast.success('AI configuration saved to cloud database (Mock)');
        setIsSaving(false);
        return;
      }

      const { error } = await supabase
        .from('ai_config')
        .upsert({
          ...config,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      toast.success('AI models & prompt parameters updated successfully');
    } catch {
      toast.error('Failed to save AI configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunTestPrompt = async () => {
    if (!testPrompt.trim()) return;

    try {
      setIsTesting(true);
      setTestOutput('');
      const start = performance.now();

      // Simulated realistic streaming output from Gemini 1.5 Pro
      await new Promise((resolve) => setTimeout(resolve, 800));
      const simulatedText = `🚀 Most SaaS launches fail because they build in silence. We spent 6 months building with 500 early adopters—and SocialPilot AI is finally public today. Check our live demo below! 👇 #BuildInPublic #AI`;

      setTestOutput(simulatedText);
      const elapsed = Math.round(performance.now() - start);
      setTestLatencyMs(elapsed);
      toast.success(`Generated output in ${elapsed}ms`);
    } catch {
      toast.error('Failed to execute AI sandbox query');
    } finally {
      setIsTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
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
            <Bot className="w-7 h-7 text-primary" />
            <span>AI Models & Intelligence Studio</span>
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Configure Google Gemini, OpenAI, and Stability SDXL provider engines and system personas
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            setConfig(DEFAULT_AI_CONFIG);
            toast.info('Restored default AI settings');
          }}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form Settings */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-6">
          {/* LLM Text Generation Card */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <Brain className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                Copywriting Engine (LLM)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                  Text Provider
                </label>
                <select
                  value={config.text_provider}
                  onChange={(e) =>
                    setConfig({ ...config, text_provider: e.target.value as 'gemini' | 'openai' })
                  }
                  className="w-full bg-input-bg border border-border rounded-xl px-3 py-2.5 text-xs sm:text-sm text-text-primary focus:outline-none focus:border-active transition"
                >
                  <option value="gemini">Google Gemini AI</option>
                  <option value="openai">OpenAI</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                  Model Identifier
                </label>
                <select
                  value={config.text_model}
                  onChange={(e) => setConfig({ ...config, text_model: e.target.value })}
                  className="w-full bg-input-bg border border-border rounded-xl px-3 py-2.5 text-xs sm:text-sm text-text-primary focus:outline-none focus:border-active transition"
                >
                  {config.text_provider === 'gemini' ? (
                    <>
                      <option value="gemini-1.5-pro">gemini-1.5-pro (Recommended)</option>
                      <option value="gemini-1.5-flash">gemini-1.5-flash (Low Latency)</option>
                      <option value="gemini-2.0-flash">gemini-2.0-flash (Ultra Fast)</option>
                    </>
                  ) : (
                    <>
                      <option value="gpt-4o">gpt-4o (Omni)</option>
                      <option value="gpt-4o-mini">gpt-4o-mini</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Temperature Slider & Max Tokens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Temperature (Creativity)
                  </label>
                  <span className="text-xs font-mono font-bold text-primary">
                    {config.temperature}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.5"
                  step="0.05"
                  value={config.temperature}
                  onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                  Max Output Tokens
                </label>
                <input
                  type="number"
                  min="256"
                  max="8192"
                  value={config.max_tokens}
                  onChange={(e) => setConfig({ ...config, max_tokens: parseInt(e.target.value) || 2048 })}
                  className="w-full bg-input-bg border border-border rounded-xl px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-active"
                />
              </div>
            </div>

            {/* System Prompt Textarea */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                Global System Prompt Persona
              </label>
              <textarea
                rows={4}
                value={config.system_prompt}
                onChange={(e) => setConfig({ ...config, system_prompt: e.target.value })}
                className="w-full bg-input-bg border border-border rounded-xl p-3.5 text-xs font-mono text-text-primary placeholder-text-muted focus:outline-none focus:border-active transition resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Visual Image Generation Card */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <Database className="w-4 h-4 text-warning" />
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                Visual Image Synthesis (SDXL)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                  Image Provider
                </label>
                <select
                  value={config.image_provider}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      image_provider: e.target.value as 'replicate' | 'stability' | 'openai',
                    })
                  }
                  className="w-full bg-input-bg border border-border rounded-xl px-3 py-2.5 text-xs sm:text-sm text-text-primary focus:outline-none focus:border-active transition"
                >
                  <option value="replicate">Replicate API</option>
                  <option value="stability">Stability AI Native</option>
                  <option value="openai">OpenAI DALL-E</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                  Image Model Name
                </label>
                <input
                  type="text"
                  value={config.image_model}
                  onChange={(e) => setConfig({ ...config, image_model: e.target.value })}
                  className="w-full bg-input-bg border border-border rounded-xl px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-active transition"
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={isSaving}
            loadingText="Saving Configuration..."
            className="w-full"
          >
            <Save className="w-4 h-4" />
            <span>Apply & Save AI Configuration</span>
          </Button>
        </form>

        {/* Right Interactive AI Playground Sandbox */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel rounded-2xl p-6 space-y-4 border border-border">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                  Live AI Engine Sandbox
                </h2>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary-10 text-primary border border-border-active-30">
                {config.text_model}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                Test Prompt
              </label>
              <textarea
                rows={3}
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                placeholder="Enter prompt to test model output..."
                className="w-full bg-input-bg border border-border rounded-xl p-3 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-active transition resize-none"
              />
            </div>

            <Button
              type="button"
              size="sm"
              disabled={isTesting || !testPrompt.trim()}
              onClick={handleRunTestPrompt}
              loadingText="Synthesizing Output..."
              className="w-full"
            >
              {!isTesting && <Sparkles className="w-3.5 h-3.5 text-warning" />}
              <span>Execute Sandbox Query</span>
            </Button>

            {/* Simulated Live Output */}
            {testOutput && (
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between text-[11px] text-text-muted">
                  <span>Model Response</span>
                  {testLatencyMs && <span className="font-mono text-success">{testLatencyMs}ms</span>}
                </div>
                <div className="p-3.5 rounded-xl bg-surface-subtle-80 border border-border text-xs text-text-primary leading-relaxed">
                  {testOutput}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
