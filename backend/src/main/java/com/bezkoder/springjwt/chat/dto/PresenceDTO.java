package com.bezkoder.springjwt.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PresenceDTO {
    private Long userId;
    private String status; // "ONLINE" or "OFFLINE"
}
