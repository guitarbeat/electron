import React, { useState, useEffect, useRef } from "react";
import { Modal, Input } from "@/components/ui";
import { spacing, colors, typography } from "@/theme/tokens";
import { sanitizeInput } from "@/utils";
import type { Place } from "@/shared/types";

interface PlaceEditModalProps {
  place: Place;
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
  onSubmit: (updates: { name: string; imageUrl?: string }) => Promise<void>;
}

export const PlaceEditModal: React.FC<PlaceEditModalProps> = ({
  place,
  isOpen,
  isMobile,
  onClose,
  onSubmit,
}) => {
  const [draftName, setDraftName] = useState(place.name);
  const [draftImageUrl, setDraftImageUrl] = useState(place.imageUrl || "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setDraftName(place.name);
    setDraftImageUrl(place.imageUrl || "");
    setError(null);
    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 40);
    return () => window.clearTimeout(focusTimer);
  }, [isOpen, place.name, place.imageUrl]);

  const cleanName = sanitizeInput(draftName);
  const cleanImageUrl = draftImageUrl.trim();
  const isUnchanged =
    cleanName === place.name && cleanImageUrl === (place.imageUrl || "");

  const canSubmit =
    !isSaving && Boolean(cleanName) && cleanName.length <= 100 && !isUnchanged;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setIsSaving(true);
    setError(null);
    try {
      await onSubmit({
        name: cleanName,
        imageUrl: cleanImageUrl || undefined,
      });
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to update place",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Place"
      ariaLabel={`Edit details for ${place.name}`}
      closeDisabled={isSaving}
      closeDisabledLabel="Saving changes"
      variant={isMobile ? "bottom-sheet" : "centered"}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: spacing.lg,
          padding: spacing.lg,
        }}
      >
        <div
          style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}
        >
          <p
            style={{
              margin: 0,
              color: colors.textSecondary,
              ...typography.presets.bodySm,
            }}
          >
            Update the shared place name or provide a custom poster image URL.
          </p>
          <Input
            ref={inputRef}
            label="Place name"
            value={draftName}
            onChange={(event) => {
              setDraftName(event.target.value);
              if (error) setError(null);
            }}
            maxLength={100}
            placeholder="Enter place name"
            error={error ?? undefined}
          />
          <Input
            label="Custom image URL (optional)"
            value={draftImageUrl}
            onChange={(event) => {
              setDraftImageUrl(event.target.value);
              if (error) setError(null);
            }}
            placeholder="https://example.com/poster.jpg"
          />
          <div
            aria-live="polite"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: spacing.sm,
              color: colors.textTertiary,
              ...typography.presets.caption,
            }}
          >
            <span>
              {isUnchanged
                ? "Make a change to save."
                : "Changes are shared immediately."}
            </span>
            <span>{cleanName.length} / 100</span>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="submit"
            className={`btn btn--primary ${!canSubmit ? "btn--disabled" : ""}`}
            disabled={!canSubmit}
            aria-disabled={!canSubmit}
            style={{ width: isMobile ? "100%" : "auto" }}
          >
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
