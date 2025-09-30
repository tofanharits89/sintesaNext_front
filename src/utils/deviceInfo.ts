"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "sintesaDeviceId";

function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const randomId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(STORAGE_KEY, randomId);
    return randomId;
  } catch {
    return "";
  }
}

export interface DeviceMetadata {
  deviceId: string;
  timezone?: string;
  locale?: string;
  platform?: string;
}

export function collectDeviceMetadata(): DeviceMetadata {
  if (typeof window === "undefined") {
    return { deviceId: "" };
  }

  const deviceId = getOrCreateDeviceId();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const locale = navigator.language;
  const platform = navigator.userAgentData?.platform || navigator.platform;

  return {
    deviceId,
    timezone,
    locale,
    platform,
  };
}

export function useDeviceMetadata(): DeviceMetadata {
  const [metadata, setMetadata] = useState<DeviceMetadata>(() => collectDeviceMetadata());
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    setMetadata(collectDeviceMetadata());
  }, []);

  return metadata;
}
