"use client";

import React from "react";
import { Check, CheckCheck, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MessageStatusProps {
  isDelivered?: boolean;
  isRead?: boolean;
  isSending?: boolean;
  isFailed?: boolean;
  deliveredAt?: string | null;
  readAt?: string | null;
  showTimestamp?: boolean;
  className?: string;
}

/**
 * Simplified 2-state message status indicator
 * - Single checkmark (gray) = Delivered
 * - Double checkmark (blue) = Read
 */
export const MessageStatus: React.FC<MessageStatusProps> = ({
  isDelivered = false,
  isRead = false,
  isSending = false,
  isFailed = false,
  deliveredAt,
  readAt,
  showTimestamp = false,
  className,
}) => {
  // Determine the status and icon to show (sending -> failed -> delivered -> read)
  const getStatusInfo = () => {
    if (isFailed) {
      return {
        icon: <AlertCircle className="h-3 w-3" />,
        color: "text-red-500",
        status: "Failed",
        timestamp: null,
      };
    } else if (isSending) {
      return {
        icon: <Clock className="h-3 w-3" />,
        color: "text-gray-400",
        status: "Sending",
        timestamp: null,
      };
    } else if (isRead) {
      return {
        icon: <CheckCheck className="h-3 w-3" />,
        color: "text-blue-500",
        status: "Read",
        timestamp: readAt,
      };
    } else if (isDelivered) {
      return {
        icon: <Check className="h-3 w-3" />,
        color: "text-gray-400",
        status: "Delivered",
        timestamp: deliveredAt,
      };
    } else {
      return {
        icon: <Check className="h-3 w-3" />,
        color: "text-gray-300",
        status: "Sent",
        timestamp: null,
      };
    }
  };

  const statusInfo = getStatusInfo();

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return "";
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        // Show time for today
        return date.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } else {
        // Show date for older messages
        return date.toLocaleDateString([], { 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
    } catch {
      return "";
    }
  };

  return (
    <div className={cn("flex items-center gap-1 text-xs", className)}>
      <span className={cn("flex-shrink-0", statusInfo.color)}>
        {statusInfo.icon}
      </span>
      {showTimestamp && statusInfo.timestamp && (
        <span className="text-gray-500 text-xs">
          {formatTimestamp(statusInfo.timestamp)}
        </span>
      )}
      {/* Tooltip for accessibility */}
      <span className="sr-only">
        {statusInfo.status}
        {statusInfo.timestamp && ` at ${formatTimestamp(statusInfo.timestamp)}`}
      </span>
    </div>
  );
};

export default MessageStatus;
