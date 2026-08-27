// ==============================================================================
// 👑 GLOBAL WHITE-LABEL CONFIGURATION (SINGLE SOURCE OF TRUTH)
// Change appName, tagline, or supportEmail here to update the ENTIRE mobile app globally!
// ==============================================================================

export const APP_BRANDING = {
  appName: 'SocialPilot AI',
  tagline: 'Autonomous Social Media Operating System',
  supportEmail: 'support@socialpilot.ai',
  websiteUrl: 'https://socialpilot.ai',
  privacyUrl: 'https://socialpilot.ai/privacy',
  termsUrl: 'https://socialpilot.ai/terms',
} as const;

export const STORAGE_KEYS = {
  ONBOARDING_COMPLETED: 'sp_onboarding_completed',
  THEME_MODE: 'sp_theme_mode',
  PALETTE_KEY: 'sp_palette_key',
  APP_CONFIG: 'sp_app_config_cache',
} as const;

export const DEFAULT_APP_NAME = APP_BRANDING.appName;
