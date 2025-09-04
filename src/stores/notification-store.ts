import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { useMemo } from "react";

// Types for notifications
export interface NotificationItem {
  id: string;
  type:
    | "message"
    | "mention"
    | "system"
    | "error"
    | "success"
    | "warning"
    | "info";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  conversationId?: string; // For message-related notifications
  userId?: string; // User who triggered the notification
  actionUrl?: string; // URL to navigate when clicked
  persistent?: boolean; // Whether notification should persist until manually dismissed
  autoHideDelay?: number; // Auto-hide delay in milliseconds (0 = no auto-hide)
  metadata?: Record<string, any>; // Additional data
}

export interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  desktopEnabled: boolean;
  messageNotifications: boolean;
  mentionNotifications: boolean;
  systemNotifications: boolean;
  doNotDisturbMode: boolean;
  doNotDisturbStart?: string; // Time in HH:MM format
  doNotDisturbEnd?: string; // Time in HH:MM format
}

export interface NotificationState {
  // All notifications
  notifications: NotificationItem[];

  // Unread notification count
  unreadCount: number;

  // Currently visible toast notifications
  activeToasts: Set<string>;

  // Notification settings
  settings: NotificationSettings;

  // Permission state for browser notifications
  browserPermission: NotificationPermission | null;

  // Last notification sound played (to prevent spam)
  lastSoundPlayed: number;
}

export interface NotificationActions {
  // Add a new notification
  addNotification: (
    notification: Omit<NotificationItem, "id" | "timestamp" | "read">
  ) => string;

  // Mark notification as read
  markAsRead: (notificationId: string) => void;

  // Mark all notifications as read
  markAllAsRead: () => void;

  // Remove a notification
  removeNotification: (notificationId: string) => void;

  // Clear all notifications
  clearAllNotifications: () => void;

  // Show toast notification
  showToast: (notificationId: string) => void;

  // Hide toast notification
  hideToast: (notificationId: string) => void;

  // Update notification settings
  updateSettings: (settings: Partial<NotificationSettings>) => void;

  // Request browser notification permission
  requestBrowserPermission: () => Promise<NotificationPermission>;

  // Show browser notification
  showBrowserNotification: (notification: NotificationItem) => void;

  // Play notification sound
  playNotificationSound: () => void;

  // Check if notifications should be shown (considering DND mode)
  shouldShowNotification: (type: NotificationItem["type"]) => boolean;

  // Get unread notifications
  getUnreadNotifications: () => NotificationItem[];

  // Get notifications by type
  getNotificationsByType: (
    type: NotificationItem["type"]
  ) => NotificationItem[];

  // Get recent notifications (last N)
  getRecentNotifications: (limit?: number) => NotificationItem[];
}

// Default notification settings
const defaultSettings: NotificationSettings = {
  enabled: true,
  soundEnabled: true,
  desktopEnabled: false, // Will be enabled after permission is granted
  messageNotifications: true,
  mentionNotifications: true,
  systemNotifications: true,
  doNotDisturbMode: false,
  doNotDisturbStart: "22:00",
  doNotDisturbEnd: "08:00",
};

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  activeToasts: new Set(),
  settings: defaultSettings,
  browserPermission: null,
  lastSoundPlayed: 0,
};

// Sound throttling - prevent playing sounds too frequently
const SOUND_THROTTLE_MS = 1000; // 1 second

// Helper function to check if current time is in DND period
const isInDoNotDisturbPeriod = (settings: NotificationSettings): boolean => {
  if (
    !settings.doNotDisturbMode ||
    !settings.doNotDisturbStart ||
    !settings.doNotDisturbEnd
  ) {
    return false;
  }

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [startHour, startMin] = settings.doNotDisturbStart
    .split(":")
    .map(Number);
  const [endHour, endMin] = settings.doNotDisturbEnd.split(":").map(Number);

  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  // Handle overnight DND period (e.g., 22:00 to 08:00)
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime <= endTime;
  }

  // Handle same-day DND period (e.g., 12:00 to 14:00)
  return currentTime >= startTime && currentTime <= endTime;
};

export const useNotificationStore = create<
  NotificationState & NotificationActions
