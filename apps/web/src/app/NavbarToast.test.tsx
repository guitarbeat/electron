/** @vitest-environment jsdom */
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { NavbarToastViewport, useToast } from "./providerContexts";
import { ToastProvider } from "./providers";

vi.mock("@/components/ui", () => ({
  Toast: ({ message, onDismiss, onAction }: { message: string; onDismiss: () => void; onAction: () => void }) => <div role="status">{message}<button onClick={onAction}>Undo</button><button onClick={onDismiss}>Dismiss</button></div>,
}));
const undo = vi.fn();
function Trigger() {
  const { showToast } = useToast();
  return <button onClick={() => showToast({ message: "Movie saved", type: "success", persistent: true, onUndo: undo })}>Notify</button>;
}
function App({ navbar }: { navbar: boolean }) {
  return <ToastProvider><Trigger />{navbar ? <nav aria-label="Top navbar"><NavbarToastViewport /></nav> : null}</ToastProvider>;
}
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it("renders notifications only in the navbar, including those queued before it mounts", () => {
  const { rerender } = render(<App navbar={false} />);
  fireEvent.click(screen.getByRole("button", { name: "Notify" }));
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  rerender(<App navbar />);
  const navbar = screen.getByRole("navigation", { name: "Top navbar" });
  expect(within(navbar).getByRole("status")).toHaveTextContent("Movie saved");
  expect(screen.getAllByRole("status")).toHaveLength(1);
  fireEvent.click(within(navbar).getByRole("button", { name: "Undo" }));
  expect(undo).toHaveBeenCalledOnce();
  fireEvent.click(within(navbar).getByRole("button", { name: "Dismiss" }));
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
