import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  getMessages,
  sendMessage, // ← Thay sendMessageViaWs bằng sendMessage (REST API)
  connectWebSocket,
  disconnectWebSocket,
  getWebSocketState,
  addWsMessageListener,
  addWsTypingListener,
  addWsErrorListener,
  addWsConnectListener,
  addWsDisconnectListener,
  removeWsMessageListener,
  removeWsTypingListener,
  removeWsErrorListener,
  removeWsConnectListener,
  removeWsDisconnectListener,
  addWsNotificationListener,
  removeWsNotificationListener,
  Message,
  sendTypingIndicator,
} from "@/services/messageApi";
import {
  WsChatMessage,
  WsTypingIndicator,
  WsNotification,
} from "@/services/messageWsApi";
import { useNotifications } from "@/components/NotificationContext";
import * as SecureStore from "expo-secure-store";

interface MessageWithLocal extends Message {
  localId?: string;
}

const MessageDetail = () => {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const { conversationId, participantName, participantAvatar } =
    useLocalSearchParams<{
      conversationId: string;
      participantName: string;
      participantAvatar?: string;
    }>();

  const [messages, setMessages] = useState<MessageWithLocal[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canLoadMore, setCanLoadMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Map<number, string>>(
    new Map()
  );
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const currentUserIdRef = useRef<number>(0);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lấy user ID
  useEffect(() => {
    SecureStore.getItemAsync("userData").then((u) => {
      if (u) {
        const user = JSON.parse(u);
        currentUserIdRef.current = Number(user.id);
      }
    });
  }, []);

  // ✅ Thêm notification handler
  const handleWsNotification = useCallback(
    (notification: WsNotification) => {
      console.log("[Chat] New notification received:", notification);

      // Convert WsNotification to Notification type
      const notif = {
        id: notification.id,
        userId: notification.user_id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        referenceId: notification.reference_id,
        isRead: notification.is_read,
        createdAt: notification.created_at,
      };

      // Add to notification context
      addNotification(notif);

      // Show alert hoặc toast (optional)
      console.log("[Chat] Notification added to context:", notif.title);
    },
    [addNotification]
  );

  // WebSocket handlers
  const handleWsMessage = useCallback((wsMessage: WsChatMessage) => {
    if (wsMessage.sender_id === currentUserIdRef.current) {
      return;
    }

    const newMessage: MessageWithLocal = {
      id: wsMessage.id,
      senderId: wsMessage.sender_id,
      content: wsMessage.content,
      timestamp: wsMessage.created_at,
      isOwn: false,
      isRead: wsMessage.is_read,
    };

    setMessages((prev) => {
      if (prev.some((m) => m.id === newMessage.id)) return prev;
      return [...prev, newMessage];
    });

    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, []);

  const handleWsTyping = useCallback((typing: WsTypingIndicator) => {
    console.log("[WS Typing]", typing);
    if (typing.is_typing) {
      setTypingUsers((prev) =>
        new Map(prev).set(typing.user_id, typing.user_name)
      );
    } else {
      setTypingUsers((prev) => {
        const updated = new Map(prev);
        updated.delete(typing.user_id);
        return updated;
      });
    }
  }, []);

  const handleWsError = useCallback((errorMsg: string) => {
    console.error("[WS Error]", errorMsg);
    setError(errorMsg);
  }, []);

  const handleWsConnect = useCallback(() => {
    console.log("[DEBUG] handleWsConnect called!");
    setWsConnected(true);
    setError(null);
  }, []);

  const handleWsDisconnect = useCallback(() => {
    console.log("[WS Disconnected]");
    setWsConnected(false);
  }, []);

  // Initialize chat
  useEffect(() => {
    if (!conversationId) return;

    let isMounted = true;

    const initializeChat = async () => {
      try {
        // 0. Register listeners TRƯỚC kết nối
        console.log("[Chat] Registering listeners first...");
        addWsMessageListener(handleWsMessage);
        addWsTypingListener(handleWsTyping);
        addWsErrorListener(handleWsError);
        addWsConnectListener(handleWsConnect);
        addWsDisconnectListener(handleWsDisconnect);
        addWsNotificationListener(handleWsNotification);
        if (!isMounted) return;

        // 1. Load messages
        console.log("[Chat] Loading messages...");
        await fetchMessages();

        if (!isMounted) return;

        // 2. Connect WebSocket - để nhận tin nhắn realtime
        console.log("[Chat] Connecting to WebSocket...");
        await connectWebSocket(conversationId);

        if (!isMounted) return;

        console.log("[Chat] WebSocket connected!");
      } catch (error) {
        console.error("[Chat Init Error]", error);
        if (isMounted) {
          setError(
            error instanceof Error
              ? error.message
              : "Không thể kết nối. Vui lòng thử lại."
          );
        }
      }
    };

    initializeChat();

    return () => {
      isMounted = false;
      removeWsMessageListener(handleWsMessage);
      removeWsTypingListener(handleWsTyping);
      removeWsErrorListener(handleWsError);
      removeWsConnectListener(handleWsConnect);
      removeWsDisconnectListener(handleWsDisconnect);
      removeWsNotificationListener(handleWsNotification);
      disconnectWebSocket();
    };
  }, [
    conversationId,
    handleWsMessage,
    handleWsTyping,
    handleWsError,
    handleWsConnect,
    handleWsDisconnect,
    handleWsNotification,
  ]);

  const [messageCount, setMessageCount] = useState(0);

  const fetchMessages = async (skip: number = 0) => {
    try {
      if (skip === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      if (conversationId) {
        const data = await getMessages(
          conversationId,
          50,
          skip,
          participantName || "Unknown",
          participantAvatar
        );

        if (skip === 0) {
          const sorted = [...data].sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );

          setMessages(sorted);
          setMessageCount(data.length);
        } else {
          const sorted = [...data].sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );

          setMessages((prev) => [...sorted, ...prev]);
          setMessageCount((prev) => prev + data.length);
        }

        if (data.length < 50) {
          setCanLoadMore(false);
        }

        if (skip === 0) {
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: false });
          }, 100);
        }
      }
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      setError(error.message || "Không thể tải tin nhắn");

      if (error.response?.status === 401) {
        Alert.alert(
          "Hết Phiên Làm Việc",
          "Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/(auth)/login"),
            },
          ]
        );
      }
      setMessages([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && canLoadMore && messages.length > 0) {
      fetchMessages(messageCount);
    }
  };

  // ✅ Sửa handleSendMessage để dùng REST API
  const handleSendMessage = async () => {
    if (!messageText.trim() || !conversationId) return;

    const messageContent = messageText.trim();
    setMessageText("");
    setIsTyping(false);

    const localId = `local_${Date.now()}`;

    // Thêm tin nhắn optimistic
    const optimisticMessage: MessageWithLocal = {
      id: -1,
      localId,
      senderId: currentUserIdRef.current,
      content: messageContent,
      timestamp: new Date().toISOString(),
      isOwn: true,
      isRead: false,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      setSending(true);
      setError(null);

      console.log("[Send] Sending message via REST API:", messageContent);

      // Gửi tin nhắn qua REST API
      const response = await sendMessage(conversationId, messageContent);

      console.log("[Send] Message sent successfully:", response);

      // Replace optimistic message với message thực từ server
      setMessages((prev) => {
        const filtered = prev.filter((m) => !(m.localId === localId));
        return [...filtered, response];
      });

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err: any) {
      console.error("[Send] Error sending message:", err);
      setError(err.message || "Gửi tin nhắn thất bại");

      // Xóa optimistic message nếu lỗi
      setMessages((prev) => prev.filter((m) => m.localId !== localId));
      setMessageText(messageContent);
    } finally {
      setSending(false);
    }
  };

  const handleTextChange = (text: string) => {
    setMessageText(text);

    if (!isTyping && text.length > 0) {
      setIsTyping(true);
      if (wsConnected) {
        sendTypingIndicator(true);
      }
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (wsConnected) {
        sendTypingIndicator(false);
      }
    }, 2000);
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMessageDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Hôm nay";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Hôm qua";
    } else {
      return date.toLocaleDateString("vi-VN");
    }
  };

  const shouldShowDateSeparator = (
    currentMessage: MessageWithLocal,
    previousMessage: MessageWithLocal | undefined
  ): boolean => {
    if (!previousMessage) return true;
    return (
      formatMessageDate(currentMessage.timestamp) !==
      formatMessageDate(previousMessage.timestamp)
    );
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <SafeAreaView
      className="flex-1 bg-white"
      edges={["left", "right", "bottom"]}
    >
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200 bg-white">
        <TouchableOpacity
          onPress={() => router.replace("/(main)/messagepage")}
          className="mr-3"
        >
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>

        {/* Participant Info */}
        <View className="flex-row items-center flex-1">
          <View className="w-12 h-12 rounded-full bg-gray-300 items-center justify-center mr-3 overflow-hidden relative">
            {participantAvatar ? (
              <Image
                source={{ uri: participantAvatar }}
                className="w-full h-full"
              />
            ) : (
              <Ionicons name="person" size={20} color="#fff" />
            )}
          </View>
          <View className="flex-1">
            <Text className="text-lg font-roboto-bold text-gray-900">
              {participantName}
            </Text>
            <Text
              className={`text-xs ${
                wsConnected ? "text-green-600" : "text-gray-500"
              }`}
            >
              {wsConnected ? "Đang hoạt động" : "Đang kết nối..."}
            </Text>
          </View>
        </View>

        {/* Connection status indicator */}
        <View
          className={`w-3 h-3 rounded-full mr-3 ${
            wsConnected ? "bg-green-500" : "bg-gray-400"
          }`}
        />

        {/* More options */}
        <TouchableOpacity className="ml-2 p-2">
          <Ionicons name="ellipsis-vertical" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#ff6a00" />
          <Text className="text-gray-500 mt-3">Đang tải tin nhắn...</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
          keyboardVerticalOffset={90}
        >
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-4 py-4"
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              scrollViewRef.current?.scrollToEnd({ animated: false })
            }
          >
            {/* Load more indicator */}
            {loadingMore && (
              <View className="items-center py-3">
                <ActivityIndicator size="small" color="#ff6a00" />
                <Text className="text-gray-500 text-xs mt-2">
                  Đang tải tin nhắn cũ...
                </Text>
              </View>
            )}

            {canLoadMore && messages.length > 0 && (
              <TouchableOpacity
                onPress={handleLoadMore}
                className="items-center py-4"
              >
                <Text className="text-orange-500 font-roboto-bold text-sm">
                  Tải tin nhắn cũ
                </Text>
              </TouchableOpacity>
            )}

            {messages.length === 0 ? (
              <View className="flex-1 items-center justify-center py-20">
                <Ionicons name="chatbubbles-outline" size={48} color="#ddd" />
                <Text className="text-gray-500 mt-4">
                  Chưa có tin nhắn nào{"\n"}Bắt đầu cuộc trò chuyện
                </Text>
              </View>
            ) : (
              messages.map((message, index) => {
                const isOwn = message.senderId === currentUserIdRef.current;
                return (
                  <View key={message.localId || message.id}>
                    {/* Date separator */}
                    {shouldShowDateSeparator(message, messages[index - 1]) && (
                      <View className="items-center py-4">
                        <Text className="text-gray-400 text-xs font-roboto">
                          {formatMessageDate(message.timestamp)}
                        </Text>
                      </View>
                    )}

                    {/* Message bubble */}
                    <View
                      className={`mb-3 flex-row ${
                        isOwn ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!isOwn && (
                        <View className="w-8 h-8 rounded-full bg-gray-300 items-center justify-center mr-2 mt-1">
                          {participantAvatar ? (
                            <Image
                              source={{ uri: participantAvatar }}
                              className="w-full h-full rounded-full"
                            />
                          ) : (
                            <Ionicons name="person" size={16} color="#fff" />
                          )}
                        </View>
                      )}

                      <View
                        className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                          isOwn
                            ? "bg-orange-500 rounded-br-md"
                            : "bg-gray-500 rounded-bl-md"
                        }`}
                        style={{ opacity: message.localId ? 0.6 : 1 }}
                      >
                        <Text className="text-white text-base leading-5">
                          {message.content}
                        </Text>
                        <View className="flex-row items-center mt-1">
                          <Text
                            className={`mt-1 ${
                              isOwn ? "items-end" : "items-start"
                            }`}
                          >
                            <Text className="text-[10px] text-gray-200">
                              {formatMessageTime(message.timestamp)}
                            </Text>
                          </Text>
                          {isOwn && message.isRead && (
                            <Ionicons
                              name="checkmark-done"
                              size={12}
                              color="#fff"
                              style={{ marginLeft: 4 }}
                            />
                          )}
                          {message.localId && (
                            <ActivityIndicator
                              size={10}
                              color={isOwn ? "rgba(255,255,255,0.6)" : "#999"}
                              style={{ marginLeft: 4 }}
                            />
                          )}
                        </View>
                      </View>

                      {isOwn && (
                        <View className="w-8 h-8 rounded-full bg-gray-400 mr-2 mt-1 overflow-hidden">
                          <Ionicons name="person" size={16} color="#fff" />
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}

            {/* Typing indicator */}
            {typingUsers.size > 0 && (
              <View className="mb-3 flex-row">
                <View className="w-8 h-8 rounded-full bg-gray-300 items-center justify-center mr-2">
                  <Ionicons name="person" size={16} color="#fff" />
                </View>
                <View className="bg-gray-100 rounded-2xl rounded-bl-none px-4 py-3">
                  <Text className="text-xs text-gray-500">
                    {Array.from(typingUsers.values()).join(", ")} đang nhập...
                  </Text>
                </View>
              </View>
            )}

            <View className="h-4" />
          </ScrollView>

          {/* Error message */}
          {error && (
            <View className="mx-4 mb-2 p-3 bg-red-50 rounded-lg border border-red-200">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <Ionicons name="alert-circle" size={16} color="#dc2626" />
                  <Text className="ml-2 text-red-700 text-xs flex-1">
                    {error}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setError(null)}>
                  <Ionicons name="close" size={16} color="#dc2626" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Input Area */}
          <View className="px-4 py-4 border-t border-gray-200 bg-white flex-row items-end">
            <TouchableOpacity className="mr-3 p-2 items-center justify-center">
              <Ionicons name="add" size={24} color="#ff6a00" />
            </TouchableOpacity>

            <View className="flex-1">
              <TextInput
                placeholder="Nhập tin nhắn..."
                placeholderTextColor="#aaa"
                className="bg-gray-100 rounded-full px-4 py-3 text-gray-900"
                value={messageText}
                onChangeText={handleTextChange}
                multiline
                maxLength={1000}
                editable={!sending}
              />
            </View>

            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={!messageText.trim() || sending}
              className={`ml-3 w-10 h-10 rounded-full items-center justify-center ${
                messageText.trim() && !sending ? "bg-orange-500" : "bg-gray-300"
              }`}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

export default MessageDetail;
