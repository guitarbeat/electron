import type { FC } from "react";
import SpinSwipeGame from "@/components/spin-match/SpinSwipeGame";
import "./SpinMatchWorkspaceSection.css";

const SpinMatchWorkspaceSection: FC = () => (
  <section
    id="spin-match-section"
    className="spin-match-workspace-section"
    aria-label="Spin match game"
  >
    <SpinSwipeGame />
  </section>
);

export default SpinMatchWorkspaceSection;
