/**
 * Unified Socket Event Definitions
 *
 * Single source of truth for all socket events
 * Shared between frontend and backend
 * Simplified and streamlined event definitions
 */

/**
 * Versioning for socket events
 */
export const SOCKET_EVENTS_VERSION = "2.0" as const;

// Base event response structure
export interface BaseEventResponse {
  success: boolean;
  message?: string;
  timestamp: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Success response
export interface SuccessResponse<T = any> extends BaseEventResponse {
  success: true;
  data: T;
}

// Error response
export interface ErrorResponse extends BaseEventResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// Message Events
export interface MessageSendPayload {
  recipientId: string;
  content: string;
  type?: "text" | "image" | "file" | "audio" | "video";
  replyToId?: string;
  conversationId?: string;
  tempId?: string;
}

export interface MessageSentResponse extends SuccessResponse {
  data: {
    message: Message;
    conversationId: string;
    isNewConversation: boolean;
    deliveryId: string;
  };
}

export interface MessageNewPayload {
  message: Message;
  conversationId: string;
  isNewConversation?: boolean;
}

export interface MessageReadPayload {
  messageId: string;
  conversationId: string;
  userId?: string;
  readAt?: string;
}

export interface MessageDeletePayload {
  messageId: string;
  conversationId: string;
}

// Conversation Events
export interface ConversationJoinPayload {
  conversationId: string;
}

export interface ConversationJoinedResponse extends SuccessResponse {
  data: {
    conversationId: string;
  };
}

export interface ConversationLeavePayload {
  conversationId: string;
}

export interface ConversationMessagesPayload {
  conversationId: string;
  page?: number;
  limit?: number;
}

// Typing Events
export interface TypingStartPayload {
  conversationId?: string;
  recipientId?: string;
}

export interface TypingStopPayload {
  conversationId?: string;
  recipientId?: string;
}

export interface TypingUserPayload {
  userId: string;
  username: string;
  conversationId: string;
  isTyping: boolean;
}

// Handshake & Auth Events
export interface HandshakeRequestPayload {
  timestamp: number;
  clientId: string;
  attempt?: number;
}

export interface HandshakeResponse extends SuccessResponse {
  data: {
    userId: string;
    username: string;
    serverTime: string;
    serverId: string;
  };
}

export interface ServerReadyPayload {
  timestamp: number;
  serverId: string;
  userId: string;
  handlersSetup: boolean;
}

export interface AuthErrorPayload {
  reason: string;
  code?: string;
  message?: string;
}

export interface SessionExpiredPayload {
  userId?: string;
  reason?: string;
  displayMessage?: string;
}

export interface SessionRecoveredPayload {
  userId: string;
  recoveredAt: string;
  tokenExpiresAt?: string;
}

// Presence / User Events
export interface OnlineUser {
  id: string;
  username: string;
  name: string;
  role: string;
  socketId: string;
  connectedAt: string;
  lastSeen?: string;
}

export interface OnlineUsersResponse extends SuccessResponse {
  data: {
    users: OnlineUser[];
  };
}

export interface UserOnlinePayload {
  user: OnlineUser;
  since: string;
}

export interface UserOfflinePayload {
  userId: string;
  lastSeen?: string;
}

// Health Events
export interface PingPayload {
  timestamp: number;
  clientId?: string;
}

export interface PongPayload {
  timestamp: number;
  serverTime: string;
}

// Data Models
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  type: "text" | "image" | "file" | "audio" | "video";
  reply_to_id?: string;
  sender_type?: "user" | "admin";
  is_read: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  timestamp?: string;
  read_at?: string;
  preview?: string;
  sender?: User;
  recipient?: User;
  replyTo?: Message;
}

// Frontend-specific types
export interface FrontendMessage extends Message {
  // CamelCase aliases for frontend convenience
  senderType?: "user" | "admin"; // alias for sender_type
  conversationId?: string; // alias for conversation_id
  senderId?: string; // alias for sender_id
  recipientId?: string; // alias for recipient_id
  replyToId?: string; // alias for reply_to_id
  isRead?: boolean; // alias for is_read
  isDeleted?: boolean; // alias for is_deleted
  createdAt?: string; // alias for created_at
  updatedAt?: string; // alias for updated_at
  readAt?: string; // alias for read_at

  // Frontend-specific properties
  tempId?: string;
  isSending?: boolean;
  sendError?: string;
  deliveryStatus?: "sending" | "sent" | "delivered" | "failed";
  isDelivered?: boolean;
  deliveredAt?: string;
}

export interface SocketMessageData {
  message: FrontendMessage;
  conversationId: string;
  isNewConversation?: boolean;
  tempId?: string;

