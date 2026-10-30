import React, { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserProvider, ThemeProvider } from "@/app/providers";
import { TopFrameProvider } from "@/app/TopFramePanels";
import { ProfilePinProvider } from "@/app/ProfilePinContext";
import { ToastProvider } from "@/app/providers";
import { PwaInstallProvider } from "@/app/PwaInstallProvider";
import { ViewportProvider } from "@/app/providerContexts";
import type { ThemeName } from "@/theme/tokens";

interface AppProvidersProps {
  children: ReactNode;
  themeName?: ThemeName;
}

export const AppProviders: React.FC<AppProvidersProps> = ({
  children,
  themeName = "movies",
}) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60_000,
            gcTime: 30 * 60_000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TopFrameProvider>
      <UserProvider>
        <ProfilePinProvider>
          <ToastProvider>
            <PwaInstallProvider>
              <ViewportProvider>
                <ThemeProvider themeName={themeName}>{children}</ThemeProvider>
              </ViewportProvider>
            </PwaInstallProvider>
          </ToastProvider>
        </ProfilePinProvider>
      </UserProvider>
      </TopFrameProvider>
    </QueryClientProvider>
  );
};
