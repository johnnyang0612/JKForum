"use client";

import { Toaster as SonnerToaster } from "sonner";

function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        className:
          "bg-card text-card-foreground border border-border shadow-lg",
        style: {
          background: "var(--card)",
          color: "var(--card-foreground)",
          border: "1px solid var(--border)",
        },
      }}
      closeButton
      richColors
    />
  );
}

export { Toaster };
