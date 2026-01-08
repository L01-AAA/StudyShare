import * as SecureStore from "expo-secure-store";

// WebSocket Message Types
export interface WsMessage {
  type:
    | "message"
    | "typing"
    | "seen"
    | "user_joined"
    | "user_left"
    | "error"
    | "notification";
  data: any;
  timestamp?: string;
  sender_id?: number;
  conversation_id?: number;
}

export interface WsChatMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface WsTypingIndicator {
  user_id: number;
  user_name: string;
  is_typing: boolean;
}

export interface WsSeenMessage {
  message_id: number;
  user_id: number;
  seen_at: string;
}

export interface WsNotification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  reference_id?: number;
  is_read: boolean;
  created_at: string;
}

export type NotificationHandler = (notification: WsNotification) => void;

// Event callback types
export type MessageHandler = (message: WsChatMessage) => void;
export type TypingHandler = (indicator: WsTypingIndicator) => void;
export type ErrorHandler = (error: string) => void;
export type ConnectionHandler = () => void;

// Helper function to validate WsChatMessage structure - LESS STRICT
function isValidChatMessage(data: any): boolean {
  // Chỉ check những field critical - không check type vì có thể null
  if (!data || typeof data !== "object") return false;
  if (typeof data.id !== "number") return false;
  if (typeof data.sender_id !== "number") return false;
  if (typeof data.content !== "string") return false;
  if (typeof data.created_at !== "string") return false;

  // conversation_id, type, is_read có thể optional hoặc có giá trị mặc định
  return true;
}

class MessageWebSocketService {
  private ws: WebSocket | null = null;
  private url: string = "";
  private conversationId: string | number | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 3000; // 3 seconds
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private messageQueue: WsMessage[] = [];
  private isConnecting: boolean = false;
  private baseUrl: string =
    "wss://studyshare-backend-production.up.railway.app";
  private connectionPromise: Promise<void> | null = null;
  private connectionResolve: (() => void) | null = null;
  private connectionReject: ((error: Error) => void) | null = null;

  // Listeners
  private onMessageListeners: MessageHandler[] = [];
  private onTypingListeners: TypingHandler[] = [];
  private onErrorListeners: ErrorHandler[] = [];
  private onConnectListeners: ConnectionHandler[] = [];
  private onDisconnectListeners: ConnectionHandler[] = [];
  private onNotificationListeners: NotificationHandler[] = [];
  /**
   * Connect to WebSocket server for a conversation
   */
  async connect(
    conversationId: string | number,
    onMessage?: MessageHandler,
    onTyping?: TypingHandler,
    onError?: ErrorHandler,
    onConnect?: ConnectionHandler,
    onDisconnect?: ConnectionHandler
  ): Promise<void> {
    try {
      // Cleanup previous connection if exists
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.disconnect();
      }

      this.conversationId = conversationId;

      // Register listeners if provided
      if (onMessage) this.onMessage(onMessage);
      if (onTyping) this.onTyping(onTyping);
      if (onError) this.onError(onError);
      if (onConnect) this.onConnect(onConnect);
      if (onDisconnect) this.onDisconnect(onDisconnect);

      // Get access token
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) {
        const error = "No access token available";
        console.error("[WS Error]", error);
        this._notifyError(error);
        throw new Error(error);
      }

      // Build WebSocket URL
      this.url = `${this.baseUrl}/api/v1/chat/ws/${conversationId}?token=${token}`;

      this.isConnecting = true;

      // Create a new connection promise
      this.connectionPromise = new Promise((resolve, reject) => {
        this.connectionResolve = resolve;
        this.connectionReject = reject;
        this._connect();
      });

      // Wait for the connection to establish with 10s timeout
      await Promise.race([
        this.connectionPromise,
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("WebSocket connection timeout")),
            10000
          )
        ),
      ]);
    } catch (error: any) {
      console.error("[WS Connect Error]", error.message);
      this._notifyError(error.message || "Failed to connect");
      this.connectionResolve = null;
      this.connectionReject = null;
      throw error;
    }
  }

  /**
   * Internal connection handler
   */
  private _connect(): void {
    if (!this.url) return;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      console.log("[WS] Connecting to", this.url.split("?")[0]);
      this.ws = new WebSocket(this.url);
      this.isConnecting = true;

      this.ws.onopen = () => {
        console.log("[WS] Connected successfully");
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this._flushMessageQueue();
        this._notifyConnect();

        this.connectionResolve?.();
        this.connectionResolve = null;
        this.connectionReject = null;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("[WS Raw Message Received]", JSON.stringify(data));
          this._handleMessage(data);
        } catch (error) {
          console.error("[WS] JSON parse error:", error);
        }
      };

      this.ws.onerror = (error: any) => {
        console.error("[WS] WebSocket error:", error);
        this.connectionReject?.(new Error("WebSocket error"));
        this.connectionResolve = null;
        this.connectionReject = null;
      };

      this.ws.onclose = () => {
        console.log("[WS] WebSocket closed");
        this.isConnecting = false;
        this.ws = null;
        this._notifyDisconnect();
        this._attemptReconnect();
      };
    } catch (err) {
      console.error("[WS] Connection setup error:", err);
      this.isConnecting = false;
      this._attemptReconnect();
    }
  }

  /**
   * Handle incoming WebSocket messages with validation
   */
  private _handleMessage(wsMessage: WsMessage): void {
    console.log("[WS] Raw message type:", wsMessage.type);
    console.log(
      "[WS] Raw message content:",
      JSON.stringify(wsMessage, null, 2)
    );

    switch (wsMessage.type) {
      case "message":
        try {
          const data = wsMessage.data;
          console.log("[WS] Processing message type, data structure:", {
            keys: Object.keys(data || {}),
            data: data,
          });

          // Log từng field
          console.log("[WS Message Fields]", {
            id: data?.id,
            sender_id: data?.sender_id,
            content: data?.content?.substring(0, 20),
            conversation_id: data?.conversation_id,
            type: data?.type,
            is_read: data?.is_read,
            created_at: data?.created_at?.substring(0, 19),
          });

          if (!isValidChatMessage(data)) {
            console.warn(
              "[WS] Validation failed but attempting to process anyway:",
              data
            );
            // Vẫn cố gắng gửi nếu có data
            if (data && typeof data === "object") {
              const reconstructed: WsChatMessage = {
                id: data.id || -1,
                sender_id: data.sender_id || 0,
                content: data.content || "",
                conversation_id: data.conversation_id || 0,
                type: data.type || "text",
                is_read: data.is_read === true,
                created_at: data.created_at || new Date().toISOString(),
              };
              console.log("[WS] Using reconstructed message:", reconstructed);
              this._notifyMessageHandlers(reconstructed);
              break;
            }
          }

          const chatMessage = data as WsChatMessage;
          console.log("[WS] Valid message received:", chatMessage);
          this._notifyMessageHandlers(chatMessage);
        } catch (error) {
          console.error("[WS] Error processing chat message:", error);
        }
        break;

      case "typing":
        try {
          const typing = wsMessage.data as WsTypingIndicator;
          console.log("[WS] Typing indicator:", typing);
          this._notifyTypingHandlers(typing);
        } catch (error) {
          console.error("[WS] Error processing typing indicator:", error);
        }
        break;

      case "seen":
        try {
          const seen = wsMessage.data as WsSeenMessage;
          console.log("[WS] Message seen:", seen);
        } catch (error) {
          console.error("[WS] Error processing seen message:", error);
        }
        break;

      case "error":
        try {
          const errorMsg = wsMessage.data?.message || "Unknown error";
          console.error("[WS] Error from server:", errorMsg);
          this._notifyError(errorMsg);
        } catch (error) {
          console.error("[WS] Error processing error message:", error);
        }
        break;
      case "notification":
        try {
          const notif = wsMessage.data as WsNotification;
          console.log("[WS] Notification received:", notif);
          this._notifyNotificationHandlers(notif);
        } catch (error) {
          console.error("[WS] Error processing notification:", error);
        }
        break;

      default:
        console.warn("[WS] Unknown message type:", wsMessage.type);
        // Log all raw data khi receive type không được expect
        console.log(
          "[WS] Full raw message:",
          JSON.stringify(wsMessage, null, 2)
        );
    }
  }

  /**
   * Send a chat message
   */
  private sendRaw(payload: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn(
        "[WS] Not connected (state: " +
          this.ws?.readyState +
          "), queueing message"
      );
      this.messageQueue.push(payload);
      return;
    }

    try {
      const jsonPayload = JSON.stringify(payload);
      console.log("[WS] Sending raw payload:", jsonPayload);
      this.ws.send(jsonPayload);
      console.log("[WS] Raw message sent successfully");
    } catch (error) {
      console.error("[WS] Error sending raw message:", error);
      this.messageQueue.push(payload);
    }
  }
  sendMessage(content: string): void {
    if (!content || !content.trim()) {
      console.warn("[WS] Cannot send empty message");
      return;
    }

    const message = {
      type: "message",
      content: content.trim(),
    };

    console.log("[WS] Preparing to send message:", JSON.stringify(message));
    this.sendRaw(message);
  }

  /**
   * Send typing indicator
   */
  sendTyping(isTyping: boolean): void {
    const message: WsMessage = {
      type: "typing",
      data: {
        is_typing: isTyping,
      },
    };

    console.log("[WS] Sending typing indicator:", isTyping);
    this.send(message);
  }

  /**
   * Send a generic WebSocket message
   */
  send(message: WsMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn(
        "[WS] WebSocket not connected (state: " +
          this.ws?.readyState +
          "), queueing message:",
        message.type
      );
      this.messageQueue.push(message);
      return;
    }

    try {
      const payload = JSON.stringify(message);
      console.log("[WS] Sending message:", payload);
      this.ws.send(payload);
      console.log("[WS] Message sent successfully:", message.type);
    } catch (error) {
      console.error("[WS] Send error:", error);
      this.messageQueue.push(message);
    }
  }

  /**
   * Flush queued messages
   */
  private _flushMessageQueue(): void {
    console.log(
      "[WS] Flushing message queue, pending messages:",
      this.messageQueue.length
    );
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        console.log("[WS] Flushing queued message:", message.type);
        this.send(message);
      }
    }
  }

  /**
   * Attempt to reconnect
   */
  private _attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[WS] Max reconnect attempts reached");
      const error = "Failed to reconnect after multiple attempts";
      this._notifyError(error);
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    console.log(
      `[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
        this.isConnecting = false;
        this._connect();
      }
    }, delay);
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    console.log("[WS] Disconnecting");

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      try {
        this.ws.close();
        console.log("[WS] WebSocket closed successfully");
      } catch (error) {
        console.error("[WS] Error closing connection:", error);
      }
      this.ws = null;
    }

    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.messageQueue = [];
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection state
   */
  getState(): "connected" | "connecting" | "disconnected" {
    if (!this.ws) return "disconnected";

    if (this.ws.readyState === WebSocket.CONNECTING) return "connecting";
    if (this.ws.readyState === WebSocket.OPEN) return "connected";

    return "disconnected";
  }

  // Event listeners
  onMessage(handler: MessageHandler): void {
    this.onMessageListeners.push(handler);
    console.log(
      "[WS] Message listener registered, total:",
      this.onMessageListeners.length
    );
  }

  onTyping(handler: TypingHandler): void {
    this.onTypingListeners.push(handler);
    console.log(
      "[WS] Typing listener registered, total:",
      this.onTypingListeners.length
    );
  }

  onError(handler: ErrorHandler): void {
    this.onErrorListeners.push(handler);
    console.log(
      "[WS] Error listener registered, total:",
      this.onErrorListeners.length
    );
  }

  onConnect(handler: ConnectionHandler): void {
    this.onConnectListeners.push(handler);
    console.log(
      "[WS] Connect listener registered, total:",
      this.onConnectListeners.length
    );
  }

  onDisconnect(handler: ConnectionHandler): void {
    this.onDisconnectListeners.push(handler);
    console.log(
      "[WS] Disconnect listener registered, total:",
      this.onDisconnectListeners.length
    );
  }

  // Remove listeners
  removeMessageListener(handler: MessageHandler): void {
    this.onMessageListeners = this.onMessageListeners.filter(
      (h) => h !== handler
    );
    console.log(
      "[WS] Message listener removed, remaining:",
      this.onMessageListeners.length
    );
  }

  removeTypingListener(handler: TypingHandler): void {
    this.onTypingListeners = this.onTypingListeners.filter(
      (h) => h !== handler
    );
    console.log(
      "[WS] Typing listener removed, remaining:",
      this.onTypingListeners.length
    );
  }

  removeErrorListener(handler: ErrorHandler): void {
    this.onErrorListeners = this.onErrorListeners.filter((h) => h !== handler);
    console.log(
      "[WS] Error listener removed, remaining:",
      this.onErrorListeners.length
    );
  }

  removeConnectListener(handler: ConnectionHandler): void {
    this.onConnectListeners = this.onConnectListeners.filter(
      (h) => h !== handler
    );
    console.log(
      "[WS] Connect listener removed, remaining:",
      this.onConnectListeners.length
    );
  }

  removeDisconnectListener(handler: ConnectionHandler): void {
    this.onDisconnectListeners = this.onDisconnectListeners.filter(
      (h) => h !== handler
    );
    console.log(
      "[WS] Disconnect listener removed, remaining:",
      this.onDisconnectListeners.length
    );
  }

  // Notify handlers
  private _notifyMessageHandlers(message: WsChatMessage): void {
    console.log(
      "[WS] Notifying " + this.onMessageListeners.length + " message handler(s)"
    );
    this.onMessageListeners.forEach((handler, index) => {
      try {
        console.log("[WS] Calling message handler", index + 1);
        handler(message);
        console.log(
          "[WS] Message handler",
          index + 1,
          "completed successfully"
        );
      } catch (error) {
        console.error("[WS] Message handler error:", error);
      }
    });
  }

  private _notifyTypingHandlers(typing: WsTypingIndicator): void {
    console.log(
      "[WS] Notifying " + this.onTypingListeners.length + " typing handler(s)"
    );
    this.onTypingListeners.forEach((handler, index) => {
      try {
        handler(typing);
      } catch (error) {
        console.error("[WS] Typing handler error:", error);
      }
    });
  }

  private _notifyError(error: string): void {
    console.log(
      "[WS] Notifying " + this.onErrorListeners.length + " error handler(s)"
    );
    this.onErrorListeners.forEach((handler, index) => {
      try {
        console.log(
          "[WS] Calling error handler",
          index + 1,
          "with error:",
          error
        );
        handler(error);
      } catch (err) {
        console.error("[WS] Error handler error:", err);
      }
    });
  }

  private _notifyConnect(): void {
    console.log(
      "[WS] Notifying " + this.onConnectListeners.length + " connect handler(s)"
    );
    this.onConnectListeners.forEach((handler, index) => {
      try {
        console.log("[WS] Calling connect handler", index + 1);
        handler();
      } catch (error) {
        console.error("[WS] Connect handler error:", error);
      }
    });
  }

  private _notifyDisconnect(): void {
    console.log(
      "[WS] Notifying " +
        this.onDisconnectListeners.length +
        " disconnect handler(s)"
    );
    this.onDisconnectListeners.forEach((handler, index) => {
      try {
        handler();
      } catch (error) {
        console.error("[WS] Disconnect handler error:", error);
      }
    });
  }

  onNotification(handler: NotificationHandler): void {
    this.onNotificationListeners.push(handler);
  }

  removeNotificationListener(handler: NotificationHandler): void {
    this.onNotificationListeners = this.onNotificationListeners.filter(
      (h) => h !== handler
    );
  }

  private _notifyNotificationHandlers(notification: WsNotification): void {
    console.log(
      "[WS] Notifying " +
        this.onNotificationListeners.length +
        " notification handler(s)"
    );
    this.onNotificationListeners.forEach((handler, index) => {
      try {
        handler(notification);
      } catch (error) {
        console.error("[WS] Notification handler error:", error);
      }
    });
  }
}

// Export singleton instance
export const messageWsService = new MessageWebSocketService();
