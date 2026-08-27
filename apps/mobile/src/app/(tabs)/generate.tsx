import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
  TextInput,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuthStore } from '@/store/useAuthStore';
import { ScreenWrapper } from '@/components/templates/ScreenWrapper';
import { GlassCard, AnimatedButton, Badge } from '@/components/atoms';
import { useToast } from '@/components/atoms/CustomToast';
import { supabase, isPlaceholderUrl } from '@/services/supabase';
import { PlatformType, AIContentType } from '@socialpilot/types';
import {
  Sparkles,
  Copy,
  Check,
  Calendar,
  Bookmark,
  Image as ImageIcon,
  FileText,
  X,
  Instagram,
  Twitter,
  Linkedin,
  Video,
  Share2,
  Sliders,
  Wand2,
  ChevronDown,
  Download,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const PLATFORMS: { id: PlatformType; name: string; icon: (c: string) => React.ReactNode }[] = [
  { id: 'instagram', name: 'Instagram', icon: (c) => <Instagram size={22} color={c} /> },
  { id: 'twitter', name: 'Twitter / X', icon: (c) => <Twitter size={20} color={c} /> },
  { id: 'linkedin', name: 'LinkedIn', icon: (c) => <Linkedin size={20} color={c} /> },
  { id: 'tiktok', name: 'TikTok', icon: (c) => <Video size={20} color={c} /> },
  { id: 'facebook', name: 'Facebook', icon: (c) => <Share2 size={20} color={c} /> },
];

const CONTENT_TYPES: { id: AIContentType; label: string }[] = [
  { id: 'caption', label: 'Caption & Hook' },
  { id: 'hashtags', label: 'Viral Hashtags' },
  { id: 'post_ideas', label: 'Post Ideas' },
  { id: 'thread', label: 'Multi-Post Thread' },
];

const TONES = ['Professional', 'Casual', 'Humorous', 'Inspirational', 'Urgent'];

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 Square (Feed)' },
  { id: '9:16', label: '9:16 Story / Reel' },
  { id: '16:9', label: '16:9 Banner' },
  { id: '4:5', label: '4:5 Portrait' },
];

const STYLES = ['Photorealistic', '3D Render', 'Cyberpunk', 'Digital Art', 'Minimalist'];

const CURATED_TEMPLATES = [
  {
    id: '1',
    title: 'Viral 30-Sec Reel Script',
    category: 'Video',
    prompt: 'Write a high-retention 30-second Reel script breaking down: {{topic}}',
    platform: 'instagram',
  },
  {
    id: '2',
    title: 'LinkedIn Thought Leadership Breakdown',
    category: 'Business',
    prompt: 'Write an insightful 5-point carousel breakdown on lessons learned in: {{topic}}',
    platform: 'linkedin',
  },
  {
    id: '3',
    title: '5-Tweet Storytelling Thread',
    category: 'Growth',
    prompt: 'Write a 5-tweet engaging thread explaining the secrets of: {{topic}}',
    platform: 'twitter',
  },
];

