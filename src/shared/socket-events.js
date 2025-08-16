/**
 * Standardized Socket Event Schema (JavaScript version)
 * This file defines all socket events and their payload structures
 * to ensure consistency between backend and frontend
 */

/**
 * Versioning for socket events.
 * Increment this when breaking changes to event contracts are introduced.
 */
export const SOCKET_EVENTS_VERSION = "1.0";

// Event Name Constants
export const SOCKET_EVENTS = {
  // Version meta (useful for debugging and conditional handling)
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
  AUTH_REQUEST: "auth:request",
  AUTH_RESPONSE: "auth:response",
  AUTH_ERROR: "auth:error",
  SESSION_EXPIRED: "session:expired",
  SESSION_RECOVERED: "session:recovered",

  // Message Events
  MESSAGE_SEND: "message:send",
  MESSAGE_SENT: "message:sent",
  MESSAGE_NEW: "message:new",
  MESSAGE_RECEIVED: "message:received",
  MESSAGE_READ: "message:read",
  MESSAGE_OPENED: "message:opened",
  MESSAGE_DELETE: "message:delete",
  MESSAGE_DELETED: "message:deleted",
  MESSAGE_DELIVERED: "message:delivered",
  MESSAGE_DELIVERY_CONFIRM: "message:delivery:confirm",
  MESSAGE_ACK: "message:ack",
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

  // Data Subscription Events
  DATA_SUBSCRIBE: "data:subscribe",
  DATA_SUBSCRIBED: "data:subscribed",
  DATA_UNSUBSCRIBE: "data:unsubscribe",
  DATA_UPDATE: "data:update",
};

// Helper functions for creating standardized responses

/**
 * Create a standardized success response envelope.
 * @param {any} data - Payload data.
 * @param {string} [message] - Optional human readable message.
 * @returns {Object} SuccessResponse
 */
export function createStandardSuccessResponse(data, message) {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a standardized error response envelope.
 * @param {string} error - Error message.
 * @param {string} [type] - Optional classification of error.
 * @param {string} [code] - Optional error code.
 * @returns {Object} ErrorResponse
 */
export function createStandardErrorResponse(error, type, code) {
  return {
    success: false,
    error,
    type,
    code,
    timestamp: new Date().toISOString(),
  };
}

// Legacy aliases for backward compatibility
export const createSuccessResponse = createStandardSuccessResponse;
export const createErrorResponse = createStandardErrorResponse;

// Utility functions

/**
 * Safely formats a time string with validation for messaging timestamps
 * Returns a fallback value for invalid dates
 * @param {string|null|undefined} dateString - Date string to format
 * @param {string} [fallback="—"] - Fallback value for invalid dates
 * @returns {string} Formatted relative time string
 */
export function formatRelativeTime(dateString, fallback = "—") {
  if (!dateString) {
    return fallback;
  }

  try {
    const date = new Date(dateString);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date string received: ${dateString}`);
      return fallback;
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
      return "Just now";
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      // For older messages, show the date
      return date.toLocaleDateString();
    }
  } catch (error) {
    console.error(`Error formatting relative time: ${dateString}`, error);
    return fallback;
  }
}

// Validation functions for backend use

/**
 * Validate payload for sending a message.
 * @param {any} payload - Payload to validate
 * @returns {boolean} Whether the payload is valid
 */
export function validateMessageSend(payload) {
  return (
    payload &&
    typeof payload.recipientId === "string" &&
    typeof payload.content === "string" &&
    payload.content.trim().length > 0 &&
    payload.content.length <= 10000 &&
    (!payload.type ||
      ["text", "image", "file", "audio", "video"].includes(payload.type)) &&
    (!payload.replyToId || typeof payload.replyToId === "string") &&
    (!payload.conversationId || typeof payload.conversationId === "string")
  );
}

/**
 * Validate a message read payload.
 * @param {any} payload - Payload to validate
 * @returns {boolean} Whether the payload is valid
 */
export function validateMessageRead(payload) {
  return (
    payload &&
    typeof payload.messageId === "string" &&
    typeof payload.conversationId === "string"
  );
}

/**
 * Validate conversation join payload.
 * @param {any} payload - Payload to validate
 * @returns {boolean} Whether the payload is valid
 */
export function validateConversationJoin(payload) {
  return payload && typeof payload.conversationId === "string";
}

/**
 * Validate typing start payload.
 * @param {any} payload - Payload to validate
 * @returns {boolean} Whether the payload is valid
 */
export function validateTypingStart(payload) {
  return (
    payload &&
    (typeof payload.conversationId === "string" ||
      typeof payload.recipientId === "string")
  );
}

/**
 * Validate typing stop payload.
 * @param {any} payload - Payload to validate
 * @returns {boolean} Whether the payload is valid
 */
export function validateTypingStop(payload) {
  return (
    payload &&
    (typeof payload.conversationId === "string" ||
      typeof payload.recipientId === "string")
  );
}
