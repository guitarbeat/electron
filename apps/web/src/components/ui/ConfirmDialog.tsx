import React from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import Button from "./Button";
import { useAudio } from "@/hooks/useAudio";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "primary";
  isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "danger",
  isLoading = false,
}) => {
  const { playPop, playClick } = useAudio();

  const handleConfirm = () => {
    playClick();
    onConfirm();
  };

  const handleCancel = () => {
    playPop();
    onCancel();
  };

  return (
    <AlertDialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="confirm-dialog__overlay" />
        <AlertDialog.Content className={`confirm-dialog__content confirm-dialog__content--${variant}`}>
          <AlertDialog.Title className="confirm-dialog__title">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="confirm-dialog__message">
            {message}
          </AlertDialog.Description>
          <div className="confirm-dialog__actions">
            <AlertDialog.Cancel asChild>
              <Button variant="ghost" onClick={handleCancel} disabled={isLoading}>
                {cancelText}
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button variant={variant} onClick={handleConfirm} isLoading={isLoading}>
                {confirmText}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};

export default ConfirmDialog;