export default function GenerateScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const user = useAuthStore((state) => state.user);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);

  const [studioMode, setStudioMode] = useState<'text' | 'image'>('text');

  // Text States
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>('instagram');
  const [selectedType, setSelectedType] = useState<AIContentType>('caption');
  const [selectedTone, setSelectedTone] = useState('Professional');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState('');
  const [copied, setCopied] = useState(false);

  // Image States
  const [imagePrompt, setImagePrompt] = useState('');
  const [selectedAspect, setSelectedAspect] = useState('1:1');
  const [selectedStyle, setSelectedStyle] = useState('Photorealistic');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');

  // Modals
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showParamsModal, setShowParamsModal] = useState(false);

  const handleGenerateText = async () => {
    if (!prompt.trim()) {
      showToast({ title: 'Topic Required', message: 'Enter a concept or instruction for the AI.', type: 'error' });
      return;
    }

    try {
      setIsGenerating(true);
      await new Promise((resolve) => setTimeout(resolve, 600));

      const sampleResponse = `🚀 Unlocking massive growth with ${prompt.trim()} on ${selectedPlatform.toUpperCase()}!\n\nHere is your high-impact ${selectedType.replace('_', ' ')}:\n\n1. Hook: Why 90% of creators fail with ${prompt.trim()} (and how to win).\n2. Core Value: Consistency + Authenticity + Strategic Distribution.\n3. Takeaway: Quality beats quantity every single time.\n4. Action: Save this framework and test it today!\n\n#ContentCreator #GrowthStrategy #${selectedPlatform}`;

      setGeneratedResult(sampleResponse);
      showToast({ title: 'Copy Generated!', message: 'AI copy crafted successfully.', type: 'success' });

      if (user && !isPlaceholderUrl) {
        await supabase
          .from('profiles')
          .update({ credits_remaining: Math.max(0, (user.credits_remaining ?? 50) - 1) })
          .eq('id', user.id);
        await fetchProfile(user.id);
      }
    } catch {
      showToast({ title: 'Generation Error', message: 'Could not generate copy.', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      showToast({ title: 'Prompt Required', message: 'Enter a visual description.', type: 'error' });
      return;
    }

    try {
      setIsGeneratingImage(true);
      await new Promise((resolve) => setTimeout(resolve, 900));

      setGeneratedImageUrl('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop');
      showToast({ title: 'Image Rendered!', message: 'High-res visual generated.', type: 'success' });
    } catch {
      showToast({ title: 'Render Error', message: 'Could not generate visual.', type: 'error' });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const applyTemplate = (tpl: (typeof CURATED_TEMPLATES)[0]) => {
    setPrompt(tpl.prompt);
    setSelectedPlatform(tpl.platform as PlatformType);
    setShowTemplatesModal(false);
    showToast({ title: 'Template Loaded', message: tpl.title, type: 'info' });
  };

  const handleCopy = () => {
    setCopied(true);
    showToast({ title: 'Copied to Clipboard!', type: 'success' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ScreenWrapper scrollable contentContainerStyle={styles.container}>
      {/* 1. Spacious Full-Width Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>AI Content Studio</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Generate high-converting copy, ideas, and imagery with AI
        </Text>
      </View>

      {/* 2. Full-Width Mode Switcher (No Squishing or Clipping) */}
      <View style={[styles.modeTrack, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <TouchableOpacity
          onPress={() => setStudioMode('text')}
          activeOpacity={0.8}
          style={[styles.modeTab, studioMode === 'text' && { backgroundColor: theme.colors.primary }]}
        >
          <FileText size={16} color={studioMode === 'text' ? theme.colors.btnTextColor : theme.colors.textSecondary} />
          <Text style={[styles.modeTabText, { color: studioMode === 'text' ? theme.colors.btnTextColor : theme.colors.textSecondary }]}>
            Text Copywriter
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setStudioMode('image')}
          activeOpacity={0.8}
          style={[styles.modeTab, studioMode === 'image' && { backgroundColor: theme.colors.primary }]}
        >
          <ImageIcon size={16} color={studioMode === 'image' ? theme.colors.btnTextColor : theme.colors.textSecondary} />
          <Text style={[styles.modeTabText, { color: studioMode === 'image' ? theme.colors.btnTextColor : theme.colors.textSecondary }]}>
            AI Image Generator
          </Text>
        </TouchableOpacity>
      </View>

      {/* ========================================================== */}
      {/* TEXT COPYWRITER MODE */}
      {/* ========================================================== */}
      {studioMode === 'text' ? (
        <>
          {/* 3. Spacious Platform Carousel (Comfortable & Elegant) */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
              Target Publishing Channel
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.platformScrollRow}
            >
              {PLATFORMS.map((plat) => {
                const isSelected = selectedPlatform === plat.id;
                return (
                  <TouchableOpacity
                    key={plat.id}
                    onPress={() => setSelectedPlatform(plat.id)}
                    activeOpacity={0.75}
                    style={[
                      styles.platformCard,
                      {
                        backgroundColor: isSelected ? theme.colors.surface : theme.colors.surfaceSubtle,
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                  >
                    <View style={[styles.platformIconCircle, isSelected && { backgroundColor: theme.colors.badgeBg }]}>
                      {plat.icon(isSelected ? theme.colors.primary : theme.colors.textMuted)}
                    </View>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.platformCardText,
                        {
                          color: isSelected ? theme.colors.primary : theme.colors.textSecondary,
                          fontWeight: isSelected ? '800' : '600',
                        },
                      ]}
                    >
                      {plat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* 4. Balanced 50/50 Controls Bar (Format & Presets) */}
          <View style={styles.controlsRow}>
            <TouchableOpacity
              onPress={() => setShowParamsModal(true)}
              activeOpacity={0.75}
              style={[styles.controlCard, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
            >
              <View style={[styles.controlIconBox, { backgroundColor: theme.colors.badgeBg }]}>
                <Sliders size={15} color={theme.colors.primary} />
              </View>
              <View style={styles.controlTextGroup}>
                <Text style={[styles.controlLabel, { color: theme.colors.textMuted }]}>Format & Tone</Text>
                <Text numberOfLines={1} style={[styles.controlValue, { color: theme.colors.textPrimary }]}>
                  {CONTENT_TYPES.find((c) => c.id === selectedType)?.label}
                </Text>
              </View>
              <ChevronDown size={15} color={theme.colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowTemplatesModal(true)}
              activeOpacity={0.75}
              style={[styles.controlCard, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
            >
              <View style={[styles.controlIconBox, { backgroundColor: theme.colors.badgeBg }]}>
                <Wand2 size={15} color={theme.colors.badgeText} />
              </View>
              <View style={styles.controlTextGroup}>
                <Text style={[styles.controlLabel, { color: theme.colors.textMuted }]}>Curated Presets</Text>
                <Text numberOfLines={1} style={[styles.controlValue, { color: theme.colors.badgeText }]}>
                  10+ Viral Ideas
                </Text>
              </View>
              <ChevronDown size={15} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* 5. Expansive Frosted Creative Canvas */}
          <GlassCard elevated style={styles.creativeCanvas}>
            <View style={styles.canvasHeader}>
              <Text style={[styles.canvasLabel, { color: theme.colors.textSecondary }]}>
                Creative Concept & Instructions
              </Text>
              <Text style={[styles.charCount, { color: theme.colors.textMuted }]}>
                {prompt.length} chars
              </Text>
            </View>

            <TextInput
              placeholder="Describe your post topic, key takeaways, or paste notes here..."
              placeholderTextColor="rgba(148, 163, 184, 0.4)"
              multiline
              numberOfLines={4}
              style={[styles.canvasInput, { color: theme.colors.textPrimary }]}
              value={prompt}
              onChangeText={setPrompt}
            />

            <AnimatedButton
              title={isGenerating ? 'Synthesizing Copy...' : 'Generate with AI (1 Credit)'}
              onPress={handleGenerateText}
              loading={isGenerating}
              size="lg"
              style={styles.generateBtn}
            />
          </GlassCard>

          {/* 6. Output Result Preview */}
          {generatedResult ? (
            <GlassCard elevated style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Badge label="AI Formatted Output" variant="primary" />
                <TouchableOpacity onPress={handleCopy} style={styles.copyBtn}>
                  {copied ? <Check size={16} color={theme.colors.primary} /> : <Copy size={16} color={theme.colors.textSecondary} />}
                  <Text style={[styles.copyText, { color: theme.colors.textSecondary }]}>
                    {copied ? 'Copied' : 'Copy'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.resultText, { color: theme.colors.textPrimary }]}>{generatedResult}</Text>

              <View style={styles.resultActions}>
                <AnimatedButton
                  title="Save Draft"
                  variant="outline"
                  size="md"
                  onPress={() => {
                    showToast({ title: 'Saved to Drafts', type: 'success' });
                    router.push('/(tabs)');
                  }}
                  icon={<Bookmark size={16} color={theme.colors.textPrimary} />}
                  style={{ flex: 1 }}
                />
                <AnimatedButton
                  title="Schedule Post"
                  size="md"
                  onPress={() => router.push('/(tabs)/calendar')}
                  icon={<Calendar size={16} color={theme.colors.btnTextColor} />}
                  style={{ flex: 1 }}
                />
              </View>
            </GlassCard>
          ) : null}
        </>
      ) : (
        /* ========================================================== */
        /* IMAGE STUDIO MODE */
        /* ========================================================== */
        <>
          <GlassCard elevated style={styles.creativeCanvas}>
            <View style={styles.canvasHeader}>
              <Text style={[styles.canvasLabel, { color: theme.colors.textSecondary }]}>
                Visual Scene Prompt (SDXL)
              </Text>
            </View>

            <TextInput
              placeholder="e.g. Modern minimalist workspace with glowing laptop and neon ambient lighting..."
              placeholderTextColor="rgba(148, 163, 184, 0.4)"
              multiline
              numberOfLines={4}
              style={[styles.canvasInput, { color: theme.colors.textPrimary }]}
              value={imagePrompt}
              onChangeText={setImagePrompt}
            />

            <AnimatedButton
              title={isGeneratingImage ? 'Synthesizing Image...' : 'Render Image (2 Credits)'}
              onPress={handleGenerateImage}
              loading={isGeneratingImage}
              size="lg"
              style={styles.generateBtn}
            />
          </GlassCard>

          {generatedImageUrl ? (
            <GlassCard elevated style={styles.imageResultCard}>
              <Image source={{ uri: generatedImageUrl }} style={styles.imagePreview} />
              <View style={styles.resultActions}>
                <AnimatedButton
                  title="Save to Gallery"
                  variant="outline"
                  size="md"
                  onPress={() => showToast({ title: 'Saved to Gallery', type: 'success' })}
                  icon={<Download size={16} color={theme.colors.textPrimary} />}
                  style={{ flex: 1 }}
                />
                <AnimatedButton
                  title="Schedule Image Post"
                  size="md"
                  onPress={() => router.push('/(tabs)/calendar')}
                  style={{ flex: 1 }}
                />
              </View>
            </GlassCard>
          ) : null}
        </>
      )}

      {/* Format & Tone Modal */}
      <Modal visible={showParamsModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Format & Voice Tone</Text>
              <TouchableOpacity onPress={() => setShowParamsModal(false)}>
                <X size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSectionLabel, { color: theme.colors.textSecondary }]}>Content Format</Text>
            <View style={styles.paramsGrid}>
              {CONTENT_TYPES.map((ct) => (
                <TouchableOpacity
                  key={ct.id}
                  onPress={() => setSelectedType(ct.id)}
                  style={[
                    styles.paramTile,
                    {
                      backgroundColor: selectedType === ct.id ? theme.colors.primary : theme.colors.surfaceSubtle,
                      borderColor: selectedType === ct.id ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.paramTileText, { color: selectedType === ct.id ? theme.colors.btnTextColor : theme.colors.textPrimary }]}>
                    {ct.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.modalSectionLabel, { color: theme.colors.textSecondary, marginTop: 14 }]}>Tone of Voice</Text>
            <View style={styles.paramsGrid}>
              {TONES.map((tone) => (
                <TouchableOpacity
                  key={tone}
                  onPress={() => setSelectedTone(tone)}
                  style={[
                    styles.paramTile,
                    {
                      backgroundColor: selectedTone === tone ? theme.colors.primary : theme.colors.surfaceSubtle,
                      borderColor: selectedTone === tone ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.paramTileText, { color: selectedTone === tone ? theme.colors.btnTextColor : theme.colors.textPrimary }]}>
                    {tone}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <AnimatedButton
              title="Apply Parameters"
              onPress={() => setShowParamsModal(false)}
              size="md"
              style={{ marginTop: 18 }}
            />
          </View>
        </View>
      </Modal>

      {/* Curated Presets Modal */}
      <Modal visible={showTemplatesModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Curated Viral Presets</Text>
              <TouchableOpacity onPress={() => setShowTemplatesModal(false)}>
                <X size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
              {CURATED_TEMPLATES.map((tpl) => (
                <TouchableOpacity
                  key={tpl.id}
                  onPress={() => applyTemplate(tpl)}
                  style={[styles.templateCard, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
                >
                  <View style={styles.templateTop}>
                    <Badge label={tpl.category} variant="primary" />
                    <Text style={[styles.templatePlat, { color: theme.colors.textMuted }]}>#{tpl.platform}</Text>
                  </View>
                  <Text style={[styles.templateTitle, { color: theme.colors.textPrimary }]}>{tpl.title}</Text>
                  <Text style={[styles.templatePrompt, { color: theme.colors.textSecondary }]}>{tpl.prompt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 16,
  },
  header: {
    gap: 3,
    marginBottom: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  modeTrack: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1.2,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 7,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '800',
  },
  sectionBlock: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  platformScrollRow: {
    gap: 10,
    paddingVertical: 2,
  },
  platformCard: {
    width: 80,
    height: 82,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  platformIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformCardText: {
    fontSize: 11.5,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  controlCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
  },
  controlIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlTextGroup: {
    flex: 1,
    gap: 1,
  },
  controlLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  controlValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  creativeCanvas: {
    padding: 18,
    borderRadius: 24,
    gap: 10,
  },
  canvasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  canvasLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  charCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  canvasInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 14.5,
    lineHeight: 22,
    fontWeight: '500',
  },
  generateBtn: {
    marginTop: 4,
  },
  resultCard: {
    padding: 18,
    borderRadius: 22,
    gap: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  copyText: {
    fontSize: 12,
    fontWeight: '700',
  },
  resultText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
  resultActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  imageResultCard: {
    padding: 14,
    borderRadius: 22,
    gap: 12,
  },
  imagePreview: {
    width: '100%',
    height: 250,
    borderRadius: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 22,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  modalSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  paramsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paramTile: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  paramTileText: {
    fontSize: 12,
    fontWeight: '700',
  },
  templateCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 5,
  },
  templateTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templatePlat: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  templateTitle: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  templatePrompt: {
    fontSize: 12,
    lineHeight: 17,
  },
});
