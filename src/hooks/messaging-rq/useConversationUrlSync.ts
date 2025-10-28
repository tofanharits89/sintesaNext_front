"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface ConversationUrlSyncOptions {
  activeConversationId: string | null | undefined;
  selectConversation: (conversationId: string) => void;
}

interface ConversationUrlSyncResult {
  handleConversationSelect: (conversationId: string) => void;
}

const TEMP_PREFIXES = ["temp-", "temp_conv-", "temp-conv-"];

const isTempConversation = (conversationId: string | null | undefined) =>
  !!conversationId && TEMP_PREFIXES.some((prefix) => conversationId.startsWith(prefix));

/**
 * Encapsulates URL ↔ store synchronization for the messaging conversations page.
 */
export function useConversationUrlSync({
  activeConversationId,
  selectConversation,
}: ConversationUrlSyncOptions): ConversationUrlSyncResult {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [urlConversationId, setUrlConversationId] = useState<string | null>(null);

  useEffect(() => {
    setUrlConversationId(searchParams?.get("conversation") || null);
  }, [searchParams]);

  useEffect(() => {
    if (urlConversationId && urlConversationId !== activeConversationId) {
      selectConversation(urlConversationId);
    } else if (!urlConversationId && activeConversationId) {
      selectConversation("");
    }
  }, [urlConversationId, activeConversationId, selectConversation]);

  useEffect(() => {
    if (!activeConversationId) return;
    if (!isTempConversation(activeConversationId)) return;
    // Do not overwrite a real conversation in the URL with a temp one
    if (urlConversationId && !isTempConversation(urlConversationId)) return;
    if (urlConversationId === activeConversationId) return;

    const params = new URLSearchParams(window.location.search);
    params.set("conversation", activeConversationId);
    router.replace(`${pathname}?${params.toString()}`);
  }, [activeConversationId, urlConversationId, router, pathname]);

  const handleConversationSelect = useCallback(
    (conversationId: string) => {
      const params = new URLSearchParams(window.location.search);
      params.set("conversation", conversationId);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname],
  );

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      const conversationId = detail.conversationId as string | undefined;
      if (!conversationId) return;
      handleConversationSelect(conversationId);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("conversation:created", handler as EventListener);
      window.addEventListener("conversation:selected", handler as EventListener);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("conversation:created", handler as EventListener);
        window.removeEventListener("conversation:selected", handler as EventListener);
      }
    };
  }, [handleConversationSelect]);

  return { handleConversationSelect };
}
