import { create } from "zustand";
import { supabase } from "@/lib/supabaseClient";
import { TASK_CARDS } from "@/config/taskCards";

export type EarnTask = {
  id: string;
  title: string;
  delta: number;
  imageUrl?: string;
  sortOrder: number;
  createdAt: string;
};

function fallbackTasks(): EarnTask[] {
  const now = new Date().toISOString();
  return TASK_CARDS.map((t, idx) => ({
    id: `local:${t.key}`,
    title: t.title,
    delta: t.delta,
    imageUrl: undefined,
    sortOrder: idx,
    createdAt: now,
  }));
}

type TasksState = {
  tasks: EarnTask[];
  loading: boolean;
  error?: string;
  hydrate: () => Promise<void>;
  createTask: (params: { title: string; delta: number; imageUrl?: string }) => Promise<{ ok: boolean; error?: string }>;
  deleteTask: (taskId: string) => Promise<{ ok: boolean; error?: string }>;
  updateTask: (taskId: string, patch: { title?: string; delta?: number; imageUrl?: string | null }) => Promise<{ ok: boolean; error?: string }>;
};

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  loading: false,
  error: undefined,
  hydrate: async () => {
    set({ loading: true, error: undefined });
    try {
      const fetchTasks = async () =>
        await supabase
          .from("tasks")
          .select("id, title, delta, image_url, sort_order, created_at")
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true });

      const res = await fetchTasks();
      if (res.error) {
        const msg = res.error.message || "加载失败";
        if (msg.includes("public.tasks") && msg.includes("schema cache")) {
          set({
            loading: false,
            tasks: fallbackTasks(),
            error: "任务表未初始化，当前显示默认任务；执行 Supabase 任务表迁移后即可管理任务。",
          });
          return;
        }
        set({ loading: false, error: msg });
        return;
      }
      let rows = res.data ?? [];
      if (rows.length === 0) {
        await supabase.rpc("ensure_user_setup");
        const res2 = await fetchTasks();
        if (!res2.error) rows = res2.data ?? [];
      }
      const tasks: EarnTask[] = rows.map((r) => ({
        id: r.id,
        title: r.title,
        delta: r.delta,
        imageUrl: r.image_url ?? undefined,
        sortOrder: r.sort_order ?? 0,
        createdAt: r.created_at,
      }));
      set({ tasks, loading: false });
    } catch {
      set({ loading: false, error: "加载失败" });
    }
  },
  createTask: async ({ title, delta, imageUrl }) => {
    const trimmed = title.trim();
    if (!trimmed) return { ok: false, error: "请输入任务名称" };
    if (!Number.isFinite(delta) || delta <= 0) return { ok: false, error: "加分值无效" };

    const authRes = await supabase.auth.getUser();
    const userId = authRes.data.user?.id;
    if (!userId) return { ok: false, error: "未登录" };

    const nextOrder = (get().tasks.at(-1)?.sortOrder ?? -1) + 1;
    const { data: created, error } = await supabase
      .from("tasks")
      .insert({
        user_id: userId,
        title: trimmed,
        delta: Math.trunc(delta),
        image_url: imageUrl ?? null,
        sort_order: nextOrder,
      })
      .select("id")
      .single();
    if (error || !created) return { ok: false, error: error?.message ?? "创建失败" };
    await get().hydrate();
    return { ok: true };
  },
  deleteTask: async (taskId) => {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) return { ok: false, error: error.message };
    await get().hydrate();
    return { ok: true };
  },
  updateTask: async (taskId, patch) => {
    const update: Record<string, unknown> = {};
    if (patch.title !== undefined) update.title = patch.title.trim();
    if (patch.delta !== undefined) update.delta = Math.trunc(patch.delta);
    if (patch.imageUrl !== undefined) update.image_url = patch.imageUrl;
    const { error } = await supabase.from("tasks").update(update).eq("id", taskId);
    if (error) return { ok: false, error: error.message };
    await get().hydrate();
    return { ok: true };
  },
}));
