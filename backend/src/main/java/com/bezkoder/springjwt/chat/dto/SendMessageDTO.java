package com.bezkoder.springjwt.chat.dto;

import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
public class SendMessageDTO {
    private UUID chatId;
    private Long senderId;
    private String content;
    private String type; // TEXT, SETTLEMENT_REQUEST
    private BigDecimal settlementAmount; //if settlement request
}
