import { useState } from "react";
import { KeyRound } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";

export default function AdminSecret() {
  const [oldSecret, setOldSecret] = useState("");
  const [nextSecret, setNextSecret] = useState("");
  const [msg, setMsg] = useState<string | undefined>(undefined);

  return (
    <PageShell>
      <div className="grid gap-6">
        <div>
          <div className="text-lg font-semibold text-zinc-900">密钥修改</div>
          <div className="mt-1 text-sm text-zinc-600">先验证旧密钥，再设置新密钥。</div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-[color:var(--z-accent)]" />
              设置新密钥
            </CardTitle>
            <CardDescription>新密钥会保存在云端，多台设备同步生效。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-xs font-medium text-zinc-700">旧密钥</div>
                <Input type="password" value={oldSecret} onChange={(e) => setOldSecret(e.target.value)} />
              </div>
              <div>
                <div className="mb-1 text-xs font-medium text-zinc-700">新密钥</div>
                <Input type="password" value={nextSecret} onChange={(e) => setNextSecret(e.target.value)} />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="text-xs text-zinc-600">建议设置一个只有家长知道的密钥。</div>
              <Button
                onClick={async () => {
                  setMsg(undefined);
                  const { error } = await supabase.rpc("set_parent_secret", {
                    p_old: oldSecret,
                    p_new: nextSecret,
                  });
                  if (error) {
                    setMsg("旧密钥错误或设置失败");
                    return;
                  }
                  setOldSecret("");
                  setNextSecret("");
                  setMsg("密钥已更新");
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
