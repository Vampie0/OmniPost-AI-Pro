export type UserRole = 'user' | 'admin' | 'super_admin';

export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'agency';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  subscription_tier: SubscriptionTier;
  credits_remaining: number;
  credits_limit: number;
  is_suspended: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthSessionState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
