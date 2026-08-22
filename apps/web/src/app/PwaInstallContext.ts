import { createContext } from "react";

export interface PwaInstallContextValue {
  canInstall: boolean;
  isStandalone: boolean;
  openInstallDialog: () => void;
}

export const PwaInstallContext = createContext<PwaInstallContextValue | null>(
  null,
);
