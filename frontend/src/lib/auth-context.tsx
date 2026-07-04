"use client";

import { createContext, useContext } from "react";
import type { User } from "@/lib/api";

interface AuthContextValue {
  user: User;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within the (app) layout");
  return ctx;
}
