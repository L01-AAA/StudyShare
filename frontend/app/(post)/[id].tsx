import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createConversation } from "@/services/messageApi";

type PostImage = {
  id: number;
  image_url: string;
  order: number;
};

type Categories = {
  id: number;
  name: string;
};

type PostDetail = {
  id: number;
  title: string;
  subtitle: string;
  content: string;
  price: number;
  product_condition: string;
  status: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  user_id: number;
  user_name: string;
  user_avatar: string;
  subjects: Categories[];
  categories: Categories[];
  images: PostImage[];
};

export default function PostDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchPostDetail();
  }, [id]);

  const fetchPostDetail = async () => {
    if (!id) return;

    setLoading(true);
    setError(false);

    try {
      const res = await api.get<PostDetail>(`/posts/${id}`);
      setPost(res.data);
    } catch (e) {
      console.error("Fetch post detail error:", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (id: number) => {
    const categoryMap: { [key: number]: string } = {
      1: "Giải tích",
      2: "Đại số",
      3: "Hình học",
      4: "Vật lý",
      5: "Hóa học",
    };
    return categoryMap[id] || `Môn học ${id}`;
  };

  const handleChatPress = async () => {
    if (!post) return;

    try {
      // Create or get conversation with the post author
      const conversation = await createConversation(post.user_id);

      // Navigate to message detail screen
      router.push({
        pathname: "/messagepage/[conversationId]",
        params: {
          conversationId: conversation.id.toString(),
          participantName: conversation.participantName,
          participantAvatar: conversation.participantAvatar || "",
        },
      });
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      Alert.alert(
        "Lỗi",
        error.message || "Không thể bắt đầu cuộc hội thoại. Vui lòng thử lại."
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f97316" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !post) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="alert-circle-outline" size={64} color="#9CA3AF" />
          <Text className="text-lg text-gray-600 mt-4 text-center">
            Không thể tải thông tin bài đăng
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-6 bg-orange-500 px-6 py-3 rounded-full"
          >
            <Text className="text-white font-semibold">Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }} edges={[]}>
      <ScrollView className="flex-1 px-5">
        {/* IMAGE / SLIDE */}
        <View className="mt-6">
          {post.images.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
            >
              {post.images
                .sort((a, b) => a.order - b.order)
                .map((img) => (
                  <Image
                    key={img.id}
                    source={{ uri: img.image_url }}
                    className="w-[90vw] h-56 rounded-2xl mr-3"
                    resizeMode="cover"
                  />
                ))}
            </ScrollView>
          ) : (
            <View className="h-56 bg-gray-200 rounded-2xl items-center justify-center">
              <Ionicons name="image-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-400 mt-2">Chưa có ảnh</Text>
            </View>
          )}
        </View>

        {/* CONDITION + PRICE (Horizontal) */}
        <View className="mt-6  pt-4">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-xl font-bold text-black">
                Tình trạng:{" "}
                {post.product_condition == "new"
                  ? "Mới"
                  : post.product_condition == "old"
                    ? "Cũ"
                    : "Gần như mới"}
              </Text>
              <Text className="text-xl text-orange-500 font-semibold mt-1">
                {post.title}
              </Text>
            </View>

            <View className="bg-orange-500 px-6 py-3 rounded-full">
              <Text className="text-white font-bold text-base">
                {post.price === 0
                  ? "Miễn phí"
                  : `${post.price.toLocaleString("vi-VN")} VND`}
              </Text>
            </View>
          </View>
        </View>

        {/* DESCRIPTION */}
        <View className="mt-2">
          <Text className="text-l text-gray-700 leading-5">
            {post.subtitle}
          </Text>
        </View>

        {/* DIVIDER */}
        <View className="h-px bg-black my-6" />

        <View>
          <Text className="text-xl font-bold text-black">Mô tả</Text>
          <Text className="text-l font-semibold">{post.content}</Text>
        </View>
        <View className="mt-6">
          <Text className="text-xl font-bold text-black">Phân loại</Text>
        </View>
        {/* CATEGORY */}
        <View className="flex-row flex-wrap">
          {[...post.categories, ...post.subjects].length > 0 ? (
            <>
              {post.categories.map((item) => (
                <View
                  key={`category-${item.id}`}
                  className="bg-orange-500 px-4 py-2 rounded-full mr-2 mb-2"
                >
                  <Text className="text-white font-medium text-sm">
                    {item.name}
                  </Text>
                </View>
              ))}

              {post.subjects.map((item) => (
                <View
                  key={`subject-${item.id}`}
                  className="bg-orange-500 px-4 py-2 rounded-full mr-2 mb-2"
                >
                  <Text className="text-white font-medium text-sm">
                    {item.name}
                  </Text>
                </View>
              ))}
            </>
          ) : (
            <Text className="text-gray-400">Chưa chọn phân loại</Text>
          )}
        </View>
        {/* USER FOOTER with Actions */}

        <View className="mt-8 mb-6 flex-row items-center justify-between px-4 py-3 bg-[#FBF0E9] rounded-xl">
          {/* LEFT GROUP */}
          <View className="flex-row items-center flex-1">
            {/* Avatar */}
            <TouchableOpacity className="w-10 h-10 rounded-full bg-white items-center justify-center overflow-hidden">
              {post.user_avatar ? (
                <Image
                  source={{ uri: post.user_avatar }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="person" size={18} color="#ff6a00" />
              )}
            </TouchableOpacity>

            {/* DIVIDER */}
            <View className="h-6 w-px bg-orange-500 mx-3" />

            {/* Name */}
            <Text
              className="ml-3 font-semibold text-base max-w-[120px]"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {post.user_name}
            </Text>

            {/* Stars */}
            <View className="flex-row items-center ml-2">
              {[1, 2, 3, 4].map((star) => (
                <Ionicons key={star} name="star" size={14} color="#FFA500" />
              ))}
              <Ionicons name="star-outline" size={14} color="#D1D5DB" />
            </View>

            {/* Rating count */}
            <Text className="text-xs text-gray-600 ml-1">
              {post.view_count}
            </Text>
          </View>

          {/* CHAT */}
          <TouchableOpacity
            onPress={handleChatPress}
            className="w-9 h-9 rounded-full bg-white items-center justify-center"
          >
            <Ionicons name="chatbubble-outline" size={18} color="#333" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
