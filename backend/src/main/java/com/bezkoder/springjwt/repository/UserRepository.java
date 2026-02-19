package com.bezkoder.springjwt.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.bezkoder.springjwt.models.User;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
  Optional<User> findByUsername(String username);

  Boolean existsByUsername(String username);

  Boolean existsByEmail(String email);

  @Query("""
    SELECT u FROM User u 
    WHERE (LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%'))
       OR LOWER(u.name) LIKE LOWER(CONCAT('%', :keyword, '%')))
       AND u.id NOT IN (SELECT gm.user.id FROM GroupMember gm WHERE gm.group.id = :groupId)
""")
  List<User> searchUsersNotInGroup(@Param("keyword") String keyword, @Param("groupId") Long groupId);
}
