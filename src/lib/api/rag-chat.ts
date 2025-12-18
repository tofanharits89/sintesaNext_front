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
  nearingLimit?: boolean;
  approxPromptTokens?: number;
}

export interface SendRagMessageInput {
  message: string;
  sessionId?: string;
}

/**
 * SSE Event types from the streaming agent endpoint
 */
export interface StreamEvent {
  type: 'step_start' | 'tool_call' | 'tool_result' | 'sources' | 'content' | 'done' | 'error';
  step?: number;
  action?: string;
  tool?: string;
  query?: string;
  success?: boolean;
  documents_found?: number;
  sources?: RagChatSource[];
  content?: string;
  full_content?: string;
  total_steps?: number;
  tool_calls_count?: number;
  trace_id?: string;
  error_type?: string;
  message?: string;
  recoverable?: boolean;
}

/**
 * Callback interface for streaming events
 */
export interface StreamCallbacks {
  onStepStart?: (step: number, action: string) => void;
  onToolCall?: (step: number, tool: string, query?: string) => void;
  onToolResult?: (step: number, success: boolean, documentsFound: number) => void;
  onSources?: (sources: RagChatSource[]) => void;
  onContent?: (content: string) => void;
  onDone?: (fullContent: string, totalSteps: number, toolCallsCount: number) => void;
  onError?: (errorType: string, message: string) => void;
}

/**
 * Call the backend RAG chat endpoint (non-streaming).
 */
export async function sendRagMessage(
  input: SendRagMessageInput,
): Promise<RagChatResponse> {
  return apiClient.post<RagChatResponse>("/rag/chat", {
    message: input.message,
    sessionId: input.sessionId,
  });
}

/**
 * Call the streaming RAG chat endpoint with SSE.
 * 
 * This connects to /api/v1/rag/chat/stream and processes events in real-time.
 */
export async function sendRagMessageStream(
  input: SendRagMessageInput,
  callbacks: StreamCallbacks,
): Promise<void> {
  // Use the same path pattern as apiClient - just the path without /api/v1
  // The path will be resolved relative to current origin
  const url = "/api/v1/rag/chat/stream";

  // Get CSRF token from cookie (same as httpClient)
  const csrfToken = typeof document !== "undefined"
    ? document.cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("XSRF-TOKEN="))
      ?.split("=")[1]
    : undefined;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "text/event-stream",
  };

  if (csrfToken) {
    headers["X-CSRF-Token"] = decodeURIComponent(csrfToken);
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      message: input.message,
      sessionId: input.sessionId,
    }),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Stream request failed: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE events
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.slice(6).trim();
          if (dataStr && dataStr !== "[DONE]") {
            try {
              const event: StreamEvent = JSON.parse(dataStr);
              console.log("[RAG Stream] Received event:", event.type);
              processStreamEvent(event, callbacks);
            } catch (e) {
              console.warn("Failed to parse SSE event:", dataStr);
            }
          }
        }
      }
    }

    // Process remaining buffer
    if (buffer.startsWith("data: ")) {
      const dataStr = buffer.slice(6).trim();
      if (dataStr && dataStr !== "[DONE]") {
        try {
          const event: StreamEvent = JSON.parse(dataStr);
          processStreamEvent(event, callbacks);
        } catch (e) {
          // Ignore
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function processStreamEvent(event: StreamEvent, callbacks: StreamCallbacks) {
  switch (event.type) {
    case "step_start":
      callbacks.onStepStart?.(event.step ?? 0, event.action ?? "thinking");
      break;
    case "tool_call":
      callbacks.onToolCall?.(event.step ?? 0, event.tool ?? "", event.query);
      break;
    case "tool_result":
      callbacks.onToolResult?.(event.step ?? 0, event.success ?? true, event.documents_found ?? 0);
      break;
    case "sources":
      callbacks.onSources?.(event.sources ?? []);
      break;
    case "content":
      callbacks.onContent?.(event.content ?? "");
      break;
    case "done":
      callbacks.onDone?.(
        event.full_content ?? "",
        event.total_steps ?? 0,
        event.tool_calls_count ?? 0
      );
      break;
    case "error":
      callbacks.onError?.(event.error_type ?? "unknown", event.message ?? "Unknown error");
      break;
  }
}
