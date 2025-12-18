"use client";

import { Info } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { RagChatSource } from "../types";

interface SourcesSectionProps {
    sources: RagChatSource[];
}

/**
 * Sources display section with tooltip showing source list.
 */
export function SourcesSection({ sources }: SourcesSectionProps) {
    if (!sources || sources.length === 0) return null;

    return (
        <div className="border-t border-border/50 px-4 pt-3">
            <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-muted-foreground/80 italic">
                    cek ulang, shinta bisa salah
                </span>
                <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">
                        Sumber terkait
                    </span>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground text-[10px]"
                            >
                                <Info className="h-3 w-3" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-left">
                            <div className="space-y-1">
                                {sources
                                    .slice(0, 3)
                                    .map((source: RagChatSource, index: number) => (
                                        <div
                                            key={index}
                                            className="text-[11px] leading-snug"
                                        >
                                            •{" "}
                                            {source.title ||
                                                source.id ||
                                                "Sumber tanpa judul"}
                                        </div>
                                    ))}
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </div>
        </div>
    );
}
