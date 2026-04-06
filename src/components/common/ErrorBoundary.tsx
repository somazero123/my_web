import { Component } from "react";

type Props = {
  children: React.ReactNode;
};

type State = {
  error?: Error;
};

export default class ErrorBoundary extends Component<Props, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const msg = String(error.message || error);
    const isSupabaseEnv = msg.includes("VITE_SUPABASE_URL") || msg.includes("VITE_SUPABASE_ANON_KEY") || msg.includes("Missing Supabase env");

    return (
      <div className="min-h-screen bg-[color:var(--z-bg)] px-4 py-10 text-zinc-900">
        <div className="mx-auto w-full max-w-2xl rounded-3xl border border-white/60 bg-white/70 p-6 shadow-sm shadow-zinc-200/30">
          <div className="text-lg font-semibold">页面初始化失败</div>
          <div className="mt-2 text-sm text-zinc-700">{isSupabaseEnv ? "大概率是环境变量未配置导致。" : "请打开浏览器控制台查看错误信息。"}</div>

          {isSupabaseEnv ? (
            <div className="mt-4 grid gap-2 text-sm text-zinc-800">
              <div className="font-semibold">在 Vercel 设置这两个环境变量并重新部署：</div>
              <div className="rounded-2xl bg-zinc-50 px-4 py-3 font-mono text-xs">
                VITE_SUPABASE_URL
                <br />
                VITE_SUPABASE_ANON_KEY
              </div>
              <div className="text-xs text-zinc-600">提示：Vite 的 `VITE_` 环境变量必须在构建时注入，改完变量后需要重新部署。</div>
            </div>
          ) : null}

          <div className="mt-4 rounded-2xl bg-zinc-950 px-4 py-3 font-mono text-xs text-zinc-100 whitespace-pre-wrap">{msg}</div>
        </div>
      </div>
    );
  }
}

