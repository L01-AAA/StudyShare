import axios from "axios";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async config => {
  const token = await SecureStore.getItemAsync("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
   console.log("=== AXIOS REQUEST ===");
    console.log("Method:", config.method);
    console.log("Headers:", config.headers);
    console.log("Data:", config.data);

  return config;
});

api.interceptors.response.use(
  res => res,
  async error => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync("accessToken");

      router.replace("/login");
    }
    return Promise.reject(error);
  }
);

export default api;
