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

        // ❗ Check already pending invite
        if (inviteRepository.findByGroupIdAndInvitedUserIdAndStatus(
                groupId, invitedUser.getId(), "PENDING").isPresent())
            throw new RuntimeException("Invite already sent");

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
                        invite.getStatus()
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
}