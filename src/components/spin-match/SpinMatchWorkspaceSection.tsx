import type { FC } from "react";
import SpinSwipeGame from "@/components/spin-match/SpinSwipeGame";
import WorkspaceFeatureSection from "@/components/ui/WorkspaceFeatureSection";

const SpinMatchWorkspaceSection: FC = () => (
  <WorkspaceFeatureSection
    id="spin-match-section"
    ariaLabel="Spin match game"
    title="Spin & Match"
    bodyClassName="workspace-feature-section__body--spin"
  >
    <SpinSwipeGame />
  </WorkspaceFeatureSection>
);

export default SpinMatchWorkspaceSection;
