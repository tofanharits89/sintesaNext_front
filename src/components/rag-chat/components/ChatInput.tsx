"use client";

import { useRef, useEffect } from "react";

import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CardFooter } from "@/components/ui/card";

interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    disabled: boolean;
}

/**
 * Chat input form with text field and send button.
 */
export function ChatInput({ value, onChange, onSend, disabled }: ChatInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    return (
        <CardFooter className="!p-4 !pt-0 flex flex-col gap-1">
            <form
                className="w-full relative"
                onSubmit={(e) => {
                    e.preventDefault();
                    onSend();
                }}
            >
                <Textarea
                    ref={textareaRef}
                    className="min-h-[60px] max-h-[100px] text-xs md:text-[13px] resize-none w-full overflow-y-auto pr-14 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                    placeholder="Tulis pertanyaan..."
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    rows={1}
                />
                <Button
                    type="submit"
                    size="icon"
                    disabled={disabled || value.trim().length === 0}
                    className="absolute bottom-2 right-2 h-8 w-8"
                >
                    {disabled ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                </Button>
            </form>
        </CardFooter>
    );
}
