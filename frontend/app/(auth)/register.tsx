import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu không khớp");
      return;
    }

    try {
      setLoading(true);

      await api.post("/auth/register", {
        full_name: name.trim(),
        email: email.trim(),
        password: password,
        password_confirm: confirmPassword,
      });

      Alert.alert(
        "Thành công",
        "Đăng ký thành công. Vui lòng đăng nhập.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/login"),
          },
        ]
      );
    } catch (error: any) {
      console.log("Register error:", error);
      const message =
        error?.response?.data?.message ||
        "Đăng ký thất bại. Vui lòng thử lại.";

      Alert.alert("Thất bại", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <KeyboardAwareScrollView
        enableOnAndroid
        enableAutomaticScroll
        extraScrollHeight={200}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20 }}
      >
        <View className="items-center mt-12">
          <Image
            source={require("../../assets/images/logo.png")}
            className="w-60 h-60"
            resizeMode="contain"
          />
        </View>

        <Text className="text-4xl font-roboto-bold text-center mb-5">
          Xin chào, bắt đầu ngay
        </Text>

        <TextInput
          placeholder="Họ và tên"
          className="border border-gray-300 h-12 rounded-xl px-4 mb-3"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          placeholder="Email"
          className="border border-gray-300 h-12 rounded-xl px-4 mb-3"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <View className="border border-gray-300 h-12 rounded-xl px-4 flex-row items-center mb-3">
          <TextInput
            placeholder="Mật khẩu"
            secureTextEntry={!showPassword}
            className="flex-1"
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={22}
              color="#888"
            />
          </TouchableOpacity>
        </View>

        <View className="border border-gray-300 h-12 rounded-xl px-4 flex-row items-center">
          <TextInput
            placeholder="Nhập lại mật khẩu"
            secureTextEntry={!showPassword}
            className="flex-1"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={22}
              color="#888"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className={`h-12 rounded-xl items-center justify-center mt-6 ${
            loading ? "bg-gray-400" : "bg-black"
          }`}
          onPress={submit}
          disabled={loading}
        >
          <Text className="text-white text-lg font-semibold">
            {loading ? "Đang xử lý..." : "Đăng ký"}
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center mt-6 mb-10">
          <Text>Bạn đã có tài khoản? </Text>
          <TouchableOpacity onPress={() => router.replace("/login")}>
            <Text className="text-primary-400 font-semibold">
              Đăng nhập
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
