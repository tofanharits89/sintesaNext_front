import { useState, useRef, useCallback, useEffect } from "react";
import { sendRagMessageStream, RagChatSource } from "@/lib/api/rag-chat";
import { ChatMessage, StreamProgress, generateSessionId } from "../types";

const STORAGE_KEY = "shinta_chat_session";

function loadPersistedSession(): { sessionId: string; messages: ChatMessage[] } {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return { sessionId: generateSessionId(), messages: [] };
}

function saveSession(sessionId: string, messages: ChatMessage[]) {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ sessionId, messages }));
    } catch { /* ignore */ }
}

interface UseChatSessionReturn {
    // State
    sessionId: string;
    messages: ChatMessage[];
    isSending: boolean;
    error: string | null;
    sources: RagChatSource[];
    streamProgress: StreamProgress | null;
    nearingLimit: boolean;
    agentName: string | null;

    // Actions
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    handleSend: (
        input: string,
        onContentCallback?: (content: string, assistantIndex: number) => void
    ) => Promise<void>;
    resetSession: () => void;
    clearError: () => void;
}

/**
 * Hook managing chat session state and messaging logic.
 */
export function useChatSession(): UseChatSessionReturn {
    const persisted = useRef(loadPersistedSession());
    const [sessionId, setSessionId] = useState<string>(() => persisted.current.sessionId);
    const [messages, setMessages] = useState<ChatMessage[]>(() => persisted.current.messages);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sources, setSources] = useState<RagChatSource[]>([]);
    const [streamProgress, setStreamProgress] = useState<StreamProgress | null>(null);
    const [nearingLimit, setNearingLimit] = useState(false);
    const [agentName, setAgentName] = useState<string | null>(null);
    const currentAnswerRef = useRef<string>("");

    // Persist session to survive page refresh
    useEffect(() => {
        saveSession(sessionId, messages);
    }, [sessionId, messages]);

    const handleSend = useCallback(async (
        input: string,
        onContentCallback?: (content: string, assistantIndex: number) => void
    ) => {
        const trimmed = input.trim();
        if (!trimmed || isSending) return;

        setError(null);
        setIsSending(true);
        setSources([]);
        setAgentName(null);
        // Show initial thinking state while waiting for first SSE event
        setStreamProgress({ step: 0, action: "connecting" });
        setNearingLimit(false);
        currentAnswerRef.current = "";

        const nextMessages: ChatMessage[] = [
            ...messages,
            { role: "user", content: trimmed },
        ];
        setMessages(nextMessages);

        // Add empty assistant message that will be streamed into
        const assistantIndex = nextMessages.length;
        setMessages([
            ...nextMessages,
            { role: "assistant", content: "" },
        ]);

        try {
            await sendRagMessageStream(
                { message: trimmed, sessionId },
                {
                    onStepStart: (step, action) => {
                        setStreamProgress({ step, action });
                    },
                    onToolCall: (step, tool, query) => {
                        setStreamProgress({ step, action: "searching", tool, query });
                    },
                    onToolResult: (step, success, documentsFound) => {
                        // Progress will be updated when sources arrive
                    },
                    onAgentSelected: (name) => {
                        setAgentName(name);
                    },
                    onSources: (newSources) => {
                        setSources(newSources);
                    },
                    onContent: (content) => {
                        currentAnswerRef.current += content;
                        // Hide progress indicator once content starts streaming
                        setStreamProgress(null);
                        // Call the callback with accumulated content
                        onContentCallback?.(currentAnswerRef.current, assistantIndex);
                    },
                    onDone: (fullContent, totalSteps, toolCallsCount) => {
                        setStreamProgress(null);
                        // Signal completion to typewriter - it will handle the final content reveal
                        // Pass the final content so typewriter knows the complete target
                        if (fullContent) {
                            onContentCallback?.(fullContent, assistantIndex);
                        }
                    },
                    onError: (errorType, message) => {
                        setError(message || "Terjadi kesalahan saat menghubungi asisten.");
                        setStreamProgress(null);
                    },
                }
            );
        } catch (err: any) {
            setError(
                err?.message ||
                "Terjadi kesalahan saat menghubungi asisten. Silakan coba lagi.",
            );
        } finally {
            setIsSending(false);
            setStreamProgress(null);
        }
    }, [isSending, messages, sessionId]);

    const resetSession = useCallback(() => {
        const newId = generateSessionId();
        sessionStorage.removeItem(STORAGE_KEY);
        setSessionId(newId);
        setMessages([]);
        setSources([]);
        setError(null);
        setStreamProgress(null);
        setNearingLimit(false);
        setAgentName(null);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        sessionId,
        messages,
        isSending,
        error,
        sources,
        streamProgress,
        nearingLimit,
        agentName,
        setMessages,
        handleSend,
        resetSession,
        clearError,
    };
}