>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        addNotification: (notificationData) => {
          const id = `notification-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          const notification: NotificationItem = {
            ...notificationData,
            id,
            timestamp: new Date().toISOString(),
            read: false,
          };

          set(
            (state) => ({
              notifications: [notification, ...state.notifications],
              unreadCount: state.unreadCount + 1,
            }),
            false,
            "addNotification"
          );

          // Show browser notification if enabled and permission granted
          const state = get();
          if (state.shouldShowNotification(notification.type)) {
            if (
              state.settings.desktopEnabled &&
              state.browserPermission === "granted"
            ) {
              state.showBrowserNotification(notification);
            }

            // Play sound if enabled
            if (state.settings.soundEnabled) {
              state.playNotificationSound();
            }
          }

          return id;
        },

        markAsRead: (notificationId) => {
          set(
            (state) => {
              const notification = state.notifications.find(
                (n) => n.id === notificationId
              );
              if (!notification || notification.read) return state;

              return {
                notifications: state.notifications.map((n) =>
                  n.id === notificationId ? { ...n, read: true } : n
                ),
                unreadCount: Math.max(0, state.unreadCount - 1),
              };
            },
            false,
            "markAsRead"
          );
        },

        markAllAsRead: () => {
          set(
            (state) => ({
              notifications: state.notifications.map((n) => ({
                ...n,
                read: true,
              })),
              unreadCount: 0,
            }),
            false,
            "markAllAsRead"
          );
        },

        removeNotification: (notificationId) => {
          set(
            (state) => {
              const notification = state.notifications.find(
                (n) => n.id === notificationId
              );
              const wasUnread = notification && !notification.read;

              return {
                notifications: state.notifications.filter(
                  (n) => n.id !== notificationId
                ),
                unreadCount: wasUnread
                  ? Math.max(0, state.unreadCount - 1)
                  : state.unreadCount,
                activeToasts: new Set(
                  [...state.activeToasts].filter((id) => id !== notificationId)
                ),
              };
            },
            false,
            "removeNotification"
          );
        },

        clearAllNotifications: () => {
          set(
            {
              notifications: [],
              unreadCount: 0,
              activeToasts: new Set(),
            },
            false,
            "clearAllNotifications"
          );
        },

        showToast: (notificationId) => {
          set(
            (state) => ({
              activeToasts: new Set([...state.activeToasts, notificationId]),
            }),
            false,
            "showToast"
          );
        },

        hideToast: (notificationId) => {
          set(
            (state) => ({
              activeToasts: new Set(
                [...state.activeToasts].filter((id) => id !== notificationId)
              ),
            }),
            false,
            "hideToast"
          );
        },

        updateSettings: (newSettings) => {
          set(
            (state) => ({
              settings: { ...state.settings, ...newSettings },
            }),
            false,
            "updateSettings"
          );
        },

        requestBrowserPermission: async () => {
          if (!("Notification" in window)) {
            return "denied";
          }

          const permission = await Notification.requestPermission();

          set(
            (state) => ({
              browserPermission: permission,
              settings: {
                ...state.settings,
                desktopEnabled:
                  permission === "granted"
                    ? state.settings.desktopEnabled
                    : false,
              },
            }),
            false,
            "requestBrowserPermission"
          );

          return permission;
        },

        showBrowserNotification: (notification) => {
          if (
            !("Notification" in window) ||
            Notification.permission !== "granted"
          ) {
            return;
          }

          const browserNotification = new Notification(notification.title, {
            body: notification.message,
            icon: "/favicon.ico", // You can customize this
            tag: notification.id,
            requireInteraction: notification.persistent,
          });

          // Handle notification click
          browserNotification.onclick = () => {
            window.focus();
            if (notification.actionUrl) {
              window.location.href = notification.actionUrl;
            }
            browserNotification.close();
          };

          // Auto-close after delay if not persistent
          if (!notification.persistent) {
            const delay = notification.autoHideDelay || 5000;
            setTimeout(() => {
              browserNotification.close();
            }, delay);
          }
        },

        playNotificationSound: () => {
          const state = get();
          const now = Date.now();

          // Throttle sound playing
          if (now - state.lastSoundPlayed < SOUND_THROTTLE_MS) {
            return;
          }

          try {
            // You can replace this with a custom sound file
            const audio = new Audio("/sounds/notification.mp3");
            audio.volume = 0.5;
            audio.play().catch(() => {
              // Ignore errors (e.g., user hasn't interacted with page yet)
            });

            set({ lastSoundPlayed: now }, false, "playNotificationSound");
          } catch (error) {
            // Ignore audio errors
          }
        },

        shouldShowNotification: (type) => {
          const state = get();

          if (!state.settings.enabled) return false;
          if (isInDoNotDisturbPeriod(state.settings)) return false;

          switch (type) {
            case "message":
              return state.settings.messageNotifications;
            case "mention":
              return state.settings.mentionNotifications;
            case "system":
            case "error":
            case "success":
            case "warning":
            case "info":
              return state.settings.systemNotifications;
            default:
              return true;
          }
        },

        getUnreadNotifications: () => {
          const state = get();
          return state.notifications.filter((n) => !n.read);
        },

        getNotificationsByType: (type) => {
          const state = get();
          return state.notifications.filter((n) => n.type === type);
        },

        getRecentNotifications: (limit = 10) => {
          const state = get();
          return state.notifications.slice(0, limit);
        },
      }),
      {
        name: "notification-store",
        // Only persist notifications and settings, not transient state
        partialize: (state) => ({
          notifications: state.notifications.slice(0, 100), // Keep only last 100 notifications
          unreadCount: state.unreadCount,
          settings: state.settings,
          browserPermission: state.browserPermission,
        }),
        // Reset transient state on rehydration
        onRehydrateStorage: () => (state) => {
          if (state) {
            state.activeToasts = new Set();
            state.lastSoundPlayed = 0;
          }
        },
      }
    ),
    { name: "Notifications" }
  )
);

// Selectors for better performance
export const useNotifications = (limit?: number) => {
  const notificationsRef = useNotificationStore((state) => state.notifications);
  return useMemo(
    () => (limit ? notificationsRef.slice(0, limit) : notificationsRef),
    [notificationsRef, limit]
  );
};

export const useUnreadNotificationCount = () =>
  useNotificationStore((state) => state.unreadCount);

export const useNotificationSettings = () =>
  useNotificationStore((state) => state.settings);

export const useActiveToasts = () => {
  const setRef = useNotificationStore((state) => state.activeToasts);
  return useMemo(() => Array.from(setRef), [setRef]);
};

export const useNotificationActions = () => {
  const addNotification = useNotificationStore(
    (state) => state.addNotification
  );
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const removeNotification = useNotificationStore(
    (state) => state.removeNotification
  );
  const clearAllNotifications = useNotificationStore(
    (state) => state.clearAllNotifications
  );
  const showToast = useNotificationStore((state) => state.showToast);
  const hideToast = useNotificationStore((state) => state.hideToast);
  const updateSettings = useNotificationStore((state) => state.updateSettings);
  const requestBrowserPermission = useNotificationStore(
    (state) => state.requestBrowserPermission
  );

  return {
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    showToast,
    hideToast,
    updateSettings,
    requestBrowserPermission,
  };
};
