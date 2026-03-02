package com.bezkoder.springjwt.chat.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.bezkoder.springjwt.chat.entity.Message;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MessageRepository extends JpaRepository<Message, UUID> {
    Optional<Message> findTopByChatIdOrderByTimestampDesc(UUID chatId);
    List<Message> findAllByChatIdOrderByTimestampAsc(UUID chatId);

    @Modifying
    @Query("UPDATE Message m SET m.isRead = true WHERE m.chat.id = :chatId AND m.sender.id <> :userId AND m.isRead = false")
    void markMessagesAsRead(@Param("chatId") UUID chatId, @Param("userId") Long userId);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.chat.id = :chatId AND m.sender.id <> :userId AND m.isRead = false")
    Long countUnread(@Param("chatId") UUID chatId, @Param("userId") Long userId);
}
