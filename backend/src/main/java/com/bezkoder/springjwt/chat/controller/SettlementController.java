package com.bezkoder.springjwt.chat.controller;

import com.bezkoder.springjwt.chat.service.SettlementService;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/settlement")
public class SettlementController {

    private final SettlementService settlementService;


    @PostMapping("/accept/{messageId}")
    public void acceptSettlement(@PathVariable UUID messageId) {
        settlementService.acceptSettlement(messageId);
    }
    

    
}
