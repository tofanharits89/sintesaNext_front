/**
 * Simplified Message Normalization
 * 
 * Reduces complex 15+ transformations to simple mapping
 * Uses shared types for consistency
 */

import type { FrontendMessage } from "@/types/socket-events";

export interface NormalizedMessage {
  id: string;
  conversation_id: string;
  conversationId: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  type: "text" | "image" | "file" | "audio" | "video";
  created_at: string;
  timestamp: string;
  sender?: {
    id: string;
    username: string;
    name: string;
  } | undefined;
  is_read: boolean;
  isRead: boolean;
  senderType?: "user" | "admin";
  tempId?: string;
  deliveryStatus?: "sending" | "sent" | "delivered" | "failed";
}

/**
 * Normalize message from various input formats
 * Simplified from 15+ transformations to basic mapping
 */
export function normalizeMessage(input: any): NormalizedMessage | null {
  if (!input) return null;
  
  // Extract message object (handles different input formats)
  const msg = input.message || input;
  if (!msg) return null;
  
  // Extract conversation ID from available fields
  const conversationId = input.conversationId || msg.conversation_id || msg.conversationId;
  if (!conversationId) return null;
  
  // Base message object with required fields
  const normalized: NormalizedMessage = {
    id: msg.id || generateTempId(),
    content: msg.content || "",
    
    // Core identifiers
    conversation_id: conversationId,
    conversationId,
    sender_id: msg.sender_id || msg.sender?.id || "unknown",
    recipient_id: msg.recipient_id || "unknown",
    
    // Timestamps
    created_at: msg.created_at || msg.timestamp || new Date().toISOString(),
    timestamp: msg.timestamp || msg.created_at || new Date().toISOString(),
    
    // Message type
    type: msg.type || "text",
    
    // Read status
    is_read: msg.is_read || false,
    isRead: msg.is_read || false,
    
    // Optional sender info
    sender: msg.sender ? {
      id: msg.sender.id,
      username: msg.sender.username,
      name: msg.sender.name,
    } : undefined,
    
    // Optional sender type
    senderType: msg.sender_type || msg.senderType || "user",
    
    // Frontend-only properties
    tempId: msg.tempId,
    deliveryStatus: msg.deliveryStatus,
  };
  
  return normalized;
}

/**
 * Generate temporary ID for frontend messages
 */
function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Batch normalize array of messages
 */
export function normalizeMessages(messages: any[]): NormalizedMessage[] {
  return messages
    .map(normalizeMessage)
    .filter((msg): msg is NormalizedMessage => msg !== null);
}

/**
 * Validate normalized message structure
 */
export function isValidMessage(msg: any): msg is NormalizedMessage {
  return (
    typeof msg === "object" &&
    typeof msg.id === "string" &&
    typeof msg.conversationId === "string" &&
    typeof msg.content === "string" &&
    typeof msg.sender_id === "string" &&
    typeof msg.recipient_id === "string"
  );
}

/**
 * Extract only essential message data for caching
 */
export function extractMessageData(msg: NormalizedMessage) {
  return {
    id: msg.id,
    conversationId: msg.conversationId,
    content: msg.content,
    type: msg.type,
    sender_id: msg.sender_id,
    created_at: msg.created_at,
    is_read: msg.is_read,
  };
}
