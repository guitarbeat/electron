import { installSharedStateMemoryStoreForTests } from "../../../api/_lib/sharedStateStore.ts";

export interface SharedStateMemoryMockContext {
  /** Filename → JSON string (same shape as shared_state_files content). */
  getFile: (filename: string) => string | undefined;
  /** Raw string bodies written by patch calls. */
  patchBodies: string[];
}

/**
 * Installs an in-memory shared-state store for API tests.
 */
export const createSharedStateMemoryMock = (
  initialFiles: Record<string, string>,
): SharedStateMemoryMockContext & { dispose: () => void } =>
  installSharedStateMemoryStoreForTests(initialFiles);
