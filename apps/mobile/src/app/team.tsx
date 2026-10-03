import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { goBackOr } from '@/utils/navigation';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuthStore } from '@/store/useAuthStore';
import { ScreenWrapper } from '@/components/templates/ScreenWrapper';
import { GlassCard, AnimatedButton, CustomInput, Badge } from '@/components/atoms';
import { useToast } from '@/components/atoms/CustomToast';
import { supabase, isPlaceholderUrl } from '@/services/supabase';
import {
  ChevronLeft,
  Users,
  UserPlus,
  Shield,
  Eye,
  Trash2,
  Mail,
  X,
  User as UserIcon,
  Clock,
} from 'lucide-react-native';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Editor' | 'Viewer';
  avatarUrl: string;
}

interface ReceivedInvite {
  id: string;
  inviter_name: string;
  role: string;
}

interface JoinedWorkspace {
  team_id: string;
  owner_name: string;
  owner_email: string;
  my_role: string;
  member_count: number;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// send_team_invite() outcome codes → user-facing messages (SECURITY DEFINER
// RPC validates registration, membership and duplicates atomically in DB).
const INVITE_OUTCOME_MESSAGES: Record<string, string> = {
  not_registered: 'No registered account found for {email}. Ask them to sign up first — invites only work for registered users.',
  self_invite: 'You cannot invite your own account.',
  already_member: 'This user is already a member of your workspace.',
  already_invited: 'A pending invite already exists for this email.',
};

export default function TeamScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const user = useAuthStore((state) => state.user);

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'Editor' | 'Viewer'>('Editor');
  const [isInviting, setIsInviting] = useState(false);
  const [sentInvites, setSentInvites] = useState<Array<{ id?: string; email: string; name: string; role: string; status?: string }>>([]);
  const [receivedInvites, setReceivedInvites] = useState<ReceivedInvite[]>([]);
  const [workspaces, setWorkspaces] = useState<JoinedWorkspace[]>([]);

  // Real membership data via definer RPCs (migration 20240001000004):
  // team_members rows + invites with inviter identity resolved server-side.
  useEffect(() => {
    if (isPlaceholderUrl || !user?.id) return;
    loadTeamData();
  }, [user?.id]);

  // Placeholder (demo) mode: no backend, seed the local owner row only.
  useEffect(() => {
    if (!isPlaceholderUrl) return;
    setMembers([
      {
        id: user?.id || '1',
        name: (user?.full_name || 'You') + ' (You)',
        email: user?.email || 'you@company.com',
        role: 'Owner',
        avatarUrl: String(user?.avatar_url || ''),
      },
    ]);
  }, [user?.id, user?.full_name, user?.email]);

  const loadTeamData = async () => {
    if (!user?.id) return;

    const { data: memberRows, error: membersError } = await supabase.rpc('get_team_members', {
      p_team: user.id,
    });
    if (!membersError && memberRows) {
      setMembers(
        memberRows.map((m: any) => ({
          id: m.user_id,
          name: m.user_id === user.id ? `${m.full_name || 'You'} (You)` : m.full_name || 'Team Member',
          email: m.email,
          role: capitalize(String(m.role)) as TeamMember['role'],
          avatarUrl: String(m.avatar_url || ''),
        }))
      );
    }

    const { data: received } = await supabase.rpc('get_received_invites');
    if (received) {
      setReceivedInvites(
        received.map((i: any) => ({
          id: i.invite_id,
          inviter_name: i.inviter_name || 'Team Owner',
          role: String(i.role),
        }))
      );
    }

    const { data: teams } = await supabase.rpc('get_my_teams');
    if (teams) {
      setWorkspaces(
        teams
          .filter((t: any) => t.team_id !== user.id)
          .map((t: any) => ({
            team_id: t.team_id,
            owner_name: t.owner_name || 'Workspace Owner',
            owner_email: t.owner_email || '',
            my_role: String(t.my_role),
            member_count: Number(t.member_count) || 1,
          }))
      );
    }

    // Sent invites are the caller's own team_invites rows — plain RLS covers.
    const { data: sent } = await supabase
      .from('team_invites')
      .select('*')
      .eq('inviter_id', user.id)
      .order('created_at', { ascending: false });
    if (sent) {
      setSentInvites(sent.map((i: any) => ({ id: i.id, email: i.invitee_email, name: i.invitee_name || i.invitee_email, role: i.role, status: i.status })));
    }
  };

