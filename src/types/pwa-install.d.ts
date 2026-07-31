import type { PWAInstallElement } from "@khmyznikov/pwa-install";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "pwa-install": React.DetailedHTMLProps<
        React.HTMLAttributes<PWAInstallElement> & {
          manifestUrl?: string;
          useLocalStorage?: boolean;
          manualApple?: boolean;
          manualChrome?: boolean;
          "disable-screenshots"?: boolean;
          installDescription?: string;
        },
        PWAInstallElement
      >;
    }
  }
}
