import { ComponentType } from "react";
import { Loader2, Search, Sparkles, Brain, Bot, Cloud } from "lucide-react";
import { StreamProgress as StreamProgressType, ACTION_LABELS } from "../types";

interface StreamProgressProps {
    progress: StreamProgressType | null;
    isSending: boolean;
    agentName?: string | null;
}

/**
 * Streaming progress indicator showing current operation status.
 * Only shows when there's actual progress to display (thinking/searching state).
 * Hidden when content is streaming (progress is null).
 */
export function StreamProgress({ progress, agentName }: StreamProgressProps) {
    if (!progress) return null;

    let Icon: ComponentType<{ className?: string }> = Loader2;
    let iconClass = "h-3 w-3 animate-spin text-primary";
    let statusText = ACTION_LABELS[progress.action] || "memproses...";

    // Customize based on agent
    if (agentName === "khodam") {
        Icon = Sparkles;
        iconClass = "h-3 w-3 animate-pulse text-purple-500";
        if (progress.action === "thinking") statusText = "menerawang...";
        if (progress.action === "searching") {
            Icon = Cloud;
            iconClass = "h-3 w-3 animate-pulse text-purple-500";
            statusText = "menembus dimensi...";
        }
        if (progress.action === "answering") statusText = "mengirim wangsit...";
    } else {
        // Default behavior (General / RAG)
        if (progress.action === "thinking") {
            Icon = Brain; // Thinking uses Brain
            iconClass = "h-3 w-3 animate-pulse text-teal-500";
        } else if (progress.action === "connecting") {
            Icon = Loader2; // Connecting uses Spinner
            iconClass = "h-3 w-3 animate-spin text-teal-500";
        }

        if (agentName === "rag") {
            // RAG specific (currently just re-affirming Brain, but could be specific color)
            if (progress.action === "thinking") {
                Icon = Brain;
                iconClass = "h-3 w-3 animate-pulse text-blue-500";
                if (progress.step > 1) {
                    statusText = "menelaah data untuk disajikan...";
                } else {
                    statusText = "menganalisis pertanyaan...";
                }
            }
        }
    }

    // Override for specific actions regardless of agent (except khodam which is handled above)
    if (progress.action === "searching" && agentName !== "khodam") {
        Icon = Search;
        iconClass = "h-3 w-3 animate-pulse text-blue-500";
    }

    return (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Icon className={iconClass} />
            <span className="animate-shimmer-text leading-none">
                {statusText}
            </span>
        </div>
    );
}
