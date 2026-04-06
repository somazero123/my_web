import { Link } from "react-router-dom";
import { BadgeCheck, CalendarDays, Database, KeyRound, Pencil, Shield } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { textToImageUrl } from "@/utils/textToImage";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";

const ADMIN_HERO_PROMPT =
  "children's illustration, zootopia inspired, big buffalo police chief working at desk inside police office, warm light, organized documents, clean line art, soft shading";

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
  const hero = textToImageUrl(ADMIN_HERO_PROMPT, "landscape_4_3");

  return (
    <PageShell>
      <div className="grid gap-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-zinc-900">后台管理</div>
            <div className="mt-1 text-sm text-zinc-600">牛局长在办公室：管理商品、积分、密钥与每日收入。</div>
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

        <Card className="overflow-hidden">
          <div className="relative">
            <div className="absolute inset-0">
              <img src={hero} alt="后台管理" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" />
            </div>
            <div className="relative px-5 py-6">
              <CardTitle className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-white shadow-sm shadow-blue-200/30">
                  <Shield className="h-4 w-4 text-[color:var(--z-accent)]" />
                </span>
                牛局长的后台管理
              </CardTitle>
              <CardDescription className="mt-2">管理换购商品、调整积分、修改密钥。</CardDescription>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          <ModuleCard
            to="/admin/products"
            title="商品管理"
            desc="新增商品、上传图片、生成 3 张候选图。"
            icon={<BadgeCheck className="h-5 w-5" />}
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
          <ModuleCard
            to="/admin/migrate"
            title="数据迁移"
            desc="把旧浏览器的商品迁移到云端。"
            icon={<Database className="h-5 w-5" />}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>说明</CardTitle>
            <CardDescription>当前为本地演示版：密钥与数据保存在浏览器本地。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-zinc-700">默认密钥为 `parent`，也可用环境变量 `VITE_PARENT_SECRET` 作为初始值。</div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