  const handleSendInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) {
      showToast({ title: 'Email Required', message: 'Enter member email address.', type: 'error' });
      return;
    }
    setIsInviting(true);

    if (isPlaceholderUrl) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      setSentInvites((prev) => [...prev, { email, name: inviteName.trim() || email.split('@')[0] || 'Team Member', role: selectedRole, status: 'pending' }]);
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteName('');
      setIsInviting(false);
      showToast({ title: 'Invitation Sent!', message: `Invite sent to ${email}.`, type: 'success' });
      return;
    }

    try {
      const { data: result, error } = await supabase.rpc('send_team_invite', {
        invitee_email: email,
        invitee_name: inviteName.trim(),
        inv_role: selectedRole.toLowerCase(),
      });
      if (error) {
        showToast({ title: 'Invite Failed', message: error.message, type: 'error' });
        return;
      }
      const outcome = String(result);
      if (outcome !== 'ok') {
        const message = (INVITE_OUTCOME_MESSAGES[outcome] || 'Could not send the invite.').replace('{email}', email);
        showToast({ title: 'Invite Not Sent', message, type: 'error' });
        return;
      }
      await loadTeamData();
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteName('');
      showToast({ title: 'Invitation Sent!', message: `${email} has been notified — they can accept from their inbox.`, type: 'success' });
    } catch (e) {
      showToast({ title: 'Invite Failed', message: e instanceof Error ? e.message : 'Unknown error', type: 'error' });
    } finally {
      setIsInviting(false);
    }
  };

  const handleAcceptInvite = async (invite: ReceivedInvite) => {
    if (isPlaceholderUrl) {
      setReceivedInvites((prev) => prev.filter((i) => i.id !== invite.id));
      showToast({ title: 'Invite Accepted', message: 'You have joined the workspace.', type: 'success' });
      return;
    }
    const { data: result, error } = await supabase.rpc('accept_team_invite', { target_invite_id: invite.id });
    if (error) {
      showToast({ title: 'Error', message: error.message, type: 'error' });
      return;
    }
    if (String(result) !== 'ok') {
      showToast({ title: 'Invite No Longer Valid', message: 'This invite was already accepted, declined or removed.', type: 'error' });
      loadTeamData();
      return;
    }
    await loadTeamData();
    showToast({
      title: 'Invite Accepted',
      message: `You joined ${invite.inviter_name}'s workspace as ${capitalize(invite.role)}.`,
      type: 'success',
    });
  };

  const handleDeclineInvite = async (invite: ReceivedInvite) => {
    if (isPlaceholderUrl) {
      setReceivedInvites((prev) => prev.filter((i) => i.id !== invite.id));
      showToast({ title: 'Invite Declined', message: 'Invitation removed.', type: 'info' });
      return;
    }
    const { data: result, error } = await supabase.rpc('decline_team_invite', { target_invite_id: invite.id });
    if (error) {
      showToast({ title: 'Error', message: error.message, type: 'error' });
      return;
    }
    if (String(result) !== 'ok') {
      showToast({ title: 'Invite No Longer Valid', message: 'This invite was already handled.', type: 'error' });
      loadTeamData();
      return;
    }
    await loadTeamData();
    showToast({ title: 'Invite Declined', message: `${invite.inviter_name} was notified.`, type: 'info' });
  };

  const handleRemoveMember = async (id: string, name: string) => {
    if (isPlaceholderUrl || !user?.id) {
      setMembers((prev) => prev.filter((m) => m.id !== id));
      showToast({ title: 'Member Removed', message: `${name} access revoked.`, type: 'info' });
      return;
    }
    const { data: result, error } = await supabase.rpc('remove_team_member', { p_team: user.id, p_user: id });
    if (error) {
      showToast({ title: 'Remove Failed', message: error.message, type: 'error' });
      return;
    }
    const outcome = String(result);
    if (outcome !== 'ok') {
      const messages: Record<string, string> = {
        forbidden: 'Only the workspace owner can remove members.',
        cannot_remove_owner: 'The owner cannot be removed.',
        not_found: 'That member was already removed.',
      };
      showToast({ title: 'Remove Failed', message: messages[outcome] || 'Could not remove member.', type: 'error' });
      loadTeamData();
      return;
    }
    await loadTeamData();
    showToast({ title: 'Member Removed', message: `${name} access revoked — they were notified.`, type: 'info' });
  };

  const handleLeaveWorkspace = async (ws: JoinedWorkspace) => {
    if (isPlaceholderUrl) {
      setWorkspaces((prev) => prev.filter((w) => w.team_id !== ws.team_id));
      showToast({ title: 'Left Workspace', message: `You left ${ws.owner_name}'s team.`, type: 'info' });
      return;
    }
    const { data: result, error } = await supabase.rpc('leave_team', { p_team: ws.team_id });
    if (error) {
      showToast({ title: 'Error', message: error.message, type: 'error' });
      return;
    }
    if (String(result) !== 'ok') {
      showToast({ title: 'Could Not Leave', message: 'You are no longer a member of that workspace.', type: 'error' });
      loadTeamData();
      return;
    }
    await loadTeamData();
    showToast({ title: 'Left Workspace', message: `You left ${ws.owner_name}'s team. They were notified.`, type: 'info' });
  };

  return (
    <ScreenWrapper scrollable contentContainerStyle={styles.container}>
      <TouchableOpacity
        onPress={() => goBackOr(router)}
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

      {/* Account Email Display */}
      {user?.email ? (
        <View style={[styles.emailCard, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}>
          <Mail size={14} color={theme.colors.textMuted} />
          <Text style={[styles.emailText, { color: theme.colors.textSecondary }]} numberOfLines={1}>{user.email}</Text>
        </View>
      ) : null}

      {/* Received Invites */}
      {receivedInvites.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Workspace Invites</Text>
            <Text style={[styles.memberCount, { color: theme.colors.textMuted }]}>{receivedInvites.length} pending</Text>
          </View>
          {receivedInvites.map((invite) => (
            <GlassCard key={invite.id} elevated style={styles.memberCard}>
              <View style={styles.memberLeft}>
                <View style={[styles.memberAvatar, { backgroundColor: theme.colors.badgeBg, alignItems: 'center', justifyContent: 'center' }]}>
                  <Mail size={18} color={theme.colors.primary} />
                </View>
                <View style={styles.memberInfo}>
                  <Text style={[styles.memberName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                    Invite from {invite.inviter_name}
                  </Text>
                  <Text style={[styles.memberEmail, { color: theme.colors.textSecondary }]}>
                    Role: {capitalize(invite.role)}
                  </Text>
                </View>
              </View>
              <View style={styles.memberRight}>
                <TouchableOpacity
                  onPress={() => handleDeclineInvite(invite)}
                  style={[styles.declineBtn, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
                >
                  <Text style={[styles.declineBtnText, { color: theme.colors.textSecondary }]}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleAcceptInvite(invite)}
                  style={[styles.acceptBtn, { backgroundColor: theme.colors.primary }]}
                >
                  <Text style={[styles.acceptBtnText, { color: theme.colors.btnTextColor }]}>Accept</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          ))}
        </>
      )}

      {/* Joined Workspaces (multi-team membership) */}
      {workspaces.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Joined Workspaces</Text>
            <Text style={[styles.memberCount, { color: theme.colors.textMuted }]}>{workspaces.length} teams</Text>
          </View>
          {workspaces.map((ws) => (
            <GlassCard key={ws.team_id} elevated style={styles.memberCard}>
              <View style={styles.memberLeft}>
                <View style={[styles.memberAvatar, { backgroundColor: theme.colors.badgeBg, alignItems: 'center', justifyContent: 'center' }]}>
                  <Users size={18} color={theme.colors.primary} />
                </View>
                <View style={styles.memberInfo}>
                  <Text style={[styles.memberName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                    {ws.owner_name}&apos;s Team
                  </Text>
                  <Text style={[styles.memberEmail, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                    {capitalize(ws.my_role)} · {ws.member_count} member{ws.member_count === 1 ? '' : 's'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => handleLeaveWorkspace(ws)}
                style={[styles.declineBtn, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
              >
                <Text style={[styles.declineBtnText, { color: theme.colors.textSecondary }]}>Leave</Text>
              </TouchableOpacity>
            </GlassCard>
          ))}
        </>
      )}

      {/* Members List */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Active Members</Text>
        <Text style={[styles.memberCount, { color: theme.colors.textMuted }]}>{members.length + sentInvites.length} Total</Text>
      </View>

      <View style={styles.membersList}>
        {members.map((member) => (
          <GlassCard key={member.id} elevated style={styles.memberCard}>
            <View style={styles.memberLeft}>
              {member.avatarUrl ? (
                <Image source={{ uri: member.avatarUrl }} style={styles.memberAvatar} />
              ) : (
                <View style={[styles.memberAvatar, { backgroundColor: theme.colors.badgeBg, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ color: theme.colors.primary, fontWeight: '800', fontSize: 16 }}>
                    {(member.name || '?')[0]}
                  </Text>
                </View>
              )}
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
                  <Trash2 size={15} color={theme.colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          </GlassCard>
        ))}

        {/* Sent Invites */}
        {sentInvites.map((invite, index) => (
          <GlassCard key={`invite-${invite.id || index}`} elevated style={styles.memberCard}>
            <View style={styles.memberLeft}>
              <View style={[styles.memberAvatar, { backgroundColor: theme.colors.surfaceSubtle, alignItems: 'center', justifyContent: 'center' }]}>
                <Clock size={16} color={theme.colors.textMuted} />
              </View>
              <View style={styles.memberInfo}>
                <Text style={[styles.memberName, { color: theme.colors.textPrimary }]}>{invite.name}</Text>
                <Text style={[styles.memberEmail, { color: theme.colors.textSecondary }]} numberOfLines={1}>{invite.email}</Text>
              </View>
            </View>
            <Badge
              label={invite.status === 'accepted' ? 'Accepted' : invite.status === 'declined' ? 'Declined' : 'Pending'}
              variant={invite.status === 'accepted' ? 'primary' : 'neutral'}
            />
          </GlassCard>
        ))}
      </View>

      {/* Invite Member Modal Sheet - Centered with KeyboardAvoidingView */}
      <Modal visible={showInviteModal} animationType="fade" transparent onRequestClose={() => setShowInviteModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.modalSheet, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Invite Collaborator</Text>
                <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                  <X size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <CustomInput
                label="Collaborator Name (Optional)"
                placeholder="Teammate name"
                value={inviteName}
                onChangeText={setInviteName}
                leftIcon={<UserIcon size={18} color={theme.colors.primary} />}
              />

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
          </ScrollView>
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
  emailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  emailText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  acceptBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  declineBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  declineBtnText: {
    fontSize: 13,
    fontWeight: '700',
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
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
