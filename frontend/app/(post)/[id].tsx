import { useUser } from "@/components/UserContext";
import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

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
  const { user } = useUser();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isOwner = user?.id === post?.user_id;

  const handleEdit = () => {
    setShowMenu(false);
    router.push(`/posts/edit/${post?.id}`);
  };

const handleDelete = () => {
  setShowMenu(false);

  Alert.alert(
    "Xóa bài đăng",
    "Bạn có chắc chắn muốn xóa bài đăng này không? Hành động này không thể hoàn tác.",
    [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await api.delete(`/posts/${post?.id}`);
            router.back();
          } catch (e) {
            console.error("Delete post error:", e);
          } finally {
            setLoading(false);
          }
        },
      },
    ],
    { cancelable: true }
  );
};


  useEffect(() => {
    fetchPostDetail();
  }, [id]);

  const fetchPostDetail = async () => {
    if (!id) return;

    setLoading(true);
    setError(false);

    try {
      const res = await api.get<PostDetail>(`/posts/${id}`);
      console.log("Post detail:", res.data);
      setPost(res.data);
    } catch (e) {
      console.error("Fetch post detail error:", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };
  const [activeIndex, setActiveIndex] = useState(0);
  const [updatingStatus, setUpdatingStatus] = useState(false);
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
  const handleMarkAsSold = async () => {
    try {
      setUpdatingStatus(true);

      const formData = new FormData();
      formData.append("post_status", "SOLD");

      await api.put(
        `/posts/${post.id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 40000,
        }
      );

      setPost({ ...post, status: "SOLD" });
    } catch (e) {
      console.error("Update status error:", e);
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }} edges={[]}>
      {showMenu && (
        <Pressable
          onPress={() => setShowMenu(false)}
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 40,
          }}
        >
          <View
            style={{
              position: "absolute",
              top: 60,
              right: 20,
              backgroundColor: "white",
              borderRadius: 12,
              width: 160,
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <TouchableOpacity
              onPress={handleEdit}
              className="px-4 py-3 flex-row items-center"
            >
              <Text className="ml-2">Chỉnh sửa</Text>
            </TouchableOpacity>

            <View className="h-px bg-gray-200" />

            <TouchableOpacity
              onPress={handleDelete}
              className="px-4 py-3 flex-row items-center"
            >
              <Text className="ml-2 text-red-500">Xóa</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      )}
      {isOwner && (
        <View className="flex-row justify-end px-5 pt-4">
          <TouchableOpacity
            onPress={() => setShowMenu((showMenu) => !showMenu)}
            className="p-2 bg-white rounded-full"
          >
            <Ionicons name="menu" size={24} color="#111" />
          </TouchableOpacity>
        </View>
      )}
      <ScrollView className="flex-1 px-5">
        {/* IMAGE / SLIDE */}

        <View className="mt-6">
          {post.images.length > 0 ? (
            <>
              {/* IMAGE SLIDER */}
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => {
                  const index = Math.round(
                    e.nativeEvent.contentOffset.x / width
                  );
                  setActiveIndex(index);
                }}
                scrollEventThrottle={16}
              >
                {post.images
                  .sort((a, b) => a.order - b.order)
                  .map((img) => (
                    <Image
                      key={img.id}
                      source={{ uri: img.image_url }}
                      style={{
                        width: width,
                        height: 224,
                      }}
                      resizeMode="cover"
                    />
                  ))}
              </ScrollView>

              {/* DOT INDICATOR */}
              {post.images.length > 1 && (
                <View className="flex-row justify-center mt-3">
                  {post.images.map((_, index) => (
                    <View
                      key={index}
                      className={`mx-1 rounded-full ${
                        activeIndex === index
                          ? "bg-orange-500 w-3 h-3"
                          : "bg-gray-300 w-2 h-2"
                      }`}
                    />
                  ))}
                </View>
              )}
            </>
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

        {/* FOOTER */}
        {isOwner ? (
          <View className="mt-8 mb-6 px-4">
            {post.status !== "SOLD" ? (
              <TouchableOpacity
                onPress={handleMarkAsSold}
                disabled={updatingStatus}
                className={`border-2 rounded-2xl py-4 items-center ${
                  updatingStatus
                    ? "border-gray-300 bg-gray-100"
                    : "border-orange-500"
                }`}
              >
                {updatingStatus ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="#9CA3AF" />
                    <Text className="ml-3 text-gray-500 font-semibold text-xl">
                      Đang cập nhật...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-orange-500 font-semibold text-xl">
                    Đánh dấu đã bán
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <View className="rounded-2xl py-4 items-center bg-gray-200">
                <Text className="text-gray-600 font-semibold text-xl">
                  Đã bán
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View className="mt-8 mb-6 flex-row items-center justify-between px-4 py-3 bg-[#FBF0E9] rounded-xl">
            {/* USER INFO */}
            <View className="flex-row items-center flex-1">
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

              <View className="h-6 w-px bg-orange-500 mx-3" />

              <Text
                className="font-semibold text-base max-w-[120px]"
                numberOfLines={1}
              >
                {post.user_name}
              </Text>
            </View>

            <TouchableOpacity className="w-9 h-9 rounded-full bg-white items-center justify-center">
              <Ionicons name="chatbubble-outline" size={18} color="#333" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
