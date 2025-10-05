"use client";

import { useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/httpClient";
import { collectDeviceMetadata, DeviceMetadata } from "@/utils/deviceInfo";
import { toast } from "sonner";
import { createQueryOptions, queryKeyFactories, cacheInvalidation } from "@/lib/query-configs";
import { logger } from "@/lib/utils";
import type { AxiosRequestConfig, AxiosRequestHeaders } from "axios";

interface AuthStatusResponse {
  isAuthenticated: boolean;
  user?: unknown;
}

type DeviceHeaders = Record<string, string>;

function buildDeviceHeaders(metadata: DeviceMetadata | null): DeviceHeaders | undefined {
  if (!metadata || !metadata.deviceId) {
    return undefined;
  }

  const headers: DeviceHeaders = {
    "X-Device-Id": metadata.deviceId,
  };

  if (metadata.timezone) headers["X-Device-Timezone"] = metadata.timezone;
  if (metadata.locale) headers["X-Device-Locale"] = metadata.locale;
  if (metadata.platform) headers["X-Device-Platform"] = metadata.platform;

  return headers;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const deviceMetadataRef = useRef<DeviceMetadata | null>(null);

  const ensureMetadata = () => {
    if (typeof window === "undefined") return null;
    if (!deviceMetadataRef.current) {
      deviceMetadataRef.current = collectDeviceMetadata();
    }
    return deviceMetadataRef.current;
  };

  const deviceHeaders = useMemo(() => buildDeviceHeaders(ensureMetadata()), []);

  const authQuery = useQuery<AuthStatusResponse>({
    queryKey: queryKeyFactories.user.profile(),
    queryFn: async () => {
      const headers = deviceHeaders ?? buildDeviceHeaders(ensureMetadata());
      const config: AxiosRequestConfig | undefined = headers
        ? { headers: headers as AxiosRequestHeaders }
        : undefined;
      try {
        // Prefer frontend API bridge: GET /api/auth/me
        const res = await apiClient.get<{ success: boolean; data?: any }>("/auth/me", config);
        if (res && (res as any).success) {
          return { isAuthenticated: true, user: (res as any).data } as AuthStatusResponse;
        }
        // Fallback shape
        return { isAuthenticated: !!(res as any)?.data, user: (res as any)?.data } as AuthStatusResponse;
      } catch (err: any) {
        // If unauthorized, attempt a one-time silent refresh then retry once
        const status = err?.response?.status;
        if (status === 401) {
          try {
            await apiClient.post("/auth/refresh", {});
            const res2 = await apiClient.get<{ success: boolean; data?: any }>("/auth/me", config);
            if (res2 && (res2 as any).success) {
              return { isAuthenticated: true, user: (res2 as any).data } as AuthStatusResponse;
            }
            return { isAuthenticated: !!(res2 as any)?.data, user: (res2 as any)?.data } as AuthStatusResponse;
          } catch (refreshError) {
            // Refresh failed - session is truly invalid
            // Cookies are already cleared by httpClient interceptor
            logger.warn('Session invalid and refresh failed - user needs to log in again');

            // Clear validation cache to prevent stale auth state
            import("@/utils/auth-state-manager").then(({ simpleAuthValidator }) => {
              simpleAuthValidator.clearCache();
            }).catch(() => {
              // Ignore if auth state manager is not available
            });

            return { isAuthenticated: false } as AuthStatusResponse;
          }
        }
        throw err;
      }
    },
    ...createQueryOptions("critical", {
      refetchInterval: 30000,
    }),
    refetchIntervalInBackground: true,
  });

  const logout = useMutation({
    mutationFn: async () => {
      // Prefer frontend API bridge to ensure HttpOnly cookies are cleared on this origin
      const url = `/api/auth/logout?t=${Date.now()}`;
      try {
        await fetch(url, {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        });
      } catch (e) {
        // Fall back to backend endpoint if bridge fails (network issues)
        const headers = deviceHeaders ?? buildDeviceHeaders(ensureMetadata());
        const config: AxiosRequestConfig | undefined = headers
          ? { headers: headers as AxiosRequestHeaders }
          : undefined;
        try {
          await apiClient.post("/auth/logout", {}, config);
        } catch (inner) {
          throw inner;
        }
      }
    },
    onMutate: async () => {
      // ENTERPRISE PATTERN: Optimistic update - clear auth state BEFORE API call completes
      // This prevents the glimpse by immediately updating UI
      await queryClient.cancelQueries({ queryKey: queryKeyFactories.user.profile() });
      
      // Immediately set auth state to logged out
      queryClient.setQueryData(queryKeyFactories.user.profile(), {
        isAuthenticated: false,
        user: null
      });

      // Clear validation cache immediately
      import("@/utils/auth-state-manager").then(({ simpleAuthValidator }) => {
        simpleAuthValidator.clearCache();
      }).catch(() => {});

      return { previousAuth: queryClient.getQueryData(queryKeyFactories.user.profile()) };
    },
    onSuccess: () => {
      cacheInvalidation.invalidateUser(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeyFactories.user.profile() });

      // CRITICAL FIX: Dispatch auth logout event for messaging components
      // This ensures messaging components clean up their state properly
      import("@/utils/auth-events").then(({ dispatchLogout }) => {
        dispatchLogout("User logged out");

        // Also dispatch a generic auth state change event
        window.dispatchEvent(new CustomEvent('auth:state-change', {
          detail: { authenticated: false, user: null }
        }));

        // Force socket disconnection to clean up messaging connections
        import("@/lib/socket").then(({ disconnectSocket }) => {
          try {
            disconnectSocket();
            logger.info("Socket disconnected during logout");
          } catch (socketError) {
            logger.error("Failed to disconnect socket during logout", socketError);
          }
        }).catch((error) => {
          logger.error("Failed to import socket during logout", error);
        });

      }).catch((error) => {
        logger.error("Failed to dispatch logout event", error);
      });

      toast.success("Anda telah keluar");
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousAuth) {
        queryClient.setQueryData(queryKeyFactories.user.profile(), context.previousAuth);
      }
      logger.error("Logout error", error);
      toast.error("Gagal logout");
    },
  });

  return {
    isAuthenticated: !!authQuery.data?.isAuthenticated,
    isLoading: authQuery.isLoading,
    user: authQuery.data?.user,
    error: authQuery.error,
    logout: logout.mutate,
    logoutAsync: logout.mutateAsync,
    isLoggingOut: logout.isPending,
    refetch: authQuery.refetch,
    deviceMetadata: deviceMetadataRef.current,
  };
}

export function useRequireAuth() {
  const auth = useAuth();

  if (auth.isLoading) {
    return { ...auth, isLoading: true };
  }

  if (!auth.isAuthenticated || !auth.user) {
    throw new Error("Authentication required");
  }

  return { ...auth, isLoading: false, user: auth.user };
}
