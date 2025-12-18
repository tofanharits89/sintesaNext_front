"use client";

import { RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface ChatHeaderProps {
    onReset: () => void;
}

/**
 * Chat header with branding and reset button.
 */
export function ChatHeader({ onReset }: ChatHeaderProps) {
    return (
        <CardHeader className="flex flex-row items-start justify-between gap-2 !p-3 m-4 bg-gradient-to-r from-teal-100 to-sky-200 dark:bg-background rounded-lg">
            <div className="flex items-center gap-4">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Sparkles className="h-4 w-4" />
                </span>
                <div className="flex flex-col">
                    <CardTitle className="text-sm">Shinta</CardTitle>
                    <CardDescription className="text-xs">
                        SINTESA Hi-Quality Information Trusted Assistant
                    </CardDescription>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-xs"
                    title="Mulai sesi baru"
                    onClick={onReset}
                >
                    <RotateCcw className="h-3 w-3" />
                </Button>
            </div>
        </CardHeader>
    );
}
