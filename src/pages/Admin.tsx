import { Link } from "react-router-dom";
import { BadgeCheck, CalendarDays, KeyRound, ListChecks, Pencil, Users } from "lucide-react";
import { useEffect, useState } from "react";
import PageShell from "@/components/layout/PageShell";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/providers/authContext";

function ModuleCard({
  to,
  title,
  desc,
  icon,
}: {
  to: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group rounded-3xl border border-white/60 bg-white/70 p-5 shadow-sm shadow-zinc-200/30 transition hover:-translate-y-0.5 hover:bg-white",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-base font-semibold text-zinc-900">{title}</div>
          <div className="mt-1 text-sm text-zinc-600">{desc}</div>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white shadow-sm shadow-blue-200/30 text-[color:var(--z-accent)]">
          {icon}
        </div>
      </div>
    </Link>
  );
}

export default function Admin() {
  const { session } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
      setIsSuperAdmin(data?.role === "superadmin");
    })();
  }, [session?.user?.id]);

  return (
    <PageShell>
      <div className="grid gap-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-zinc-900">后台管理</div>
            <div className="mt-1 text-sm text-zinc-600">管理商品、任务、积分、密钥与每日收入。</div>
          </div>
          <Button
            variant="secondary"
            onClick={async () => {
              await supabase.auth.signOut();
            }}
          >
            退出登录
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {isSuperAdmin && (
            <ModuleCard
              to="/admin/users"
              title="超级管理员"
              desc="查看所有账号，直接修改积分，免密切换用户视角。"
              icon={<Users className="h-5 w-5" />}
            />
          )}
          <ModuleCard
            to="/admin/products"
            title="商品管理"
            desc="新增商品、上传图片并设置主图。"
            icon={<BadgeCheck className="h-5 w-5" />}
          />
          <ModuleCard
            to="/admin/tasks"
            title="任务管理"
            desc="管理“赚积分”里的任务与任务封面图。"
            icon={<ListChecks className="h-5 w-5" />}
          />
          <ModuleCard
            to="/admin/points"
            title="积分修改"
            desc="输入密钥后才能修改积分。"
            icon={<Pencil className="h-5 w-5" />}
          />
          <ModuleCard
            to="/admin/secret"
            title="密钥修改"
            desc="用旧密钥验证后设置新密钥。"
            icon={<KeyRound className="h-5 w-5" />}
          />
          <ModuleCard
            to="/admin/income"
            title="每日收入"
            desc="查看每日赚取的任务与总积分。"
            icon={<CalendarDays className="h-5 w-5" />}
          />
        </div>
      </div>
    </PageShell>
  );
}
