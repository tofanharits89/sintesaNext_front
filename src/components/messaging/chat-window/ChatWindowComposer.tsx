"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Smile, Paperclip, Image, FileText, X, Send } from "lucide-react";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

interface ChatWindowComposerProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  messageContent: string;
  isSending: boolean;
  attachedFiles: File[];
  onAttachmentsChange: (files: File[]) => void;
  onMessageChange: (value: string) => void;
  onSend: () => Promise<void> | void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  isTyping: boolean;
}

export function ChatWindowComposer({
  inputRef,
  messageContent,
  isSending,
  attachedFiles,
  onAttachmentsChange,
  onMessageChange,
  onSend,
  onTypingStart,
  onTypingStop,
  isTyping,
}: ChatWindowComposerProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = useCallback(
    (value: string) => {
      onMessageChange(value);

      const trimmed = value.trim();
      if (trimmed && !isTyping) {
        onTypingStart();
      } else if (!trimmed && isTyping) {
        onTypingStop();
      }
    },
    [onMessageChange, onTypingStart, onTypingStop, isTyping],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void onSend();
      }
    },
    [onSend],
  );

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileAttach = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files) {
        const newFiles = Array.from(files);
        onAttachmentsChange([...attachedFiles, ...newFiles]);
      }
      if (event.target) {
        event.target.value = "";
      }
    },
    [attachedFiles, onAttachmentsChange],
  );

  const removeAttachedFile = useCallback(
    (index: number) => {
      onAttachmentsChange(attachedFiles.filter((_, i) => i !== index));
    },
    [attachedFiles, onAttachmentsChange],
  );

  const handleEmojiClick = useCallback(
    (emojiData: any) => {
      onMessageChange(messageContent + (emojiData?.emoji || ""));
      setShowEmojiPicker(false);
      inputRef.current?.focus();
    },
    [messageContent, onMessageChange, inputRef],
  );

  return (
    <div className="border-t p-4 flex-shrink-0">
      {attachedFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachedFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm"
            >
              {file.type.startsWith("image/") ? (
                <Image className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              <span className="truncate max-w-[150px]">{file.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0"
                onClick={() => removeAttachedFile(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={triggerFileInput}
          className="flex-shrink-0"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileAttach}
          className="hidden"
        />

        <Input
          ref={inputRef}
          value={messageContent}
          onChange={(event) => handleInputChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1"
        />

        <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="flex-shrink-0">
              <Smile className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" side="top" align="end">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              width={300}
              height={400}
            />
          </PopoverContent>
        </Popover>

        <Button
          onClick={() => void onSend()}
          disabled={
            (!messageContent.trim() && attachedFiles.length === 0) || isSending
          }
          size="icon"
          className="flex-shrink-0"
          aria-busy={isSending}
          aria-label={isSending ? "Sending message" : "Send message"}
          title={isSending ? "Sending…" : "Send"}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
