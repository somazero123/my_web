import { create } from "zustand";
import type { PointsLedgerItem } from "@/types/app";
import { supabase } from "@/lib/supabaseClient";

type PointsState = {
  balance: number;
  ledger: PointsLedgerItem[];
  loading: boolean;
  lastMessage?: { kind: "success" | "error"; text: string };
  hydrate: () => Promise<void>;
  adjustPointsWithSecret: (params: {
    delta: number;
    reason: string;
    secret: string;
  }) => Promise<{ ok: boolean; error?: string; newBalance?: number }>;
  setPointsWithSecret: (params: {
    target: number;
    reason: string;
    secret: string;
  }) => Promise<{ ok: boolean; error?: string; newBalance?: number }>;
  redeemProduct: (productId: string) => Promise<{ ok: boolean; error?: string; newBalance?: number }>;
  clearLastMessage: () => void;
};

export const usePointsStore = create<PointsState>()((set) => ({
  balance: 0,
  ledger: [],
  loading: false,
  lastMessage: undefined,
  hydrate: async () => {
    set({ loading: true });
    try {
      const profileRes = await supabase
        .from("profiles")
        .select("points_balance")
        .single();
      const balance = profileRes.data?.points_balance ?? 0;

      const ledgerRes = await supabase
        .from("points_ledger")
        .select("id, delta, reason, created_at")
        .order("created_at", { ascending: false })
        .limit(200);

      const ledger: PointsLedgerItem[] = (ledgerRes.data ?? []).map((x) => ({
        id: x.id,
        delta: x.delta,
        reason: x.reason,
        createdAt: x.created_at,
      }));

      set({ balance, ledger, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  adjustPointsWithSecret: async ({ delta, reason, secret }) => {
    if (!Number.isFinite(delta) || delta === 0) {
      set({ lastMessage: { kind: "error", text: "积分变更值无效" } });
      return { ok: false, error: "积分变更值无效" };
    }
    const trimmedReason = reason.trim() ? reason.trim() : "积分变更";
    const { data, error } = await supabase.rpc("add_points_with_secret", {
      p_delta: Math.trunc(delta),
      p_reason: trimmedReason,
      p_secret: secret,
    });
    if (error) {
      set({ lastMessage: { kind: "error", text: "密钥错误或加分失败" } });
      return { ok: false, error: error.message };
    }
    const newBalance = (data as Array<{ new_balance: number }> | null)?.[0]?.new_balance;
    set({ lastMessage: { kind: "success", text: delta > 0 ? `已加分 +${delta}` : `已扣分 ${Math.abs(delta)}` } });
    await usePointsStore.getState().hydrate();
    return { ok: true, newBalance };
  },
  setPointsWithSecret: async ({ target, reason, secret }) => {
    if (!Number.isFinite(target) || target < 0) {
      set({ lastMessage: { kind: "error", text: "目标积分值无效" } });
      return { ok: false, error: "目标积分值无效" };
    }
    const trimmedReason = reason.trim() ? reason.trim() : "积分重置";
    const { data, error } = await supabase.rpc("set_points_with_secret", {
      p_target: Math.trunc(target),
      p_reason: trimmedReason,
      p_secret: secret,
    });
    if (error) {
      set({ lastMessage: { kind: "error", text: "密钥错误或修改失败" } });
      return { ok: false, error: error.message };
    }
    const newBalance = (data as Array<{ new_balance: number }> | null)?.[0]?.new_balance;
    set({ lastMessage: { kind: "success", text: `积分已修改为 ${target}` } });
    await usePointsStore.getState().hydrate();
    return { ok: true, newBalance };
  },
  redeemProduct: async (productId) => {
    const { data, error } = await supabase.rpc("redeem_product", { p_product_id: productId });
    if (error) {
      set({ lastMessage: { kind: "error", text: "换购失败" } });
      return { ok: false, error: error.message };
    }
    const raw = (Array.isArray(data) ? data[0] : data) as unknown;
    const row = raw as { ok?: unknown; new_balance?: unknown; message?: unknown } | null;
    const ok = row?.ok === true || (row?.ok !== false && typeof row?.new_balance === "number");
    if (!ok) {
      const msg = typeof row?.message === "string" && row.message.trim() ? row.message : "换购失败";
      set({ lastMessage: { kind: "error", text: msg } });
      return { ok: false, error: msg };
    }
    const msg = typeof row?.message === "string" && row.message.trim() ? row.message : "换购成功";
    set({ lastMessage: { kind: "success", text: msg } });
    await usePointsStore.getState().hydrate();
    const newBalance = typeof row?.new_balance === "number" ? row.new_balance : undefined;
    return { ok: true, newBalance };
  },
  clearLastMessage: () => set({ lastMessage: undefined }),
}));
