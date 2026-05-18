package com.bezkoder.springjwt.groups.groupInvite;

import com.bezkoder.springjwt.groups.groupInvite.dto.InviteResponse;
import com.bezkoder.springjwt.chat.entity.Message;
import com.bezkoder.springjwt.chat.entity.MessageType;
import com.bezkoder.springjwt.chat.entity.Chat;
import com.bezkoder.springjwt.chat.entity.ChatType;
import com.bezkoder.springjwt.chat.repository.MessageRepository;

import org.springframework.stereotype.Service;

import com.bezkoder.springjwt.groups.Group;
import com.bezkoder.springjwt.groups.GroupRepository;
import com.bezkoder.springjwt.groups.GroupMember;
import com.bezkoder.springjwt.groups.GroupMemberRepository;
import com.bezkoder.springjwt.repository.UserRepository;
import com.bezkoder.springjwt.models.User;
import com.bezkoder.springjwt.chat.repository.ChatRepository;
import com.bezkoder.springjwt.chat.repository.ChatMemberRepository;
import com.bezkoder.springjwt.chat.entity.ChatMember;
import java.util.List;

@Service
public class GroupInviteService {

    private final GroupInviteRepository inviteRepository;
    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final ChatRepository chatRepository;
    private final ChatMemberRepository chatMemberRepository;
    private final MessageRepository messageRepository;

    public GroupInviteService(GroupInviteRepository inviteRepository,
                              GroupRepository groupRepository,
                              UserRepository userRepository,
                              GroupMemberRepository groupMemberRepository,
                              ChatRepository chatRepository,
                              ChatMemberRepository chatMemberRepository,
                              MessageRepository messageRepository) {
        this.inviteRepository = inviteRepository;
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.chatRepository = chatRepository;
        this.chatMemberRepository = chatMemberRepository;
        this.messageRepository = messageRepository;
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
        GroupInvite invite = null;
        List<GroupInvite> rejectedList = inviteRepository
                .findByGroupAndInvitedUserAndStatus(group, invitedUser, "REJECTED");
        if (!rejectedList.isEmpty()) {
            // Delete duplicates, keep first
            if (rejectedList.size() > 1) {
                inviteRepository.deleteAll(rejectedList.subList(1, rejectedList.size()));
            }
            invite = rejectedList.get(0);
            invite.setStatus("PENDING");
            invite.setCreatedAt(java.time.LocalDateTime.now());
            inviteRepository.save(invite);
        } else {
            // ❗ Check for existing PENDING invite (only after confirming no REJECTED one)
            List<GroupInvite> pendingList = inviteRepository
                    .findByGroupAndInvitedUserAndStatus(group, invitedUser, "PENDING");
            if (!pendingList.isEmpty()) {
                // Delete duplicates if any, keep first
                if (pendingList.size() > 1) {
                    inviteRepository.deleteAll(pendingList.subList(1, pendingList.size()));
                }
                // If we find a PENDING invite that's not the one we just reset, return it
                if (invite == null || !pendingList.get(0).getId().equals(invite.getId())) {
                    throw new RuntimeException("Invite already sent");
                }
            }

            if (invite == null) {
                invite = new GroupInvite();
                invite.setGroup(group);
                invite.setInvitedUser(invitedUser);
                invite.setInvitedBy(invitedBy);
                inviteRepository.save(invite);
            }
        }
        
        // Send invitation message to private chat between inviter and invited user
        Chat privateChat = chatRepository.findPrivateChat(invitedBy.getId(), invitedUser.getId())
                .orElseGet(() -> {
                    // Create private chat if it doesn't exist
                    Chat newChat = new Chat();
                    newChat.setType(ChatType.PRIVATE);
                    newChat.setCreatedAt(java.time.LocalDateTime.now());
                    newChat = chatRepository.save(newChat);
                    
                    // Add both users to chat
                    ChatMember inviterMember = new ChatMember();
                    inviterMember.setChat(newChat);
                    inviterMember.setUser(invitedBy);
                    chatMemberRepository.save(inviterMember);
                    
                    ChatMember invitedMember = new ChatMember();
                    invitedMember.setChat(newChat);
                    invitedMember.setUser(invitedUser);
                    chatMemberRepository.save(invitedMember);
                    
                    return newChat;
                });
        
        Message invitationMessage = new Message();
        invitationMessage.setChat(privateChat);
        invitationMessage.setType(MessageType.INVITATION);
        invitationMessage.setContent("You've been invited to join " + group.getName());
        invitationMessage.setTimestamp(java.time.LocalDateTime.now());
        invitationMessage.setSender(invitedBy);
        invitationMessage.setInviteId(invite.getId());
        invitationMessage.setInvitationStatus("PENDING");
        invitationMessage.setGroupId(groupId);
        messageRepository.save(invitationMessage);
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

        // --- Sync with Chat and add system message ---
        chatRepository.findByGroupId(invite.getGroup().getId()).ifPresent(groupChat -> {
            ChatMember cm = new ChatMember();
            cm.setChat(groupChat);
            cm.setUser(invite.getInvitedUser());
            chatMemberRepository.save(cm);
            
            // System message for member joining via invite
            Message systemMessage = new Message();
            systemMessage.setChat(groupChat);
            systemMessage.setType(MessageType.SYSTEM);
            systemMessage.setContent(invite.getInvitedUser().getName() + " joined the group");
            systemMessage.setTimestamp(java.time.LocalDateTime.now());
            systemMessage.setSender(invite.getInvitedUser());
            messageRepository.save(systemMessage);
        });
        
        // Update invitation message status to ACCEPTED in private chat
        chatRepository.findPrivateChat(invite.getInvitedBy().getId(), invite.getInvitedUser().getId())
                .ifPresent(privateChat -> {
                    messageRepository.findByChatIdAndInviteId(privateChat.getId(), inviteId).ifPresent(message -> {
                        message.setInvitationStatus("ACCEPTED");
                        messageRepository.save(message);
                    });
                });

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
        
        // Update invitation message status to REJECTED in private chat
        chatRepository.findPrivateChat(invite.getInvitedBy().getId(), invite.getInvitedUser().getId())
                .ifPresent(privateChat -> {
                    messageRepository.findByChatIdAndInviteId(privateChat.getId(), inviteId).ifPresent(message -> {
                        message.setInvitationStatus("REJECTED");
                        messageRepository.save(message);
                    });
                });
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

    // 🔹 Get Invite by ID
    public InviteResponse getInviteById(Long inviteId) {
        GroupInvite invite = inviteRepository.findById(inviteId)
                .orElseThrow(() -> new RuntimeException("Invite not found"));
        
        return new InviteResponse(
                invite.getId(),
                invite.getGroup().getId(),
                invite.getGroup().getName(),
                invite.getInvitedBy().getUsername(),
                invite.getStatus(),
                invite.getInvitedUser().getId(),
                invite.getInvitedUser().getUsername()
        );
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
