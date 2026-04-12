import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "@/components/layout/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";

async function sha256Base64Url(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function accountToEmail(account: string) {
  const trimmed = account.trim();
  if (!trimmed) return "";
  if (trimmed.includes("@")) return trimmed.toLowerCase();
  const key = trimmed.toLowerCase();
  const hash = await sha256Base64Url(key);
  return `u_${hash}@accounts.local`;
}

export default function Login() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>{mode === "login" ? "登录" : "注册"}</CardTitle>
            <CardDescription>用于家里多台设备同步积分与商品数据。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <div>
                <div className="mb-1 text-xs font-medium text-zinc-700">账号</div>
                <Input value={account} onChange={(e) => setAccount(e.target.value)} placeholder="例如：admin / 妈妈 / 爸爸" />
              </div>
              <div>
                <div className="mb-1 text-xs font-medium text-zinc-700">密码</div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少 6 位"
                />
              </div>
              <Button
                disabled={loading}
                onClick={async () => {
                  setMsg(undefined);
                  setLoading(true);
                  try {
                    if (mode === "login") {
                      const email = await accountToEmail(account);
                      if (!email) throw new Error("请输入账号");
                      const { error } = await supabase.auth.signInWithPassword({
                        email,
                        password,
                      });
                      if (error) throw error;
                      nav("/");
                      return;
                    }

                    const trimmedAccount = account.trim();
                    if (!trimmedAccount) throw new Error("请输入账号");
                    const regRes = await fetch("/api/auth/register", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ username: trimmedAccount, password }),
                    });
                    const regJson = (await regRes.json().catch(() => null)) as { success?: boolean; error?: string } | null;
                    if (!regRes.ok || !regJson?.success) throw new Error(regJson?.error || "注册失败");

                    const email = await accountToEmail(trimmedAccount);
                    const { error } = await supabase.auth.signInWithPassword({ email, password });
                    if (error) throw error;
                    nav("/");
                  } catch (e) {
                    const raw = e instanceof Error ? e.message : "操作失败";
                    const lower = raw.toLowerCase();
                    if (lower.includes("database")) {
                      setMsg("数据库错误：请稍后重试（或联系管理员检查 Supabase 触发器/函数）。");
                    } else if (lower.includes("invalid login credentials")) {
                      setMsg("账号不存在或密码错误。首次使用请先点“去注册”创建账号。");
                    } else if (lower.includes("email not confirmed")) {
                      setMsg("账号未启用，请联系管理员。");
                    } else {
                      setMsg(raw);
                    }
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {mode === "login" ? "登录" : "注册"}
              </Button>
              <button
                type="button"
                className="text-sm font-medium text-[color:var(--z-accent)] underline underline-offset-2"
                onClick={() => {
                  setMsg(undefined);
                  setMode((m) => (m === "login" ? "signup" : "login"));
                }}
              >
                {mode === "login" ? "没有账号？去注册" : "已有账号？去登录"}
              </button>
              {msg ? <div className="text-sm text-zinc-700">{msg}</div> : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
