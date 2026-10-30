/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "motion/react";

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

export function TopFrameViewport() {
  const { target, setTarget, modalOpen } = useTopFrame();
  const [height, setHeight] = useState(0);
  const reducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    if (!target) return;
    const measure = () => setHeight(modalOpen ? 0 : target.getBoundingClientRect().height);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(target);
    return () => observer.disconnect();
  }, [target, modalOpen]);

  return (
    <motion.div
      className="top-frame-panels"
      data-modal-open={modalOpen}
      data-expanded={height > 0}
      initial={false}
      animate={{ height }}
      transition={reducedMotion
        ? { duration: 0 }
        : { type: "spring", stiffness: 420, damping: 38, mass: 0.8 }}
    >
      <div ref={setTarget} className="top-frame-panels__content" />
    </motion.div>
  );
}

export function TopFramePanel({ name, children }: { name: string; children: ReactNode }) {
  const { target } = useTopFrame();
  return target
    ? createPortal(<div className="top-frame-panel" data-frame-panel={name}>{children}</div>, target)
    : <>{children}</>;
}

export function AccountPinViewport() {
  const { setAccountTarget } = useTopFrame();
  return <div ref={setAccountTarget} className="account-pin-viewport" />;
}
