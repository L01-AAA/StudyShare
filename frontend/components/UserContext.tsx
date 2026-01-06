import api from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) {
        setUserState(null);
        return;
      }

      const res = await api.get("/me");
      setUserState(res.data);
    } catch (error) {
      await SecureStore.deleteItemAsync("accessToken");
      setUserState(null);
    } finally {
      setIsLoading(false);
    }
  };

  const setUser = async (userData: User | null) => {
    try {
      if (userData) {
        await AsyncStorage.setItem("user", JSON.stringify(userData));
        setUserState(userData);
      } else {
        await AsyncStorage.removeItem("user");
        setUserState(null);
      }
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync("accessToken");
      await AsyncStorage.removeItem("user");
      setUserState(null);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}