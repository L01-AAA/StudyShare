import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function Login() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  return (
    <View className="flex-1 bg-white px-6">
      <View className="items-center mt-12">
        <Image
          source={require("../assets/images/logo.png")}
          className="w-60 h-60"
          resizeMode="contain"
        />
      </View>

      <Text className="text-4xl font-roboto-bold text-center mb-5">
        Chào mừng trở lại
      </Text>

      <Text className="text-l text-center font-roboto-medium text-neutral-800 mt-2">
        Tiếp tục với tài khoản Google hoặc đăng nhập tài khoản
      </Text>

      <TouchableOpacity className="border border-primary-400 py-3 mt-10 rounded-xl flex-row items-center justify-center gap-3">
        <Image
          source={require("../assets/images/google-logo.png")}
          className="w-5 h-5"
          resizeMode="contain"
        />
        <Text className="text-base font-medium text-neutral-700">
          Tiếp tục với Google
        </Text>
      </TouchableOpacity>

      <View className="flex-row items-center my-6">
        <View className="flex-1 h-[1px] bg-gray-200" />
        <Text className="mx-2 text-gray-400">Hoặc</Text>
        <View className="flex-1 h-[1px] bg-gray-200" />
      </View>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#aaa"
        className="border border-gray-300 h-12 rounded-xl px-4 mb-3"
      />

      <View className="border border-gray-300 h-12 rounded-xl px-4 flex-row items-center">
        <TextInput
          placeholder="Mật khẩu"
          placeholderTextColor="#aaa"
          secureTextEntry={!showPassword}
          className="flex-1"
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={22}
            color="#888"
          />
        </TouchableOpacity>
      </View>

      <View className="flex-row justify-between items-center mt-4">
        <TouchableOpacity
          className="flex-row items-center"
          onPress={() => setRemember(!remember)}
        >
          <View
            className={`w-5 h-5 rounded border mr-2 items-center justify-center
    ${remember ? "bg-primary-400 border-primary-400" : "border-primary-400"}
  `}
          >
            {remember && <Ionicons name="checkmark" size={14} color="white" />}
          </View>

          <Text>Nhớ mật khẩu</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text className="text-primary-400 font-medium">Quên mật khẩu</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 justify-end pb-10 mb-10">
        <TouchableOpacity
          className="bg-black h-12 rounded-xl items-center justify-center mt-6"
          onPress={() => router.push("/")}
        >
          <Text className="text-white text-lg font-semibold">Đăng nhập</Text>
        </TouchableOpacity>

        <View className="flex-row justify-center mt-6">
          <Text>Bạn chưa có tài khoản? </Text>
          <TouchableOpacity
            onPress={() => router.push({ pathname: "/register" } as any)}
          >
            <Text className="text-primary-400 font-semibold">Tạo tài khoản</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
