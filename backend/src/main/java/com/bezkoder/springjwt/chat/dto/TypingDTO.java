package com.bezkoder.springjwt.chat.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class TypingDTO {
    private UUID chatId;
}
