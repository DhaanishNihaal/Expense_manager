package com.bezkoder.springjwt.chat.service;

import com.bezkoder.springjwt.chat.entity.Message;
import com.bezkoder.springjwt.chat.entity.SettlementStatus;
import com.bezkoder.springjwt.chat.repository.MessageRepository;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import java.util.UUID;
import com.bezkoder.springjwt.chat.dto.PaySettlementRequest;
import com.bezkoder.springjwt.groups.expenses.ExpenseTransaction;
import com.bezkoder.springjwt.groups.expenses.ExpenseTransactionRepository;
import com.bezkoder.springjwt.models.User;
import com.bezkoder.springjwt.repository.UserRepository;
import com.bezkoder.springjwt.groups.Group;
import com.bezkoder.springjwt.groups.GroupRepository;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SettlementService {

    private final MessageRepository messageRepository;
    private final ExpenseTransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;

    public void acceptSettlement(UUID messageId) {
        Message message = messageRepository.findById(messageId).orElseThrow();
        message.setSettlementStatus(SettlementStatus.ACCEPTED);
        messageRepository.save(message);
    }

    public void pay(Long payerId, PaySettlementRequest request) {
        User payer = userRepository.findById(payerId)
            .orElseThrow(() -> new RuntimeException("Payer not found"));
        User receiver = userRepository.findById(request.getReceiverId())
            .orElseThrow(() -> new RuntimeException("Receiver not found"));
            
        Group group = null;
        if (request.getGroupId() != null) {
            group = groupRepository.findById(request.getGroupId())
                .orElseThrow(() -> new RuntimeException("Group not found"));
        }

        ExpenseTransaction tx = new ExpenseTransaction();
        tx.setPayer(payer);
        tx.setReceiver(receiver);
        tx.setAmount(request.getAmount());
        tx.setGroup(group);
        tx.setSettlement(true);
        // paymentGroupId is nullable now
        
        transactionRepository.save(tx);
    }
}
