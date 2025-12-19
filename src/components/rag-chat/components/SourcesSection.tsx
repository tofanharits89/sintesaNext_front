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
 * AI disclaimer and sources display section.
 * Always visible to maintain consistent chat height.
 * Shows sources tooltip only when sources are available.
 */
export function SourcesSection({ sources }: SourcesSectionProps) {
    const hasSources = sources && sources.length > 0;

    return (
        <div className="px-6 p-4">
            <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-muted-foreground/80 italic">
                    cek ulang, shinta bisa salah
                </span>
                {hasSources && (
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">
                            Sumber terkait
                        </span>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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
                )}
            </div>
        </div>
    );
}
