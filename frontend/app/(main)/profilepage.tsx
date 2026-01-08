import { useUser } from "@/components/UserContext";
import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

type Material = {
  id: number;
  title: string;
  price?: string;
  image: string;
  category: string;
  faculty: string;
  subject: string;
  rating: number;
  reviews: number;
  description?: string;
};

type Filters = {
  categories: string[];
  status: string[];
  subjects: string[];
};

type ApiSubject = {
  id: number;
  name: string;
};

type ApiCategory = {
  id: number;
  name: string;
};

type ApiPost = {
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
  user_avatar: string | null;
  subjects: ApiSubject[];
  categories: ApiCategory[];
  image_urls: string[];
};

type ApiResponse = {
  posts: ApiPost[];
  total: number;
};

/* ================= CONFIG ================= */
const PAGE_SIZE = 20;
const LIMIT = 6;

/* ================= API ================= */
const categories = [
  { id: 1, label: "Sách bài tập" },
  { id: 2, label: "Sách giáo trình" },
  { id: 3, label: "Sách thí nghiệm" },
  { id: 4, label: "Dụng cụ" },
  { id: 5, label: "Slide bài giảng" },
];

const subjects = [
  { id: 1, faculty_id: 5, label: "Cấu trúc Rời rạc" },
  { id: 2, faculty_id: 5, label: "Mô hình hóa Toán học" },
  { id: 3, faculty_id: 5, label: "Nhập môn Điện toán" },
  { id: 4, faculty_id: 5, label: "Hệ thống số" },
  { id: 5, faculty_id: 5, label: "Kỹ thuật Lập trình" },
  { id: 6, faculty_id: 5, label: "CTDL & GT" },
  { id: 7, faculty_id: 5, label: "Kiến trúc Máy tính" },
  { id: 8, faculty_id: 5, label: "Hệ CSDL" },
  { id: 9, faculty_id: 5, label: "Mạng Máy tính" },
  { id: 10, faculty_id: 5, label: "Hệ điều hành" },
];

const status = [
  { id: "ACTIVE", label: "Chưa bán" },
  { id: "SOLD", label: "Đã bán" },
];

/* ================= MAPPER ================= */
const mapPostToMaterial = (p: ApiPost): Material => ({
  id: p.id,
  title: p.title,
  description: p.subtitle || p.content,
  price: p.price === 0 ? "Miễn phí" : `${p.price.toLocaleString()} VND`,
  image: p.image_urls?.[0],
  category: p.categories.map((c) => c.name).join(", "),
  faculty: "",
  subject: p.subjects.map((s) => s.name).join(", "),
  rating: 5,
  reviews: p.view_count,
});

/* ================= UI COMPONENTS ================= */

