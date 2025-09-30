"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

type AuthSessionProviderProps = {
  children: ReactNode;
};

export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  return <SessionProvider>{children}</SessionProvider>;
}
