import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafePress } from '@/hooks/useSafePress';
import { useTheme } from '@/theme/ThemeProvider';
import { EmptyStateCard } from '@/components/atoms/EmptyStateCard';
import { ScreenWrapper } from '@/components/templates/ScreenWrapper';
import { GlassCard, AnimatedButton, CustomInput, Badge } from '@/components/atoms';
import { useToast } from '@/components/atoms/CustomToast';
import * as SecureStore from '@/utils/secureStorage';
import {
  ChevronLeft,
  Plus,
  Search,
  Sparkles,
  Trash2,
  StickyNote,
  X,
} from 'lucide-react-native';

interface NoteItem {
  id: string;
  title: string;
  content: string;
  tag: string;
  updatedAt: string;
}

const TAGS = ['All', 'Hooks', 'Launch', 'Strategy', 'Reels'];

export default function NotesScreen() {
  const router = useRouter();
  const { safePress } = useSafePress();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');

  // New Note Modal State
  const [showModal, setShowModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTag, setNoteTag] = useState('Hooks');

  // Load saved notes from SecureStore on startup
  useEffect(() => {
    SecureStore.getItemAsync('user_creator_notes').then((saved) => {
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setNotes(parsed);
          }
        } catch {}
      }
    });
  }, []);

  // Save new note permanently
  const handleSaveNote = async () => {
    if (!noteTitle.trim() || !noteContent.trim()) {
      showToast({ title: 'Fields Required', message: 'Enter both title and idea draft.', type: 'error' });
      return;
    }

    const newNote: NoteItem = {
      id: Date.now().toString(),
      title: noteTitle.trim(),
      content: noteContent.trim(),
      tag: noteTag,
      updatedAt: 'Just now',
    };

    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    await SecureStore.setItemAsync('user_creator_notes', JSON.stringify(updatedNotes));

    setShowModal(false);
    setNoteTitle('');
    setNoteContent('');
    showToast({ title: 'Note Saved!', message: 'Idea stored permanently in your vault.', type: 'success' });
  };

  // Delete note
  const handleDeleteNote = async (id: string) => {
    const updatedNotes = notes.filter((n) => n.id !== id);
    setNotes(updatedNotes);
    await SecureStore.setItemAsync('user_creator_notes', JSON.stringify(updatedNotes));
    showToast({ title: 'Note Deleted', type: 'info' });
  };

  // Send to AI Studio — the note text is handed to the generator via the
  // `note` param and pre-fills its prompt box (see (tabs)/generate.tsx)
  const handleSendToAIStudio = (content: string) => {
    router.push({ pathname: '/(tabs)/generate', params: { note: content } });
    showToast({ title: 'Exported to AI Studio', message: 'Note loaded into the generator prompt.', type: 'success' });
  };

  const filteredNotes = notes.filter((n) => {
    const matchesTag = selectedTag === 'All' || n.tag === selectedTag;
    const matchesSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase());
    return matchesTag && matchesSearch;
  });

  return (
    <ScreenWrapper scrollable contentContainerStyle={styles.container}>
      {/* Top Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={() =>
            safePress(() => {
              // Direct URL loads / refreshes leave the stack with no previous
              // route — GO_BACK would then throw; fall back to the workspace
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)');
              }
            })
          }
          style={[styles.backBtn, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
        >
          <ChevronLeft size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        {/* Plus Button with high touch priority */}
        <TouchableOpacity
          onPress={() => safePress(() => setShowModal(true))}
          activeOpacity={0.75}
          style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
        >
          <Plus size={20} color={theme.colors.btnTextColor} />
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Creator Scratchpad</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Jot down viral ideas, rough hooks, and export them directly to AI Studio
        </Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchBox, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}>
        <Search size={16} color={theme.colors.textMuted} />
        <TextInput
          placeholder="Search ideas or notes..."
          placeholderTextColor={theme.colors.textMuted}
          value={search}
          onChangeText={setSearch}
          style={[styles.searchInput, { color: theme.colors.textPrimary }]}
        />
      </View>

      {/* Tag Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll} contentContainerStyle={styles.tagsRow}>
        {TAGS.map((tag) => {
          const isSelected = selectedTag === tag;
          return (
            <TouchableOpacity
              key={tag}
              onPress={() => setSelectedTag(tag)}
              style={[
                styles.tagPill,
                {
                  backgroundColor: isSelected ? theme.colors.primary : theme.colors.surfaceSubtle,
                  borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.tagText,
                  {
                    color: isSelected ? theme.colors.btnTextColor : theme.colors.textSecondary,
                    fontWeight: isSelected ? '800' : '600',
                  },
                ]}
              >
                {tag}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Notes Grid */}
      <View style={styles.notesList}>
        {filteredNotes.length === 0 ? (
          <EmptyStateCard
            icon={StickyNote}
            title="No notes found"
            subtitle="Tap the (+) button at the top to create your first idea note."
            style={styles.emptyCard}
          />
        ) : (
          filteredNotes.map((note) => (
            <GlassCard key={note.id} elevated style={styles.noteCard}>
              <View style={styles.noteCardTop}>
                <Badge label={note.tag} variant="primary" />
                <View style={styles.noteActions}>
                  <TouchableOpacity
                    onPress={() => safePress(() => handleSendToAIStudio(note.content))}
                    style={[styles.aiExpandBtn, { backgroundColor: theme.colors.badgeBg }]}
                  >
                    <Sparkles size={13} color={theme.colors.primary} />
                    <Text style={[styles.aiExpandText, { color: theme.colors.primary }]}>Expand with AI</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => safePress(() => handleDeleteNote(note.id))} style={styles.deleteBtn}>
                    <Trash2 size={15} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={[styles.noteTitle, { color: theme.colors.textPrimary }]}>{note.title}</Text>
              <Text style={[styles.noteContent, { color: theme.colors.textSecondary }]}>{note.content}</Text>

              <Text style={[styles.noteDate, { color: theme.colors.textMuted }]}>Updated {note.updatedAt}</Text>
            </GlassCard>
          ))
        )}
      </View>

    {/* Create Note Modal Sheet with KeyboardAvoidingView */}
