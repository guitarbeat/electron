import React, { useEffect, useId, useRef, useState } from "react";
import type { Place } from "@/shared/types";
import { Modal } from "@/ui/ModalSystem";
import { useMediaQuery, mediaBreakpoints } from "@/hooks/useMediaQuery";
import { colors, radius, spacing, typography, motion } from "@/theme/tokens";

const CATEGORIES = [
  "",
  "Restaurant",
  "Cafe",
  "Bar",
  "Park",
  "Museum",
  "Theater",
  "Shop",
  "Hotel",
  "Beach",
  "Landmark",
  "Nature",
  "Other",
];

interface PlaceEditModalProps {
  place: Place;
  onSave: (
    id: string,
    updates: Partial<Pick<Place, "name" | "notes" | "category">>,
  ) => Promise<void>;
  onClose: () => void;
}

const PlaceEditModal: React.FC<PlaceEditModalProps> = ({
  place,
  onSave,
  onClose,
}) => {
  const isMobile = useMediaQuery(mediaBreakpoints.sm);
  const [name, setName] = useState(place.name);
  const [notes, setNotes] = useState(place.notes ?? "");
  const [category, setCategory] = useState(place.category ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const nameInputId = useId();
  const categoryInputId = useId();
  const notesInputId = useId();

  useEffect(() => {
    setName(place.name);
    setNotes(place.notes ?? "");
    setCategory(place.category ?? "");
    setError("");

    const focusTimer = window.setTimeout(() => {
      nameRef.current?.focus();
      nameRef.current?.select();
    }, 40);

    return () => window.clearTimeout(focusTimer);
  }, [place.category, place.id, place.name, place.notes]);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.heading.join(", "),
    fontSize: typography.fontSize.sm,
    padding: `${spacing.sm} ${spacing.md}`,
    outline: "none",
    transition: `border-color ${motion.duration.fast}`,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: typography.fontFamily.heading.join(", "),
    fontSize: typography.fontSize.xs,
    letterSpacing: "0.08em",
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await onSave(place.id, {
        name: trimmed,
        notes: notes.trim() || undefined,
        category: category || undefined,
      });
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to save.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Edit Place"
      ariaLabel={`Edit ${place.name}`}
      maxWidth={420}
      closeDisabled={isSaving}
      closeDisabledLabel="Saving place"
      variant={isMobile ? "bottom-sheet" : "centered"}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: spacing.md,
          padding: spacing.xl,
        }}
      >
        <div>
          <label htmlFor={nameInputId} style={labelStyle}>
            Name *
          </label>
          <input
            id={nameInputId}
            ref={nameRef}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError("");
            }}
            placeholder="Place name"
            required
            disabled={isSaving}
            style={{
              ...inputStyle,
              borderColor: error ? "rgba(220,80,60,0.7)" : colors.border,
            }}
          />
          {error ? (
            <p
              style={{
                margin: `${spacing.xs} 0 0`,
                fontSize: typography.fontSize.xs,
                color: "#f87171",
              }}
            >
              {error}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor={categoryInputId} style={labelStyle}>
            Category
          </label>
          <select
            id={categoryInputId}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            disabled={isSaving}
            style={{
              ...inputStyle,
              cursor: isSaving ? "not-allowed" : "pointer",
              appearance: "none",
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
              paddingRight: "32px",
            }}
          >
            {CATEGORIES.map((entry) => (
              <option
                key={entry}
                value={entry}
                style={{ background: "#1a0e08" }}
              >
                {entry === "" ? "No category" : entry}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={notesInputId} style={labelStyle}>
            Notes
          </label>
          <textarea
            id={notesInputId}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Any notes..."
            rows={3}
            disabled={isSaving}
            style={{
              ...inputStyle,
              resize: "vertical",
              minHeight: "72px",
              lineHeight: typography.lineHeight.relaxed,
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: spacing.sm,
            justifyContent: "flex-end",
            paddingTop: spacing.xs,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              background: "transparent",
              color: colors.textSecondary,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.md,
              fontFamily: typography.fontFamily.heading.join(", "),
              fontSize: typography.fontSize.sm,
              cursor: isSaving ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || !name.trim()}
            style={{
              padding: `${spacing.sm} ${spacing.lg}`,
              background:
                name.trim() && !isSaving ? colors.accent : colors.border,
              color: name.trim() && !isSaving ? "#fff" : colors.textTertiary,
              border: "none",
              borderRadius: radius.md,
              fontFamily: typography.fontFamily.heading.join(", "),
              fontSize: typography.fontSize.sm,
              cursor: name.trim() && !isSaving ? "pointer" : "not-allowed",
              transition: `all ${motion.duration.fast}`,
            }}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PlaceEditModal;
