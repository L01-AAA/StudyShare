import api from "./api";
import * as SecureStore from "expo-secure-store";
import {
  messageWsService,
  WsChatMessage,
  WsTypingIndicator,
  MessageHandler,
  TypingHandler,
  ErrorHandler,
  ConnectionHandler,
  NotificationHandler,
} from "./messageWsApi";

export interface Message {
  id: number;
  senderId: number;
  senderName?: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  isRead?: boolean;
}

export interface Conversation {
  id: number;
  participantId: number;
  participantName: string;
  participantAvatar?: string;
  lastMessage?: string;
  lastMessageSenderId?: number | null;
  lastMessageTime: string;
  unreadCount: number;
  createdAt?: string;
}

// Backend API Response Types
interface BackendMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface BackendConversation {
  id: number;
  user1_id: number;
  user2_id: number;
  other_user_id: number;
  other_user_name: string;
  other_user_avatar: string | null;
  last_message_content: string | null;
  last_message_sender_id: number | null;
  last_message_at: string | null;
  unread_count: number;
  created_at: string;
}

interface PaginatedMessagesResponse {
  items: BackendMessage[];
  total: number;
}

// Cache current user ID to avoid repeated JWT decoding
let cachedUserId: number | null = null;
let cachedUserIdTimestamp: number = 0;
const USER_ID_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Lấy danh sách các cuộc hội thoại
export const getConversations = async (): Promise<Conversation[]> => {
  try {
    const response = await api.get<BackendConversation[]>(
      "/chat/conversations"
    );

    if (!Array.isArray(response.data)) {
      console.error("Invalid conversations response format:", response.data);
      return [];
    }

    // Transform backend response to frontend format
    return response.data.map((conv) => ({
      id: conv.id,
      participantId: conv.other_user_id,
      participantName: conv.other_user_name,
      participantAvatar: conv.other_user_avatar || undefined,
      lastMessage: conv.last_message_content || "",
      lastMessageSenderId: conv.last_message_sender_id,
      lastMessageTime: conv.last_message_at || new Date().toISOString(),
      unreadCount: conv.unread_count,
      createdAt: conv.created_at,
    }));
  } catch (error: any) {
    console.error("Error fetching conversations:", error.message);
    if (error.response?.status === 401) {
      // Clear tokens on unauthorized
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
    }
    throw error;
  }
};

// Lấy các tin nhắn của một cuộc hội thoại với pagination
export const getMessages = async (
  conversationId: number | string,
  limit: number = 50,
  skip: number = 0,
  participantName?: string,
  participantAvatar?: string
): Promise<Message[]> => {
  try {
    const response = await api.get<BackendMessage[]>(
      `/chat/conversations/${conversationId}/messages?limit=${limit}&skip=${skip}`
    );

    if (!Array.isArray(response.data)) {
      console.error("Invalid messages response format:", response.data);
      return [];
    }

    // Get current user ID to determine isOwn
    const currentUserId = await getCurrentUserId();

    return response.data.map((msg) => ({
      id: msg.id,
      senderId: msg.sender_id,
      senderName:
        msg.sender_id === currentUserId ? "Bạn" : participantName || "Unknown",
      senderAvatar:
        msg.sender_id === currentUserId
          ? undefined
          : participantAvatar || undefined,
      content: msg.content,
      timestamp: msg.created_at,
      isOwn: msg.sender_id === currentUserId,
      isRead: msg.is_read,
    }));
  } catch (error: any) {
    console.error("Error fetching messages:", error.message);
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
    }
    throw error;
  }
};

// Gửi tin nhắn
export const sendMessage = async (
  conversationId: number | string,
  content: string
): Promise<Message> => {
  if (!content || !content.trim()) {
    throw new Error("Message content cannot be empty");
  }

  try {
    const response = await api.post<BackendMessage>(
      `/chat/conversations/${conversationId}/messages`,
      { content: content.trim() }
    );

    const currentUserId = await getCurrentUserId();

    return {
      id: response.data.id,
      senderId: response.data.sender_id,
      content: response.data.content,
      timestamp: response.data.created_at,
      isOwn: response.data.sender_id === currentUserId,
      isRead: response.data.is_read,
    };
  } catch (error: any) {
    console.error("Error sending message:", error.message);
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
      throw new Error("Session expired. Please login again.");
    }
    if (error.response?.status === 403) {
      throw new Error(
        "You don't have permission to send messages in this conversation."
      );
    }
    if (error.response?.status === 404) {
      throw new Error("Conversation not found.");
    }
    throw error;
  }
};

// Tạo cuộc hội thoại mới
export const createConversation = async (
  participantId: number | string
): Promise<Conversation> => {
  try {
    const response = await api.post<BackendConversation>(
      "/chat/conversations",
      {
        other_user_id: participantId,
      }
    );

    return {
      id: response.data.id,
      participantId: response.data.other_user_id,
      participantName: response.data.other_user_name,
      participantAvatar: response.data.other_user_avatar || undefined,
      lastMessage: response.data.last_message_content || "",
      lastMessageTime:
        response.data.last_message_at || new Date().toISOString(),
      unreadCount: response.data.unread_count,
      createdAt: response.data.created_at,
    };
  } catch (error: any) {
    console.error("Error creating conversation:", error.message);
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
      throw new Error("Session expired. Please login again.");
    }
    if (error.response?.status === 404) {
      throw new Error("User not found.");
    }
    if (error.response?.status === 400) {
      throw new Error("Cannot create conversation with yourself.");
    }
    throw error;
  }
};

