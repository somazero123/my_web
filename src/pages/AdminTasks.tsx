import { useEffect, useMemo, useState } from "react";
import { ListChecks, Trash2, UploadCloud } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { uploadTaskImage } from "@/lib/storage";
import { useTasksStore } from "@/stores/tasksStore";

export default function AdminTasks() {
  const { tasks, hydrate, createTask, deleteTask, updateTask, error } = useTasksStore();
  const [title, setTitle] = useState("");
  const [delta, setDelta] = useState<number>(1);
  const [msg, setMsg] = useState<string | undefined>(undefined);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const ordered = useMemo(() => tasks.slice().sort((a, b) => a.sortOrder - b.sortOrder), [tasks]);

  return (
    <PageShell>
      <div className="grid gap-6">
        <div>
          <div className="text-lg font-semibold text-zinc-900">任务管理</div>
          <div className="mt-1 text-sm text-zinc-600">添加或删除“赚积分”里的任务，并为任务上传展示图片。</div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-[color:var(--z-accent)]" />
              新增任务
            </CardTitle>
            <CardDescription>创建后会出现在“赚积分”的任务卡片里。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-xs font-medium text-zinc-700">任务名称</div>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：练字" />
              </div>
              <div>
                <div className="mb-1 text-xs font-medium text-zinc-700">每次加分</div>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={delta}
                  onChange={(e) => setDelta(Math.max(1, Number(e.target.value || 1)))}
                />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="text-xs text-zinc-600">图片可在创建后上传。</div>
              <Button
                onClick={async () => {
                  setMsg(undefined);
                  const r = await createTask({ title, delta });
                  if (!r.ok) {
                    setMsg(r.error || "创建失败");
                    return;
                  }
                  setTitle("");
                  setDelta(1);
                  setMsg("创建成功");
                }}
              >
                创建任务
              </Button>
            </div>
            {msg ? <div className="mt-3 text-sm text-zinc-700">{msg}</div> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>任务列表</CardTitle>
            <CardDescription>上传图片后会作为任务卡片封面。</CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                任务表尚未就绪或权限不足：{error}
              </div>
            ) : null}
            {ordered.length ? (
              <div className="grid gap-3">
                {ordered.map((t) => (
                  <div
                    key={t.id}
                    className="grid gap-3 rounded-3xl border border-white/60 bg-white/70 p-4 shadow-sm shadow-zinc-200/30 sm:grid-cols-[132px_1fr_auto] sm:items-center"
                  >
                    <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-zinc-100">
                      <div className="aspect-[4/3]">
                        {t.imageUrl ? (
                          <img src={t.imageUrl} alt={t.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-xs font-semibold text-zinc-600">
                            暂无图片
                          </div>
                        )}
                      </div>
                      <div className="absolute left-2 top-2 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-amber-950">
                        +{t.delta}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-zinc-900">{t.title}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <label
                          className={cn(
                            "inline-flex items-center gap-2 rounded-2xl border border-dashed border-zinc-300 bg-white/50 px-3 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-white",
                          )}
                        >
                          <UploadCloud className="h-4 w-4" />
                          上传图片
                          <input
                            className="hidden"
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const url = await uploadTaskImage({ taskId: t.id, file, filename: file.name });
                              await updateTask(t.id, { imageUrl: url });
                              e.target.value = "";
                            }}
                          />
                        </label>
                        <Button
                          variant="secondary"
                          onClick={async () => {
                            const ok = await deleteTask(t.id);
                            if (!ok.ok) setMsg(ok.error || "删除失败");
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          删除
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/50 px-4 py-6 text-sm text-zinc-600">
                还没有任务，先创建一个。
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
