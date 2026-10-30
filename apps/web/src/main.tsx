/* eslint-disable react-refresh/only-export-components */
import React from "react";
import ReactDOM from "react-dom/client";
import LibrarySearch from "@/components/library/LibrarySearch";
import { AppProviders } from "@/app/providerContexts";
import { PwaInstallProvider } from "@/app/PwaInstallProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProviders>
        <PwaInstallProvider>
          <div style={{ minHeight: "100vh", backgroundColor: "#090d16", color: "#ffffff", padding: "1.5rem" }}>
            <LibrarySearch />
          </div>
        </PwaInstallProvider>
      </AppProviders>
    </QueryClientProvider>
  );
};

const rootEl = document.getElementById("root");
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<App />);
}