<Modal
  visible={showModal}
  animationType="slide"
  transparent
  statusBarTranslucent
  onRequestClose={() => setShowModal(false)}
>
  <KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    style={styles.modalBackdrop}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
  >
    <View
      style={[
        styles.modalSheet,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {/* Header fixed — scroll nahi hoga */}
      <View style={styles.modalHeader}>
        <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
          New Idea Note
        </Text>
        <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeBtn}>
          <X size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* ScrollView — ab height limit ke saath properly scroll karega */}
      <ScrollView
        style={styles.modalScroll}
        contentContainerStyle={styles.modalScrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
        bounces={true}
      >
        <CustomInput
          label="Note Title"
          placeholder="e.g. 5 Morning Habits Hook"
          value={noteTitle}
          onChangeText={setNoteTitle}
        />

        <CustomInput
          label="Content / Idea Draft"
          placeholder="Write your rough idea or draft here..."
          multiline
          numberOfLines={4}
          style={{ minHeight: 90 }}
          value={noteContent}
          onChangeText={setNoteContent}
        />

        <Text style={[styles.modalSectionLabel, { color: theme.colors.textSecondary }]}>
          Category Tag
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll} contentContainerStyle={styles.modalTagsRow}>
          {TAGS.filter((t) => t !== 'All').map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setNoteTag(t)}
              style={[
                styles.tagPill,
                {
                  backgroundColor:
                    noteTag === t ? theme.colors.primary : theme.colors.surfaceSubtle,
                  borderColor:
                    noteTag === t ? theme.colors.primary : theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.tagText,
                  {
                    color:
                      noteTag === t
                        ? theme.colors.btnTextColor
                        : theme.colors.textPrimary,
                    fontWeight: noteTag === t ? '800' : '600',
                  },
                ]}
              >
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <AnimatedButton
          title="Save Note to Scratchpad"
          onPress={() => safePress(handleSaveNote)}
          size="lg"
          style={{ marginTop: 14, marginBottom: 8 }}
        />
      </ScrollView>
    </View>
  </KeyboardAvoidingView>
</Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 16,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  tagsScroll: {
    // react-native-web gives ScrollView flex:1 by default; inside the
    // screen's column layout that steals leftover height and stretches the
    // pills into tall rectangles. Keep it content-sized.
    flexGrow: 0,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  modalTagsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  tagPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
  },
  notesList: {
    gap: 12,
  },
  noteCard: {
    padding: 16,
    borderRadius: 22,
    gap: 8,
  },
  noteCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiExpandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 999,
    gap: 4,
  },
  aiExpandText: {
    fontSize: 11,
    fontWeight: '800',
  },
  deleteBtn: {
    padding: 4,
  },
  noteTitle: {
    fontSize: 15.5,
    fontWeight: '800',
  },
  noteContent: {
    fontSize: 13,
    lineHeight: 19,
  },
  noteDate: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 36,
    borderRadius: 22,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  modalBackdrop: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 20,
},
modalSheet: {
  width: '100%',
  maxWidth: 420,
  maxHeight: '80%',
  borderRadius: 24,
  borderWidth: 1.2,
  padding: 20,
  paddingBottom: 12,
},
modalHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
},
modalTitle: {
  fontSize: 18,
  fontWeight: '900',
},
closeBtn: {
  padding: 4,
},
modalScroll: {
  flexGrow: 0,               // important — maxHeight ke andar fit hone do
  maxHeight: '100%',
},
modalScrollContent: {
  gap: 12,
  paddingBottom: 24,         // button ke neeche extra space taake scroll kar saken
},
modalSectionLabel: {
  fontSize: 11,
  fontWeight: '800',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  marginTop: 4,
},
});
