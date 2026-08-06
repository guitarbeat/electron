/**
 * FabQuickActions — the row of action buttons inside the FAB panel.
 * Each action has an icon, label, and color. Easily extensible.
 */
import React from "react";
import { MessageIcon } from "@/common/Icons";

// ── Icons ─────────────────────────────────────────────────────────

const QuizIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
);

const SpinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="2" x2="12" y2="12" />
    <line x1="12" y1="12" x2="20" y2="16" />
  </svg>
);

// ── Types ─────────────────────────────────────────────────────────

export interface QuickAction {
  label: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}

interface FabQuickActionsProps {
  actions: QuickAction[];
}

// ── Default actions factory ───────────────────────────────────────

export function buildDefaultActions(handlers: {
  onMessages?: () => void;
  onQuiz?: () => void;
  onSpin?: () => void;
}): QuickAction[] {
  return [
    { label: "Messages", icon: <MessageIcon size={18} />, color: "teal", onClick: () => handlers.onMessages?.() },
    { label: "Quiz", icon: <QuizIcon />, color: "violet", onClick: () => handlers.onQuiz?.() },
    { label: "Spin", icon: <SpinIcon />, color: "amber", onClick: () => handlers.onSpin?.() },
  ];
}

// ── Component ─────────────────────────────────────────────────────

const FabQuickActions: React.FC<FabQuickActionsProps> = ({ actions }) => (
  <div className="fwp-panel__actions">
    {actions.map((a) => (
      <button
        key={a.label}
        type="button"
        className={`fwp-action fwp-action--${a.color}`}
        onClick={a.onClick}
        aria-label={a.label}
        title={a.label}
      >
        <span className="fwp-action__icon">{a.icon}</span>
        <span className="fwp-action__label">{a.label}</span>
      </button>
    ))}
  </div>
);

export default FabQuickActions;
