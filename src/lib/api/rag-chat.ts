import { apiClient } from "./httpClient";

export interface RagChatSource {
  id?: string;
  title?: string;
  url?: string;
  score?: number;
}

export interface RagChatResponse {
  success: boolean;
  answer: string;
  sources: RagChatSource[];
  traceId?: string;
}

export interface SendRagMessageInput {
  message: string;
  sessionId?: string;
}

/**
 * Call the backend RAG chat endpoint.
 *
 * This function is intentionally lightweight; you can extend it later
 * with richer metadata (e.g. department, filters) as needed.
 */
export async function sendRagMessage(
  input: SendRagMessageInput,
): Promise<RagChatResponse> {
  return apiClient.post<RagChatResponse>("/rag/chat", {
    message: input.message,
    sessionId: input.sessionId,
  });
}

