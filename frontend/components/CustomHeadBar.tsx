import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { useState } from "react";
import { Image, Modal, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUser } from "./UserContext";

interface CustomHeadBarProps {
  showBackButton?: boolean; 
}

export default function CustomHeadBar({
  showBackButton,
}: CustomHeadBarProps) {
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState(false);
  const { user, logout } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const routesWithBackButton = [
    "/(account)/accountpage",
    "/accountpage",
    "/change-password",
    "/settings",
  ];

  const shouldShowBackButton =
    showBackButton !== undefined
      ? showBackButton
      : routesWithBackButton.some((route) => pathname.includes(route));

  return (
    <>
      <View style={{ paddingTop: insets.top }} className="bg-white">
        <View className="h-20 flex-row items-center px-4">
          <View className="flex-1">
            {shouldShowBackButton && (
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-10 h-10 items-center justify-center"
              >
                <Ionicons name="chevron-back" size={28} color="#ff6a00" />
              </TouchableOpacity>
            )}
          </View>

          <View className="flex-2 items-center">
            <Text
              className="text-orange-500"
              style={{ fontFamily: "Roboto-Bold", fontSize: 30 }}
            >
              StudyShare
            </Text>
          </View>

          <View className="flex-1 items-end">
            <TouchableOpacity
              onPress={() => setMenuVisible(true)}
              className="flex-row items-center space-x-2"
            >
              <View className="relative">
                {user?.avatar ? (
                  <Image
                    source={{ uri: user.avatar }}
                    className="w-9 h-9 rounded-full border-2 border-orange-500"
                  />
                ) : (
                  <View className="w-9 h-9 rounded-full border-2 border-orange-500 items-center justify-center">
                    <Ionicons name="person" size={18} color="#ff6a00" />
                  </View>
                )}
                <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
          className="flex-1 bg-black/30"
        >
          <View
            style={{ top: insets.top}}
            className="absolute right-4 bg-white rounded-xl min-w-[200px] shadow-lg"
          >
            <TouchableOpacity
              onPress={() => {
                setMenuVisible(false);
                router.push("/(account)/accountpage");
              }}
              className="flex-row items-center px-4 py-3 space-x-3"
            >
              <Ionicons name="person-outline" size={20} color="#333" />
              <Text className="text-base font-medium text-gray-800">
                Tài khoản
              </Text>
            </TouchableOpacity>

            <View className="h-px bg-gray-200 mx-3" />

            <TouchableOpacity
              onPress={() => {
                setMenuVisible(false);
                logout();
              }}
              className="flex-row items-center px-4 py-3 space-x-3"
            >
              <Ionicons name="log-out-outline" size={20} color="#ff4444" />
              <Text className="text-base font-medium text-red-500">
                Đăng xuất
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}