import * as SecureStore from "expo-secure-store";

/* ================= TYPES ================= */

export interface WsChatMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name?: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface WsTypingIndicator {
  conversation_id: number;
  user_id: number;
  user_name: string;
  is_typing: boolean;
}

export interface WsNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  reference_id?: number;
  created_at: string;
  user_id?: number;
}

export type MessageHandler = (msg: WsChatMessage) => void;
export type TypingHandler = (typing: WsTypingIndicator) => void;
export type NotificationHandler = (notif: WsNotification) => void;
export type ErrorHandler = (error: string) => void;
export type ConnectionHandler = () => void;

/* ================= SERVICE ================= */

class MessageWsService {
  private ws: WebSocket | null = null;
  private state: "disconnected" | "connecting" | "connected" = "disconnected";
  private conversationId: number | string | null = null;

  private messageListeners = new Set<MessageHandler>();
  private typingListeners = new Set<TypingHandler>();
  private notificationListeners = new Set<NotificationHandler>();
  private errorListeners = new Set<ErrorHandler>();
  private connectListeners = new Set<ConnectionHandler>();
  private disconnectListeners = new Set<ConnectionHandler>();

  private baseUrl =
    "wss://studyshare-backend-production.up.railway.app/api/v1/chat/ws";

  /* ============ CONNECT ============ */

  async connect(conversationId: number | string) {
    if (this.state === "connected") return;

    this.conversationId = conversationId;
    this.state = "connecting";

    const token = await SecureStore.getItemAsync("accessToken");
    if (!token) throw new Error("No access token");

    const url = `${this.baseUrl}/${conversationId}?token=${token}`;
    console.log("[WS] Connecting:", url.split("?")[0]);

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log("%c[WS CONNECTED]", "color: green; font-weight: bold;");
      this.state = "connected";
      this.connectListeners.forEach((cb) => cb());
    };

    this.ws.onclose = () => {
      console.log("%c[WS DISCONNECTED]", "color: red; font-weight: bold;");
      this.state = "disconnected";
      this.ws = null;
      this.disconnectListeners.forEach((cb) => cb());
    };

    this.ws.onerror = () => {
      this.errorListeners.forEach((cb) => cb("WebSocket connection error"));
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("%c[WS RAW]", "color:#22c55e;font-weight:bold;", data);
        this.route(data);
      } catch (e) {
        console.error("[WS] JSON parse error", e);
      }
    };
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
    this.state = "disconnected";
  }

  isConnected() {
    return this.state === "connected";
  }

  getState() {
    return this.state;
  }

  /* ============ ROUTING (QUAN TRỌNG NHẤT) ============ */

  private route(data: any) {
    // 🔥 CHAT MESSAGE
    if (
      typeof data?.id === "number" &&
      typeof data?.sender_id === "number" &&
      typeof data?.conversation_id === "number" &&
      typeof data?.content === "string"
    ) {
      console.log("%c[WS ROUTE] MESSAGE", "color:orange;font-weight:bold;");
      this.messageListeners.forEach((cb) =>
        cb({
          id: data.id,
          sender_id: data.sender_id,
          sender_name: data.sender_name,
          conversation_id: data.conversation_id,
          content: data.content,
          is_read: data.is_read,
          created_at: data.created_at,
        })
      );
      return;
    }

    // 🔵 TYPING
    if (data?.event === "typing") {
      console.log("%c[WS ROUTE] TYPING", "color:#0ea5e9;font-weight:bold;");
      this.typingListeners.forEach((cb) =>
        cb({
          conversation_id: data.conversation_id,
          user_id: data.user_id,
          user_name: data.user_name,
          is_typing: data.is_typing,
        })
      );
      return;
    }

    // 🟣 NOTIFICATION
    if (data?.event === "notification") {
      console.log(
        "%c[WS ROUTE] NOTIFICATION",
        "color:#a855f7;font-weight:bold;"
      );
      this.notificationListeners.forEach((cb) => cb(data));
      return;
    }

    console.warn("[WS] Unhandled payload:", data);
  }

  /* ============ SENDERS ============ */

  sendMessage(content: string) {
    if (!this.ws || this.state !== "connected") return;
    this.ws.send(JSON.stringify({ content }));
  }

  sendTyping(isTyping: boolean) {
    if (!this.ws || this.state !== "connected") return;
    this.ws.send(JSON.stringify({ event: "typing", is_typing: isTyping }));
  }

  /* ============ LISTENERS ============ */

  onMessage(cb: MessageHandler) {
    this.messageListeners.add(cb);
  }
  removeMessageListener(cb: MessageHandler) {
    this.messageListeners.delete(cb);
  }

  onTyping(cb: TypingHandler) {
    this.typingListeners.add(cb);
  }
  removeTypingListener(cb: TypingHandler) {
    this.typingListeners.delete(cb);
  }

  onNotification(cb: NotificationHandler) {
    this.notificationListeners.add(cb);
  }
  removeNotificationListener(cb: NotificationHandler) {
    this.notificationListeners.delete(cb);
  }

  onError(cb: ErrorHandler) {
    this.errorListeners.add(cb);
  }
  removeErrorListener(cb: ErrorHandler) {
    this.errorListeners.delete(cb);
  }

  onConnect(cb: ConnectionHandler) {
    this.connectListeners.add(cb);
  }
  removeConnectListener(cb: ConnectionHandler) {
    this.connectListeners.delete(cb);
  }

  onDisconnect(cb: ConnectionHandler) {
    this.disconnectListeners.add(cb);
  }
  removeDisconnectListener(cb: ConnectionHandler) {
    this.disconnectListeners.delete(cb);
  }
}

export const messageWsService = new MessageWsService();
