import { useUser } from "@/components/UserContext";
import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AccountPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, setUser, logout } = useUser();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    setName(user.full_name ?? "");
    setEmail(user.email ?? "");
    setAvatar(user.avatar_url ?? "");
  }, [user]);

  const hasChanges =
    name.trim() !== (user?.full_name ?? "") ||
    email.trim() !== (user?.email ?? "") ||
    avatar !== (user?.avatar_url ?? "");

  const getInitial = () =>
    name ? name.charAt(0).toUpperCase() : "A";

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleCancel = () => {
    if (!user) return;

    setName(user.full_name ?? "");
    setEmail(user.email ?? "");
    setAvatar(user.avatar_url ?? "");
  };

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập họ và tên");
      return;
    }

    try {
      setIsLoading(true);
      const result = await api.put("/users/me", {
        full_name: name.trim()
      });

      setUser({
        ...user!,
        full_name: name.trim(),
        email: email.trim(),
        avatar_url: avatar,
      });

      Alert.alert("Thành công", "Cập nhật thông tin thành công");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#ff6a00" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAwareScrollView
        enableOnAndroid
        enableAutomaticScroll
        extraScrollHeight={150}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{getInitial()}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.cameraButton}
              onPress={pickImage}
              disabled={isLoading}
            >
              <Ionicons name="image-outline" size={20} color="#ff6a00" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Form */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Họ và Tên</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            editable={!isLoading}
          />

          <Text style={[styles.label, { marginTop: 16 }]}>Email</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: "#f7f0edff",
                color: "#9CA3AF",
              },
            ]}
            value={email}
            editable={false}
          />

          <TouchableOpacity
            style={styles.changePasswordButton}
            onPress={() => router.push("/changepasswordpage")}
          >
            <Text style={styles.changePasswordText}>
              Thay đổi mật khẩu
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action buttons */}
        {hasChanges && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={isLoading}
            >
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleUpdateProfile}
              disabled={isLoading}
            >
              <Text style={styles.saveButtonText}>Lưu</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAwareScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#ff6a00" />
        ) : (
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={logout}
          >
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  avatarSection: { alignItems: "center", marginVertical: 32 },
  avatarContainer: { position: "relative" },
  avatar: { width: 160, height: 160, borderRadius: 80 },
  avatarPlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#e36c2f",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 56, fontWeight: "700", color: "#fff" },

  cameraButton: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#ff6a00",
    alignItems: "center",
    justifyContent: "center",
  },

  formSection: { paddingHorizontal: 24 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff1eb",
    borderWidth: 1,
    borderColor: "#ff6a00",
  },

  changePasswordButton: { marginTop: 20, alignSelf: "flex-end" },
  changePasswordText: { color: "#ff6a00", fontWeight: "600" },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },


  actionRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    marginTop: 24,
  },

  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#f2f2f2",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { fontWeight: "600", color: "#555" },

  saveButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#ff6a00",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },

  logoutButton: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ff4d4f",
    backgroundColor: "#fff1f0",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: { color: "#ff4d4f", fontSize: 16, fontWeight: "600" },
});
