package com.bezkoder.springjwt.chat.repository;

import com.bezkoder.springjwt.chat.entity.ChatMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

public interface ChatMemberRepository extends JpaRepository<ChatMember, Long> {
    List<ChatMember> findByUserId(Long userId);
    List<ChatMember> findByChatId(UUID chatId);

    boolean existsByChatIdAndUserId(UUID chatId, Long userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM ChatMember cm WHERE cm.chat.id = :chatId AND cm.user.id = :userId")
    void deleteByChatIdAndUserId(@Param("chatId") UUID chatId, @Param("userId") Long userId);
}
