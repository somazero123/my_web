import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "@/components/layout/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";

export default function Login() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
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
                <div className="mb-1 text-xs font-medium text-zinc-700">邮箱</div>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
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
                      const { error } = await supabase.auth.signInWithPassword({
                        email: email.trim(),
                        password,
                      });
                      if (error) throw error;
                      nav("/");
                      return;
                    }

                    const { error } = await supabase.auth.signUp({
                      email: email.trim(),
                      password,
                      options: { data: { display_name: "" } },
                    });
                    if (error) throw error;
                    setMsg("注册成功，请登录。");
                    setMode("login");
                  } catch (e) {
                    const raw = e instanceof Error ? e.message : "操作失败";
                    if (raw.toLowerCase().includes("database")) {
                      setMsg("数据库错误：请稍后重试（或联系管理员检查 Supabase 触发器/函数）。");
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
