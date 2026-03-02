package com.bezkoder.springjwt.chat.config;

import com.bezkoder.springjwt.chat.dto.PresenceDTO;
import com.bezkoder.springjwt.chat.service.PresenceService;
import com.bezkoder.springjwt.security.services.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;

@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final PresenceService presenceService;
    private final SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void handleConnect(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = headerAccessor.getUser();
        if (principal instanceof UsernamePasswordAuthenticationToken) {
            Object userDetails = ((UsernamePasswordAuthenticationToken) principal).getPrincipal();
            if (userDetails instanceof UserDetailsImpl) {
                Long userId = ((UserDetailsImpl) userDetails).getId();
                presenceService.userOnline(userId);
                messagingTemplate.convertAndSend("/topic/presence", new PresenceDTO(userId, "ONLINE"));
                System.out.println("Presence: User " + userId + " is online");
            }
        }
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = headerAccessor.getUser();
        if (principal instanceof UsernamePasswordAuthenticationToken) {
            Object userDetails = ((UsernamePasswordAuthenticationToken) principal).getPrincipal();
            if (userDetails instanceof UserDetailsImpl) {
                Long userId = ((UserDetailsImpl) userDetails).getId();
                presenceService.userOffline(userId);
                messagingTemplate.convertAndSend("/topic/presence", new PresenceDTO(userId, "OFFLINE"));
                System.out.println("Presence: User " + userId + " is offline");
            }
        }
    }
}
