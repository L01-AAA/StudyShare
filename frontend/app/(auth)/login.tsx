import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import { ActivityIndicator, Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../../components/UserContext";

export default function Login() {
  const router = useRouter();
  const { setUser } = useUser(); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    try {
      if (!email || !password) {
        alert("Vui lòng nhập đầy đủ email và mật khẩu!");
        return;
      }
      setLoading(true);
      const result = await api.post("/auth/login", {
        email: email.trim(),
        password: password,
      });

      if (result.data && result.data.tokens) {
        await SecureStore.setItemAsync("accessToken", result.data.tokens.access_token);
        await SecureStore.setItemAsync("refreshToken", result.data.tokens.refresh_token);

        setUser({
          id: result.data.user.id,
          full_name: result.data.user.full_name || result.data.user.name,
          email: result.data.user.email,
          avatar_url: result.data.user.avatar_url,
        });

      }
        router.replace("/homepage");
    } catch (error) {
      console.log("Login error:", error);
      alert("Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAwareScrollView
        enableOnAndroid
        enableAutomaticScroll
        extraScrollHeight={150}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 bg-white px-6">
          <View className="items-center mt-12">
            <Image
              source={require("../../assets/images/logo.png")}
              className="w-60 h-60"
              resizeMode="contain"
            />
          </View>

          <Text className="text-4xl font-roboto-bold text-center mb-5">
            Chào mừng trở lại
          </Text>

          <TextInput
            placeholder="Email"
            placeholderTextColor="#aaa"
            className="border border-gray-300 h-12 rounded-xl px-4 mb-3"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View className="border border-gray-300 h-12 rounded-xl px-4 flex-row items-center">
            <TextInput
              placeholder="Mật khẩu"
              placeholderTextColor="#aaa"
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

          <View className="flex-row justify-between items-center mt-4">
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => setRemember(!remember)}
            >
              <View
                className={`w-5 h-5 rounded border mr-2 items-center justify-center ${
                  remember ? "bg-primary-400 border-primary-400" : "border-primary-400"
                }`}
              >
                {remember && (
                  <Ionicons name="checkmark" size={14} color="white" />
                )}
              </View>
              <Text>Nhớ mật khẩu</Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text className="text-primary-400 font-medium">
                Quên mật khẩu
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-1 justify-end">
            <TouchableOpacity
              className={`bg-black h-12 rounded-xl items-center justify-center mt-6 ${loading ? 'opacity-70' : ''}`}
              onPress={submit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-lg font-semibold">
                  Đăng nhập
                </Text>
              )}
            </TouchableOpacity>


            <View className="flex-row justify-center mt-6">
              <Text>Bạn chưa có tài khoản? </Text>
              <TouchableOpacity onPress={() => router.push("/register")}>
                <Text className="text-primary-400 font-semibold">
                  Tạo tài khoản
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}