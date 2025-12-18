"use client";

import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    return (
        <CardFooter className="border-t px-4 flex flex-col gap-1">
            <form
                className="flex w-full items-center gap-2"
                onSubmit={(e) => {
                    e.preventDefault();
                    onSend();
                }}
            >
                <Input
                    className="h-9 text-sm"
                    placeholder="Tulis pertanyaan..."
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                />
                <Button
                    type="submit"
                    size="icon"
                    disabled={disabled || value.trim().length === 0}
                    className="shrink-0"
                >
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </CardFooter>
    );
}
