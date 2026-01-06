// app/(main)/_layout.tsx
import CustomHeadBar from "@/components/CustomHeadBar";
import CustomTabBar from "@/components/CustomTabBar";
import { UserProvider } from "@/components/UserContext";
import { Tabs } from "expo-router";

export default function MainLayout() {
  return (
    <UserProvider>
      <Tabs
        screenOptions={{
          header: () => <CustomHeadBar />,
        }}
        tabBar={(props) => <CustomTabBar {...props} />}
      >
      </Tabs>
    </UserProvider>
  );
}