package com.bezkoder.springjwt.groups.groupInvite;

import com.bezkoder.springjwt.models.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GroupInviteRepository extends JpaRepository<GroupInvite, Long> {

    List<GroupInvite> findByInvitedUserAndStatus(User user, String status);

    List<GroupInvite> findByGroupId(Long groupId);

    Optional<GroupInvite> findByGroupIdAndInvitedUserIdAndStatus(
            Long groupId, Long userId, String status
    );
}