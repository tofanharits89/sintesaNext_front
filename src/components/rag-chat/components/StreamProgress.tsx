"use client";

import { Loader2, Search } from "lucide-react";
import { StreamProgress as StreamProgressType, ACTION_LABELS } from "../types";

interface StreamProgressProps {
    progress: StreamProgressType | null;
    isSending: boolean;
}

/**
 * Streaming progress indicator showing current operation status.
 * Only shows when there's actual progress to display (thinking/searching state).
 * Hidden when content is streaming (progress is null).
 */
export function StreamProgress({ progress }: StreamProgressProps) {
    if (!progress) return null;

    return (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            {progress.action === "searching" ? (
                <Search className="h-3 w-3 animate-pulse text-primary" />
            ) : (
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
            )}
            <span className="animate-shimmer-text">
                {ACTION_LABELS[progress.action] || "memproses..."}
                {progress.query && (
                    <span className="text-muted-foreground/60 ml-1">
                        &quot;{progress.query.slice(0, 30)}...
                    </span>
                )}
            </span>
        </div>
    );
}
