package com.bezkoder.springjwt.groups.groupInvite;

import com.bezkoder.springjwt.groups.groupInvite.dto.InviteResponse;

import org.springframework.stereotype.Service;

import com.bezkoder.springjwt.groups.Group;
import com.bezkoder.springjwt.groups.GroupRepository;
import com.bezkoder.springjwt.groups.GroupMember;
import com.bezkoder.springjwt.groups.GroupMemberRepository;
import com.bezkoder.springjwt.repository.UserRepository;
import com.bezkoder.springjwt.models.User;
import java.util.List;
import java.util.Optional;

@Service
public class GroupInviteService {

    private final GroupInviteRepository inviteRepository;
    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final GroupMemberRepository groupMemberRepository;

    public GroupInviteService(GroupInviteRepository inviteRepository,
                              GroupRepository groupRepository,
                              UserRepository userRepository,
                              GroupMemberRepository groupMemberRepository) {
        this.inviteRepository = inviteRepository;
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
        this.groupMemberRepository = groupMemberRepository;
    }

    // 🔹 Send Invite
    public void sendInvite(Long groupId, String username, String currentUsername) {

        User invitedUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        User invitedBy = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("Sender not found")); 

        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        // ❗ Check already member
        boolean alreadyMember = groupMemberRepository
                .existsByGroupIdAndUserId(groupId, invitedUser.getId());

        if (alreadyMember)
            throw new RuntimeException("User already member");

        // 🔄 If previously REJECTED, reset to PENDING first (before PENDING check)
        List<GroupInvite> rejectedList = inviteRepository
                .findByGroupAndInvitedUserAndStatus(group, invitedUser, "REJECTED");
        if (!rejectedList.isEmpty()) {
            // Delete duplicates, keep first
            if (rejectedList.size() > 1) {
                inviteRepository.deleteAll(rejectedList.subList(1, rejectedList.size()));
            }
            GroupInvite toReset = rejectedList.get(0);
            toReset.setStatus("PENDING");
            toReset.setCreatedAt(java.time.LocalDateTime.now());
            inviteRepository.save(toReset);
            return;
        }

        // ❗ Check for existing PENDING invite (only after confirming no REJECTED one)
        List<GroupInvite> pendingList = inviteRepository
                .findByGroupAndInvitedUserAndStatus(group, invitedUser, "PENDING");
        if (!pendingList.isEmpty()) {
            // Delete duplicates if any, keep first
            if (pendingList.size() > 1) {
                inviteRepository.deleteAll(pendingList.subList(1, pendingList.size()));
            }
            throw new RuntimeException("Invite already sent");
        }

        GroupInvite invite = new GroupInvite();
        invite.setGroup(group);
        invite.setInvitedUser(invitedUser);
        invite.setInvitedBy(invitedBy);
        
        inviteRepository.save(invite);
    }

    // 🔹 Get My Invites
    public List<InviteResponse> getMyInvites(String username) {

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return inviteRepository.findByInvitedUserAndStatus(user, "PENDING")
                .stream()
                .map(invite -> new InviteResponse(
                        invite.getId(),
                        invite.getGroup().getId(),
                        invite.getGroup().getName(),
                        invite.getInvitedBy().getUsername(),
                        invite.getStatus(),
                        invite.getInvitedUser().getId(),
                        invite.getInvitedUser().getUsername()
                ))
                .toList();
    }
    // Get My sents
    public List<InviteResponse> getMySents(String username) {

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return inviteRepository.findByInvitedByAndStatusIn(user, List.of("PENDING", "REJECTED"))
                .stream()
                // 🧹 Skip stale invites where the user is already a member
                .filter(invite -> !groupMemberRepository.existsByGroupIdAndUserId(
                        invite.getGroup().getId(), invite.getInvitedUser().getId()))
                .map(invite -> new InviteResponse(
                        invite.getId(),
                        invite.getGroup().getId(),
                        invite.getGroup().getName(),
                        invite.getInvitedBy().getUsername(),
                        invite.getStatus(),
                        invite.getInvitedUser().getId(),
                        invite.getInvitedUser().getUsername()
                ))
                .toList();
    }

    // 🔹 Accept Invite
    public void acceptInvite(Long inviteId, String username) {

        GroupInvite invite = inviteRepository.findById(inviteId)
                .orElseThrow(() -> new RuntimeException("Invite not found"));

        if (!invite.getInvitedUser().getUsername().equals(username))
            throw new RuntimeException("Not authorized");

        invite.setStatus("ACCEPTED");

        // Add to group_members
        GroupMember member = new GroupMember();
        member.setGroup(invite.getGroup());
        member.setUser(invite.getInvitedUser());
        member.setRole("MEMBER");

        groupMemberRepository.save(member);
        inviteRepository.save(invite);

        // 🧹 Clean up all other duplicate invite rows for this group+user
        List<GroupInvite> allInvites = inviteRepository
                .findByGroupAndInvitedUser(invite.getGroup(), invite.getInvitedUser());
        List<GroupInvite> toDelete = allInvites.stream()
                .filter(i -> !i.getId().equals(invite.getId()))
                .toList();
        if (!toDelete.isEmpty()) {
            inviteRepository.deleteAll(toDelete);
        }
    }

    // 🔹 Reject Invite
    public void rejectInvite(Long inviteId, String username) {

        GroupInvite invite = inviteRepository.findById(inviteId)
                .orElseThrow(() -> new RuntimeException("Invite not found"));

        if (!invite.getInvitedUser().getUsername().equals(username))
            throw new RuntimeException("Not authorized");

        invite.setStatus("REJECTED");
        inviteRepository.save(invite);
    }
    // Get group invites
    public List<InviteResponse> getGroupInvites(Long groupId) {
        return inviteRepository.findByGroupId(groupId)
                .stream()
                .map(invite -> new InviteResponse(
                        invite.getId(),
                        invite.getGroup().getId(),
                        invite.getGroup().getName(),
                        invite.getInvitedBy().getUsername(),
                        invite.getStatus(),
                        invite.getInvitedUser().getId(),
                        invite.getInvitedUser().getUsername()
                ))
                .toList();
    }

    // 🔹 Delete (recall) a sent invite — only the sender can do this
    public void deleteInvite(Long inviteId, String username) {
        GroupInvite invite = inviteRepository.findById(inviteId)
                .orElseThrow(() -> new RuntimeException("Invite not found"));

        if (!invite.getInvitedBy().getUsername().equals(username))
            throw new RuntimeException("Not authorized — only the sender can delete this invite");

        inviteRepository.deleteById(inviteId);
    }

}