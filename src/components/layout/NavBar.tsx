import { useLocation, useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import { cn } from "@/lib/utils";
import ZootopiaBadge from "@/components/icons/ZootopiaBadge";

export default function NavBar() {
  const nav = useNavigate();
  const loc = useLocation();
  return (
    <div className="sticky top-0 z-40 border-b border-white/50 bg-[color:var(--z-bg)]/60 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white shadow-sm shadow-blue-200/30">
            <ZootopiaBadge className="h-6 w-6 text-[color:var(--z-accent)]" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-zinc-900">积分世界</div>
            <div className="text-xs text-zinc-600">疯狂动物城主题</div>
          </div>
        </div>

        <div className="hidden items-center gap-1 rounded-2xl bg-white/40 p-1 sm:flex">
          <button
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
              loc.pathname === "/" ? "bg-white/70 text-zinc-900" : "text-zinc-700 hover:bg-white/50",
            )}
            onClick={() => nav("/")}
            type="button"
          >
            <span className="text-zinc-700">
              <Home className="h-4 w-4" />
            </span>
            <span>首页</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block" />
        </div>
      </div>
    </div>
  );
}
