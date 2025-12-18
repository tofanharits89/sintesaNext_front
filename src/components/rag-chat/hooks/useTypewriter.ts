import { useEffect, useState, useCallback } from "react";
import { ChatMessage } from "../types";

interface UseTypewriterOptions {
    charsPerTick?: number;
    tickInterval?: number;
}

interface UseTypewriterReturn {
    /** Update target content to type towards */
    setTargetContent: (content: string) => void;
    /** Set the message index being typed */
    setAssistantMsgIndex: (index: number) => void;
    /** Reset typewriter state for new message */
    reset: () => void;
    /** Update messages with current displayed content */
    updateMessages: (setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>) => void;
}

/**
 * Hook for progressive typewriter display of streaming content.
 * 
 * @param options - Configuration options
 * @returns Controls for the typewriter effect
 */
export function useTypewriter(options: UseTypewriterOptions = {}): UseTypewriterReturn {
    const { charsPerTick = 8, tickInterval = 10 } = options;

    const [displayedContent, setDisplayedContent] = useState<string>("");
    const [targetContent, setTargetContent] = useState<string>("");
    const [assistantMsgIndex, setAssistantMsgIndex] = useState<number>(-1);
    const [messageUpdater, setMessageUpdater] = useState<React.Dispatch<React.SetStateAction<ChatMessage[]>> | null>(null);

    // Progressive display effect
    useEffect(() => {
        if (displayedContent.length >= targetContent.length) return;

        const charsToAdd = Math.min(charsPerTick, targetContent.length - displayedContent.length);

        const timeoutId = setTimeout(() => {
            const newDisplayed = targetContent.slice(0, displayedContent.length + charsToAdd);
            setDisplayedContent(newDisplayed);

            // Update the message with displayed content
            if (assistantMsgIndex >= 0 && messageUpdater) {
                messageUpdater((prev) => {
                    const updated = [...prev];
                    if (updated[assistantMsgIndex]) {
                        updated[assistantMsgIndex] = {
                            ...updated[assistantMsgIndex],
                            content: newDisplayed,
                        };
                    }
                    return updated;
                });
            }
        }, tickInterval);

        return () => clearTimeout(timeoutId);
    }, [displayedContent, targetContent, assistantMsgIndex, messageUpdater, charsPerTick, tickInterval]);

    const reset = useCallback(() => {
        setDisplayedContent("");
        setTargetContent("");
        setAssistantMsgIndex(-1);
    }, []);

    const updateMessages = useCallback((setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>) => {
        setMessageUpdater(() => setMessages);
    }, []);

    return {
        setTargetContent,
        setAssistantMsgIndex,
        reset,
        updateMessages,
    };
}
