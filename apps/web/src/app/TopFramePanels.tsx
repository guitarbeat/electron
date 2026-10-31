/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { leaveNotchGhost } from "./dynamicNotch";

const TopFrameContext = createContext<{
  target: HTMLDivElement | null;
  setTarget: (target: HTMLDivElement | null) => void;
  accountTarget: HTMLDivElement | null;
  setAccountTarget: (target: HTMLDivElement | null) => void;
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
}>({ target: null, setTarget: () => {}, accountTarget: null, setAccountTarget: () => {}, modalOpen: false, setModalOpen: () => {} });

export const useTopFrame = () => useContext(TopFrameContext);

export function TopFrameProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  const [accountTarget, setAccountTarget] = useState<HTMLDivElement | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const value = useMemo(() => ({ target, setTarget, accountTarget, setAccountTarget, modalOpen, setModalOpen }), [target, accountTarget, modalOpen]);
  return <TopFrameContext.Provider value={value}>{children}</TopFrameContext.Provider>;
}

/**
 * The inside of the expanded notch that owns the open panel (Add suggestions, Settings, or the
 * movie picker). It has no surface of its own: the notch body drawn behind it grows to the
 * published `--dyn-panel-h`, and this clip grows with it on the same curve.
 */
export function TopFrameViewport() {
  const { target, setTarget, modalOpen } = useTopFrame();
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    if (!target) return;
    const root = document.documentElement;
    const measure = () => {
      const next = modalOpen ? 0 : Math.ceil(target.getBoundingClientRect().height);
      setHeight(next);
      root.style.setProperty("--dyn-panel-h", `${next}px`);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(target);
    return () => observer.disconnect();
  }, [target, modalOpen]);

  return (
    <div className="top-frame-panels" data-modal-open={modalOpen} data-expanded={height > 0}>
      <div ref={setTarget} className="top-frame-panels__content" />
    </div>
  );
}

export function TopFramePanel({ name, children }: { name: string; children: ReactNode }) {
  const { target } = useTopFrame();
  const panelRef = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    // Refs attach before layout effects, so this is the panel node portaled into `target`.
    const node = panelRef.current;
    const host = target?.parentElement ?? null;
    return () => leaveNotchGhost(node, host);
  }, [target]);
  return target
    ? createPortal(<div ref={panelRef} className="top-frame-panel" data-frame-panel={name}>{children}</div>, target)
    : <>{children}</>;
}

export function AccountPinViewport() {
  const { setAccountTarget } = useTopFrame();
  return <div ref={setAccountTarget} className="account-pin-viewport" />;
}
