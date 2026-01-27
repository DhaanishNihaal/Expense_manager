package com.bezkoder.springjwt.groups;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {

    // Check if a user is already a member of a group
    boolean existsByGroupIdAndUserId(Long groupId, Long userId);

    // Get all members of a group
    List<GroupMember> findByGroupId(Long groupId);

    // Get a specific member (useful for role checks)
    Optional<GroupMember> findByGroupIdAndUserId(Long groupId, Long userId);
}
