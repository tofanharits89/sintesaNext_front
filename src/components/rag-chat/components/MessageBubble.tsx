"use client";

import { motion } from "framer-motion";
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex ${isUser ? "justify-end" : "justify-start"}`}
        >
            <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 ${isUser
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
