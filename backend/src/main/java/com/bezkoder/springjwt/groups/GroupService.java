package com.bezkoder.springjwt.groups;

import com.bezkoder.springjwt.groups.dto.CreateGroupRequest;
import com.bezkoder.springjwt.models.User;
import com.bezkoder.springjwt.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GroupService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;

    public GroupService(GroupRepository groupRepository,
                        GroupMemberRepository groupMemberRepository,
                        UserRepository userRepository) {
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Group createGroup(CreateGroupRequest request, String username) {

        User creator = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Group group = new Group();
        group.setName(request.getName());
        group.setDescription(request.getDescription());
        group.setCreatedBy(creator);

        Group savedGroup = groupRepository.save(group);

        GroupMember member = new GroupMember();
        member.setGroup(savedGroup);
        member.setUser(creator);
        member.setRole("ADMIN");

        groupMemberRepository.save(member);

        return savedGroup;
    }
    @Transactional
    public void addMember(Long groupId, String adminUsername, String newUsername) {

        User admin = userRepository.findByUsername(adminUsername)
                .orElseThrow(() -> new RuntimeException("Admin user not found"));

        GroupMember adminMember = groupMemberRepository
            .findByGroupIdAndUserId(groupId, admin.getId())
            .orElseThrow(() -> new RuntimeException("Not a group member"));

        if (!"ADMIN".equals(adminMember.getRole())) {
            throw new RuntimeException("Only ADMIN can add members");
        }

        User newUser = userRepository.findByUsername(newUsername)
            .orElseThrow(() -> new RuntimeException("User not found"));

        if (groupMemberRepository.existsByGroupIdAndUserId(groupId, newUser.getId())) {
            throw new RuntimeException("User already in group");
        }

        Group group = groupRepository.findById(groupId)
            .orElseThrow(() -> new RuntimeException("Group not found"));

        GroupMember member = new GroupMember();
        member.setGroup(group);
        member.setUser(newUser);
        member.setRole("MEMBER");

        groupMemberRepository.save(member);
    }

    
}
