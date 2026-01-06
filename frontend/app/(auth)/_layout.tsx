import { UserProvider } from "@/components/UserContext";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Roboto: require("../../assets/fonts/Roboto-Regular.ttf"),
    "Roboto-Medium": require("../../assets/fonts/Roboto-Medium.ttf"),
    "Roboto-SemiBold": require("../../assets/fonts/Roboto-SemiBold.ttf"),
    "Roboto-Bold": require("../../assets/fonts/Roboto-Bold.ttf"),
  });

  if (!fontsLoaded) {
    return (
      <View className="flex-1 justify-center items-center bg-neutral-100">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <UserProvider>
        <StatusBar style="dark" backgroundColor="#FFFFFF" />

        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
    </UserProvider>
  );
}
