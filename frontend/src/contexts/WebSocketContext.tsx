import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Client } from '@stomp/stompjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/config';
import { getToken } from '../utils/storage';

interface WebSocketContextType {
  stompClient: Client | null;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
}

const WebSocketContext = createContext<WebSocketContextType>({
  stompClient: null,
  isConnected: false,
  connectionStatus: 'disconnected',
});

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const connectWebSocket = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const userJson = await AsyncStorage.getItem("user");
      if (userJson) {
        const user = JSON.parse(userJson);
        setCurrentUserId(user.id);

        const baseUrl = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
        const brokerURL = baseUrl.replace(/^http/, "ws") + "/ws";
        console.log("Connecting to WebSocket:", brokerURL);

        const client = new Client({
          brokerURL,
          connectHeaders: {
            Authorization: `Bearer ${token}`,
            userId: user.id.toString(), // Add userId header
          },
          reconnectDelay: 5000,
          debug: (msg) => console.log("STOMP:", msg),
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
        });

        client.onConnect = (frame) => {
          console.log("SUCCESS: Connected to WebSocket", frame);
          setConnectionStatus('connected');
          setStompClient(client);
          
          // Send presence event when connected
          if (user.id) {
            const presenceData = {
              userId: parseInt(user.id),
              status: "ONLINE"
            };
            
            console.log("Sending presence event on connect:", presenceData);
            
            client.publish({
              destination: "/app/chat.presence",
              body: JSON.stringify(presenceData)
            });
          }
        };

        client.onStompError = (frame) => {
          console.error("STOMP error", frame.headers['message']);
          console.error("STOMP error details", frame.body);
          console.error("Full error frame:", frame);
          setConnectionStatus('disconnected');
        };

        client.onDisconnect = () => {
            console.log("WebSocket disconnected");
            setConnectionStatus('disconnected');
            
            // Send offline presence event when disconnected
            if (user.id) {
              const presenceData = {
                userId: parseInt(user.id),
                status: "OFFLINE"
              };
              
              console.log("Sending offline presence event on disconnect:", presenceData);
              
              // Try to send offline status, but it might fail if already disconnected
              try {
                client.publish({
                  destination: "/app/chat.presence",
                  body: JSON.stringify(presenceData)
                });
              } catch (error) {
                console.log("Could not send offline presence (already disconnected):", error);
              }
            }
        };

        client.onWebSocketError = (error) => {
          console.error("WebSocket error:", error);
          setConnectionStatus('disconnected');
        };

        client.onWebSocketClose = (event) => {
          console.log("WebSocket closed:", event);
          setConnectionStatus('disconnected');
        };

        setConnectionStatus('connecting');
        client.activate();
      }
    } catch (error) {
      console.error("Error setting up WebSocket:", error);
      setConnectionStatus('disconnected');
    }
  };

  const disconnectWebSocket = () => {
    if (stompClient) {
      stompClient.deactivate();
      setStompClient(null);
      setConnectionStatus('disconnected');
    }
  };

  useEffect(() => {
    // Connect when component mounts
    connectWebSocket();

    // Cleanup on unmount
    return () => {
      disconnectWebSocket();
    };
  }, []);

  const value: WebSocketContextType = {
    stompClient,
    isConnected: connectionStatus === 'connected',
    connectionStatus,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
