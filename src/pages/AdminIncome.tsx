import { useEffect, useMemo } from "react";
import { CalendarDays } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { usePointsStore } from "@/stores/pointsStore";

type DailyIncome = {
  dateKey: string;
  label: string;
  total: number;
  items: Array<{ reason: string; delta: number; createdAt: string }>;
};

function toDateKey(ts: string) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toLabel(dateKey: string) {
  const [, m, d] = dateKey.split("-");
  return `${Number(m)}月${Number(d)}日`;
}

export default function AdminIncome() {
  const { ledger, hydrate } = usePointsStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const days = useMemo((): DailyIncome[] => {
    const income = ledger.filter((x) => x.delta > 0);
    const map = new Map<string, DailyIncome>();
    for (const it of income) {
      const key = toDateKey(it.createdAt);
      const entry = map.get(key) ?? {
        dateKey: key,
        label: toLabel(key),
        total: 0,
        items: [],
      };
      entry.total += it.delta;
      entry.items.push({ reason: it.reason, delta: it.delta, createdAt: it.createdAt });
      map.set(key, entry);
    }
    return Array.from(map.values())
      .map((d) => ({
        ...d,
        items: d.items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
      }))
      .sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
  }, [ledger]);

  return (
    <PageShell>
      <div className="grid gap-6">
        <div>
          <div className="text-lg font-semibold text-zinc-900">每日收入详情</div>
          <div className="mt-1 text-sm text-zinc-600">记录每天赚取了哪些任务，共计多少积分。</div>
        </div>

        {days.length ? (
          <div className="grid gap-4">
            {days.map((d) => (
              <Card key={d.dateKey}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-[color:var(--z-accent)]" />
                      {d.label}
                    </span>
                    <span className="text-[color:var(--z-accent)]">+{d.total}</span>
                  </CardTitle>
                  <CardDescription>{d.dateKey}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    {d.items.map((it) => (
                      <div key={it.createdAt + it.reason} className="flex items-start justify-between gap-3 rounded-2xl border border-white/60 bg-white/60 px-3 py-2">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-zinc-900">{it.reason}</div>
                          <div className="mt-0.5 text-xs text-zinc-600">{new Date(it.createdAt).toLocaleTimeString()}</div>
                        </div>
                        <div className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">+{it.delta}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>暂无记录</CardTitle>
              <CardDescription>先去“赚积分”完成一次结算，就会在这里看到每日收入详情。</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-zinc-700">提示：当前仅统计积分增加记录（正数）。</div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
