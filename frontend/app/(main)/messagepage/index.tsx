import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  getConversations,
  markAsRead,
  Conversation,
} from "@/services/messageApi";
import { useNotifications } from "@/components/NotificationContext";
import * as SecureStore from "expo-secure-store";

const MessagePage = () => {
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const { notifications } = useNotifications();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<
    Conversation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const currentUserIdRef = useRef<number>(0);

  useEffect(() => {
    if (!notifications.length) return;

    const latest = notifications[0];

    if (latest.type !== "message" || !latest.referenceId) return;

    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === latest.referenceId);

      if (idx === -1) return prev;

      const updated = [...prev];
      const conv = updated[idx];

      updated.splice(idx, 1);

      updated.unshift({
        ...conv,
        lastMessage: latest.message,
        lastMessageTime: latest.createdAt,
        unreadCount: conv.unreadCount + 1,
      });

      return updated;
    });
  }, [notifications]);

  useEffect(() => {
    setFilteredConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    SecureStore.getItemAsync("userData").then((u) => {
      if (u) {
        const user = JSON.parse(u);
        currentUserIdRef.current = Number(user.id);
      }
    });
  }, []);
  // Load conversations khi screen được focus
  useFocusEffect(
    useCallback(() => {
      const fetchConversations = async () => {
        try {
          setLoading(true);
          setError(null);
          const data = await getConversations();
          // Sort by last message time (newest first)
          const sorted = data.sort((a, b) => {
            const timeA = new Date(a.lastMessageTime).getTime();
            const timeB = new Date(b.lastMessageTime).getTime();
            return timeB - timeA;
          });
          setConversations(sorted);
          setFilteredConversations(sorted);
        } catch (error: any) {
          console.error("Error loading conversations:", error);
          setError(error.message || "Failed to load conversations");

          // Check if it's a 403 error
          if (error.response?.status === 403) {
            Alert.alert(
              "Lỗi Quyền Truy Cập",
              "Bạn không có quyền truy cập tính năng này. Vui lòng đăng nhập lại.",
              [
                {
                  text: "OK",
                  onPress: () => {
                    // Navigate to login
                    router.replace("/(auth)/login");
                  },
                },
              ]
            );
          } else if (error.response?.status === 401) {
            Alert.alert(
              "Hết Phiên Làm Việc",
              "Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.",
              [
                {
                  text: "OK",
                  onPress: () => {
                    router.replace("/(auth)/login");
                  },
                },
              ]
            );
          }
        } finally {
          setLoading(false);
        }
      };

      fetchConversations();
    }, [router])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      setError(null);
      const data = await getConversations();
      const sorted = data.sort((a, b) => {
        const timeA = new Date(a.lastMessageTime).getTime();
        const timeB = new Date(b.lastMessageTime).getTime();
        return timeB - timeA;
      });
      setConversations(sorted);
      setFilteredConversations(sorted);
    } catch (error: any) {
      console.error("Error refreshing conversations:", error);
      setError("Failed to refresh conversations");
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text.trim() === "") {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter((conv) =>
        conv.participantName.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredConversations(filtered);
    }
  };

  const handleSelectConversation = async (conversation: Conversation) => {
    try {
      // Mark as read
      if (conversation.unreadCount > 0) {
        await markAsRead(conversation.id);
      }
      // Navigate to message detail
      router.push({
        pathname: "/messagepage/[conversationId]",
        params: {
          conversationId: conversation.id.toString(),
          participantName: conversation.participantName,
          participantAvatar: conversation.participantAvatar || "",
        },
      });
    } catch (error) {
      console.error("Error opening conversation:", error);
      Alert.alert("Lỗi", "Không thể mở cuộc hội thoại. Vui lòng thử lại.");
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffMinutes < 1) return "Vừa xong";
    if (diffMinutes < 60) return `${diffMinutes}p`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
    if (diffMinutes < 10080) {
      const days = Math.floor(diffMinutes / 1440);
      return `${days}d`;
    }
    return date.toLocaleDateString("vi-VN");
  };

  const handleCreateNewChat = () => {
    Alert.alert(
      "Coming Soon",
      "Create new chat feature will be available soon"
    );
  };

  const handleOpenNotifications = () => {
    // TODO: Navigate to notifications screen
    Alert.alert("Thông báo", `Bạn có ${unreadCount} thông báo chưa đọc`);
  };

  return (
    <SafeAreaView
      className="flex-1 bg-white"
      edges={["left", "right", "bottom"]}
    >
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200 flex-row items-center justify-between">
        <Text className="text-2xl font-roboto-bold text-gray-900">
          Tin nhắn
        </Text>

        {/* ✅ Notification + Create icons */}
        <View className="flex-row items-center gap-2">
          {/* Notification Icon */}
          <TouchableOpacity
            onPress={handleOpenNotifications}
            className="relative p-2"
          >
            <Ionicons name="notifications" size={24} color="#333" />
            {/* ✅ Badge */}
            {unreadCount > 0 && (
              <View className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full items-center justify-center">
                <Text className="text-white text-xs font-roboto-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Create Chat Icon */}
          <TouchableOpacity
            onPress={handleCreateNewChat}
            className="w-10 h-10 rounded-full bg-orange-500 items-center justify-center"
          >
            <Ionicons name="create" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View className="px-4 py-4 border-b border-gray-200">
        <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-3">
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            placeholder="Tìm kiếm cuộc trò chuyện"
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-3 text-gray-600"
            value={searchText}
            onChangeText={handleSearch}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Error State */}
      {error && (
        <View className="mx-4 mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <Ionicons name="alert-circle" size={18} color="#dc2626" />
              <Text className="ml-2 text-red-700 text-sm flex-1">{error}</Text>
            </View>
            <TouchableOpacity onPress={() => setError(null)}>
              <Ionicons name="close" size={18} color="#dc2626" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Conversations List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#ff6a00" />
          <Text className="text-gray-500 mt-3">Đang tải cuộc hội thoại...</Text>
        </View>
      ) : filteredConversations.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="chatbubbles-outline" size={64} color="#ddd" />
          <Text className="text-gray-500 mt-4 text-center text-base">
            {searchText
              ? "Không tìm thấy cuộc trò chuyện"
              : conversations.length === 0
                ? "Chưa có cuộc trò chuyện\nĐể chat với người bán, hãy chọn học liệu cần trao đổi trước."
                : "Không có cuộc hội thoại nào"}
          </Text>
          {conversations.length === 0 && (
            <TouchableOpacity
              onPress={() => router.replace("/(main)/homepage")}
              className="mt-6 px-6 py-3 bg-orange-500 rounded-lg"
            >
              <Text className="text-white font-roboto-bold">
                Xem các học liệu hiện có
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredConversations.map((conversation) => (
            <TouchableOpacity
              key={conversation.id}
              onPress={() => handleSelectConversation(conversation)}
              className="flex-row items-center px-4 py-3 border-b border-gray-100 bg-white active:bg-gray-50"
            >
              {/* Avatar */}
              <View className="w-14 h-14 rounded-full bg-gray-300 items-center justify-center mr-4 overflow-hidden relative">
                {conversation.participantAvatar ? (
                  <Image
                    source={{ uri: conversation.participantAvatar }}
                    className="w-full h-full"
                  />
                ) : (
                  <Ionicons name="person" size={24} color="#fff" />
                )}
                {/* Online indicator - optional */}
                <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
              </View>

              {/* Conversation Info */}
              <View className="flex-1">
                <View className="flex-row justify-between items-center">
                  <Text
                    className={`text-base ${
                      conversation.unreadCount > 0
                        ? "font-roboto-bold text-gray-900"
                        : "font-roboto text-gray-700"
                    }`}
                    numberOfLines={1}
                  >
                    {conversation.participantName}
                  </Text>
                  <Text
                    className={`text-xs ${
                      conversation.unreadCount > 0
                        ? "font-roboto-bold text-gray-900"
                        : "text-gray-500"
                    }`}
                  >
                    {formatTime(conversation.lastMessageTime)}
                  </Text>
                </View>

                {/* Last Message */}
                <Text
                  className={`mt-1 text-sm ${
                    conversation.unreadCount > 0
                      ? "font-roboto-bold text-gray-700"
                      : "text-gray-500"
                  }`}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {conversation.lastMessage
                    ? conversation.lastMessageSenderId ===
                      currentUserIdRef.current
                      ? `Bạn: ${conversation.lastMessage}`
                      : `${conversation.lastMessage}`
                    : "Chưa có tin nhắn"}
                </Text>
              </View>

              {/* Unread Badge */}
              {conversation.unreadCount > 0 && (
                <View className="w-6 h-6 bg-orange-500 rounded-full items-center justify-center ml-2">
                  <Text className="text-white text-xs font-roboto-bold">
                    {conversation.unreadCount > 9
                      ? "9+"
                      : conversation.unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
          <View className="h-6" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default MessagePage;
