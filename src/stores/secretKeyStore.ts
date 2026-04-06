import { create } from "zustand";
import { persist } from "zustand/middleware";

type SecretKeyState = {
  secret: string;
  verify: (input: string) => { ok: boolean; error?: string };
  setSecret: (next: string) => { ok: boolean; error?: string };
};

function getSeedSecret() {
  const v = import.meta.env.VITE_PARENT_SECRET as string | undefined;
  return (v && v.trim()) ? v.trim() : "parent";
}

export const useSecretKeyStore = create<SecretKeyState>()(
  persist(
    (set, get) => ({
      secret: getSeedSecret(),
      verify: (input) => {
        const expected = get().secret;
        if (input.trim() !== expected) return { ok: false, error: "密钥错误" };
        return { ok: true };
      },
      setSecret: (next) => {
        const trimmed = next.trim();
        if (!trimmed) return { ok: false, error: "新密钥不能为空" };
        if (trimmed.length > 64) return { ok: false, error: "新密钥太长" };
        set({ secret: trimmed });
        return { ok: true };
      },
    }),
    {
      name: "kids_secret_key_v1",
      partialize: (s) => ({ secret: s.secret }),
    },
  ),
);

