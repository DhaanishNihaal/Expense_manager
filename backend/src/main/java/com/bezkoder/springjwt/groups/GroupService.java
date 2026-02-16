package com.bezkoder.springjwt.groups;

import com.bezkoder.springjwt.groups.dto.CreateGroupRequest;
import com.bezkoder.springjwt.groups.dto.GroupResponse;
import com.bezkoder.springjwt.models.User;
import com.bezkoder.springjwt.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

import com.bezkoder.springjwt.groups.dto.GroupDetailResponse;
import com.bezkoder.springjwt.groups.dto.MemberResponse;


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
    @Transactional(readOnly = true)
    public List<Group> getUserGroups(String username) {

    User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
    return groupRepository.findGroupsByUserId(user.getId());
    }

    @Transactional(readOnly = true)
    public List<GroupResponse> getUserGroupsWithMemberCount(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<Group> groups = groupRepository.findGroupsByUserId(user.getId());
        
        return groups.stream()
                .map(group -> {
                    int memberCount = groupMemberRepository.findByGroupId(group.getId()).size();
                    return new GroupResponse(
                        group.getId(),
                        group.getName(),
                        group.getDescription(),
                        group.getCreatedAt(),
                        memberCount
                    );
                })
                .toList();
    }
    public GroupDetailResponse getGroupDetails(Long groupId, String username) {

        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // ensure user belongs to group
        groupMemberRepository.findByGroupIdAndUserId(groupId, user.getId())
            .orElseThrow(() -> new RuntimeException("Access denied"));

        Group group = groupRepository.findById(groupId)
            .orElseThrow(() -> new RuntimeException("Group not found"));

        List<MemberResponse> members =
            groupMemberRepository.findByGroupId(groupId)
                .stream()
                .map(m -> new MemberResponse(
                    m.getUser().getId(),
                    m.getUser().getName(),
                    m.getRole()
                ))
                .toList();

        return new GroupDetailResponse(
            group.getId(),
            group.getName(),
            group.getDescription(),
            members
        );
    }

    
}
