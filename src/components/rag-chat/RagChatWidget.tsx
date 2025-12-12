"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Info, Loader2, MessageCircle, RotateCcw, Send, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { sendRagMessage, RagChatResponse } from "@/lib/api/rag-chat";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface StreamState {
  target: string;
  index: number;
  messageIndex: number;
}

const WAITING_MESSAGES = [
  "menanti sebuah jawaban..",
  "tatkala letih menunggu..",
  "menunggu pagi..",
  "sabarlah menanti..",
];

/**
 * Floating RAG chatbot widget using shadcn UI.
 */
export function RagChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string>(() => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `session-${Date.now()}`;
  });
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<RagChatResponse | null>(
    null,
  );
  const [streamState, setStreamState] = useState<StreamState | null>(null);
  const [waitingIndex, setWaitingIndex] = useState<number>(() =>
    Math.floor(Math.random() * WAITING_MESSAGES.length),
  );
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatRef = useRef<HTMLDivElement | null>(null);
  const toggleButtonRef = useRef<HTMLDivElement | null>(null);

  // Close chat when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      // Don't close if click is on the toggle button or inside the chat
      const isToggleButton = toggleButtonRef.current?.contains(target);
      const isChatCard = chatRef.current?.contains(target);

      if (!isChatCard && !isToggleButton) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    setError(null);
    setIsSending(true);
    setWaitingIndex(Math.floor(Math.random() * WAITING_MESSAGES.length));

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(nextMessages);
    setInput("");

    try {
      const response = await sendRagMessage({ message: trimmed, sessionId });
      setLastResponse(response);

      const fullAnswer =
        response.answer || "(Asisten tidak memberikan jawaban)";

      const assistantIndex = nextMessages.length;
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: "",
        },
      ]);
      setStreamState({
        target: fullAnswer,
        index: 0,
        messageIndex: assistantIndex,
      });

      if (response.nearingLimit) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "⚠️ Konteks percakapan hampir penuh. Sebaiknya mulai sesi baru agar jawaban tetap akurat.",
          },
        ]);
      }
    } catch (err: any) {
      setError(
        err?.message ||
          "Terjadi kesalahan saat menghubungi asisten. Silakan coba lagi.",
      );
    } finally {
      setIsSending(false);
    }
  }

  // Typewriter-style streaming for the latest assistant message
  useEffect(() => {
    if (!streamState) return;

    const { target, index, messageIndex } = streamState;

    if (index >= target.length) {
      setStreamState(null);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setMessages((prev) => {
        if (messageIndex < 0 || messageIndex >= prev.length) {
          return prev;
        }
        const updated = [...prev];
        const msg = updated[messageIndex];
        if (!msg) return prev;

        const nextIndex = Math.min(index + 3, target.length);
        updated[messageIndex] = {
          ...msg,
          content: target.slice(0, nextIndex),
        };
        return updated;
      });

      setStreamState((prev) =>
        prev
          ? { ...prev, index: Math.min(prev.index + 3, prev.target.length) }
          : null,
      );
    }, 8);

    return () => window.clearTimeout(timeoutId);
  }, [streamState]);

  // Jika tab berpindah (offscreen), selesaikan pengetikan di belakang layar
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState !== "hidden") return;

      setStreamState((current) => {
        if (!current) return current;
        const { target, messageIndex } = current;

        setMessages((prev) => {
          if (messageIndex < 0 || messageIndex >= prev.length) {
            return prev;
          }
          const updated = [...prev];
          const msg = updated[messageIndex];
          if (!msg) return prev;

          updated[messageIndex] = {
            ...msg,
            content: target,
          };
          return updated;
        });

        // Hentikan efek typewriter; ketika pengguna kembali,
        // jawaban sudah muncul penuh.
        return null;
      });
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const isWaiting = isSending;

  useEffect(() => {
    if (!isWaiting) return;

    const intervalId = window.setInterval(() => {
      setWaitingIndex((prev) => (prev + 1) % WAITING_MESSAGES.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [isWaiting]);

  useEffect(() => {
    if (!messagesEndRef.current) return;
    try {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    } catch {
      // ignore scroll errors
    }
  }, [messages, streamState]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            ref={chatRef}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              opacity: { duration: 0.2 },
            }}
          >
            <Card className="w-[420px] max-w-[calc(100vw-2rem)] border-border/70 shadow-xl bg-white dark:bg-background gap-3">
          <CardHeader className="flex flex-row items-start justify-between gap-2 border-b">
            <div className="flex items-center gap-4">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="flex flex-col">
                <CardTitle className="text-sm">Shinta</CardTitle>
                <CardDescription className="text-xs">
                  SINTESA Hi-Quality Information Trusted Assistant
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-xs"
                title="Mulai sesi baru"
                onClick={() => {
                  const newId =
                    typeof crypto !== "undefined" && "randomUUID" in crypto
                      ? crypto.randomUUID()
                      : `session-${Date.now()}`;
                  setSessionId(newId);
                  setMessages([]);
                  setLastResponse(null);
                  setError(null);
                }}
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="px-0 pt-0 pb-0">
            {messages.length === 0 ? (
              <div className="flex h-96 flex-col items-center justify-center gap-2 px-4 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground/50" />
                <p className="text-xs font-semibold text-muted-foreground/50">
                  Mulai percakapan dengan mengetik pertanyaan di bawah.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-96 px-4 pb-0">
                <div className="flex flex-col gap-2 text-sm">
                  {messages.map((m, idx) => {
                  const isUser = m.role === "user";
                  const isWarning = m.content.startsWith("⚠️ Konteks percakapan hampir penuh");
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex ${
                        isUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                          isUser
                            ? "bg-primary text-primary-foreground rounded-br-sm text-xs md:text-sm"
                            : isWarning
                            ? "bg-transparent text-muted-foreground italic text-[10px]"
                            : "bg-muted text-foreground rounded-bl-sm text-xs md:text-sm"
                        }`}
                      >
                        {isWarning ? (
                          <p className="mb-1 last:mb-0">{m.content}</p>
                        ) : (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ node, ...props }) => (
                                <p className="mb-1 last:mb-0" {...props} />
                              ),
                              ul: ({ node, ...props }) => (
                                <ul
                                  className="list-disc list-inside space-y-1"
                                  {...props}
                                />
                              ),
                              ol: ({ node, ...props }) => (
                                <ol
                                  className="list-decimal list-inside space-y-1"
                                  {...props}
                                />
                              ),
                              li: ({ node, ...props }) => (
                                <li className="mb-0" {...props} />
                              ),
                              strong: ({ node, ...props }) => (
                                <strong className="font-semibold" {...props} />
                              ),
                            }}
                          >
                            {m.content}
                          </ReactMarkdown>
                        )}
                      </div>
                    </motion.div>
                  );
                  })}

                {isWaiting && (
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    <span className="animate-shimmer-text">
                      {WAITING_MESSAGES[waitingIndex]}
                    </span>
                  </div>
                )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            )}

            {lastResponse?.sources && lastResponse.sources.length > 0 && (
              <div className="border-t border-border/50 px-4 pt-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-muted-foreground/80 italic">
                    cek ulang, shinta bisa salah
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">
                      Sumber terkait
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground text-[10px]"
                        >
                          <Info className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-left">
                        <div className="space-y-1">
                          {lastResponse.sources
                            .slice(0, 3)
                            .map((source, index) => (
                              <div
                                key={index}
                                className="text-[11px] leading-snug"
                              >
                                •{" "}
                                {source.title ||
                                  source.id ||
                                  "Sumber tanpa judul"}
                              </div>
                            ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="px-4 pb-1 text-[11px] text-destructive">
                {error}
              </div>
            )}
          </CardContent>

          <CardFooter className="border-t px-4 flex flex-col gap-1">
            <form
              className="flex w-full items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void handleSend();
              }}
            >
              <Input
                className="h-9 text-sm"
                placeholder="Tulis pertanyaan..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isSending}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isSending || input.trim().length === 0}
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        ref={toggleButtonRef}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Button
          type="button"
          size="icon-lg"
          className="rounded-full shadow-xl"
          onClick={() => setIsOpen((v) => !v)}
          aria-label={isOpen ? "Tutup asisten" : "Buka asisten"}
        >
          <motion.div
            initial={false}
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <MessageCircle className="h-5 w-5" />
            )}
          </motion.div>
        </Button>
      </motion.div>
    </div>
  );
}
