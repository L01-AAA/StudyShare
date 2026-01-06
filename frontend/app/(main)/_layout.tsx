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
        <Tabs.Screen 
          name="homepage"
          options={{ title: "Home" }}
        />
        <Tabs.Screen 
          name="searchpage"
          options={{ title: "Search" }}
        />
        <Tabs.Screen 
          name="createpostpage"
          options={{ title: "Create" }}
        />
        <Tabs.Screen 
          name="messagepage"
          options={{ title: "Messages" }}
        />
        <Tabs.Screen 
          name="profilepage"
          options={{ title: "Profile" }}
        />
      </Tabs>
    </UserProvider>
  );
}