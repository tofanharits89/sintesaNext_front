"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface LoginLoadingProps {
  isVisible: boolean;
  message?: string;
}

export function LoginLoading({ isVisible, message = "Sedang memuat halaman..." }: LoginLoadingProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
    } else {
      // Delay hiding to prevent flash
      const timer = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-md z-[9999] flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4 bg-card p-6 rounded-lg shadow-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}