const Checkbox = ({
  label,
  checked,
  onPress,
}: {
  label: string;
  checked: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center mb-4 w-1/2"
  >
    <View
      className={`w-5 h-5 rounded-md border-2 mr-3 items-center justify-center ${
        checked ? "bg-orange-500 border-orange-500" : "border-orange-500"
      }`}
    >
      {checked && <Text className="text-white text-xs font-bold">✓</Text>}
    </View>
    <Text>{label}</Text>
  </TouchableOpacity>
);

export default function ProfilePage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [total, setTotal] = useState(0);
  const { user } = useUser();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const [appliedFilters, setAppliedFilters] = useState<Filters>({
    categories: [],
    subjects: [],
    status: [],
  });

  const [tempFilters, setTempFilters] = useState<Filters>({
    categories: [],
    subjects: [],
    status: [],
  });

  const { categoryId } = useLocalSearchParams<{
    categoryId?: string;
  }>();

  const [filterVisible, setFilterVisible] = useState(false);
  const isInitialMount = useRef(true);
  const currentRequestId = useRef(0);

  const insets = useSafeAreaInsets();

  const fetchPosts = async (params: {
    search: string;
    filters: Filters;
    skip: number;
    limit: number;
  }) => {
    const query = new URLSearchParams();

    query.append("skip", params.skip.toString());
    query.append("limit", params.limit.toString());

    if (params.search) {
      query.append("search", params.search);
    }

    if (params.filters.subjects.length > 0) {
      params.filters.subjects.forEach((id) => {
        query.append("subject_ids", id.toString());
      });
    }

    if (params.filters.categories.length > 0) {
      params.filters.categories.forEach((id) => {
        query.append("category_ids", id.toString());
      });
    }

    if (params.filters.status.length > 0) {
      params.filters.status.forEach((status) => {
        query.append("status", status);
      });
    }

    const res = await api.get<ApiResponse>(
      `/users/${user?.id}/posts?${query.toString()}`
    );
    return res.data;
  };

  const loadData = useCallback(
    async (
      reset: boolean,
      searchQuery: string,
      filters: Filters,
      skipCount: number
    ) => {
      if ((loading || loadingSearch) && !reset) return;

      // Tạo ID cho request này
      const requestId = ++currentRequestId.current;

      reset ? setLoadingSearch(true) : setLoading(true);

      try {
        const res = await fetchPosts({
          search: searchQuery,
          filters: filters,
          skip: skipCount,
          limit: LIMIT,
        });

        // Chỉ update nếu đây vẫn là request mới nhất
        if (requestId === currentRequestId.current) {
          const mapped = res.posts.map(mapPostToMaterial);

          setTotal(res.total);
          setMaterials((prev) => (reset ? mapped : [...prev, ...mapped]));
        }
      } catch (error) {
        if (requestId === currentRequestId.current) {
          console.error("Error loading data:", error);
        }
      } finally {
        if (requestId === currentRequestId.current) {
          setLoading(false);
          setLoadingSearch(false);
        }
      }
    },
    [user?.id]
  );

  // Xử lý khi screen focus
  useFocusEffect(
    useCallback(() => {
      if (isInitialMount.current) return;

      // Chỉ refresh nếu không có categoryId (tránh conflict với useEffect categoryId)
      if (!categoryId) {
        setMaterials([]);
        loadData(true, q, appliedFilters, 0);
      }
    }, [q, appliedFilters, categoryId])
  );

  // Xử lý categoryId từ params
  useEffect(() => {
    if (categoryId && !isInitialMount.current) {
      const presetFilters: Filters = {
        categories: [categoryId],
        status: [],
        subjects: [],
      };

      setMaterials([]);
      setTotal(0);
      setAppliedFilters(presetFilters);
      setTempFilters(presetFilters);

      loadData(true, "", presetFilters, 0);
    }
  }, [categoryId]);

  // Initial mount
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      loadData(true, q, appliedFilters, 0);
    }
  }, []);

  const onRefresh = async () => {
    if (refreshing) return;

    setRefreshing(true);
    try {
      setMaterials([]);
      setTotal(0);
      await loadData(true, q, appliedFilters, 0);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleTempFilter = (key: keyof Filters, value: string) => {
    setTempFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  };

  const applyFilter = () => {
    setFilterVisible(false);
    setAppliedFilters(tempFilters);
    setMaterials([]);
    setTotal(0);
    
    // Load ngay với filter mới
    loadData(true, q, tempFilters, 0);
  };

  const clearFilters = () => {
    const empty: Filters = { categories: [], status: [], subjects: [] };
    setAppliedFilters(empty);
    setTempFilters(empty);
    setMaterials([]);
    setTotal(0);
    
    loadData(true, q, empty, 0);
  };

  const handleSearch = () => {
    setMaterials([]);
    setTotal(0);
    loadData(true, q, appliedFilters, 0);
  };

  const handleLoadMore = () => {
    const hasMore = materials.length < total;
    if (hasMore && !loading && !loadingSearch) {
      loadData(false, q, appliedFilters, materials.length);
    }
  };

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

  if (!user) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#ff6a00" />
      </View>
    );
  }

  const hasMore = materials.length < total;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }} edges={[]}>
      {/* SEARCH */}
      <View className="px-4">
        <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
          <Ionicons name="search-outline" size={22} color="#9CA3AF" />
          <TextInput
            placeholder="Tìm kiếm học liệu..."
            className="ml-3 flex-1"
            value={q}
            onChangeText={setQ}
            onSubmitEditing={handleSearch}
            placeholderTextColor="#9CA3AF"
            returnKeyType="search"
          />
        </View>
      </View>

      {/* TOTAL + FILTER */}
      <View className="flex-row justify-between items-center px-4 mt-6 mb-4">
        <Text className="font-semibold">{total.toLocaleString()} học liệu</Text>

        <View className="flex-row items-center">
          {(appliedFilters.categories.length > 0 ||
            appliedFilters.status.length > 0 ||
            appliedFilters.subjects.length > 0) && (
            <TouchableOpacity className="mr-3" onPress={clearFilters}>
              <Text className="text-orange-500">Xóa bộ lọc</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => {
              setTempFilters(appliedFilters);
              setFilterVisible(true);
            }}
          >
            <Ionicons name="filter-outline" size={22} />
            <Text className="ml-1">Lọc</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loadingSearch ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={"#ff6a00"} />
        </View>
      ) : (
        <FlatList
          data={materials}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          renderItem={({ item }) => <MaterialItem item={item} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#ff6a00"]}
              tintColor="#ff6a00"
            />
          }
          ListFooterComponent={
            loading ? (
              <ActivityIndicator className="my-6" color={"#ff6a00"} />
            ) : !hasMore && materials.length > 0 ? (
              <Text className="text-center text-gray-500 my-6">
                Bạn đã lướt hết học liệu
              </Text>
            ) : null
          }
          ListEmptyComponent={
            !loading && !loadingSearch ? (
              <View className="items-center justify-center py-12">
                <Ionicons name="search-outline" size={60} color="#9CA3AF" />
                <Text className="text-gray-500 mt-4">
                  Không tìm thấy học liệu
                </Text>
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={filterVisible} transparent animationType="fade">
        <TouchableOpacity
          className="flex-1 bg-black/30"
          onPress={() => setFilterVisible(false)}
        />

        <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6">
          {/* CATEGORY */}
          <Text className="text-lg font-bold mb-4">Danh mục</Text>
          <View className="flex-row flex-wrap">
            {categories.map((cat) => {
              const value = cat.id.toString();

              return (
                <Checkbox
                  key={cat.id}
                  label={cat.label}
                  checked={tempFilters.categories.includes(value)}
                  onPress={() => toggleTempFilter("categories", value)}
                />
              );
            })}
          </View>

          {/* SUBJECT */}
          <Text className="text-lg font-bold mb-4 mt-4">Môn học</Text>
          <View className="flex-row flex-wrap">
            {subjects.map((subj) => {
              const value = subj.id.toString();

              return (
                <Checkbox
                  key={subj.id}
                  label={subj.label}
                  checked={tempFilters.subjects.includes(value)}
                  onPress={() => toggleTempFilter("subjects", value)}
                />
              );
            })}
          </View>

          {/* STATUS */}
          <Text className="text-lg font-bold mb-4 mt-4">Trạng thái</Text>
          <View className="flex-row flex-wrap">
            {status.map((subj) => {
              const value = subj.id.toString();

              return (
                <Checkbox
                  key={subj.id}
                  label={subj.label}
                  checked={tempFilters.status.includes(value)}
                  onPress={() => toggleTempFilter("status", value)}
                />
              );
            })}
          </View>
          <TouchableOpacity
            className="bg-orange-500 py-4 rounded-xl mt-6"
            onPress={applyFilter}
          >
            <Text className="text-white text-center font-bold text-lg">
              Áp dụng
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});