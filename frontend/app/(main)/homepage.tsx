import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* ================= TYPES ================= */
type Category = {
  id: number;
  title: string;
  image: any;
};

type Material = {
  id: number;
  title: string;
  description: string;
  price: string;
  image: string | null;
};

type ApiPost = {
  id: number;
  title: string;
  subtitle: string;
  content: string;
  price: number;
  image_urls: string[];
};

type ApiResponse = {
  items: ApiPost[];
  total: number;
};

/* ================= MOCK CATEGORY ================= */
const Categories: Category[] = [
  {
    id: 1,
    title: "Sách bài tập",
    image: require("../../assets/images/baitap.jpg"),
  },
  {
    id: 2,
    title: "Sách giáo trình",
    image: require("../../assets/images/giaotrinh.png"),
  },
  {
    id: 3,
    title: "Slide bài giảng",
    image: require("../../assets/images/slide.jpg"),
  },
  {
    id: 4,
    title: "Sách thí nghiệm",
    image: require("../../assets/images/thinghiem.jpg"),
  },
  {
    id: 5,
    title: "Dụng cụ",
    image: require("../../assets/images/Dung-cu.jpg"),
  },
];

const LIMIT = 6;

export default function HomePage() {
  const router = useRouter();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const hasMore = materials.length < total;

  /* ================= MAPPER ================= */
  const mapPostToMaterial = (p: ApiPost): Material => ({
    id: p.id,
    title: p.title,
    description: p.subtitle || p.content || "",
    price: p.price === 0 ? "Miễn phí" : `${p.price.toLocaleString()} VND`,
    image: p.image_urls?.[0] ?? null,
  });

  /* ================= API CALL ================= */
  const fetchMaterials = async (reset = false) => {
    if (loading && !reset) return;

    if (!reset && initialized && !hasMore) return;

    reset ? setRefreshing(true) : setLoading(true);

    try {
      const skip = reset ? 0 : materials.length;

      const res = await api.get<ApiResponse>(
        `/posts?skip=${skip}&limit=${LIMIT}&status=ACTIVE`
      );
      console.log("Fetched materials:", res.data);
      const mapped = res.data.items.map(mapPostToMaterial);

      setTotal(res.data.total);

      setMaterials((prev) => {
        if (reset) return mapped;

        const map = new Map<number, Material>();
        [...prev, ...mapped].forEach((item) => map.set(item.id, item));
        return Array.from(map.values());
      });

      setInitialized(true);
    } catch (e) {
      console.error("Fetch materials error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMaterials(true);
  }, []);

  /* ================= ITEM ================= */
  const MaterialItem = ({ item }: { item: Material }) => (
    <TouchableOpacity
      className="flex-1 mx-2 mb-4"
      onPress={() =>
        router.push({
          pathname: "/(post)/[id]",
          params: { id: item.id },
        })
      }
    >
      <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
        <View className="w-full h-40 rounded-2xl overflow-hidden bg-gray-200 items-center justify-center">
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <>
              <Ionicons name="image-outline" size={30} color="#9CA3AF" />
              <Text className="text-gray-400 mt-2">Chưa có ảnh</Text>
            </>
          )}
        </View>

        <View className="p-3">
          <Text className="font-semibold mb-1" numberOfLines={2}>
            {item.title}
          </Text>
          {!!item.description && (
            <Text className="text-xs text-gray-500 mb-1" numberOfLines={2}>
              {item.description}
            </Text>
          )}
          {!!item.price && (
            <Text className="font-bold text-gray-900">{item.price}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  /* ================= HEADER ================= */
  const ListHeader = () => (
    <View>
      {/* SEARCH */}
      <TouchableOpacity onPress={() => router.push("/searchpage")}>
        <View className="px-4 mb-6 mt-2">
          <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
            <Ionicons name="search-outline" size={22} color="#9CA3AF" />
            <TextInput
              placeholder="Tìm kiếm dụng cụ học tập, tài liệu..."
              className="ml-3 flex-1 text-base text-gray-500"
              editable={false}
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* CATEGORIES */}
      <View className="px-4 mb-6">
        <Text className="text-2xl font-bold mb-4">Các danh mục</Text>
        <FlatList
          horizontal
          data={Categories}
          keyExtractor={(item) => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="mr-4 items-center"
              onPress={() => {
                router.push({
                  pathname: "/searchpage",
                  params: {
                    categoryId: item.id.toString(),
                  },
                });
              }}
            >
              <View className="w-24 h-24 rounded-full overflow-hidden mb-2">
                <Image source={item.image} className="w-full h-full" />
              </View>
              <Text className="text-sm font-medium text-center">
                {item.title}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }} edges={[]}>
      <StatusBar barStyle="dark-content" />

      <FlatList
        data={materials}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        renderItem={({ item }) => <MaterialItem item={item} />}
        onEndReached={() => fetchMaterials()}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<ListHeader />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchMaterials(true)}
            colors={["#ff6a00"]} // Android
            tintColor="#ff6a00" // iOS
          />
        }
        ListFooterComponent={
          loading ? (
            <ActivityIndicator className="my-6" />
          ) : initialized && !hasMore ? (
            <Text className="text-center text-gray-500 my-6">
              Bạn đã lướt hết học liệu
            </Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
