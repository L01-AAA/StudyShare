import React, {
  createContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import {
  Notification,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/services/notificationApi";

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;

  refreshNotifications: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: number) => void;
}

export const NotificationContext = createContext<
  NotificationContextType | undefined
>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * ✅ unreadCount derive từ notifications
   * → KHÔNG BAO GIỜ LỆCH
   */
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  /**
   * 🔁 Load / refresh từ REST
   * Chỉ dùng khi:
   * - App start
   * - User pull-to-refresh
   */
  const refreshNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getNotifications(50, 0, false);
      setNotifications(data);
    } catch (error) {
      console.error("[Notification] refresh failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 🔔 Add notification từ WebSocket
   * ❗ Không gọi REST
   */
  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => {
      // tránh duplicate (phòng backend resend)
      if (prev.some((n) => n.id === notification.id)) {
        return prev;
      }
      return [notification, ...prev];
    });
  }, []);

  /**
   * 👁️ Mark ONE as read
   * - Update backend
   * - Update local state nếu chưa read
   */
  const markAsRead = useCallback(async (id: number) => {
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === id);
      if (!target || target.isRead) return prev;

      return prev.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    });

    try {
      await markNotificationAsRead(id);
    } catch (error) {
      console.error("[Notification] markAsRead failed:", error);
      // optional rollback nếu cần
    }
  }, []);

  /**
   * 👁️ Mark ALL as read
   */
  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    try {
      await markAllNotificationsAsRead();
    } catch (error) {
      console.error("[Notification] markAllAsRead failed:", error);
    }
  }, []);

  /**
   * ❌ Remove notification (optional)
   */
  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  /**
   * 🚀 Load ban đầu
   */
  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refreshNotifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * ✅ Hook
 */
export const useNotifications = () => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  }
  return context;
};
