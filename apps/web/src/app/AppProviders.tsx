import React, { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserProvider, ThemeProvider } from "@/app/providers";
import { ProfilePinProvider } from "@/app/ProfilePinContext";
import { ToastProvider } from "@/app/providers";
import { PwaInstallProvider } from "@/app/PwaInstallProvider";
import { ViewportProvider } from "@/app/ViewportContext";
import type { ThemeName } from "@/theme/themes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      refetchOnWindowFocus: true,
    },
  },
});

interface AppProvidersProps {
  children: ReactNode;
  themeName?: ThemeName;
}

export const AppProviders: React.FC<AppProvidersProps> = ({
  children,
  themeName = "movies",
}) => (
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <ProfilePinProvider>
        <ToastProvider>
          <PwaInstallProvider>
            <ViewportProvider>
              <ThemeProvider themeName={themeName}>
                {children}
              </ThemeProvider>
            </ViewportProvider>
          </PwaInstallProvider>
        </ToastProvider>
      </ProfilePinProvider>
    </UserProvider>
  </QueryClientProvider>
);
