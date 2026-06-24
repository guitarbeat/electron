import type { FC } from "react";
import FishTank from "@/components/effects/FishTank";

const FishTankSection: FC = () => (
  <section className="fish-tank-section" aria-label="Aquarium">
    <FishTank />
  </section>
);

export default FishTankSection;
