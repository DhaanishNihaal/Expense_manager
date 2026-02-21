package com.bezkoder.springjwt.groups.groupInvite;

import com.bezkoder.springjwt.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import com.bezkoder.springjwt.groups.Group;

import java.util.List;
import java.util.Optional;

public interface GroupInviteRepository extends JpaRepository<GroupInvite, Long> {

    List<GroupInvite> findByInvitedUserAndStatus(User user, String status);
    List<GroupInvite> findByInvitedByAndStatusIn(User user, List<String> statuses);

    List<GroupInvite> findByGroupId(Long groupId);

    List<GroupInvite> findByGroupAndInvitedUserAndStatus(
            Group group, User user, String status
    );

    List<GroupInvite> findByGroupAndInvitedUser(Group group, User user);
}