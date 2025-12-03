"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { sendRagMessage, RagChatResponse } from "@/lib/api/rag-chat";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  role: ChatRole;
  content: string;
}

/**
 * Floating RAG chatbot widget.
 *
 * - Fixed to bottom-right of the screen
 * - Minimal state handling and styling so it can be extended later
 */
export function RagChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<RagChatResponse | null>(
    null,
  );

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    setError(null);
    setIsSending(true);

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(nextMessages);
    setInput("");

    try {
      const response = await sendRagMessage({ message: trimmed });
      setLastResponse(response);
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: response.answer || "(Asisten tidak memberikan jawaban)",
        },
      ]);
    } catch (err: any) {
      setError(
        err?.message ||
          "Terjadi kesalahan saat menghubungi asisten. Silakan coba lagi.",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="rounded-full bg-blue-600 text-white shadow-lg px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {isOpen ? "Tutup Asisten" : "Tanya Asisten"}
        </button>
      </div>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-16 right-4 z-50 w-80 max-w-full bg-background border border-border rounded-lg shadow-xl flex flex-col">
          <div className="px-3 py-2 border-b border-border text-sm font-semibold">
            Asisten Pintar (RAG)
          </div>

          <div className="flex-1 max-h-72 overflow-y-auto px-3 py-2 text-sm space-y-2">
            {messages.length === 0 && (
              <p className="text-muted-foreground">
                Mulai percakapan dengan mengetik pertanyaan Anda.
              </p>
            )}
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={m.role === "user" ? "text-right" : "text-left"}
              >
                <div
                  className={
                    m.role === "user"
                      ? "inline-block rounded-lg bg-blue-600 text-white px-2 py-1 text-left"
                      : "inline-block rounded-lg bg-muted text-foreground px-2 py-1 text-left"
                  }
                >
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
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="px-3 py-1 text-xs text-red-600 border-t border-border">
              {error}
            </div>
          )}

          {/* Basic sources preview for the last answer (optional, can be enhanced later) */}
          {lastResponse?.sources && lastResponse.sources.length > 0 && (
            <div className="px-3 py-2 border-t border-border max-h-24 overflow-y-auto">
              <p className="text-[11px] font-semibold mb-1 text-muted-foreground">
                Sumber terkait:
              </p>
              <ul className="space-y-1">
                {lastResponse.sources.slice(0, 3).map((source, index) => (
                  <li key={index} className="text-[11px] text-muted-foreground">
                    • {source.title || source.id || "Sumber tanpa judul"}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <form
            className="flex items-center gap-1 px-2 py-2 border-t border-border"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
          >
            <input
              className="flex-1 bg-transparent border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Tulis pertanyaan..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={isSending}
              className="text-sm px-2 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
            >
              Kirim
            </button>
          </form>
        </div>
      )}
    </>
  );
}
