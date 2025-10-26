import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ComponentLoadingFallback } from "@/components/ui/loading-fallback";
import { Suspense, ReactNode } from "react";

interface LazyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  fallback?: ReactNode;
}

export function LazyModal({ open, onOpenChange, children, fallback }: LazyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <Suspense fallback={fallback || <ComponentLoadingFallback />}>
          {children}
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}
