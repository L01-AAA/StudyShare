// app/(main)/_layout.tsx
import CustomHeadBar from "@/components/CustomHeadBar";
import { UserProvider } from "@/components/UserContext";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function MainLayout() {
  return (
    <UserProvider>
        <StatusBar style="dark" backgroundColor="#FFFFFF" />

        <Stack
          screenOptions={{
            header: () => <CustomHeadBar />,
          }}
        />
    </UserProvider>
  );
}