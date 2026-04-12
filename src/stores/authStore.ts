import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabaseClient";

type AuthState = {
  impersonatedUserId?: string;
  setImpersonatedUserId: (id?: string) => void;
  getEffectiveUserId: () => Promise<string | undefined>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      impersonatedUserId: undefined,
      setImpersonatedUserId: (id) => {
        set({ impersonatedUserId: id });
        // Force reload to refresh all data stores cleanly
        window.location.href = "/";
      },
      getEffectiveUserId: async () => {
        const impId = get().impersonatedUserId;
        if (impId) return impId;
        const { data } = await supabase.auth.getUser();
        return data.user?.id;
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ impersonatedUserId: state.impersonatedUserId }),
    },
  ),
);