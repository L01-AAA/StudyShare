import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ChangePasswordPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Calculate progress
  const progress = step === 1 ? 0 : 50;

  const verifyOldPassword = async () => {
    if (!oldPassword.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập mật khẩu cũ");
      return;
    }

    try {
      setIsLoading(true);

    //   const response = await fetch("YOUR_API_ENDPOINT/verify-password", {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       oldPassword: oldPassword,
    //     }),
    //   });

      await new Promise((resolve) => setTimeout(resolve, 1500));

      const isValid = true;

      if (isValid) {
        setStep(2);
      } else {
        Alert.alert("Lỗi", "Mật khẩu cũ không chính xác");
      }
    } catch (error) {
      console.log("Error verifying password:", error);
      Alert.alert("Lỗi", "Không thể xác thực mật khẩu. Vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập mật khẩu mới");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (!confirmPassword.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập lại mật khẩu mới");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp");
      return;
    }

    if (newPassword === oldPassword) {
      Alert.alert("Lỗi", "Mật khẩu mới không được trùng với mật khẩu cũ");
      return;
    }

    try {
      setIsLoading(true);

    //   const response = await fetch("YOUR_API_ENDPOINT/change-password", {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       oldPassword: oldPassword,
    //       newPassword: newPassword,
    //     }),
    //   });

      await new Promise((resolve) => setTimeout(resolve, 1500));

      Alert.alert("Thành công", "Đổi mật khẩu thành công", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.log("Error changing password:", error);
      Alert.alert("Lỗi", "Không thể đổi mật khẩu. Vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <View className="px-5 py-4">
        <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <View
            className="h-full bg-[#ff6a00] rounded-full"
            style={{ width: `${progress}%` }}
          />
        </View>
        <Text className="text-right text-sm text-gray-600 mt-2">
          {progress}%
        </Text>
      </View>

      {/* Content */}
      <View className="flex-1 px-5 pt-6">
        {step === 1 ? (
          // Step 1: Verify Old Password
          <>
            <View className="mb-6">
              <View className="relative">
                <TextInput
                  className="h-14 border border-gray-300 rounded-xl px-4 pr-12 text-base text-gray-800"
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  placeholder="Mật khẩu cũ"
                  placeholderTextColor="#999"
                  secureTextEntry={!showOldPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  className="absolute right-4 top-0 h-14 justify-center"
                  onPress={() => setShowOldPassword(!showOldPassword)}
                >
                  <Ionicons
                    name={showOldPassword ? "eye-off" : "eye"}
                    size={24}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              className="h-14 bg-[#ff6a00] rounded-xl items-center justify-center"
              onPress={verifyOldPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-base font-semibold text-white">
                  Tiếp theo
                </Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          // Step 2: Enter New Password
          <>
            <View className="mb-4">
              <View className="relative">
                <TextInput
                  className="h-14 border border-gray-300 rounded-xl px-4 pr-12 text-base text-gray-800"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Mật khẩu mới"
                  placeholderTextColor="#999"
                  secureTextEntry={!showNewPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  className="absolute right-4 top-0 h-14 justify-center"
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Ionicons
                    name={showNewPassword ? "eye-off" : "eye"}
                    size={24}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View className="mb-6">
              <View className="relative">
                <TextInput
                  className="h-14 border border-gray-300 rounded-xl px-4 pr-12 text-base text-gray-800"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Nhập lại mật khẩu"
                  placeholderTextColor="#999"
                  secureTextEntry={!showConfirmPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  className="absolute right-4 top-0 h-14 justify-center"
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={24}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              className="h-14 bg-[#ff6a00] rounded-xl items-center justify-center"
              onPress={handleChangePassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-base font-semibold text-white">
                  Thay đổi mật khẩu
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}