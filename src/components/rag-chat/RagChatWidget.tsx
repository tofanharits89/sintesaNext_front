"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Info, Loader2, MessageCircle, RotateCcw, Search, Send, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { sendRagMessageStream, RagChatSource } from "@/lib/api/rag-chat";
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

interface StreamProgress {
  step: number;
  action: string;
  tool?: string;
  query?: string | undefined;
}

const ACTION_LABELS: Record<string, string> = {
  thinking: "sedang berpikir...",
  searching: "sedang mencari...",
  answering: "sedang menjawab...",
};

/**
 * Floating RAG chatbot widget using shadcn UI with real SSE streaming.
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
  const [sources, setSources] = useState<RagChatSource[]>([]);
  const [streamProgress, setStreamProgress] = useState<StreamProgress | null>(null);
  const [nearingLimit, setNearingLimit] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatRef = useRef<HTMLDivElement | null>(null);
  const toggleButtonRef = useRef<HTMLDivElement | null>(null);
  const currentAnswerRef = useRef<string>("");

  // Typewriter effect state
  const [displayedContent, setDisplayedContent] = useState<string>("");
  const [targetContent, setTargetContent] = useState<string>("");
  const [assistantMsgIndex, setAssistantMsgIndex] = useState<number>(-1);

  // Close chat when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

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
    setSources([]);
    setStreamProgress(null);
    setNearingLimit(false);
    currentAnswerRef.current = "";

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(nextMessages);
    setInput("");

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
            // Update target for typewriter effect - don't update messages directly
            setTargetContent(currentAnswerRef.current);
            setAssistantMsgIndex(assistantIndex);
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
  }

  // Typewriter effect - progressively display content
  useEffect(() => {
    if (displayedContent.length >= targetContent.length) return;

    // Display 8 characters at a time
    const charsToAdd = Math.min(8, targetContent.length - displayedContent.length);

    const timeoutId = setTimeout(() => {
      const newDisplayed = targetContent.slice(0, displayedContent.length + charsToAdd);
      setDisplayedContent(newDisplayed);

      // Update the message with displayed content
      if (assistantMsgIndex >= 0) {
        setMessages((prev) => {
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
    }, 10); // 8 chars every 10ms

    return () => clearTimeout(timeoutId);
  }, [displayedContent, targetContent, assistantMsgIndex]);

  // Reset typewriter state when starting new message
  useEffect(() => {
    if (isSending) {
      setDisplayedContent("");
      setTargetContent("");
      setAssistantMsgIndex(-1);
    }
  }, [isSending]);

  // Auto-scroll to latest message
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
  }, [messages, streamProgress]);

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
                      setSources([]);
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
                      {messages
                        .filter((m) => m.role === "user" || m.content.length > 0)
                        .map((m, idx) => {
                          const isUser = m.role === "user";
                          const isWarning = m.content.startsWith("⚠️ Konteks percakapan hampir penuh");
                          return (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2 }}
                              className={`flex ${isUser ? "justify-end" : "justify-start"
                                }`}
                            >
                              <div
                                className={`max-w-[80%] rounded-2xl px-3 py-2 ${isUser
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

                      {(streamProgress || isSending) && (
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          {streamProgress?.action === "searching" ? (
                            <Search className="h-3 w-3 animate-pulse text-primary" />
                          ) : (
                            <Loader2 className="h-3 w-3 animate-spin text-primary" />
                          )}
                          <span className="animate-shimmer-text">
                            {streamProgress
                              ? (ACTION_LABELS[streamProgress.action] || "memproses...")
                              : "menghubungkan..."}
                            {streamProgress?.query && (
                              <span className="text-muted-foreground/60 ml-1">
                                &quot;{streamProgress.query.slice(0, 30)}...
                              </span>
                            )}
                          </span>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                )}

                {sources && sources.length > 0 && (
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
                              {sources
                                .slice(0, 3)
                                .map((source: RagChatSource, index: number) => (
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
