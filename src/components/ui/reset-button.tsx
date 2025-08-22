"use client";

import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface ResetButtonProps {
  onReset: () => void;
  className?: string;
}

export function ResetButton({ onReset, className }: ResetButtonProps) {
  return (
    <Button variant="outline" size="sm" onClick={onReset} className={className}>
      <RotateCcw className="h-4 w-4 mr-2" />
      Reset
    </Button>
  );
}
