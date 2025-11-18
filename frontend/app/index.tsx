import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [hasSeen, setHasSeen] = useState(false);

  useEffect(() => {
    async function checkOnboarding() {
      const value = await AsyncStorage.getItem("hasSeenOnboarding");
      setHasSeen(value === "true");
      setLoading(false);
    }
    checkOnboarding();
  }, []);

  if (loading) return null; 

  if (hasSeen) return <Redirect href="/login" />;

  return <Redirect href="/(onboarding)" />;

}
