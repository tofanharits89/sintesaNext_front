"use client";

import { MessageCircle, X } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { forwardRef } from "react";

interface ChatToggleButtonProps {
    isOpen: boolean;
    onToggle: () => void;
}

/**
 * Floating action button to toggle chat visibility.
 */
export const ChatToggleButton = forwardRef<HTMLDivElement, ChatToggleButtonProps>(
    function ChatToggleButton({ isOpen, onToggle }, ref) {
        return (
            <motion.div
                ref={ref}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
                <Button
                    type="button"
                    size="icon-lg"
                    className="rounded-full shadow-xl"
                    onClick={onToggle}
                    aria-label={isOpen ? "Tutup asisten" : "Buka asisten"}
                >
                    <motion.div
                        initial={false}
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {isOpen ? (
                            <X className="h-5 w-5" />
                        ) : (
                            <MessageCircle className="h-5 w-5" />
                        )}
                    </motion.div>
                </Button>
            </motion.div>
        );
    }
);
