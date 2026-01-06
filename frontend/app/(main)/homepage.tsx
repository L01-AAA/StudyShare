import React from 'react';
import {
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";

const HomePage = () => {
  const categories = [
    { id: 1, title: 'Sách bài tập', color: 'bg-yellow-700' },
    { id: 2, title: 'Sách giáo trình', color: 'bg-blue-500' },
    { id: 3, title: 'Slide bài giảng', color: 'bg-gray-100' },
    { id: 4, title: 'Sách thi nghiệm', color: 'bg-green-600' },
  ];

  const materials = [
    {
      id: 1,
      title: 'Slide bài giảng...',
      description: 'Tổng hợp slide bài giảng Giải Tích 1 – bản đẹp, đầy đủ chương',
      price: '0 VND',
      rating: 4,
      reviews: 12,
      imageColor: 'bg-white',
    },
    {
      id: 2,
      title: 'Giáo trình Xác suất...',
      description: 'Tài liệu Xác suất thống kê chính thống mới nhất của trường...',
      price: '40.000 VND',
      rating: 4,
      reviews: 24,
      imageColor: 'bg-blue-500',
    },
    {
      id: 3,
      title: 'BÀI TẬP\nVẬT LÝ ĐẠI CƯƠNG AI',
      description: '',
      price: '',
      rating: 0,
      reviews: 0,
      imageColor: 'bg-yellow-700',
    },
  ];

  const renderStars = (rating: number) => {
    return (
      <View className="flex-row">
        {[1, 2, 3, 4, 5].map((star) => (
          <Text key={star} className={star <= rating ? 'text-yellow-500' : 'text-gray-300'}>
            ★
          </Text>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View className="px-4 mb-6">
          <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-3">
            <TextInput
              placeholder="Tìm kiếm dụng cụ học tập, tài liệu,..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 ml-3 text-gray-600"
            />
          </View>
        </View>

        {/* Categories */}
        <View className="px-4 mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-4">Các danh mục</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((category) => (
              <TouchableOpacity key={category.id} className="mr-4">
                <View className={`w-32 h-32 ${category.color} rounded-full items-center justify-center mb-2`}>
                  <View className="w-20 h-20 bg-white/30 rounded-full" />
                </View>
                <Text className="text-center text-sm font-medium text-gray-900">
                  {category.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Materials */}
        <View className="px-4 pb-20">
          <Text className="text-2xl font-bold text-gray-900 mb-4">Học liệu</Text>
          <View className="flex-row flex-wrap justify-between">
            {materials.map((material, index) => (
              <TouchableOpacity
                key={material.id}
                className={`${index === 2 ? 'w-full' : 'w-[48%]'} mb-4`}
              >
                <View
                  className={`${material.imageColor} ${
                    index === 2 ? 'h-64' : 'h-48'
                  } rounded-2xl items-center justify-center mb-2 overflow-hidden`}
                >
                  {index === 0 && (
                    <View className="p-4">
                      <Text className="text-sm font-medium text-gray-700">
                        Đại học Quốc gia TPHCM
                      </Text>
                      <Text className="text-sm text-gray-600">
                        Trường Đại học Bách Khoa
                      </Text>
                      <Text className="text-sm text-gray-600 mb-4">
                        Bộ môn Toán Ứng dụng
                      </Text>
                      <Text className="text-xl font-bold text-center mb-4">
                        Bài Giảng Giải Tích 1
                      </Text>
                      <View className="items-center">
                        <View className="w-16 h-16 bg-blue-400 rounded-lg items-center justify-center">
                          <Text className="text-white font-bold text-xs">BK</Text>
                        </View>
                        <Text className="text-xs mt-2">ThS.Nguyễn Hữu Hiệp</Text>
                        <Text className="text-xs text-gray-500">
                          E-mail: nguyenhuuhiep@hcmut.edu.vn
                        </Text>
                      </View>
                    </View>
                  )}
                  {index === 1 && (
                    <View className="w-full h-full bg-gradient-to-b from-blue-400 to-blue-600 items-center justify-center p-4">
                      <View className="bg-white/20 w-full h-16 mb-4" />
                      <Text className="text-white text-2xl font-bold text-center">
                        GIÁO TRÌNH
                      </Text>
                      <Text className="text-yellow-300 text-xl font-bold text-center">
                        XÁC SUẤT VÀ THỐNG KÊ
                      </Text>
                    </View>
                  )}
                  {index === 2 && (
                    <View className="w-full h-full bg-gradient-to-b from-yellow-600 to-yellow-800 p-6">
                      <Text className="text-xs text-gray-800 mb-2">
                        NGUYỄN THỊ THÚY HẰNG, PHẠM THỊ BẢI MIÊN, PHAN NGỌC KHUÔNG CẦT
                      </Text>
                      <Text className="text-xs text-gray-800 mb-8">
                        NGUYỄN THỊ MINH HƯƠNG, NGUYỄN NHƯ SƠN THỦY, ÔNG SỸ HIẾU
                      </Text>
                      <Text className="text-3xl font-bold text-red-700 text-center mb-4">
                        BÀI TẬP
                      </Text>
                      <Text className="text-4xl font-bold text-red-700 text-center">
                        VẬT LÝ ĐẠI CƯƠNG AI
                      </Text>
                      <View className="mt-8 items-center">
                        <View className="border-t-2 border-orange-300 w-16 mb-2" />
                        <Text className="text-white text-xl">Y</Text>
                      </View>
                    </View>
                  )}
                </View>
                {index !== 2 && (
                  <View>
                    <Text className="text-base font-semibold text-gray-900 mb-1">
                      {material.title}
                    </Text>
                    <Text className="text-xs text-gray-600 mb-2" numberOfLines={2}>
                      {material.description}
                    </Text>
                    <Text className="text-sm font-bold text-gray-900 mb-1">
                      {material.price}
                    </Text>
                    {material.rating > 0 && (
                      <View className="flex-row items-center">
                        {renderStars(material.rating)}
                        <Text className="text-xs text-gray-500 ml-2">
                          {material.reviews}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomePage;