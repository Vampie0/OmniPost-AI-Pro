export type PlatformType = 'instagram' | 'twitter' | 'linkedin' | 'facebook' | 'tiktok' | 'threads';
export type PostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
export type AIContentType = 'caption' | 'hashtags' | 'post_ideas' | 'thread' | 'image';
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'promo' | 'system';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing' | 'incomplete';

export interface PostItem {
  id: string;
  user_id: string;
  folder_id: string | null;
  title: string;
  content: string;
  hashtags: string[];
  media_urls: string[];
  platforms: PlatformType[];
  status: PostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  analytics: Record<string, unknown>;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface TemplateItem {
  id: string;
  title: string;
  category: string;
  prompt_template: string;
  tags: string[];
  default_hashtags: string[];
  suggested_platform: PlatformType;
  is_featured: boolean;
  is_premium: boolean;
  is_active: boolean;
  created_at: string;
}

export interface AppConfig {
  id: string;
  app_name: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  support_email: string;
  feature_flags: Record<string, boolean>;
  legal_links: Record<string, string>;
  is_maintenance_mode: boolean;
  updated_at: string;
}

export interface AIConfig {
  id: string;
  text_provider: 'gemini' | 'openai';
  text_model: string;
  image_provider: 'replicate' | 'stability' | 'openai';
  image_model: string;
  max_tokens: number;
  temperature: number;
  system_prompt: string;
  rate_limit_per_min: number;
  updated_at: string;
}

export interface SubscriptionItem {
  id: string;
  user_id: string;
  tier: import('./auth').SubscriptionTier;
  status: SubscriptionStatus;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: NotificationType;
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_entity: string;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export interface GeneratedImage {
  id: string;
  user_id: string;
  prompt: string;
  image_url: string;
  aspect_ratio: string;
  style: string;
  created_at: string;
}

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface AnalyticsMetric {
  id: string;
  user_id: string;
  total_posts_created: number;
  total_posts_scheduled: number;
  total_ai_generations: number;
  credits_used: number;
  date: string;
}
