/** @vitest-environment jsdom */
import { useState } from "react";
import { afterEach, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { leaveNotchGhost, useExclusiveNotch, type NotchName } from "./dynamicNotch";
import { TopFramePanel, TopFrameProvider, TopFrameViewport } from "./TopFramePanels";

afterEach(cleanup);

function Notch({ name }: { name: NotchName }) {
  const [open, setOpen] = useState(false);
  useExclusiveNotch(name, open, () => setOpen(false));
  return <button type="button" aria-expanded={open} onClick={() => setOpen(true)}>{name}</button>;
}

it("keeps only one notch expanded: opening one collapses the others", () => {
  render(<><Notch name="search" /><Notch name="settings" /><Notch name="profiles" /></>);
  const button = (name: string) => screen.getByRole("button", { name });
  fireEvent.click(button("settings"));
  expect(button("settings")).toHaveAttribute("aria-expanded", "true");
  fireEvent.click(button("profiles"));
  expect(button("profiles")).toHaveAttribute("aria-expanded", "true");
  expect(button("settings")).toHaveAttribute("aria-expanded", "false");
  fireEvent.click(button("search"));
  expect(button("search")).toHaveAttribute("aria-expanded", "true");
  expect(button("profiles")).toHaveAttribute("aria-expanded", "false");
});

it("leaves an inert, unlabeled copy of closing content to fade out inside the notch", () => {
  const host = document.createElement("div");
  document.body.append(host);
  const panel = document.createElement("section");
  panel.id = "menu";
  panel.innerHTML = '<button id="inner">Go</button>';
  leaveNotchGhost(panel, host);
  const ghost = host.querySelector(".dyn-notch-ghost");
  expect(ghost).toHaveAttribute("aria-hidden", "true");
  expect(ghost).toHaveAttribute("inert");
  expect(ghost?.querySelector("[id]")).toBeNull();
  host.remove();
});

it("publishes the open panel height so the notch body grows around it", () => {
  function Host() {
    const [open, setOpen] = useState(true);
    return <TopFrameProvider><TopFrameViewport />{open ? <TopFramePanel name="test"><button type="button" onClick={() => setOpen(false)}>Close</button></TopFramePanel> : null}</TopFrameProvider>;
  }
  const { container } = render(<Host />);
  const viewport = container.querySelector(".top-frame-panels")!;
  expect(viewport).toContainElement(screen.getByRole("button", { name: "Close" }));
  expect(document.documentElement.style.getPropertyValue("--dyn-panel-h")).toMatch(/px$/);
  act(() => { fireEvent.click(screen.getByRole("button", { name: "Close" })); });
  expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
});
