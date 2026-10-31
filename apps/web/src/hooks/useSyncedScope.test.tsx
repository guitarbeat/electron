/** @vitest-environment jsdom */
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { renderHook, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useSyncedScope } from "./index";

const serverMessages = [
  { id: "m1", author: "Aaron", content: "Movie tonight?", createdAt: "2026-10-30T20:00:00.000Z" },
  { id: "m2", author: "Electra", content: "Yes!", createdAt: "2026-10-30T20:01:00.000Z" },
];

// Same defaults as AppProviders: a 5-minute staleTime is what hid the bug.
const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: 5 * 60_000, retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  localStorage.clear();
  fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: serverMessages, version: "v2", degraded: false }), { status: 200, headers: { "Content-Type": "application/json" } }));
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("loads messages on first open instead of showing an empty list until the next poll", async () => {
  const { result } = renderHook(() => useSyncedScope("messages", { pollingInterval: 60_000 }), { wrapper });
  // Nothing saved yet: this is loading, not an empty inbox.
  expect(result.current.isLoading).toBe(true);
  expect(result.current.data).toBeUndefined();
  await waitFor(() => expect(result.current.data).toHaveLength(2));
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(String(fetchMock.mock.calls[0][0])).toBe("/api/state/messages");
});

it("shows saved messages right away and still refreshes them on open", async () => {
  localStorage.setItem("movieList.scopeSnapshot.messages", JSON.stringify({ data: [serverMessages[0]], version: "v1", degraded: false }));
  const { result } = renderHook(() => useSyncedScope("messages", { pollingInterval: 60_000 }), { wrapper });
  expect(result.current.data).toHaveLength(1);
  await waitFor(() => expect(result.current.data).toHaveLength(2));
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
