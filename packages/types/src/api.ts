import { AIContentType, PlatformType } from './database';

export interface GenerateTextRequest {
  prompt: string;
  type: AIContentType;
  platform?: PlatformType;
  tone?: 'professional' | 'casual' | 'humorous' | 'inspirational' | 'urgent';
  targetAudience?: string;
  language?: string;
}

export interface GenerateTextResponse {
  result: string;
  hashtags?: string[];
  tokens_used: number;
}

export interface GenerateImageRequest {
  prompt: string;
  aspect_ratio?: '1:1' | '16:9' | '9:16' | '4:5';
  style?: 'photorealistic' | 'digital-art' | 'minimalist' | '3d-render';
}

export interface GenerateImageResponse {
  image_url: string;
  revised_prompt?: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}
