import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { usePointsStore } from "@/stores/pointsStore";
import ZootopiaBadge from "@/components/icons/ZootopiaBadge";
import { cn } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import { useTasksStore } from "@/stores/tasksStore";
import NoticeModal from "@/components/common/NoticeModal";

function TaskCardItem({
  title,
  delta,
  img,
  onPick,
}: {
  title: string;
  delta: number;
  img?: string;
  onPick: () => void;
}) {
  return (
    <button
      className={cn(
        "group w-full overflow-hidden rounded-2xl border border-white/60 bg-white/70 text-left shadow-sm shadow-zinc-200/30 transition hover:-translate-y-0.5 hover:bg-white",
      )}
      onClick={onPick}
    >
      <div className="relative aspect-[4/3] bg-zinc-100">
        {img ? (
          <img src={img} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-blue-100 via-white to-amber-100">
            <div className="grid place-items-center gap-2 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/80 shadow-sm shadow-blue-200/25">
                <ZootopiaBadge className="h-7 w-7 text-[color:var(--z-accent)]" />
              </div>
              <div className="px-4 text-sm font-semibold text-zinc-900">{title}</div>
            </div>
          </div>
        )}
        <div className="absolute left-3 top-3 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold text-amber-950">
          +{delta}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-zinc-900">{title}</div>
          <div className="text-xs font-medium text-[color:var(--z-accent)]">点击加分</div>
        </div>
      </div>
    </button>
  );
}

export default function Points() {
  const { hydrate, adjustPointsWithSecret } = usePointsStore();
  const { tasks, hydrate: hydrateTasks, error: tasksError } = useTasksStore();

  const [cart, setCart] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [secret, setSecret] = useState("");
  const [secretError, setSecretError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [notice, setNotice] = useState<{ title: string; description: string } | null>(null);
  const closeNotice = useCallback(() => setNotice(null), []);

  const cards = useMemo(() => tasks, [tasks]);

  const items = useMemo(() => {
    return cards
      .map((c) => ({
        ...c,
        qty: cart[c.id] || 0,
      }))
      .filter((x) => x.qty > 0);
  }, [cards, cart]);

  const total = useMemo(() => {
    return items.reduce((sum, it) => sum + it.qty * it.delta, 0);
  }, [items]);

  const summary = useMemo(() => {
    if (!items.length) return "";
    return items.map((it) => `${it.title}x${it.qty}`).join("，");
  }, [items]);

  useEffect(() => {
    hydrate();
    hydrateTasks();
  }, [hydrate, hydrateTasks]);

  return (
    <PageShell>
      <div className="grid gap-6">
        <div>
          <div className="text-lg font-semibold text-zinc-900">赚积分</div>
          <div className="mt-1 text-sm text-zinc-600">把完成的任务先放进累加积分，最后结算时输入密钥。</div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
          <div>
            <div className="mb-3 text-sm font-semibold text-zinc-900">任务卡片（点击加入累加积分）</div>
            {cards.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cards.map((c) => (
                  <TaskCardItem
                    key={c.id}
                    title={c.title}
                    delta={c.delta}
                    img={c.imageUrl}
                    onPick={() => setCart((s) => ({ ...s, [c.id]: (s[c.id] || 0) + 1 }))}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/50 px-4 py-6 text-sm text-zinc-600">
                {tasksError ? `任务加载失败：${tasksError}` : "还没有任务，请到后台的“任务管理”添加任务。"}
              </div>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-[color:var(--z-accent)]" />
                累加积分
              </CardTitle>
              <CardDescription>把完成的任务先放这里，最后一起结算。</CardDescription>
            </CardHeader>
            <CardContent>
              {items.length ? (
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    {items.map((it) => (
                      <div key={it.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/60 bg-white/60 px-3 py-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-zinc-900">{it.title}</div>
                          <div className="mt-0.5 text-xs text-zinc-600">每次 +{it.delta}，共 {it.qty * it.delta}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-800 transition hover:bg-zinc-50"
                            onClick={() =>
                              setCart((s) => {
                                const next = { ...s };
                                const v = (next[it.id] || 0) - 1;
                                if (v <= 0) delete next[it.id];
                                else next[it.id] = v;
                                return next;
                              })
                            }
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <div className="w-8 text-center text-sm font-semibold text-zinc-900">{it.qty}</div>
                          <button
                            className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-800 transition hover:bg-zinc-50"
                            onClick={() => setCart((s) => ({ ...s, [it.id]: (s[it.id] || 0) + 1 }))}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-zinc-100 px-3 py-2">
                    <div className="text-sm font-semibold text-zinc-900">合计</div>
                    <div className="text-sm font-semibold text-[color:var(--z-accent)]">+{total}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => setCart({})}
                    >
                      <Trash2 className="h-4 w-4" />
                      清空
                    </Button>
                    <Button className="flex-1" onClick={() => setOpen(true)}>
                      结算
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/50 px-4 py-6 text-sm text-zinc-600">
                  还没有任务，先点左边的卡片加入累加积分。
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        open={open}
        title="结算加分"
        description={total > 0 ? `将一次性加分 +${total}（${summary}）` : "累加积分为空"}
        onClose={() => {
          setOpen(false);
          setSecretError(undefined);
          setSecret("");
          setSubmitting(false);
          submittingRef.current = false;
        }}
      >
        <div className="grid gap-3">
          <div>
            <div className="mb-1 text-xs font-medium text-zinc-700">密钥</div>
            <Input
              type="password"
              placeholder="请输入密钥完成结算"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
            />
            {secretError ? <div className="mt-2 text-sm text-red-700">{secretError}</div> : null}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setOpen(false);
                setSecretError(undefined);
                setSecret("");
                setSubmitting(false);
                submittingRef.current = false;
              }}
            >
              取消
            </Button>
            <Button
              disabled={total <= 0 || submitting}
              onClick={async () => {
                if (submittingRef.current) return;
                submittingRef.current = true;
                setSubmitting(true);
                setSecretError(undefined);
                try {
                  const r = await adjustPointsWithSecret({
                    delta: total,
                    reason: summary ? `赚积分结算：${summary}` : "赚积分结算",
                    secret,
                  });
                  if (!r.ok) {
                    setSecretError("密钥错误");
                    setNotice({ title: "结算失败", description: "密钥错误或结算失败" });
                    return;
                  }
                  const next = r.newBalance ?? 0;
                  setCart({});
                  setOpen(false);
                  setSecret("");
                  setNotice({ title: "结算成功", description: `已增加 ${total} 积分，目前共 ${next} 积分。` });
                } finally {
                  submittingRef.current = false;
                  setSubmitting(false);
                }
              }}
            >
              {submitting ? "请稍后" : "确认结算"}
            </Button>
          </div>
        </div>
      </Modal>
      <NoticeModal
        open={!!notice}
        title={notice?.title ?? ""}
        description={notice?.description ?? ""}
        onClose={closeNotice}
      />
    </PageShell>
  );
}
