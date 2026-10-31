/** @vitest-environment jsdom */
import { useState } from "react";
import { afterEach, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { SettingsSwitch, SlidingSegments } from "./SettingsControls";

afterEach(cleanup);

it("switch reports its state with aria-checked", () => {
  function Harness() {
    const [on, setOn] = useState(false);
    return <SettingsSwitch label="Moving wall" checked={on} onChange={setOn} />;
  }
  render(<Harness />);
  const toggle = screen.getByRole("switch", { name: "Moving wall" });
  expect(toggle).toHaveAttribute("aria-checked", "false");
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute("aria-checked", "true");
});

it("toggle segments can be cleared, radio segments always keep one choice", () => {
  function Harness({ mode }: { mode: "radio" | "toggle" }) {
    const [value, setValue] = useState<"a" | "b" | null>(mode === "radio" ? "a" : null);
    return (
      <SlidingSegments
        label={mode}
        mode={mode}
        value={value}
        onSelect={(next) => setValue(mode === "toggle" && next === value ? null : next)}
        options={[{ value: "a", content: "A" }, { value: "b", content: "B" }]}
      />
    );
  }
  render(<><Harness mode="radio" /><Harness mode="toggle" /></>);
  expect(screen.getByRole("radiogroup", { name: "radio" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "A" })).toHaveAttribute("aria-checked", "true");
  fireEvent.click(screen.getByRole("radio", { name: "B" }));
  expect(screen.getByRole("radio", { name: "B" })).toHaveAttribute("aria-checked", "true");
  const toggle = screen.getAllByRole("button", { name: "A" })[0];
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute("aria-pressed", "false");
});
