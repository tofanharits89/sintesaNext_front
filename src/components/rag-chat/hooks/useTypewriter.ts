import { useEffect, useState, useCallback, useRef } from "react";
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
    /** Whether typing is complete */
    isComplete: boolean;
}

/**
 * Hook for progressive typewriter display of streaming content.
 * 
 * @param options - Configuration options
 * @returns Controls for the typewriter effect
 */
export function useTypewriter(options: UseTypewriterOptions = {}): UseTypewriterReturn {
    // Smaller chunks + faster ticks = smoother animation
    // 3 chars every 8ms gives ~375 chars/sec which feels natural
    const { charsPerTick = 3, tickInterval = 8 } = options;

    const [isComplete, setIsComplete] = useState(true);

    // Use refs for content to avoid triggering effect cascades
    const displayedLengthRef = useRef(0);
    const targetContentRef = useRef("");
    const assistantMsgIndexRef = useRef(-1);
    const messageUpdaterRef = useRef<React.Dispatch<React.SetStateAction<ChatMessage[]>> | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const lastTickRef = useRef(0);

    // Typing animation loop
    const tick = useCallback(() => {
        const now = performance.now();
        const targetContent = targetContentRef.current;
        const displayedLength = displayedLengthRef.current;

        if (displayedLength >= targetContent.length) {
            setIsComplete(true);
            animationFrameRef.current = null;
            return;
        }

        // Throttle updates based on tickInterval
        if (now - lastTickRef.current < tickInterval) {
            animationFrameRef.current = requestAnimationFrame(tick);
            return;
        }
        lastTickRef.current = now;

        // Adaptive speed: if we're far behind the target, speed up to catch up
        const behind = targetContent.length - displayedLength;
        const adaptiveChars = behind > 50 ? Math.min(behind / 10, 20) : charsPerTick;
        const charsToAdd = Math.min(Math.ceil(adaptiveChars), behind);
        const newLength = displayedLength + charsToAdd;
        displayedLengthRef.current = newLength;

        const newDisplayed = targetContent.slice(0, newLength);
        const msgIndex = assistantMsgIndexRef.current;
        const updater = messageUpdaterRef.current;

        // Update the message with displayed content
        if (msgIndex >= 0 && updater) {
            updater((prev) => {
                const updated = [...prev];
                if (updated[msgIndex]) {
                    updated[msgIndex] = {
                        ...updated[msgIndex],
                        content: newDisplayed,
                    };
                }
                return updated;
            });
        }

        // Continue animation
        animationFrameRef.current = requestAnimationFrame(tick);
    }, [charsPerTick, tickInterval]);

    // Start/restart animation when target content changes
    const setTargetContent = useCallback((content: string) => {
        targetContentRef.current = content;

        const displayedLength = displayedLengthRef.current;
        const msgIndex = assistantMsgIndexRef.current;
        const updater = messageUpdaterRef.current;

        // If we haven't shown anything yet and there's content, show first chunk immediately
        // This prevents a gap between hiding the progress indicator and showing content
        if (displayedLength === 0 && content.length > 0 && msgIndex >= 0 && updater) {
            const firstChunk = content.slice(0, charsPerTick);
            displayedLengthRef.current = firstChunk.length;
            updater((prev) => {
                const updated = [...prev];
                if (updated[msgIndex]) {
                    updated[msgIndex] = {
                        ...updated[msgIndex],
                        content: firstChunk,
                    };
                }
                return updated;
            });
        }

        setIsComplete(displayedLengthRef.current >= content.length);

        // Start animation if not already running and there's more to show
        if (!animationFrameRef.current && displayedLengthRef.current < content.length) {
            lastTickRef.current = performance.now();
            animationFrameRef.current = requestAnimationFrame(tick);
        }
    }, [tick, charsPerTick]);

    const setAssistantMsgIndex = useCallback((index: number) => {
        assistantMsgIndexRef.current = index;
    }, []);

    const reset = useCallback(() => {
        // Cancel any pending animation
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        displayedLengthRef.current = 0;
        targetContentRef.current = "";
        assistantMsgIndexRef.current = -1;
        lastTickRef.current = 0;
        setIsComplete(true);
    }, []);

    const updateMessages = useCallback((setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>) => {
        messageUpdaterRef.current = setMessages;
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    return {
        setTargetContent,
        setAssistantMsgIndex,
        reset,
        updateMessages,
        isComplete,
    };
}
