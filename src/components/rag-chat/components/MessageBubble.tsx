"use client";

import { motion } from "motion/react";
import { ChatMessage as ChatMessageType } from "../types";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface MessageBubbleProps {
    message: ChatMessageType;
    index: number;
}

/**
 * Individual chat message bubble with appropriate styling.
 */
export function MessageBubble({ message, index }: MessageBubbleProps) {
    const isUser = message.role === "user";
    const isWarning = message.content.startsWith("⚠️ Konteks percakapan hampir penuh");

    return (
        <motion.div
            key={index}
            initial={{ opacity: 0, transform: "translateY(10px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            transition={{ duration: 0.2 }}
            style={{ willChange: "transform, opacity" }}
            className={`flex ${isUser ? "justify-end" : "justify-start"}`}
        >
            <div
                className={`rag-chat-message max-w-[80%] min-w-0 overflow-hidden rounded-2xl px-3 py-2 ${isUser
                    ? "bg-primary text-primary-foreground rounded-br-sm text-xs md:text-[13px]"
                    : isWarning
                        ? "bg-transparent text-muted-foreground italic text-[10px]"
                        : "bg-muted text-foreground rounded-bl-sm text-xs md:text-[13px]"
                    }`}
            >
                {isWarning ? (
                    <p className="mb-1 last:mb-0">{message.content}</p>
                ) : (
                    <MarkdownRenderer content={message.content} />
                )}
            </div>
        </motion.div>
    );
}
