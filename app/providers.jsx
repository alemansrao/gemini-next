"use client";
// app/providers.jsx
import { ToastProvider } from "@heroui/toast";
import * as React from "react";
import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";



export function Providers({ children, themeProps }) {
  const router = useRouter();

  return (
      <HeroUIProvider navigate={router.push}>
          <ToastProvider placement="top-right" />
          {children}
      </HeroUIProvider>
  );
}
