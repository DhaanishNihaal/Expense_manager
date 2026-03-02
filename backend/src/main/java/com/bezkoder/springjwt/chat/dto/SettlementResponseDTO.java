package com.bezkoder.springjwt.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
public class SettlementResponseDTO {
    private UUID messageId;
    private String status;
    private BigDecimal amount;
}
