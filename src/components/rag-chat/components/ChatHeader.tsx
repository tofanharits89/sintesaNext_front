"use client";

import { RotateCcw, Sparkles } from "lucide-react";
import {
    RippleButton,
    RippleButtonRipples,
} from "@/components/animate-ui/components/buttons/ripple";
import {
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface ChatHeaderProps {
    onReset: () => void;
    disabled?: boolean;
}

/**
 * Chat header with branding and reset button.
 */
export function ChatHeader({ onReset, disabled }: ChatHeaderProps) {
    return (
        <CardHeader className="flex flex-row items-center justify-between gap-2 !p-3 m-4 bg-gradient-to-r from-teal-100 to-sky-200 dark:from-slate-800 dark:to-slate-900 rounded-lg">
            <div className="flex items-center gap-4">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Sparkles className="h-4 w-4" />
                </span>
                <div className="flex flex-col">
                    <CardTitle className="text-sm">Shinta <span className="text-xs font-normal text-muted-foreground">(Beta)</span></CardTitle>
                    <CardDescription className="text-xs">
                        SINTESA Hi-Quality Information Trusted Assistant
                    </CardDescription>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <RippleButton
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="Mulai sesi baru"
                    onClick={onReset}
                    disabled={disabled}
                >
                    <RotateCcw className="h-3 w-3" />
                    <RippleButtonRipples />
                </RippleButton>
            </div>
        </CardHeader>
    );
}
