import { useRef, useState, useEffect, useCallback } from "react";
import { Pencil } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { usePointsStore } from "@/stores/pointsStore";
import NoticeModal from "@/components/common/NoticeModal";

export default function AdminPoints() {
  const { balance, hydrate, setPointsWithSecret } = usePointsStore();

  const [target, setTarget] = useState<number>(balance);
  const [reason, setReason] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [notice, setNotice] = useState<{ title: string; description: string } | null>(null);
  const closeNotice = useCallback(() => setNotice(null), []);

  useEffect(() => {
    setTarget(balance);
  }, [balance]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

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
            <CardDescription>直接设置用户的目标积分。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 text-sm text-zinc-700">
              当前积分: <span className="font-bold">{balance}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-xs font-medium text-zinc-700">修改为</div>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={target}
                  onChange={(e) => setTarget(Number(e.target.value || 0))}
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
              <div className="text-xs text-zinc-600">提示：输入最终想要达到的积分值。</div>
              <Button
                disabled={submitting}
                onClick={async () => {
                  if (submittingRef.current) return;
                  submittingRef.current = true;
                  setSubmitting(true);
                  try {
                    const r = await setPointsWithSecret({
                      target,
                      reason: reason.trim() ? `后台修改：${reason.trim()}` : "后台修改：积分设置",
                      secret,
                    });
                    if (!r.ok) {
                      setNotice({ title: "修改失败", description: "密钥错误或修改失败" });
                      return;
                    }
                    const next = r.newBalance ?? target;
                    setSecret("");
                    setReason("");
                    setNotice({ title: "修改成功", description: `已修改为 ${target} 积分，目前共 ${next} 积分。` });
                  } finally {
                    submittingRef.current = false;
                    setSubmitting(false);
                  }
                }}
              >
                {submitting ? "请稍后" : "确认修改"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <NoticeModal
        open={!!notice}
        title={notice?.title ?? ""}
        description={notice?.description ?? ""}
        onClose={closeNotice}
      />
    </PageShell>
  );
}
