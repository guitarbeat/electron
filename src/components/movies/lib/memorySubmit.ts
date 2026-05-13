export const submitMemory = async (
  note: string,
  onAddMemory: (note: string) => Promise<void>,
  callbacks: {
    setIsSubmittingMemory: (isSubmitting: boolean) => void;
    setDraftNote: (note: string) => void;
    setSubmitSuccess: (success: boolean) => void;
    setSubmitError: (error: string | null) => void;
    clearSuccessTimeout: () => void;
    setSuccessTimeout: (callback: () => void, delay: number) => void;
  },
) => {
  const trimmedNote = note.trim();
  if (!trimmedNote) {
    return;
  }

  callbacks.setSubmitError(null);
  callbacks.setIsSubmittingMemory(true);
  try {
    await onAddMemory(trimmedNote);
    callbacks.setDraftNote("");
    callbacks.setSubmitSuccess(true);
    callbacks.clearSuccessTimeout();
    callbacks.setSuccessTimeout(() => {
      callbacks.setSubmitSuccess(false);
    }, 1200);
  } catch {
    callbacks.setSubmitError("Failed to save note. Please try again.");
  } finally {
    callbacks.setIsSubmittingMemory(false);
  }
};
