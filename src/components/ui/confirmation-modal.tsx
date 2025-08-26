"use client";

import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Trash2, Info, CheckCircle } from "lucide-react";
import { ButtonSpinner } from "./loading-states";

interface ConfirmationModalProps {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "warning" | "info";
  onConfirm: () => Promise<void> | void;
  onCancel?: () => void;
  requireConfirmation?: boolean;
  confirmationText?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

/**
 * Reusable confirmation modal for destructive or important actions
 * Supports different variants and optional confirmation checkbox
 */
export function ConfirmationModal({
  trigger,
  title,
  description,
  confirmText = "Konfirmasi",
  cancelText = "Batal",
  variant = "warning",
  onConfirm,
  onCancel,
  requireConfirmation = false,
  confirmationText = "Saya memahami konsekuensi dari tindakan ini",
  disabled = false,
  children,
}: ConfirmationModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const getVariantConfig = () => {
    switch (variant) {
      case "destructive":
        return {
          icon: Trash2,
          iconColor: "text-red-600",
          buttonClass: "bg-red-600 hover:bg-red-700 text-white",
          titleColor: "text-red-600",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          iconColor: "text-yellow-600",
          buttonClass: "bg-yellow-600 hover:bg-yellow-700 text-white",
          titleColor: "text-yellow-600",
        };
      case "info":
        return {
          icon: Info,
          iconColor: "text-blue-600",
          buttonClass: "bg-blue-600 hover:bg-blue-700 text-white",
          titleColor: "text-blue-600",
        };
      default:
        return {
          icon: CheckCircle,
          iconColor: "text-green-600",
          buttonClass: "bg-green-600 hover:bg-green-700 text-white",
          titleColor: "text-green-600",
        };
    }
  };

  const config = getVariantConfig();
  const IconComponent = config.icon;

  const handleConfirm = async () => {
    if (requireConfirmation && !isConfirmed) {
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm();
      setIsOpen(false);
      setIsConfirmed(false);
    } catch (error) {
      console.error("Confirmation action failed:", error);
      // Error handling is done by the parent component
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      setIsOpen(false);
      setIsConfirmed(false);
      if (onCancel) {
        onCancel();
      }
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!isLoading) {
      setIsOpen(open);
      if (!open) {
        setIsConfirmed(false);
      }
    }
  };

  const canConfirm = !requireConfirmation || isConfirmed;

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild disabled={disabled}>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className={`flex items-center gap-2 ${config.titleColor}`}>
            <IconComponent className="w-5 h-5" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Custom content */}
        {children && (
          <div className="py-4">
            {children}
          </div>
        )}

        {/* Confirmation checkbox */}
        {requireConfirmation && (
          <div className="flex items-center space-x-2 py-4">
            <Checkbox
              id="confirmation"
              checked={isConfirmed}
              onCheckedChange={(checked) => setIsConfirmed(checked as boolean)}
              disabled={isLoading}
            />
            <label
              htmlFor="confirmation"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {confirmationText}
            </label>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isLoading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading || !canConfirm}
            className={config.buttonClass}
          >
            {isLoading ? (
              <>
                <ButtonSpinner className="mr-2" />
                Memproses...
              </>
            ) : (
              <>
                <IconComponent className="w-4 h-4 mr-2" />
                {confirmText}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Pre-configured confirmation modals for common actions
 */
export const ConfirmationModals = {
  Delete: ({ trigger, itemName, onConfirm, ...props }: {
    trigger: React.ReactNode;
    itemName: string;
    onConfirm: () => Promise<void> | void;
  } & Partial<ConfirmationModalProps>) => (
    <ConfirmationModal
      trigger={trigger}
      title={`Hapus ${itemName}?`}
      description={`Apakah Anda yakin ingin menghapus "${itemName}"? Tindakan ini tidak dapat dibatalkan.`}
      confirmText="Hapus"
      variant="destructive"
      onConfirm={onConfirm}
      {...props}
    />
  ),

  BulkDelete: ({ trigger, count, onConfirm, ...props }: {
    trigger: React.ReactNode;
    count: number;
    onConfirm: () => Promise<void> | void;
  } & Partial<ConfirmationModalProps>) => (
    <ConfirmationModal
      trigger={trigger}
      title={`Hapus ${count} item?`}
      description={`Apakah Anda yakin ingin menghapus ${count} item yang dipilih? Tindakan ini tidak dapat dibatalkan.`}
      confirmText={`Hapus ${count} Item`}
      variant="destructive"
      requireConfirmation={count > 5}
      confirmationText={`Saya yakin ingin menghapus ${count} item`}
      onConfirm={onConfirm}
      {...props}
    />
  ),

  Overwrite: ({ trigger, itemName, onConfirm, ...props }: {
    trigger: React.ReactNode;
    itemName: string;
    onConfirm: () => Promise<void> | void;
  } & Partial<ConfirmationModalProps>) => (
    <ConfirmationModal
      trigger={trigger}
      title={`Timpa ${itemName}?`}
      description={`Apakah Anda yakin ingin menimpa "${itemName}"? Data yang ada akan diganti dengan data baru.`}
      confirmText="Timpa"
      variant="warning"
      onConfirm={onConfirm}
      {...props}
    />
  ),

  UnsavedChanges: ({ trigger, onConfirm, onCancel, ...props }: {
    trigger: React.ReactNode;
    onConfirm: () => Promise<void> | void;
    onCancel?: () => void;
  } & Partial<ConfirmationModalProps>) => (
    <ConfirmationModal
      trigger={trigger}
      title="Perubahan Belum Disimpan"
      description="Anda memiliki perubahan yang belum disimpan. Apakah Anda ingin melanjutkan tanpa menyimpan?"
      confirmText="Lanjutkan Tanpa Menyimpan"
      cancelText="Kembali"
      variant="warning"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />
  ),
};