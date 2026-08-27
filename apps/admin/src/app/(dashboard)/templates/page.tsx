'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit,
  X,
  Search,
  Star,
  RefreshCw,
} from 'lucide-react';
import { supabase, isPlaceholderUrl } from '@/lib/supabase';
import { toast } from 'sonner';
import { TemplateItem, PlatformType } from '@socialpilot/types';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

const MOCK_TEMPLATES: TemplateItem[] = [
  {
    id: 'tpl_1',
    title: 'High-Converting Instagram Carousel Caption',
    category: 'Social Media',
    prompt_template:
      'Write a 5-slide educational Instagram carousel caption about {topic}. Target audience: {audience}. Include a compelling hook in slide 1, 3 actionable tips in slides 2-4, and a strong engagement CTA in slide 5 with a {tone} tone.',
    tags: ['carousel', 'instagram', 'engagement'],
    default_hashtags: ['#MarketingTips', '#GrowthHacking', '#ContentCreator'],
    suggested_platform: 'instagram',
    is_featured: true,
    is_premium: true,
    is_active: true,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tpl_2',
    title: 'Viral Twitter / X Thread with Hook',
    category: 'Growth',
    prompt_template:
      'Generate a viral 6-tweet thread analyzing {topic}. Tweet 1 must be a contrarian curiosity hook. Tweets 2-5 breakdown key frameworks with concise bullets. Tweet 6 summarizes key takeaway with a retweet CTA.',
    tags: ['thread', 'twitter', 'viral'],
    default_hashtags: ['#BuildInPublic', '#Tech', '#AI'],
    suggested_platform: 'twitter',
    is_featured: false,
    is_premium: false,
    is_active: true,
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tpl_3',
    title: 'Thought Leadership LinkedIn Article Post',
    category: 'Leadership',
    prompt_template:
      'Compose a professional LinkedIn thought-leadership post regarding {topic}. Structure with an executive insight opening, industry shift observation, 3 strategic takeaways for enterprise leaders, and a discussion question.',
    tags: ['leadership', 'linkedin', 'professional'],
    default_hashtags: ['#Leadership', '#Strategy', '#Innovation'],
    suggested_platform: 'linkedin',
    is_featured: true,
    is_premium: true,
    is_active: true,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tpl_4',
    title: 'TikTok Viral Video Script Outline',
    category: 'Video',
    prompt_template:
      'Generate a 30-second TikTok script outline about {topic}. Include Visual Direction, Spoken Hook (0-3s), Core Twist/Reveal (3-20s), and Quick CTA (20-30s). Tone: {tone}.',
    tags: ['tiktok', 'video', 'viral'],
    default_hashtags: ['#TikTokGrowth', '#Viral', '#Creator'],
    suggested_platform: 'tiktok',
    is_featured: false,
    is_premium: false,
    is_active: false,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const CATEGORIES = ['All', 'Social Media', 'Growth', 'Leadership', 'Video', 'E-commerce'];

export default function TemplatesCRUDPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formState, setFormState] = useState<{
    title: string;
    category: string;
    prompt_template: string;
    suggested_platform: PlatformType;
    default_hashtags: string;
    is_premium: boolean;
    is_active: boolean;
  }>({
    title: '',
    category: 'Social Media',
    prompt_template: '',
    suggested_platform: 'instagram',
    default_hashtags: '#AI, #SocialPilot',
    is_premium: false,
    is_active: true,
  });

  const loadTemplates = async () => {
    try {
      setLoading(true);
      if (isPlaceholderUrl) {
        setTemplates(MOCK_TEMPLATES);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates((data as TemplateItem[]) || []);
    } catch {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();

    if (!isPlaceholderUrl) {
      const channel = supabase
        .channel('templates-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'templates' }, () => {
          loadTemplates();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
    return undefined;
  }, []);

  const openCreateModal = () => {
    setEditingTemplate(null);
    setFormState({
      title: '',
      category: 'Social Media',
      prompt_template: '',
      suggested_platform: 'instagram',
      default_hashtags: '#AI, #Marketing',
      is_premium: false,
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (t: TemplateItem) => {
    setEditingTemplate(t);
    setFormState({
      title: t.title,
      category: t.category,
      prompt_template: t.prompt_template,
      suggested_platform: t.suggested_platform,
      default_hashtags: (t.default_hashtags || []).join(', '),
      is_premium: t.is_premium,
      is_active: t.is_active,
    });
    setModalOpen(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title || !formState.prompt_template) {
      toast.error('Title and prompt template are required');
      return;
    }

    try {
      setIsSubmitting(true);
      const hashtagsArray = formState.default_hashtags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        title: formState.title.trim(),
        category: formState.category.trim(),
        prompt_template: formState.prompt_template.trim(),
        suggested_platform: formState.suggested_platform,
        default_hashtags: hashtagsArray,
        is_premium: formState.is_premium,
        is_active: formState.is_active,
      };

      if (isPlaceholderUrl) {
        if (editingTemplate) {
          setTemplates(
            templates.map((t) =>
              t.id === editingTemplate.id ? { ...t, ...payload } : t
            )
          );
          toast.success('Template updated (mock)');
        } else {
          const newT: TemplateItem = {
            id: `tpl_${Date.now()}`,
            ...payload,
            tags: [],
            is_featured: false,
            created_at: new Date().toISOString(),
          };
          setTemplates([newT, ...templates]);
          toast.success('Template created (mock)');
        }
        setModalOpen(false);
        setIsSubmitting(false);
        return;
      }

      if (editingTemplate) {
        const { error } = await supabase
          .from('templates')
          .update(payload)
          .eq('id', editingTemplate.id);
        if (error) throw error;
        toast.success('Template updated successfully');
      } else {
        const { error } = await supabase.from('templates').insert(payload);
        if (error) throw error;
        toast.success('New template published');
      }

      await loadTemplates();
      setModalOpen(false);
    } catch {
      toast.error('Failed to save template');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Delete this AI prompt template permanently?')) return;

    try {
      if (isPlaceholderUrl) {
        setTemplates(templates.filter((t) => t.id !== id));
        toast.success('Template removed');
        return;
      }

      const { error } = await supabase.from('templates').delete().eq('id', id);
      if (error) throw error;
      setTemplates(templates.filter((t) => t.id !== id));
      toast.success('Template deleted');
    } catch {
      toast.error('Failed to delete template');
    }
  };

  const handleToggleActive = async (template: TemplateItem) => {
    const nextStatus = !template.is_active;
    try {
      if (isPlaceholderUrl) {
        setTemplates(
          templates.map((t) => (t.id === template.id ? { ...t, is_active: nextStatus } : t))
        );
        toast.success(`Template ${nextStatus ? 'activated' : 'deactivated'}`);
        return;
      }

      const { error } = await supabase
        .from('templates')
        .update({ is_active: nextStatus })
        .eq('id', template.id);

      if (error) throw error;
      setTemplates(
        templates.map((t) => (t.id === template.id ? { ...t, is_active: nextStatus } : t))
      );
      toast.success(`Template ${nextStatus ? 'activated' : 'deactivated'}`);
    } catch {
      toast.error('Failed to toggle template status');
    }
  };

  const insertVariable = (varName: string) => {
    setFormState((prev) => ({
      ...prev,
      prompt_template: `${prev.prompt_template} {${varName}}`,
    }));
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      if (selectedCategory !== 'All' && t.category !== selectedCategory) return false;
      if (
        searchQuery &&
        !t.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !t.prompt_template.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [templates, selectedCategory, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-primary" />
            <span>AI Templates CRUD Studio</span>
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Build and publish prompt recipes for Instagram, Twitter/X, LinkedIn, and TikTok
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadTemplates}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-subtle border border-border text-xs font-bold text-text-secondary hover:text-text-primary transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-primary hover:opacity-95 text-btn-text rounded-xl font-bold text-xs shadow-md shadow-glow/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Template</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates or prompts..."
            className="w-full bg-input-bg border border-border rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-active transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedCategory === cat
                  ? 'bg-primary text-btn-text shadow-sm'
                  : 'bg-surface-subtle border border-border text-text-secondary hover:text-text-primary hover:border-active-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Template Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-panel rounded-2xl p-6 space-y-3">
              <TableSkeleton rows={3} cols={2} />
            </div>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <EmptyState
          title="No Templates Found"
          description="Create your first AI prompt template or adjust your filters."
          icon={Sparkles}
          actionLabel="Create Template"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="glass-panel rounded-2xl p-6 flex flex-col justify-between hover:border-active-50 transition relative group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary-10 border border-border-active-30 px-2 py-0.5 rounded-md">
                      {template.category}
                    </span>
                    <h3 className="text-base font-extrabold text-text-primary mt-1.5">
                      {template.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {template.is_premium && (
                      <span className="p-1 rounded-lg bg-warning-10 border border-warning-30 text-warning" title="Premium Template">
                        <Star className="w-3.5 h-3.5 fill-warning" />
                      </span>
                    )}
                    <button
                      onClick={() => handleToggleActive(template)}
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border transition ${
                        template.is_active
                          ? 'bg-success-10 text-success border-success-30'
                          : 'bg-surface-subtle text-text-muted border-border'
                      }`}
                    >
                      {template.is_active ? 'Active' : 'Draft'}
                    </button>
                  </div>
                </div>

                {/* Prompt preview box */}
                <div className="bg-surface-subtle/80 p-3.5 rounded-xl border border-border text-xs text-text-secondary font-mono leading-relaxed max-h-32 overflow-y-auto mb-4">
                  {template.prompt_template}
                </div>

                {/* Hashtags */}
                {template.default_hashtags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {template.default_hashtags.map((tag, idx) => (
                      <span key={idx} className="text-[11px] text-text-muted font-mono">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-text-muted">
                <span className="capitalize font-semibold">
                  Platform: {template.suggested_platform}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(template)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-surface-subtle text-text-primary hover:border-active-50 transition"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-1.5 rounded-lg border border-danger-30 text-danger bg-danger-10 hover:bg-danger-20 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Template Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-border space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="text-base font-bold text-text-primary">
                  {editingTemplate ? 'Edit Prompt Template' : 'Create AI Template'}
                </h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                  Template Title *
                </label>
                <input
                  type="text"
                  required
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  placeholder="e.g. Viral Twitter Hook Analyzer"
                  className="w-full bg-input-bg border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-active transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                    Category
                  </label>
                  <select
                    value={formState.category}
                    onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                    className="w-full bg-input-bg border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-active transition"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                    Target Platform
                  </label>
                  <select
                    value={formState.suggested_platform}
                    onChange={(e) =>
                      setFormState({ ...formState, suggested_platform: e.target.value as PlatformType })
                    }
                    className="w-full bg-input-bg border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-active transition"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="twitter">Twitter / X</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="facebook">Facebook</option>
                    <option value="tiktok">TikTok</option>
                    <option value="threads">Threads</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">
                    AI Prompt Template *
                  </label>
                  <div className="flex items-center gap-1 text-[11px] text-text-muted">
                    <span>Inject:</span>
                    {['topic', 'tone', 'audience', 'keywords'].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => insertVariable(v)}
                        className="px-1.5 py-0.5 rounded bg-surface-subtle hover:bg-surface border border-border text-primary font-mono text-[10px]"
                      >
                        +{v}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  required
                  rows={4}
                  value={formState.prompt_template}
                  onChange={(e) => setFormState({ ...formState, prompt_template: e.target.value })}
                  placeholder="Write prompt instructions using variables like {topic}, {tone}, {audience}..."
                  className="w-full bg-input-bg border border-border rounded-xl p-3.5 text-xs font-mono text-text-primary placeholder-text-muted focus:outline-none focus:border-active transition resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                  Default Hashtags (comma separated)
                </label>
                <input
                  type="text"
                  value={formState.default_hashtags}
                  onChange={(e) => setFormState({ ...formState, default_hashtags: e.target.value })}
                  placeholder="#Marketing, #AI, #Growth"
                  className="w-full bg-input-bg border border-border rounded-xl px-4 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-active transition"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-text-primary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.is_premium}
                    onChange={(e) => setFormState({ ...formState, is_premium: e.target.checked })}
                    className="w-4 h-4 rounded text-primary"
                  />
                  <span>Premium Tier Only</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-text-primary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.is_active}
                    onChange={(e) => setFormState({ ...formState, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-primary"
                  />
                  <span>Active & Visible</span>
                </label>
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-subtle border border-border text-xs font-bold text-text-secondary hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-primary text-btn-text text-xs font-bold hover:opacity-95 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingTemplate ? 'Update Template' : 'Publish Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
