import type { Session } from "@supabase/supabase-js";
import { createContext, useContext } from "react";

export type AuthContextValue = {
  session: Session | null;
  loading: boolean;
};

export const AuthContext = createContext<AuthContextValue>({ session: null, loading: true });

export function useAuth() {
  return useContext(AuthContext);
}

