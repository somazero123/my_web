import { useState } from "react";
import { Pencil } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { usePointsStore } from "@/stores/pointsStore";

export default function AdminPoints() {
  const { adjustPointsWithSecret } = usePointsStore();

  const [delta, setDelta] = useState<number>(1);
  const [reason, setReason] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [msg, setMsg] = useState<string | undefined>(undefined);

  return (
    <PageShell>
      <div className="grid gap-6">
        <div>
          <div className="text-lg font-semibold text-zinc-900">积分修改</div>
          <div className="mt-1 text-sm text-zinc-600">修改积分需要输入密钥。</div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-[color:var(--z-accent)]" />
              调整积分
            </CardTitle>
            <CardDescription>支持加分或扣分（扣分请输入负数）。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-xs font-medium text-zinc-700">变更值</div>
                <Input
                  type="number"
                  step={1}
                  value={delta}
                  onChange={(e) => setDelta(Number(e.target.value || 0))}
                />
              </div>
              <div>
                <div className="mb-1 text-xs font-medium text-zinc-700">密钥</div>
                <Input type="password" value={secret} onChange={(e) => setSecret(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <div className="mb-1 text-xs font-medium text-zinc-700">原因（可选）</div>
                <Input
                  placeholder="例如：补发积分 / 纠正扣分"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="text-xs text-zinc-600">提示：正数=加分，负数=扣分。</div>
              <Button
                onClick={async () => {
                  setMsg(undefined);
                  const r = await adjustPointsWithSecret({
                    delta,
                    reason: reason.trim() ? `后台修改：${reason.trim()}` : "后台修改：积分调整",
                    secret,
                  });
                  if (!r.ok) {
                    setMsg("密钥错误或变更失败");
                    return;
                  }
                  setSecret("");
                  setReason("");
                  setDelta(1);
                  setMsg("修改成功");
                }}
              >
                确认修改
              </Button>
            </div>
            {msg ? <div className="mt-3 text-sm text-zinc-700">{msg}</div> : null}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
