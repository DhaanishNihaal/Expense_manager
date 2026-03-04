package com.bezkoder.springjwt.chat.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.Message;
import java.util.Map;
import java.util.HashMap;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");
    }
    
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, org.springframework.messaging.MessageChannel channel) {
                StompHeaderAccessor accessor = 
                    StompHeaderAccessor.wrap(message);
                
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    // User connected - send online status
                    String userId = accessor.getFirstNativeHeader("userId");
                    if (userId != null) {
                        System.out.println("User connected: " + userId);
                        
                        // Broadcast online status
                        Map<String, Object> presenceData = new HashMap<>();
                        presenceData.put("userId", Long.parseLong(userId));
                        presenceData.put("status", "ONLINE");
                        
                        // This would need to be injected or handled differently
                        // For now, we'll handle presence in the controller
                    }
                } else if (StompCommand.DISCONNECT.equals(accessor.getCommand())) {
                    // User disconnected - send offline status
                    String userId = accessor.getFirstNativeHeader("userId");
                    if (userId != null) {
                        System.out.println("User disconnected: " + userId);
                        
                        // Broadcast offline status
                        Map<String, Object> presenceData = new HashMap<>();
                        presenceData.put("userId", Long.parseLong(userId));
                        presenceData.put("status", "OFFLINE");
                    }
                }
                
                return message;
            }
        });
    }
}