  // Additional properties that might be accessed
  id?: string;
  content?: string;
  timestamp?: string;
  type?: "text" | "image" | "file" | "audio" | "video";
  sender?: User;
  senderType?: "user" | "admin";
  conversation_id?: string;
  sender_id?: string;
  recipient_id?: string;
  reply_to_id?: string;
  created_at?: string;
  updated_at?: string;
  read_at?: string;
  sender_type?: "user" | "admin";
  is_read?: boolean;
  is_deleted?: boolean;
}

export interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  last_message_id?: string;
  created_at: string;
  updated_at: string;
  participant1?: User;
  participant2?: User;
  lastMessage?: Message;
  otherParticipant?: User;
  unread_count?: number;
}

export interface User {
  id: string;
  username: string;
  name: string;
  email?: string;
  is_active?: boolean;
  role?:
    | "super_admin"
    | "co_admin"
    | "kantor_pusat"
    | "kanwil_djpb"
    | "kppn"
    | "lainnya";
  kd_kanwil?: string;
  nm_kanwil?: string;
  kd_kppn?: string;
  nm_kppn?: string;
  status?: string;
}

// Event Name Constants
export const SOCKET_EVENTS = {
  // Version meta
  VERSION: SOCKET_EVENTS_VERSION,

  // Connection Events
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  CONNECT_ERROR: "connect_error",
  ERROR: "error",

  // Health / Keepalive
  PING: "ping",
  PONG: "pong",

  // Handshake & Auth Events
  HANDSHAKE_REQUEST: "handshake:request",
  HANDSHAKE_RESPONSE: "handshake:response",
  SERVER_READY: "server:ready",
  AUTH_ERROR: "auth:error",
  SESSION_EXPIRED: "session:expired",
  SESSION_RECOVERED: "session:recovered",

  // Message Events
  MESSAGE_SEND: "message:send",
  MESSAGE_SENT: "message:sent",
  MESSAGE_NEW: "message:new",
  MESSAGE_RECEIVED: "message:received",
  MESSAGE_READ: "message:read",
  MESSAGE_DELETE: "message:delete",
  MESSAGE_DELETED: "message:deleted",
  MESSAGE_DELIVERED: "message:delivered",
  MESSAGE_ERROR: "message:error",

  // Conversation Events
  CONVERSATION_JOIN: "conversation:join",
  CONVERSATION_JOINED: "conversation:joined",
  CONVERSATION_LEAVE: "conversation:leave",
  CONVERSATION_LEFT: "conversation:left",
  CONVERSATION_MESSAGES: "conversation:messages",
  CONVERSATION_CREATED: "conversation:created",
  CONVERSATION_ERROR: "conversation:error",
  CONVERSATIONS_GET: "conversations:get",
  CONVERSATIONS_LIST: "conversations:list",
  CONVERSATIONS_UPDATED: "conversations:updated",

  // Typing Events
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",
  TYPING_USER: "typing:user",
  TYPING_ERROR: "typing:error",

  // User / Presence Events
  USERS_GET_ONLINE: "users:get-online",
  USERS_ONLINE: "users:online",
  USER_LOGIN: "user:login",
  USER_ONLINE: "user:online",
  USER_OFFLINE: "user:offline",
  USERS_UPDATED: "users:updated",

  // Notification Events
  NOTIFICATION_CREATE: "notification:create",
  NOTIFICATION_CREATED: "notification:created",
  NOTIFICATION_ERROR: "notification:error",
  NOTIFICATION_NEW: "notification:new",
  NOTIFICATION_NEW_V2: "notification:new:v2",

  // Data Subscription Events
  DATA_SUBSCRIBE: "data:subscribe",
  DATA_SUBSCRIBED: "data:subscribed",
  DATA_UNSUBSCRIBE: "data:unsubscribe",
  DATA_UPDATE: "data:update",
} as const;

// Helper functions for creating standardized responses

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T = any>(data: T, message?: string): SuccessResponse<T> {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  if (message !== undefined) {
    response.message = message;
  }

  return response;
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(error: string, code?: string, details?: any): ErrorResponse {
  return {
    success: false,
    error: {
      code: code || "UNKNOWN_ERROR",
      message: error,
      details,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Safely formats a time string with validation
 */
export function formatRelativeTime(dateString?: string | null, fallback = "—"): string {
  if (!dateString) return fallback;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date string received: ${dateString}`);
      return fallback;
    }
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  } catch (error) {
    console.error(`Error formatting relative time: ${dateString}`, error);
    return fallback;
  }
}

