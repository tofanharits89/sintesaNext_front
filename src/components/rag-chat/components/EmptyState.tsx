"use client";

import { Sparkles } from "lucide-react";

/**
 * Empty state display when no messages exist.
 */
export function EmptyState() {
    return (
        <div className="flex h-96 flex-col items-center justify-center gap-2 px-4 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-xs font-semibold text-muted-foreground/50">
                Mulai percakapan dengan mengetik pertanyaan di bawah.
            </p>
        </div>
    );
}
