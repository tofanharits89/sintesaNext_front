"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { withBasePath } from "@/lib/base-path";
import { backendPath } from "@/lib/backend";

export function RetryActions() {
  return (
    <div className="flex gap-3">
      <Button
        onClick={() => {
          fetch(backendPath("/auth/health"), { cache: "no-store" })
            .then((res) => {
              if (res.ok) {
                window.location.href = withBasePath("/dashboard");
              } else {
                window.location.reload();
              }
            })
            .catch(() => window.location.reload());
        }}
        className="gap-2 cursor-pointer"
      >
        <RefreshCw className="h-4 w-4" />
        Coba Lagi
      </Button>
    </div>
  );
}
