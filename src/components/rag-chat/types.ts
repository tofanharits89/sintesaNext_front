import { RagChatSource } from "@/lib/api/rag-chat";

// ----- Types -----

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
    role: ChatRole;
    content: string;
}

export interface StreamProgress {
    step: number;
    action: string;
    tool?: string;
    query?: string | undefined;
}

// ----- Constants -----

export const ACTION_LABELS: Record<string, string> = {
    thinking: "sedang berpikir...",
    searching: "sedang mencari...",
    answering: "sedang menjawab...",
};

// ----- Utilities -----

export function generateSessionId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }
    return `session-${Date.now()}`;
}

// ----- Re-exports -----

export type { RagChatSource };
