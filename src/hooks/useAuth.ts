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
          } catch {
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
      const headers = deviceHeaders ?? buildDeviceHeaders(ensureMetadata());
      const config: AxiosRequestConfig | undefined = headers
        ? { headers: headers as AxiosRequestHeaders }
        : undefined;
      await apiClient.post(backendPath("/auth/logout"), {}, config);
    },
    onSuccess: () => {
      cacheInvalidation.invalidateUser(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeyFactories.user.profile() });
      toast.success("Anda telah keluar");
    },
    onError: (error) => {
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
