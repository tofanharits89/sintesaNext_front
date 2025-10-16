/**
 * Message Normalizer Service
 * Extracts and normalizes messages from various API response shapes
 * Reduces useMessagesRQ complexity by isolating response parsing
 */

export interface NormalizedMessage {
  id: string;
  conversationId: string;
  content: string;
  timestamp: string;
  sender?: any;
  senderType: string;
  isRead: boolean;
  isDelivered: boolean;
  readAt?: string | null;
  deliveredAt?: string | null;
}

export interface NormalizedResponse {
  messages: NormalizedMessage[];
  pagination: {
    nextBefore?: string | null;
    limit: number;
    total: number;
    hasMore?: boolean;
  };
}

/**
 * Normalize timestamp to ISO string
 * Handles: milliseconds, seconds, ISO strings, Date objects
 */
export function normalizeTimestamp(value: any): string {
  if (!value) return new Date().toISOString();
  
  // Already ISO string
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (!isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }
  }
  
  // Numeric timestamp
  if (typeof value === 'number') {
    const ms = value < 1_000_000_000_000 ? value * 1000 : value;
    return new Date(ms).toISOString();
  }
  
  // Date object
  if (value instanceof Date) {
    return value.toISOString();
  }
  
  return new Date().toISOString();
}

/**
 * Extract messages array from various response shapes
 * Tolerates multiple backend response formats
 */
export function extractMessagesArray(response: any): any[] {
  if (!response || typeof response !== 'object') return [];
  
  // Try common paths in order of likelihood
  const candidates = [
    response?.data?.messages,
    response?.messages,
    response?.data?.data?.messages,
    response?.result?.messages,
    response?.data?.result?.messages,
    response?.data?.items,
    response?.items,
    response?.result?.items,
    response?.data?.records,
    response?.records,
    response?.rows,
    response?.data?.rows,
  ];
  
  // Return first array found
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }
  
  // Fallback: recursive search (expensive but thorough)
  return searchForMessageArray(response, 0, 3);
}

/**
 * Extract pagination info from various response shapes
 */
export function extractPagination(response: any): {
  nextBefore?: string | null;
  limit: number;
  total: number;
  hasMore?: boolean;
} {
  if (!response || typeof response !== 'object') {
    return { limit: 25, total: 0 };
  }
  
  // Try common pagination paths
  const pg = response?.data?.pagination ||
    response?.pagination ||
    response?.data?.data?.pagination ||
    response?.result?.pagination ||
    response?.paging ||
    response?.data?.paging ||
    {};
  
  return {
    nextBefore: pg?.nextBefore || pg?.next_before || pg?.next || null,
    limit: pg?.limit || pg?.pageSize || pg?.page_size || 25,
    total: pg?.total || pg?.totalCount || pg?.total_count || 0,
    hasMore: pg?.hasMore ?? pg?.has_more ?? true,
  };
}

/**
 * Normalize a single message from API
 */
export function normalizeMessage(raw: any, conversationId?: string): NormalizedMessage | null {
  if (!raw || typeof raw !== 'object') return null;
  
  const id = raw.id || raw.messageId || raw.message_id;
  if (!id) return null;
  
  const convId = conversationId || raw.conversation_id || raw.conversationId;
  if (!convId) return null;
  
  const content = String(raw.content || raw.text || raw.message || '');
  if (!content.trim()) return null;
  
  return {
    id,
    conversationId: convId,
    content: content.trim(),
    timestamp: normalizeTimestamp(raw.timestamp || raw.created_at),
    sender: raw.sender || raw.senderInfo || null,
    senderType: (raw.senderType || raw.sender_type || 'user').toLowerCase(),
    isRead: Boolean(raw.isRead || raw.is_read || false),
    isDelivered: Boolean(raw.isDelivered || raw.is_delivered || true),
    readAt: raw.readAt || raw.read_at || null,
    deliveredAt: raw.deliveredAt || raw.delivered_at || null,
  };
}

/**
 * Normalize entire API response to standard format
 */
export function normalizeResponse(
  response: any,
  conversationId: string,
): NormalizedResponse {
  const messages = extractMessagesArray(response)
    .map((msg) => normalizeMessage(msg, conversationId))
    .filter((msg): msg is NormalizedMessage => msg !== null);
  
  const pagination = extractPagination(response);
  
  return {
    messages,
    pagination: {
      ...pagination,
      nextBefore: pagination.nextBefore || null,
      limit: pagination.limit,
      total: pagination.total,
      hasMore: pagination.hasMore ?? (messages.length >= pagination.limit),
    },
  };
}

/**
 * Sort messages by timestamp (ascending)
 */
export function sortMessages(messages: NormalizedMessage[]): NormalizedMessage[] {
  return [...messages].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeA - timeB;
  });
}

/**
 * Deduplicate messages by ID
 */
export function deduplicateMessages(
  messages: NormalizedMessage[],
): NormalizedMessage[] {
  const seen = new Set<string>();
  const deduped: NormalizedMessage[] = [];
  
  for (const msg of messages) {
    if (!seen.has(msg.id)) {
      seen.add(msg.id);
      deduped.push(msg);
    }
  }
  
  return deduped;
}

/**
 * Merge and normalize multiple message pages
 */
export function mergePages(pages: NormalizedResponse[]): NormalizedMessage[] {
  const allMessages: NormalizedMessage[] = [];
  
  for (const page of pages) {
    allMessages.push(...page.messages);
  }
  
  return sortMessages(deduplicateMessages(allMessages));
}

/**
 * Recursive search for message-like array
 * Used as fallback when standard paths don't work
 */
function searchForMessageArray(
  obj: any,
  depth: number,
  maxDepth: number,
): any[] {
  if (!obj || typeof obj !== 'object' || depth > maxDepth) {
    return [];
  }
  
  // If this is an array, check if it looks like messages
  if (Array.isArray(obj)) {
    if (looksLikeMessageArray(obj)) {
      return obj;
    }
  }
  
  // Scan object values
  try {
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      
      // Found array in this key
      if (Array.isArray(value) && looksLikeMessageArray(value)) {
        return value;
      }
      
      // Recurse deeper
      if (value && typeof value === 'object') {
        const found = searchForMessageArray(value, depth + 1, maxDepth);
        if (found.length > 0) {
          return found;
        }
      }
    }
  } catch {
    // Ignore errors during recursion
  }
  
  return [];
}

/**
 * Check if array looks like message objects
 */
function looksLikeMessageArray(arr: any[]): boolean {
  if (!Array.isArray(arr) || arr.length === 0) return false;
  
  const first = arr[0];
  if (typeof first !== 'object') return false;
  
  // Check for message-like fields
  const hasId = 'id' in first || 'messageId' in first || 'message_id' in first;
  const hasContent = 'content' in first || 'text' in first || 'message' in first;
  const hasTimestamp = 'timestamp' in first || 'created_at' in first || 'createdAt' in first;
  
  return hasId && hasContent && hasTimestamp;
}

export default {
  normalizeTimestamp,
  extractMessagesArray,
  extractPagination,
  normalizeMessage,
  normalizeResponse,
  sortMessages,
  deduplicateMessages,
  mergePages,
};
