"use client";

import { Toaster } from "sonner";

export default function AppToaster() {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        style: {
          fontFamily: '"Sora", sans-serif',
          fontSize: "13px",
        },
      }}
    />
  );
}
