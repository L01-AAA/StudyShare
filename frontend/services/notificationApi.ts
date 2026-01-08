import api from "./api";
import * as SecureStore from "expo-secure-store";

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  referenceId?: number;
  isRead: boolean;
  createdAt: string;
}

interface BackendNotification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  reference_id: number | null;
  is_read: boolean;
  created_at: string;
}

// Fetch notifications
export const getNotifications = async (
  limit: number = 20,
  skip: number = 0,
  unreadOnly: boolean = false
): Promise<Notification[]> => {
  try {
    const response = await api.get<BackendNotification[]>(
      `/notifications?limit=${limit}&skip=${skip}&unread_only=${unreadOnly}`
    );

    if (!Array.isArray(response.data)) {
      console.error("Invalid notifications response:", response.data);
      return [];
    }

    return response.data.map((notif) => ({
      id: notif.id,
      userId: notif.user_id,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      referenceId: notif.reference_id || undefined,
      isRead: notif.is_read,
      createdAt: notif.created_at,
    }));
  } catch (error: any) {
    console.error("Error fetching notifications:", error.message);
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
    }
    throw error;
  }
};

// Get unread count
export const getUnreadNotificationCount = async (): Promise<number> => {
  try {
    const response = await api.get<{ count: number }>(
      "/notifications/unread-count"
    );
    return response.data.count || 0;
  } catch (error: any) {
    console.error("Error fetching unread count:", error.message);
    return 0;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (
  notificationId: number
): Promise<void> => {
  try {
    await api.put(`/notifications/${notificationId}/read`);
  } catch (error: any) {
    console.error("Error marking notification as read:", error.message);
    throw error;
  }
};

// Mark all as read
export const markAllNotificationsAsRead = async (): Promise<void> => {
  try {
    await api.put("/notifications/read-all");
  } catch (error: any) {
    console.error("Error marking all notifications as read:", error.message);
    throw error;
  }
};
