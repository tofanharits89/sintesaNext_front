"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "motion/react";

import { Card, CardContent } from "@/components/ui/card";

// Hooks
import { useChatSession, useTypewriter, useClickOutside } from "./hooks";

// Components
import {
  ChatHeader,
  MessageBubble,
  StreamProgress,
  SourcesSection,
  ChatInput,
  EmptyState,
  ChatToggleButton,
} from "./components";

/**
 * Floating RAG chatbot widget using shadcn UI with real SSE streaming.
 */
export function RagChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");

  const chatRef = useRef<HTMLDivElement | null>(null);
  const toggleButtonRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Custom hooks
  const {
    messages,
    isSending,
    error,
    sources,
    streamProgress,
    agentName,
    setMessages,
    handleSend: sendMessage,
    resetSession,
  } = useChatSession();

  const typewriter = useTypewriter();

  // Close chat when clicking outside
  useClickOutside(
    [chatRef, toggleButtonRef],
    useCallback(() => setIsOpen(false), []),
    isOpen
  );

  // Handle sending messages with typewriter integration
  const handleSend = useCallback(async () => {
    if (!input.trim() || isSending) return;

    const inputValue = input;
    setInput("");

    typewriter.reset();
    typewriter.updateMessages(setMessages);

    await sendMessage(inputValue, (content, assistantIndex) => {
      // Must set index BEFORE content so typewriter knows which message to update
      typewriter.setAssistantMsgIndex(assistantIndex);
      typewriter.setTargetContent(content);
    });
  }, [input, isSending, sendMessage, typewriter, setMessages]);

  // Auto-scroll to latest message only when a new message is received or during streaming
  useEffect(() => {
    if (!messagesEndRef.current) return;
    try {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    } catch {
      // ignore scroll errors
    }
  }, [messages.length, streamProgress]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 pointer-events-none">
      <motion.div
        ref={chatRef}
        initial={{ opacity: 0, y: 20, scale: 0.95, pointerEvents: "none", visibility: "hidden" }}
        animate={isOpen ? {
          opacity: 1,
          y: 0,
          scale: 1,
          pointerEvents: "auto",
          visibility: "visible",
        } : {
          opacity: 0,
          y: 20,
          scale: 0.95,
          pointerEvents: "none",
          transitionEnd: {
            visibility: "hidden"
          }
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25,
          opacity: { duration: 0.2 },
        }}
      >
        <Card className="w-[430px] max-w-[calc(100vw-2rem)] border-border/70 shadow-xl bg-white dark:bg-card gap-0 !p-0">
          <ChatHeader onReset={resetSession} disabled={isSending} />

          <CardContent className="p-0">
            {messages.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="h-[calc(60vh-2rem)] overflow-y-auto overflow-x-hidden px-4 py-0 rounded-lg">
                <div className="flex flex-col gap-4 text-[13px] w-full max-w-full min-w-0">
                  {messages
                    .filter((m) => m.role === "user" || m.content.length > 0)
                    .map((m, idx) => (
                      <MessageBubble key={idx} message={m} index={idx} />
                    ))}

                  <StreamProgress
                    progress={streamProgress}
                    isSending={isSending}
                    agentName={agentName}
                  />

                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}

            <SourcesSection sources={sources} />

            {error && (
              <div className="px-4 pb-1 text-[11px] text-destructive">
                {error}
              </div>
            )}
          </CardContent>

          <ChatInput
            value={input}
            onChange={setInput}
            onSend={handleSend}
            disabled={isSending}
          />
        </Card>
      </motion.div>

      <ChatToggleButton
        ref={toggleButtonRef}
        isOpen={isOpen}
        onToggle={() => setIsOpen((v) => !v)}
        className="pointer-events-auto"
      />
    </div>
  );
}
