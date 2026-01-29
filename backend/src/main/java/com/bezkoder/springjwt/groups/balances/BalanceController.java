package com.bezkoder.springjwt.groups.balance;

import com.bezkoder.springjwt.groups.balance.dto.BalanceResponse;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups/{groupId}/balances")
public class BalanceController {

    private final BalanceService balanceService;

    public BalanceController(BalanceService balanceService) {
        this.balanceService = balanceService;
    }

    @GetMapping
    public List<BalanceResponse> getBalances(@PathVariable Long groupId,
                                             Authentication authentication) {

        // Authentication is already enforced by Spring Security
        return balanceService.calculateBalances(groupId);
    }
}
