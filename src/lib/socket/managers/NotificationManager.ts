/**
 * Notification Manager
 * Enterprise-grade user notification and toast management
 */

import { toast } from "sonner";
import Logger from "../utils/Logger";

export interface NotificationOptions {
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export type NotificationType = "info" | "success" | "warning" | "error";

/**
 * Manages user notifications and toast messages
 */
export class NotificationManager {
  private logger: Logger;
  private activeToasts: Map<string, string | number> = new Map();
  private notificationHistory: Array<{
    type: NotificationType;
    options: NotificationOptions;
    timestamp: number;
  }> = [];
  private readonly MAX_HISTORY = 50;

  constructor(logger: Logger) {
    this.logger = logger;
    this.logger.debug("NotificationManager initialized");
  }

  /**
   * Show connection error notification
   */
  showConnectionError(title: string, description: string): void {
    this.dismissConnectionToast();

    const toastId = toast.error(title, { description });
    this.activeToasts.set("connection", toastId);

    this.recordNotification("error", title, description);
    this.logger.debug("Connection error notification shown", {
      title,
      description,
    });
  }

  /**
   * Show connection success notification
   */
  showConnectionSuccess(title: string, description?: string): void {
    this.dismissConnectionToast();

    const toastOptions: any = {};
    if (description !== undefined) {
      toastOptions.description = description;
    }
    const toastId = toast.success(title, toastOptions);
    this.activeToasts.set("connection", toastId);

    this.recordNotification("success", title, description);
    this.logger.debug("Connection success notification shown", {
      title,
      description,
    });
  }

  /**
   * Show connection info notification
   */
  showConnectionInfo(title: string, description?: string): void {
    this.dismissConnectionToast();

    const toastOptions: any = {};
    if (description !== undefined) {
      toastOptions.description = description;
    }
    const toastId = toast.info(title, toastOptions);
    this.activeToasts.set("connection", toastId);

    this.recordNotification("info", title, description);
    this.logger.debug("Connection info notification shown", {
      title,
      description,
    });
  }

  /**
   * Show reconnecting notification
   */
  showReconnecting(attemptNumber: number, maxAttempts: number): void {
    this.dismissConnectionToast();

    const toastId = toast.loading(
      `Reconnecting (${attemptNumber}/${maxAttempts})...`,
      {
        description: "Attempting to restore connection",
      }
    );
    this.activeToasts.set("connection", toastId);

    this.recordNotification(
      "info",
      "Reconnecting",
      `Attempt ${attemptNumber}/${maxAttempts}`
    );
  }

  /**
   * Show session expired notification
   */
  showSessionExpired(reason: string, displayMessage?: string): void {
    // Don't show on login page
    if (this.isOnLoginPage()) {
      return;
    }

    const isLoggedInElsewhere = reason === "LOGGED_IN_ELSEWHERE";
    const description =
      displayMessage ||
      (isLoggedInElsewhere
        ? "You have been logged out"
        : "Your session has expired and could not be refreshed");

    const title = isLoggedInElsewhere
      ? "Logged in from another device"
      : "Session Expired";

    if (isLoggedInElsewhere) {
      toast.error(title, { description });
    } else {
      toast.error(title, { description });
    }

    this.recordNotification("error", title, displayMessage);

    this.logger.debug("Session expired notification shown", {
      reason,
      displayMessage,
    });
  }

  /**
   * Show token refresh error notification
   */
  showTokenRefreshError(error?: string): void {
    if (this.isOnLoginPage()) {
      return;
    }

    const description =
      error || "Your session has expired. Please log in again.";
    toast.error("Session Expired", { description });

    this.recordNotification("error", "Session Expired", error);

    this.logger.debug("Token refresh error notification shown", { error });
  }

  /**
   * Show generic notification
   */
  show(type: NotificationType, options: NotificationOptions): string | number {
    let toastId: string | number;

    const toastOptions: any = {};
    if (options.description !== undefined) {
      toastOptions.description = options.description;
    }
    if (options.duration !== undefined) {
      toastOptions.duration = options.duration;
    }
    if (options.action !== undefined) {
      toastOptions.action = options.action;
    }

    switch (type) {
      case "success":
        toastId = toast.success(options.title, toastOptions);
        break;
      case "error":
        toastId = toast.error(options.title, toastOptions);
        break;
      case "warning":
        toastId = toast.warning(options.title, toastOptions);
        break;
      case "info":
      default:
        toastId = toast.info(options.title, toastOptions);
        break;
    }

    this.recordNotification(type, options.title, options.description);
    this.logger.debug("Notification shown", { type, options });

    return toastId;
  }

  /**
   * Dismiss connection toast
   */
  dismissConnectionToast(): void {
    const toastId = this.activeToasts.get("connection");
    if (toastId !== undefined) {
      try {
        toast.dismiss(toastId);
        this.activeToasts.delete("connection");
        this.logger.debug("Connection toast dismissed");
      } catch (error: unknown) {
        this.logger.error("Failed to dismiss connection toast", error);
      }
    }
  }

  /**
   * Dismiss specific toast
   */
  dismiss(toastId: string | number): void {
    try {
      toast.dismiss(toastId);
      this.logger.debug("Toast dismissed", { toastId });
    } catch (error: unknown) {
      this.logger.error("Failed to dismiss toast", { toastId, error });
    }
  }

  /**
   * Dismiss all toasts
   */
  dismissAll(): void {
    try {
      toast.dismiss();
      this.activeToasts.clear();
      this.logger.debug("All toasts dismissed");
    } catch (error: unknown) {
      this.logger.error("Failed to dismiss all toasts", error);
    }
  }

  /**
   * Record notification in history
   */
  private recordNotification(
    type: NotificationType,
    title: string,
    description?: string
  ): void {
    this.notificationHistory.push({
      type,
      options: { title, ...(description !== undefined && { description }) },
      timestamp: Date.now(),
    });

    // Maintain history size
    if (this.notificationHistory.length > this.MAX_HISTORY) {
      this.notificationHistory.shift();
    }
  }

  /**
   * Get notification history
   */
  getHistory(): Array<{
    type: NotificationType;
    options: NotificationOptions;
    timestamp: number;
  }> {
    return [...this.notificationHistory];
  }

  /**
   * Get notification statistics
   */
  getStats(): {
    total: number;
    byType: Record<NotificationType, number>;
    recent: number;
  } {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;

    const byType: Record<NotificationType, number> = {
      info: 0,
      success: 0,
      warning: 0,
      error: 0,
    };

    let recent = 0;

    for (const notification of this.notificationHistory) {
      byType[notification.type]++;

      if (notification.timestamp >= fiveMinutesAgo) {
        recent++;
      }
    }

    return {
      total: this.notificationHistory.length,
      byType,
      recent,
    };
  }

  /**
   * Check if on login page
   */
  private isOnLoginPage(): boolean {
    return (
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/login")
    );
  }

  /**
   * Clear notification history
   */
  clearHistory(): void {
    this.notificationHistory = [];
    this.logger.debug("Notification history cleared");
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.dismissAll();
    this.notificationHistory = [];
    this.logger.debug("NotificationManager cleaned up");
  }
}

export default NotificationManager;
