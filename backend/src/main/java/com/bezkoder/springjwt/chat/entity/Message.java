package com.bezkoder.springjwt.chat.entity;

import com.bezkoder.springjwt.models.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.UUID;
import java.math.BigDecimal;

@Entity
@Getter
@Setter
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne
    private Chat chat;

    @ManyToOne
    private User sender;

    @Enumerated(EnumType.STRING)
    private MessageType type;

    private String content;

    private BigDecimal settlementAmount;

    @Enumerated(EnumType.STRING)
    private SettlementStatus settlementStatus;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean isRead = false;

    private LocalDateTime timestamp = LocalDateTime.now();
}
