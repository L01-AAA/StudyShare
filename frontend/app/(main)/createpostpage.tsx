import api from "@/services/api";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
/* ===================== TYPES ===================== */

type SelectionField = "categories" | "subjects";

interface PickedImage {
  uri: string;
  name: string;
  type: string;
}

export interface PostFormData {
  categories: number[];
  subjects: number[];
  title: string;
  subtitle: string;
  status: string;
  description: string;
  price: string;
  images: PickedImage[];
}

interface CreatePostPageProps {
  initialFormData?: PostFormData;
}

/* ===================== DEFAULT DATA ===================== */

const DEFAULT_FORM_DATA: PostFormData = {
  categories: [],
  subjects: [],
  title: "",
  subtitle: "",
  status: "",
  description: "",
  price: "",
  images: [],
};

const TOTAL_STEP = 4;

/* ===================== COMPONENT ===================== */

const CreatePostPage: React.FC<CreatePostPageProps> = ({
  initialFormData = DEFAULT_FORM_DATA,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<PostFormData>({
    ...initialFormData,
  });
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [loading, setLoading] = useState(false);
  /* ===================== EFFECT ===================== */

  useEffect(() => {
    setFormData({ ...initialFormData });
    setCurrentStep(0);
  }, [initialFormData]);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height - 150);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  /* ===================== DATA ===================== */

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

  /* ===================== HELPERS ===================== */
  const CheckboxItem = ({
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
      <Text className="text-gray-800">{label}</Text>
    </TouchableOpacity>
  );
  const progress = (currentStep / TOTAL_STEP) * 100;

  const resetForm = () => {
    setCurrentStep(0);
    setFormData({ ...initialFormData });
  };

  const toggleSelection = (field: SelectionField, id: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(id)
        ? prev[field].filter((i) => i !== id)
        : [...prev[field], id],
    }));
  };

  const submitPost = async () => {
    if (loading) return;

    try {
      setLoading(true);

      const data = new FormData();

      data.append("title", formData.title);
      data.append("subtitle", formData.subtitle || "");
      data.append("content", formData.description);
      data.append("price", String(Number(formData.price || 0)));
      data.append("product_condition", formData.status || "new");
      data.append("category_ids", JSON.stringify(formData.categories));
      data.append("subject_ids", JSON.stringify(formData.subjects));

      formData.images.forEach((img, index) => {
        data.append("images", {
          uri: img.uri,
          name: img.name || `image_${index}.jpg`,
          type: img.type || "image/jpeg",
        } as any);
      });

      const response = await api.post("/posts", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 40000,
      });

      console.log("=== CREATE POST SUCCESS ===");
      console.log("Status:", response.status);
      console.log("Data:", response.data);

      alert("Tạo bài viết thành công!");
      resetForm();
    } catch (error: any) {
      console.log("=== CREATE POST ERROR ===");

      if (error.response) {
        alert(
          error.response.data?.message ||
            "Dữ liệu không hợp lệ, vui lòng kiểm tra lại"
        );
      } else {
        alert(
          "Không thể kết nối tới server.\nVui lòng kiểm tra mạng và thử lại."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (id: number) =>
    categories.find((c) => c.id === id)?.label ||
    subjects.find((s) => s.id === id)?.label ||
    id;

  const getSubjectLabel = (id: number) =>
    subjects.find((s) => s.id === id)?.label ||
    categories.find((c) => c.id === id)?.label ||
    id;

  const insets = useSafeAreaInsets();

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert("Cần quyền truy cập thư viện ảnh");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const images = result.assets.map((asset, index) => ({
        uri: asset.uri,
        name: `image_${Date.now()}_${index}.jpg`,
        type: "image/jpeg",
      }));

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...images],
      }));
    }
  };

  /* ===================== UI PARTS ===================== */

  const renderStepIndicator = () => {
    const isFromStep2 = currentStep >= 2;
    const isLastStep = currentStep === TOTAL_STEP - 1;

    return (
      <View className="px-5 mb-6">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity
            onPress={resetForm}
            className="px-6 py-2 rounded-full bg-orange-300"
          >
            <Text className="text-white font-semibold">Hủy</Text>
          </TouchableOpacity>

          {isFromStep2 && (
            <TouchableOpacity
              onPress={() => setCurrentStep((p) => p - 1)}
              className="px-6 py-2 rounded-full border border-gray-300 mx-3"
            >
              <Text className="text-gray-400 font-semibold">Trở lại</Text>
            </TouchableOpacity>
          )}

          <View className="flex-1" />

          <TouchableOpacity
            onPress={() =>
              isLastStep ? submitPost() : setCurrentStep((p) => p + 1)
            }
            className="px-6 py-2 rounded-full border-2 border-orange-500"
          >
            <Text className="text-orange-400 font-semibold">
              {isLastStep ? "Đăng bài" : "Tiếp theo"}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center">
          <Text className="w-12 text-lg font-semibold">
            {progress.toFixed(0)}%
          </Text>
          <View className="flex-1 h-3 bg-gray-200 rounded-full ml-2">
            <View
              className="h-full bg-orange-500"
              style={{ width: `${progress}%` }}
            />
          </View>
        </View>
      </View>
    );
  };

  const renderStep1 = () => (
    <ScrollView className="flex-1 px-5 ">
      <Text className="text-2xl font-bold text-orange-400 text-center mb-6">
        Chọn phân loại cho sản phẩm của bạn
      </Text>

      <View className="bg-white rounded-2xl p-5 shadow-xl mb-6 border border-orange-400">
        <Text className="text-lg font-bold mb-4">Danh mục</Text>
        <View className="flex-row flex-wrap">
          {categories.map((cat) => (
            <CheckboxItem
              key={cat.id}
              label={cat.label}
              checked={formData.categories.includes(cat.id)}
              onPress={() => toggleSelection("categories", cat.id)}
            />
          ))}
        </View>

        <Text className="text-lg font-bold mb-4 mt-4">Môn học</Text>
        <View className="flex-row flex-wrap">
          {subjects.map((subj) => (
            <CheckboxItem
              key={subj.id}
              label={subj.label}
              checked={formData.subjects.includes(subj.id)}
              onPress={() => toggleSelection("subjects", subj.id)}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <KeyboardAwareScrollView
      enableOnAndroid
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        paddingBottom: keyboardHeight > 0 ? keyboardHeight : 0,
      }}
      className="px-5"
    >
      <Text className="text-2xl font-bold text-orange-400 text-center mb-6 px-5">
        Mô tả cho bài viết
      </Text>

      <Text className="text-base font-semibold mb-2">Tiêu đề của bài viết</Text>
      <TextInput
        className="bg-white border border-gray-300 rounded-lg px-4 py-3 mb-4"
        placeholder="VD: Combo 3 đại cương"
        placeholderTextColor={"#9CA3AF"}
        value={formData.title}
        onChangeText={(text) =>
          setFormData((prev) => ({ ...prev, title: text }))
        }
      />

      <Text className="text-base font-semibold mb-2">Tiêu đề nhỏ</Text>
      <TextInput
        className="bg-white border border-gray-300 rounded-lg px-4 py-3 mb-4"
        placeholder="VD: Bài tập Vật lý 1 + Giải tích 1..."
        placeholderTextColor={"#9CA3AF"}
        value={formData.subtitle}
        onChangeText={(text) =>
          setFormData((prev) => ({ ...prev, subtitle: text }))
        }
      />

      <Text className="text-base font-semibold mb-2">Tình trạng</Text>

      <View className="bg-white border border-gray-300 rounded-lg mb-4 overflow-hidden">
        <Picker
          selectedValue={formData.status}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, status: value }))
          }
        >
          <Picker.Item label="Mới" value="new" />
          <Picker.Item label="Gần như mới" value="like_new" />
          <Picker.Item label="Cũ" value="used" />
        </Picker>
      </View>

      <Text className="text-base font-semibold mb-2">Mô tả</Text>
      <TextInput
        className="bg-white border border-gray-300 rounded-lg px-4 py-3 mb-4 h-32"
        placeholder="VD: [ Góc pass tài liệu] Mình có mấy cuốn sách hiện đang không còn sử dụng nữa nên muốn pass lại à"
        value={formData.description}
        placeholderTextColor={"#9CA3AF"}
        onChangeText={(text) =>
          setFormData((prev) => ({ ...prev, description: text }))
        }
        multiline
        textAlignVertical="top"
      />

      <Text className="text-base font-semibold mb-2">Giá tiền</Text>
      <View className="flex-row items-center mb-6">
        <TextInput
          className="bg-white border border-gray-300 rounded-lg px-4 py-3 flex-1"
          value={formData.price}
          placeholder="140000"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
          onChangeText={(text) =>
            setFormData((prev) => ({
              ...prev,
              price: text.replace(/[^0-9]/g, ""), // chỉ cho nhập số
            }))
          }
        />

        {/* Giảm */}
        <TouchableOpacity
          className="ml-2 bg-orange-100 p-3 rounded-lg"
          onPress={() =>
            setFormData((prev) => {
              const value = Math.max(0, Number(prev.price || 0) - 1000);
              return { ...prev, price: String(value) };
            })
          }
        >
          <Text className="text-orange-400 text-xl">−</Text>
        </TouchableOpacity>

        {/* Tăng */}
        <TouchableOpacity
          className="ml-2 bg-orange-100 p-3 rounded-lg"
          onPress={() =>
            setFormData((prev) => {
              const value = Number(prev.price || 0) + 1000;
              return { ...prev, price: String(value) };
            })
          }
        >
          <Text className="text-orange-400 text-xl">+</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );

  const renderStep3 = () => (
    <ScrollView className="flex-1 px-5">
      <Text className="text-xl font-bold text-orange-400 text-center mb-6">
        Chọn hình ảnh cho sản phẩm
      </Text>

      {/* Grid ảnh */}
      <View className="flex-row flex-wrap">
        {formData.images.map((img, idx) => (
          <View key={idx} className="w-1/3 p-1">
            <Image
              source={{ uri: img.uri }}
              className="w-full h-32 rounded-xl"
            />
          </View>
        ))}

        <TouchableOpacity onPress={pickImages} className="w-1/3 p-1">
          <View className="h-32 rounded-xl border-2 border-dashed border-orange-400 items-center justify-center">
            <Text className="text-4xl text-orange-400">+</Text>
            <Text className="text-orange-400 text-xs mt-1">Thêm ảnh</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const classificationNames: string[] = [
    ...formData.categories.map((c) => getCategoryLabel(c).toString()),
    ...formData.subjects.map((s) => getSubjectLabel(s).toString()),
  ];
  const renderStep4 = () => (
    <ScrollView className="flex-1 px-5">
      <Text className="text-xl font-bold text-orange-400 text-center mb-6">
        Xem lại trước khi đăng
      </Text>

      {/* ===== ẢNH ===== */}
      <View className="mb-6">
        {formData.images.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          >
            {formData.images.map((img, idx) => (
              <Image
                key={idx}
                source={{ uri: img.uri }}
                className="w-[90vw] h-56 rounded-2xl mr-3"
              />
            ))}
          </ScrollView>
        ) : (
          <View className="h-56 bg-gray-200 rounded-2xl items-center justify-center">
            <Text className="text-gray-400">Chưa có ảnh</Text>
          </View>
        )}
      </View>

      {/* ===== GIÁ + TÌNH TRẠNG ===== */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-gray-600">
          Tình trạng:{" "}
          <Text className="font-semibold">
            {formData.status || "Chưa chọn"}
          </Text>
        </Text>

        <View className="bg-orange-500 px-4 py-2 rounded-full">
          <Text className="text-white font-bold">
            {formData.price || "0"} VND
          </Text>
        </View>
      </View>

      {/* ===== TIÊU ĐỀ ===== */}
      <Text className="text-lg font-bold text-orange-500 mb-1">
        {formData.title || "Chưa có tiêu đề"}
      </Text>

      <Text className="text-gray-600 mb-4">
        {formData.subtitle || "Chưa có tiêu đề phụ"}
      </Text>

      {/* ===== MÔ TẢ ===== */}
      <View className="border-t border-gray-200 pt-4 mb-4">
        <Text className="font-bold mb-2">Mô tả</Text>
        <Text className="text-gray-700 leading-5">
          {formData.description || "Chưa có mô tả"}
        </Text>
      </View>

      {/* ===== PHÂN LOẠI ===== */}

      <View className="border-t border-gray-200 pt-4 mb-10">
        <Text className="font-bold mb-2">Phân loại</Text>

        <View className="flex-row flex-wrap">
          {classificationNames.length > 0 ? (
            classificationNames.map((name, index) => (
              <View
                key={index}
                className="bg-orange-100 px-4 py-2 rounded-full mr-2 mb-2"
              >
                <Text className="text-orange-500 font-medium">{name}</Text>
              </View>
            ))
          ) : (
            <Text className="text-gray-400">Chưa chọn phân loại</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#ff6a00" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {renderStepIndicator()}

      <View className="flex-1">
        {currentStep === 0 && renderStep1()}
        {currentStep === 1 && renderStep2()}
        {currentStep === 2 && renderStep3()}
        {currentStep === 3 && renderStep4()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});

export default CreatePostPage;
