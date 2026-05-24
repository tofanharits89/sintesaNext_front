"use client";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DetailProps {
  showModal: boolean;
  handleCloseModal: () => void;
  selectedDetail?: string | null;
  token?: string | null;
  id?: string | null;
  bgcolor?: string;
}

export default function Detail({
  showModal,
  handleCloseModal,
  selectedDetail,
}: DetailProps) {
  return (
    <Dialog open={showModal} onOpenChange={(open) => !open && handleCloseModal()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detail</DialogTitle>
        </DialogHeader>
        <div>Selected detail: {selectedDetail}</div>
        {/* Add more detailed rendering here */}
      </DialogContent>
    </Dialog>
  );
}
