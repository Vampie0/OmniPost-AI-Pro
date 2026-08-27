import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { ScreenWrapper } from '@/components/templates/ScreenWrapper';
import { GlassCard, AnimatedButton, CustomInput, Badge } from '@/components/atoms';
import { useToast } from '@/components/atoms/CustomToast';
import {
  ChevronLeft,
  Users,
  UserPlus,
  Crown,
  Shield,
  Eye,
  Trash2,
  Mail,
  X,
  CheckCircle2,
} from 'lucide-react-native';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Editor' | 'Viewer';
  avatarUrl: string;
}

const INITIAL_MEMBERS: TeamMember[] = [
  {
    id: '1',
    name: 'Alex Rivera (You)',
    email: 'alex@company.com',
    role: 'Owner',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
  },
  {
    id: '2',
    name: 'Sarah Jenkins',
    email: 'sarah.content@agency.io',
    role: 'Editor',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
  },
  {
    id: '3',
    name: 'Marcus Vance',
    email: 'marcus.v@clientbrand.com',
    role: 'Viewer',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
  },
];

export default function TeamScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'Editor' | 'Viewer'>('Editor');
  const [isInviting, setIsInviting] = useState(false);

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      showToast({ title: 'Email Required', message: 'Enter member email address.', type: 'error' });
      return;
    }

    setIsInviting(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsInviting(false);

    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: inviteEmail.split('@')[0],
      email: inviteEmail.trim(),
      role: selectedRole,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
    };

    setMembers((prev) => [...prev, newMember]);
    setShowInviteModal(false);
    setInviteEmail('');
    showToast({ title: 'Invitation Sent!', message: `${inviteEmail} added as ${selectedRole}.`, type: 'success' });
  };

  const handleRemoveMember = (id: string, name: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    showToast({ title: 'Member Removed', message: `${name} access revoked.`, type: 'info' });
  };

  return (
    <ScreenWrapper scrollable contentContainerStyle={styles.container}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backBtn, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
      >
        <ChevronLeft size={20} color={theme.colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Team & Workspace</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Collaborate with copywriters, designers, and clients on scheduled campaigns
        </Text>
      </View>

      {/* Invite Action Trigger Card */}
      <GlassCard elevated style={styles.inviteHeroCard}>
        <View style={styles.inviteHeroTop}>
          <View style={[styles.inviteIconBox, { backgroundColor: theme.colors.badgeBg }]}>
            <Users size={20} color={theme.colors.primary} />
          </View>
          <Badge label="Agency Suite" variant="primary" />
        </View>

        <Text style={[styles.inviteHeroTitle, { color: theme.colors.textPrimary }]}>
          Invite Workspace Collaborators
        </Text>
        <Text style={[styles.inviteHeroDesc, { color: theme.colors.textSecondary }]}>
          Give editors publishing permissions or share view-only post approval dashboards with your clients.
        </Text>

        <AnimatedButton
          title="Invite New Member"
          onPress={() => setShowInviteModal(true)}
          size="md"
          icon={<UserPlus size={16} color={theme.colors.btnTextColor} />}
          style={styles.inviteHeroBtn}
        />
      </GlassCard>

      {/* Members List */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Active Members</Text>
        <Text style={[styles.memberCount, { color: theme.colors.textMuted }]}>{members.length} Total</Text>
      </View>

      <View style={styles.membersList}>
        {members.map((member) => (
          <GlassCard key={member.id} elevated style={styles.memberCard}>
            <View style={styles.memberLeft}>
              <Image source={{ uri: member.avatarUrl }} style={styles.memberAvatar} />
              <View style={styles.memberInfo}>
                <Text style={[styles.memberName, { color: theme.colors.textPrimary }]}>
                  {member.name}
                </Text>
                <Text style={[styles.memberEmail, { color: theme.colors.textSecondary }]}>
                  {member.email}
                </Text>
              </View>
            </View>

            <View style={styles.memberRight}>
              <Badge
                label={member.role}
                variant={member.role === 'Owner' ? 'primary' : member.role === 'Editor' ? 'secondary' : 'neutral'}
              />
              {member.role !== 'Owner' && (
                <TouchableOpacity
                  onPress={() => handleRemoveMember(member.id, member.name)}
                  style={styles.removeBtn}
                >
                  <Trash2 size={15} color="#F43F5E" />
                </TouchableOpacity>
              )}
            </View>
          </GlassCard>
        ))}
      </View>

      {/* Invite Member Modal Sheet */}
      <Modal visible={showInviteModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Invite Collaborator</Text>
              <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                <X size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <CustomInput
              label="Collaborator Email"
              placeholder="teammate@company.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              leftIcon={<Mail size={18} color={theme.colors.primary} />}
            />

            <Text style={[styles.roleSelectLabel, { color: theme.colors.textSecondary }]}>Select Workspace Role</Text>
            <View style={styles.rolesRow}>
              <TouchableOpacity
                onPress={() => setSelectedRole('Editor')}
                style={[
                  styles.roleCard,
                  {
                    backgroundColor: selectedRole === 'Editor' ? theme.colors.surfaceSubtle : theme.colors.surface,
                    borderColor: selectedRole === 'Editor' ? theme.colors.primary : theme.colors.border,
                    borderWidth: selectedRole === 'Editor' ? 1.8 : 1,
                  },
                ]}
              >
                <Shield size={18} color={selectedRole === 'Editor' ? theme.colors.primary : theme.colors.textMuted} />
                <Text style={[styles.roleName, { color: theme.colors.textPrimary }]}>Editor</Text>
                <Text style={[styles.roleDesc, { color: theme.colors.textMuted }]}>Create, edit & schedule posts</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedRole('Viewer')}
                style={[
                  styles.roleCard,
                  {
                    backgroundColor: selectedRole === 'Viewer' ? theme.colors.surfaceSubtle : theme.colors.surface,
                    borderColor: selectedRole === 'Viewer' ? theme.colors.primary : theme.colors.border,
                    borderWidth: selectedRole === 'Viewer' ? 1.8 : 1,
                  },
                ]}
              >
                <Eye size={18} color={selectedRole === 'Viewer' ? theme.colors.primary : theme.colors.textMuted} />
                <Text style={[styles.roleName, { color: theme.colors.textPrimary }]}>Viewer</Text>
                <Text style={[styles.roleDesc, { color: theme.colors.textMuted }]}>View & approve posts only</Text>
              </TouchableOpacity>
            </View>

            <AnimatedButton
              title={isInviting ? 'Sending Invite...' : 'Send Workspace Invite'}
              onPress={handleSendInvite}
              loading={isInviting}
              size="lg"
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
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
  inviteHeroCard: {
    padding: 18,
    borderRadius: 22,
    gap: 8,
  },
  inviteHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  inviteIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteHeroTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  inviteHeroDesc: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  inviteHeroBtn: {
    width: '100%',
    marginTop: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  memberCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  membersList: {
    gap: 10,
  },
  memberCard: {
    padding: 14,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E293B',
  },
  memberInfo: {
    gap: 2,
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '800',
  },
  memberEmail: {
    fontSize: 12,
  },
  memberRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  removeBtn: {
    padding: 4,
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
    gap: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  roleSelectLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  rolesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    gap: 4,
  },
  roleName: {
    fontSize: 14,
    fontWeight: '800',
  },
  roleDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
});
