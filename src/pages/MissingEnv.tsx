import PageShell from "@/components/layout/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

export default function MissingEnv() {
  return (
    <PageShell>
      <div className="mx-auto w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>需要配置 Supabase 环境变量</CardTitle>
            <CardDescription>当前部署缺少构建时环境变量，导致无法初始化登录与数据同步。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 text-sm text-zinc-800">
              <div className="font-semibold">在 Vercel 项目设置以下变量（Production/Preview 都建议配置）：</div>
              <div className="rounded-2xl bg-zinc-50 px-4 py-3 font-mono text-xs">
                VITE_SUPABASE_URL
                <br />
                VITE_SUPABASE_ANON_KEY
              </div>
              <div className="text-xs text-zinc-600">Vite 的 `VITE_` 变量必须在构建时注入，配置后需要重新部署。</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

