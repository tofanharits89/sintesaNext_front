import type { QueryClient } from "@tanstack/react-query";
import { queryKeyFactories } from "@/lib/query-configs";
import type { FrontendMessage } from "@/types/socket-events";

type PaginationSeed = {
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
};

interface MessagePageData {
  messages?: FrontendMessage[];
  pagination?: PaginationSeed | Record<string, unknown>;
  [key: string]: unknown;
}

interface MessagePage {
  data?: MessagePageData;
  [key: string]: unknown;
}

interface MessageCacheShape {
  pages?: MessagePage[];
  pageParams?: unknown[];
  [key: string]: unknown;
}

interface ApplyMessageArgs {
  queryClient: QueryClient;
  userId?: string | null;
  conversationId?: string | null;
  message: FrontendMessage & Record<string, unknown>;
  tempId?: string | null;
  seedPagination?: PaginationSeed;
}

const defaultSeedPagination: PaginationSeed = {
  page: 1,
  limit: 50,
  total: 1,
  hasMore: false,
};

export function getMessageCacheKey(
  userId: string | null | undefined,
  conversationId: string | null | undefined,
) {
  return queryKeyFactories.messaging.messages(
    userId ?? null,
    conversationId ?? "",
  );
}

export function applyMessageToCache({
  queryClient,
  userId,
  conversationId,
  message,
  tempId,
  seedPagination,
}: ApplyMessageArgs) {
  const messageConversationId =
    message.conversationId ??
    (message as { conversation_id?: string }).conversation_id ??
    null;

  const effectiveConversationId =
    conversationId ?? messageConversationId ?? null;

  if (!effectiveConversationId) {
    return;
  }

  const cacheKey = getMessageCacheKey(userId ?? null, effectiveConversationId);

  const messageForCache: FrontendMessage & Record<string, unknown> = {
    ...message,
    conversationId: messageConversationId ?? effectiveConversationId,
    conversation_id:
      (message as { conversation_id?: string }).conversation_id ??
      effectiveConversationId,
  };

  queryClient.setQueryData(
    cacheKey,
    (previousCache: MessageCacheShape | undefined) => {
      const previousPages = Array.isArray(previousCache?.pages)
        ? previousCache.pages
        : undefined;

      if (
        !previousPages ||
        previousPages.length === 0 ||
        !Array.isArray(previousPages[0]?.data?.messages)
      ) {
        const pagination =
          (previousPages?.[0]?.data?.pagination as
            | PaginationSeed
            | undefined) ??
          seedPagination ??
          defaultSeedPagination;

        return {
          pages: [
            {
              ...(previousPages?.[0] ?? {}),
              data: {
                ...(previousPages?.[0]?.data ?? {}),
                messages: [messageForCache],
                pagination,
              },
            },
          ],
          pageParams: Array.isArray(previousCache?.pageParams)
            ? [...previousCache.pageParams]
            : [undefined],
        } satisfies MessageCacheShape;
      }

      const clonedPages = previousPages.map((page) => ({
        ...page,
        data: { ...(page.data ?? {}) },
      }));

      const lastIndex = clonedPages.length - 1;
      const lastPage = clonedPages[lastIndex];
      if (!lastPage) {
        return previousCache;
      }
      const existingMessages = Array.isArray(lastPage.data?.messages)
        ? [...(lastPage.data!.messages as FrontendMessage[])]
        : [];

      if (tempId) {
        const tempIndex = existingMessages.findIndex(
          (item) => item?.id === tempId,
        );
        if (tempIndex !== -1) {
          existingMessages.splice(tempIndex, 1);
        }
      }

      const messageId = messageForCache.id ?? tempId ?? null;
      const existingIndex =
        messageId != null
          ? existingMessages.findIndex((item) => item?.id === messageId)
          : -1;

      const normalizedFlags = {
        _sending: (messageForCache as { _sending?: boolean })._sending ?? false,
        _failed: (messageForCache as { _failed?: boolean })._failed ?? false,
      };

      if (existingIndex !== -1) {
        const existing = existingMessages[existingIndex] as FrontendMessage &
          Record<string, unknown>;
        const mergedMessage: FrontendMessage & Record<string, unknown> = {
          ...existing,
          ...messageForCache,
          _failed:
            normalizedFlags._failed ??
            (existing as { _failed?: boolean })._failed ??
            false,
          _sending: normalizedFlags._sending,
        };
        existingMessages[existingIndex] = mergedMessage;
      } else {
        existingMessages.push({
          ...messageForCache,
          ...normalizedFlags,
        });
      }

      lastPage.data = {
        ...(lastPage.data ?? {}),
        messages: existingMessages,
      };
      clonedPages[lastIndex] = lastPage;

      return {
        ...previousCache,
        pages: clonedPages,
        pageParams: Array.isArray(previousCache?.pageParams)
          ? [...previousCache.pageParams!]
          : [undefined],
      } satisfies MessageCacheShape;
    },
  );
}
