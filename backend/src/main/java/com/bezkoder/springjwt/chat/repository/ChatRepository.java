package com.bezkoder.springjwt.chat.repository;

import com.bezkoder.springjwt.chat.entity.Chat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ChatRepository extends JpaRepository<Chat, UUID> {
    @Query("""
        SELECT c FROM Chat c
        JOIN ChatMember cm1 ON cm1.chat = c
        JOIN ChatMember cm2 ON cm2.chat = c
        WHERE c.type = 'PRIVATE'
        AND cm1.user.id = :user1
        AND cm2.user.id = :user2
    """)
    Optional<Chat> findPrivateChat(
            @Param("user1") Long user1,
            @Param("user2") Long user2
    );

    Optional<Chat> findByGroupId(Long groupId);
}
