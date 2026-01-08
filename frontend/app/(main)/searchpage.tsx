import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  faculties: string[];
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
  items: ApiPost[];
  total: number;
};

/* ================= CONFIG ================= */
const PAGE_SIZE = 20;
const LIMIT = 6;
/* ================= API ================= */
const fetchPosts = async (params: {
  search: string;
  filters: Filters;
  skip: number;
  limit: number;
}) => {
  const query = new URLSearchParams();

  query.append("skip", params.skip.toString());
  query.append("limit", params.limit.toString());
  query.append("status", "ACTIVE");

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

  const res = await api.get<ApiResponse>(`/posts?${query.toString()}`);
  return res.data;
};

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
const renderStars = (rating: number) => (
  <View className="flex-row">
    {[1, 2, 3, 4, 5].map((star) => (
      <Text
        key={star}
        className={star <= rating ? "text-yellow-500" : "text-gray-300"}
      >
        ★
      </Text>
    ))}
  </View>
);

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

export default function SearchPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const [appliedFilters, setAppliedFilters] = useState<Filters>({
    categories: [],
    faculties: [],
    subjects: [],
  });

  const [tempFilters, setTempFilters] = useState<Filters>({
    categories: [],
    faculties: [],
    subjects: [],
  });
  
  const { categoryId } = useLocalSearchParams<{
    categoryId?: string;
  }>();
  
  const [filterVisible, setFilterVisible] = useState(false);
  const isInitialMount = useRef(true);

  const hasMore = materials.length < total;

  const loadData = useCallback(async (
    reset = false, 
    searchQuery: string,
    filters: Filters,
    currentMaterials: Material[]
  ) => {
    if (loading || loadingSearch) return;

    reset ? setLoadingSearch(true) : setLoading(true);

    try {
      const res = await fetchPosts({
        search: searchQuery,
        filters: filters,
        skip: reset ? 0 : currentMaterials.length,
        limit: LIMIT,
      });

      const mapped = res.items.map(mapPostToMaterial);

      setTotal(res.total);
      setMaterials(reset ? mapped : [...currentMaterials, ...mapped]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
      setLoadingSearch(false);
    }
  }, [loading, loadingSearch]);

  useEffect(() => {
    if (categoryId && !isInitialMount.current) {
      const presetFilters: Filters = {
        categories: [categoryId],
        faculties: [],
        subjects: [],
      };

      setMaterials([]);
      setTotal(0);
      setAppliedFilters(presetFilters);
      setTempFilters(presetFilters);
      
      loadData(true, q, presetFilters, []);
    }
  }, [categoryId]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      
      // Nếu không có categoryId thì load data bình thường
      if (!categoryId) {
        loadData(true, q, appliedFilters, []);
      }
    }
  }, []);

  const toggleTempFilter = (key: keyof Filters, value: string) => {
    setTempFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  };

  const applyFilter = () => {
    setAppliedFilters(tempFilters);
    setFilterVisible(false);
    setMaterials([]);
    loadData(true, q, tempFilters, []);
  };

  const clearFilters = () => {
    const empty: Filters = { categories: [], faculties: [], subjects: [] };
    setAppliedFilters(empty);
    setTempFilters(empty);
    setFilterVisible(false);
    setMaterials([]);
    loadData(true, q, empty, []);
  };

  const handleSearch = () => {
    setMaterials([]);
    loadData(true, q, appliedFilters, []);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading && !loadingSearch) {
      loadData(false, q, appliedFilters, materials);
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
            placeholderTextColor="#9CA3AF"
            onChangeText={setQ}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* TOTAL + FILTER */}
      <View className="flex-row justify-between items-center px-4 mt-6 mb-4">
        <Text className="font-semibold">{total.toLocaleString()} học liệu</Text>

        <View className="flex-row items-center">
          {(appliedFilters.categories.length > 0 ||
            appliedFilters.faculties.length > 0 ||
            appliedFilters.subjects.length > 0) && (
            <TouchableOpacity
              className="mr-3"
              onPress={clearFilters}
            >
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
            !loading ? (
              <View className="items-center justify-center py-12">
                <Ionicons name="search-outline" size={60} color="#9CA3AF" />
                <Text className="text-gray-500 mt-4">Không tìm thấy học liệu</Text>
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FILTER MODAL */}
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