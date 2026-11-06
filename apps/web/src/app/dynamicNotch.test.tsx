/** @vitest-environment jsdom */
import { useRef, useState } from "react";
import { afterEach, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import {
  collapseAllNotches,
  leaveNotchGhost,
  useExclusiveNotch,
  useNotchGripDrag,
  type NotchName,
} from "./dynamicNotch";
import { AccountPinViewport, TopFramePanel, TopFrameProvider, TopFrameViewport, useTopFrame } from "./TopFramePanels";
import { createPortal } from "react-dom";

afterEach(cleanup);

function Notch({ name }: { name: NotchName }) {
  const [open, setOpen] = useState(false);
  useExclusiveNotch(name, open, () => setOpen(false));
  return <button type="button" aria-expanded={open} onClick={() => setOpen(true)}>{name}</button>;
}

it("keeps only one notch expanded: opening one collapses the others, and collapseAllNotches closes the active notch", () => {
  render(<><Notch name="search" /><Notch name="activities" /><Notch name="settings" /><Notch name="profiles" /></>);
  const button = (name: string) => screen.getByRole("button", { name });
  fireEvent.click(button("settings"));
  expect(button("settings")).toHaveAttribute("aria-expanded", "true");
  fireEvent.click(button("activities"));
  expect(button("activities")).toHaveAttribute("aria-expanded", "true");
  expect(button("settings")).toHaveAttribute("aria-expanded", "false");
  fireEvent.click(button("profiles"));
  expect(button("profiles")).toHaveAttribute("aria-expanded", "true");
  expect(button("activities")).toHaveAttribute("aria-expanded", "false");
  fireEvent.click(button("search"));
  expect(button("search")).toHaveAttribute("aria-expanded", "true");
  expect(button("profiles")).toHaveAttribute("aria-expanded", "false");
  act(() => { collapseAllNotches(); });
  expect(button("search")).toHaveAttribute("aria-expanded", "false");
});

it("toggles and drags notches open and closed via useNotchGripDrag and syncs drag state to .viewport-frame .dyn-notch", () => {
  function GripHost() {
    const [open, setOpen] = useState(false);
    const hostRef = useRef<HTMLDivElement | null>(null);
    const grip = useNotchGripDrag({
      edge: "top",
      isOpen: open,
      onOpen: () => setOpen(true),
      onClose: () => setOpen(false),
      hostRef,
    });
    return (
      <>
        <div className="viewport-frame">
          <span className="dyn-notch dyn-notch--frame" data-notch="search" data-testid="frame-notch" />
        </div>
        <div ref={hostRef} data-testid="notch-host" data-open={open}>
          <span className="dyn-notch" data-notch="search">
            <i data-testid="notch-grip" {...grip} />
          </span>
        </div>
      </>
    );
  }
  render(<GripHost />);
  const host = screen.getByTestId("notch-host");
  const frameNotch = screen.getByTestId("frame-notch");
  const grip = screen.getByTestId("notch-grip");
  expect(host).toHaveAttribute("data-open", "false");

  // Dragging downward (> 24px) opens a top notch and syncs --dyn-drag-h to the .viewport-frame notch
  fireEvent.pointerDown(grip, { pointerId: 1, clientY: 10 });
  fireEvent.pointerMove(grip, { pointerId: 1, clientY: 45 });
  expect(host.style.getPropertyValue("--dyn-drag-h")).toBe("35px");
  expect(frameNotch.style.getPropertyValue("--dyn-drag-h")).toBe("35px");
  expect(frameNotch).toHaveAttribute("data-dragging", "true");
  fireEvent.pointerUp(grip, { pointerId: 1, clientY: 45 });
  expect(host).toHaveAttribute("data-open", "true");
  expect(host.style.getPropertyValue("--dyn-drag-h")).toBe("");
  expect(frameNotch.style.getPropertyValue("--dyn-drag-h")).toBe("");
  expect(frameNotch).not.toHaveAttribute("data-dragging");

  // Clicking the grip closes the open notch
  fireEvent.click(grip);
  expect(host).toHaveAttribute("data-open", "false");
});

it("leaves an inert, unlabeled copy of closing content to fade out inside the notch", () => {
  const host = document.createElement("div");
  document.body.append(host);
  const panel = document.createElement("section");
  panel.id = "menu";
  panel.setAttribute("data-notch-panel", "settings");
  panel.setAttribute("role", "dialog");
  panel.innerHTML = '<button id="inner">Go</button>';
  leaveNotchGhost(panel, host);
  const ghost = host.querySelector(".dyn-notch-ghost");
  expect(ghost).toHaveAttribute("aria-hidden", "true");
  expect(ghost).toHaveAttribute("inert");
  expect(ghost?.querySelector("[id]")).toBeNull();
  expect(ghost).not.toHaveAttribute("data-notch-panel");
  expect(ghost).not.toHaveAttribute("role");
  expect(panel).toHaveAttribute("data-notch-panel", "settings");
  host.remove();
});

it("publishes the open panel height and account PIN height so the notch bodies grow around them", () => {
  function PinPortal({ open }: { open: boolean }) {
    const { accountTarget } = useTopFrame();
    if (!open || !accountTarget) return null;
    return createPortal(<div data-testid="pin-sheet">PIN Pad</div>, accountTarget);
  }
  function Host() {
    const [open, setOpen] = useState(true);
    return (
      <TopFrameProvider>
        <TopFrameViewport />
        <AccountPinViewport />
        <PinPortal open={open} />
        {open ? (
          <TopFramePanel name="test">
            <button type="button" onClick={() => setOpen(false)}>Close</button>
          </TopFramePanel>
        ) : null}
      </TopFrameProvider>
    );
  }
  const { container } = render(<Host />);
  const viewport = container.querySelector(".top-frame-panels")!;
  expect(viewport).toContainElement(screen.getByRole("button", { name: "Close" }));
  expect(document.documentElement.style.getPropertyValue("--dyn-panel-h")).toMatch(/px$/);
  expect(document.documentElement.style.getPropertyValue("--dyn-pin-h")).toMatch(/px$/);
  expect(screen.getByTestId("pin-sheet")).toBeInTheDocument();
  act(() => { fireEvent.click(screen.getByRole("button", { name: "Close" })); });
  expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  expect(screen.queryByTestId("pin-sheet")).not.toBeInTheDocument();
});