// Đánh dấu cuộc hội thoại là đã đọc
export const markAsRead = async (
  conversationId: number | string
): Promise<void> => {
  try {
    // Get the first unread message to trigger marking as read
    // The backend automatically marks messages as read when fetched by the recipient
    await api.get(
      `/chat/conversations/${conversationId}/messages?limit=1&skip=0`
    );
  } catch (error: any) {
    console.error("Error marking as read:", error.message);
    // Don't throw error - this is a non-critical operation
  }
};

// Đánh dấu một tin nhắn cụ thể là đã đọc
export const markMessageAsRead = async (
  conversationId: number | string,
  messageId: number
): Promise<void> => {
  try {
    // If backend has a specific endpoint for marking single message as read
    // Uncomment and use below:
    // await api.put(`/chat/messages/${messageId}/read`);

    // Otherwise, messages are auto-marked as read on fetch
    console.log(
      `Message ${messageId} in conversation ${conversationId} marked as read`
    );
  } catch (error: any) {
    console.error("Error marking message as read:", error.message);
    // Don't throw error - non-critical operation
  }
};

// Helper function để lấy current user ID (với caching)
async function getCurrentUserId(): Promise<number> {
  try {
    // Check cache
    if (
      cachedUserId &&
      Date.now() - cachedUserIdTimestamp < USER_ID_CACHE_DURATION
    ) {
      return cachedUserId;
    }

    const token = await SecureStore.getItemAsync("accessToken");
    if (!token) {
      console.warn("No access token found");
      return 0;
    }

    try {
      // Decode JWT to get user ID
      const payload = JSON.parse(atob(token.split(".")[1]));
      const userId = payload.sub || payload.user_id || 0;

      // Cache the user ID
      cachedUserId = userId;
      cachedUserIdTimestamp = Date.now();

      return userId;
    } catch (decodeError) {
      console.error("Failed to decode JWT:", decodeError);
      return 0;
    }
  } catch (error: any) {
    console.error("Error getting current user ID:", error.message);
    return 0;
  }
}

// Clear user ID cache (call on logout)
export const clearUserIdCache = (): void => {
  cachedUserId = null;
  cachedUserIdTimestamp = 0;
};

// ===================== WebSocket Helpers =====================

/**
 * Connect to WebSocket for real-time messaging
 */
export const connectWebSocket = async (
  conversationId: string | number
): Promise<void> => {
  try {
    // Chỉ connect với conversationId
    await messageWsService.connect(conversationId);
  } catch (error: any) {
    console.error("Error connecting to WebSocket:", error.message);
    throw error;
  }
};

/**
 * Disconnect from WebSocket
 */
export const disconnectWebSocket = (): void => {
  messageWsService.disconnect();
};

/**
 * Check if WebSocket is connected
 */
export const isWebSocketConnected = (): boolean => {
  return messageWsService.isConnected();
};

/**
 * Get WebSocket connection state
 */
export const getWebSocketState = ():
  | "connected"
  | "connecting"
  | "disconnected" => {
  return messageWsService.getState();
};

/**
 * Send message via WebSocket
 */
export const sendMessageViaWs = (content: string): void => {
  messageWsService.sendMessage(content);
};

/**
 * Send typing indicator via WebSocket
 */
export const sendTypingIndicator = (isTyping: boolean): void => {
  messageWsService.sendTyping(isTyping);
};

/**
 * Add WebSocket listeners
 */
export const addWsMessageListener = (handler: MessageHandler): void => {
  messageWsService.onMessage(handler);
};

export const addWsTypingListener = (handler: TypingHandler): void => {
  messageWsService.onTyping(handler);
};

export const addWsErrorListener = (handler: ErrorHandler): void => {
  messageWsService.onError(handler);
};

export const addWsConnectListener = (handler: ConnectionHandler): void => {
  messageWsService.onConnect(handler);
};

export const addWsDisconnectListener = (handler: ConnectionHandler): void => {
  messageWsService.onDisconnect(handler);
};

/**
 * Remove WebSocket listeners
 */
export const removeWsMessageListener = (handler: MessageHandler): void => {
  messageWsService.removeMessageListener(handler);
};

export const removeWsTypingListener = (handler: TypingHandler): void => {
  messageWsService.removeTypingListener(handler);
};

export const removeWsErrorListener = (handler: ErrorHandler): void => {
  messageWsService.removeErrorListener(handler);
};

export const removeWsConnectListener = (handler: ConnectionHandler): void => {
  messageWsService.removeConnectListener(handler);
};

export const removeWsDisconnectListener = (
  handler: ConnectionHandler
): void => {
  messageWsService.removeDisconnectListener(handler);
};

export const addWsNotificationListener = (
  handler: NotificationHandler
): void => {
  messageWsService.onNotification(handler);
};

export const removeWsNotificationListener = (
  handler: NotificationHandler
): void => {
  messageWsService.removeNotificationListener(handler);
};
