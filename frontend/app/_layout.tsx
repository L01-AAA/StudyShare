import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { NotificationProvider } from "@/components/NotificationContext";
import { ChatStateProvider } from "../components/ChatStateContext";
// import GlobalWsListener from "@/components/GlobalWsListener";
// import { useEffect } from "react";
// import { connectWebSocket } from "@/services/messageApi";
import "./global.css";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Roboto: require("../assets/fonts/Roboto-Regular.ttf"),
    "Roboto-Medium": require("../assets/fonts/Roboto-Medium.ttf"),
    "Roboto-SemiBold": require("../assets/fonts/Roboto-SemiBold.ttf"),
    "Roboto-Bold": require("../assets/fonts/Roboto-Bold.ttf"),
  });

  // useEffect(() => {
  //   console.log("[App] Connecting GLOBAL WebSocket...");
  //   connectWebSocket("global"); // KHÔNG dùng conversationId nếu có WS global
  // }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <NotificationProvider>
      <ChatStateProvider>
        {/* <GlobalWsListener /> */}
        <Stack screenOptions={{ headerShown: false }} />
      </ChatStateProvider>
    </NotificationProvider>
  );
}
