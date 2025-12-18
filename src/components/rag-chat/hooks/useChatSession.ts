import { useState, useRef, useCallback } from "react";
import { sendRagMessageStream, RagChatSource } from "@/lib/api/rag-chat";
import { ChatMessage, StreamProgress, generateSessionId } from "../types";

interface UseChatSessionReturn {
    // State
    sessionId: string;
    messages: ChatMessage[];
    isSending: boolean;
    error: string | null;
    sources: RagChatSource[];
    streamProgress: StreamProgress | null;
    nearingLimit: boolean;

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
    const [sessionId, setSessionId] = useState<string>(() => generateSessionId());
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sources, setSources] = useState<RagChatSource[]>([]);
    const [streamProgress, setStreamProgress] = useState<StreamProgress | null>(null);
    const [nearingLimit, setNearingLimit] = useState(false);
    const currentAnswerRef = useRef<string>("");

    const handleSend = useCallback(async (
        input: string,
        onContentCallback?: (content: string, assistantIndex: number) => void
    ) => {
        const trimmed = input.trim();
        if (!trimmed || isSending) return;

        setError(null);
        setIsSending(true);
        setSources([]);
        setStreamProgress(null);
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
                    onSources: (newSources) => {
                        setSources(newSources);
                    },
                    onContent: (content) => {
                        currentAnswerRef.current += content;
                        // Call the callback with accumulated content
                        onContentCallback?.(currentAnswerRef.current, assistantIndex);
                    },
                    onDone: (fullContent, totalSteps, toolCallsCount) => {
                        setStreamProgress(null);
                        // Ensure final content is set
                        if (fullContent) {
                            setMessages((prev) => {
                                const updated = [...prev];
                                if (updated[assistantIndex]) {
                                    updated[assistantIndex] = {
                                        ...updated[assistantIndex],
                                        content: fullContent,
                                    };
                                }
                                return updated;
                            });
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
        setSessionId(generateSessionId());
        setMessages([]);
        setSources([]);
        setError(null);
        setStreamProgress(null);
        setNearingLimit(false);
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
        setMessages,
        handleSend,
        resetSession,
        clearError,
    };
}
