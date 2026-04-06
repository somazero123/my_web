import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";
import { usePointsStore } from "@/stores/pointsStore";
import { cn } from "@/lib/utils";
import { textToImageUrl } from "@/utils/textToImage";
import ZootopiaBadge from "@/components/icons/ZootopiaBadge";

const SHOP_PROMPT =
  "children's illustration, zootopia inspired anthropomorphic animal city, bunny police officer heroine shopping with a basket full of cute snacks and a small badge, bright pastel, clean line art, soft shading";
const EARN_PROMPT =
  "children's illustration, zootopia inspired, bunny police officer heroine earning coins, counting money with a happy smile, city background, bright pastel, clean line art, soft shading";
const ADMIN_PROMPT =
  "children's illustration, zootopia inspired, big buffalo police chief working at desk inside police office, warm light, organized documents, clean line art, soft shading";
const PATTERN_PROMPT =
  "seamless pattern, zootopia inspired police badge icons, city silhouettes, stars, cute vector style, light blue and gold, clean, minimal";

function EntryCard({
  to,
  title,
  desc,
  img,
}: {
  to: string;
  title: string;
  desc: string;
  img: string;
}) {
  const nav = useNavigate();
  return (
    <button
      type="button"
      onClick={() => nav(to)}
      className={cn(
        "group relative w-full overflow-hidden rounded-3xl border border-white/60 bg-white/60 text-left shadow-sm shadow-zinc-200/30 transition hover:-translate-y-1 hover:bg-white",
      )}
    >
      <div className="absolute inset-0">
        <img src={img} alt={title} className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-[1.03]" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/30 to-transparent" />
        <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-blue-300/25 blur-3xl transition duration-500 group-hover:translate-x-10" />
        <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-amber-300/25 blur-3xl transition duration-500 group-hover:-translate-x-10" />
      </div>
      <div className="absolute left-4 top-4 rounded-2xl border border-white/60 bg-white/75 px-4 py-2 text-left shadow-sm shadow-zinc-200/20">
        <div className="text-base font-semibold text-zinc-900">{title}</div>
      </div>
      <div className="relative flex min-h-[240px] flex-col justify-end p-5">
        <div>
          <div className="mt-1 inline-flex items-start gap-2 text-sm text-zinc-700">
            <ZootopiaBadge className="mt-0.5 h-4 w-4 text-[color:var(--z-accent)]" />
            <span>{desc}</span>
          </div>
        </div>
        <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--z-accent)]">
          进入 <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </button>
  );
}

export default function Home() {
  const { balance, hydrate } = usePointsStore();
  const nav = useNavigate();
  const shopImg = textToImageUrl(SHOP_PROMPT, "landscape_4_3");
  const earnImg = textToImageUrl(EARN_PROMPT, "landscape_4_3");
  const adminImg = textToImageUrl(ADMIN_PROMPT, "landscape_4_3");
  const pattern = textToImageUrl(PATTERN_PROMPT, "landscape_4_3");

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <PageShell showNav={false}>
      <div className="grid gap-6">
        <Card className="overflow-hidden">
          <div className="relative">
            <div className="absolute inset-0">
              <img src={pattern} alt="疯狂动物城图案" className="h-full w-full object-cover opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-br from-white via-white/70 to-white/40" />
            </div>
            <div className="relative px-5 py-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="mt-1 inline-flex items-center gap-2 text-base font-semibold text-zinc-900">
                    <ZootopiaBadge className="h-6 w-6 text-[color:var(--z-accent)]" />
                    朱迪的积分世界
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => nav("/shop")}
                      className="rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-white"
                    >
                      积分商城
                    </button>
                    <button
                      type="button"
                      onClick={() => nav("/earn")}
                      className="rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-white"
                    >
                      赚积分
                    </button>
                    <button
                      type="button"
                      onClick={() => nav("/admin")}
                      className="rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-white"
                    >
                      后台管理
                    </button>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/70 bg-white/70 px-5 py-4 shadow-sm shadow-blue-200/20">
                  <div className="text-xs font-semibold text-zinc-700">累积积分</div>
                  <div className="mt-1 flex items-end gap-2">
                    <div className="text-3xl font-extrabold tracking-tight text-[color:var(--z-accent)]">{balance}</div>
                    <div className="pb-1 text-sm font-semibold text-zinc-900">积分</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <EntryCard
            to="/shop"
            title="积分商城"
            desc="用积分换购喜欢的奖励吧"
            img={shopImg}
          />
          <EntryCard
            to="/earn"
            title="赚积分"
            desc="选择任务开始吧"
            img={earnImg}
          />
          <EntryCard
            to="/admin"
            title="后台管理"
            desc="牛局长在办公室：商品、积分、密钥都在这里管理。"
            img={adminImg}
          />
        </div>
      </div>
    </PageShell>
  );
}
