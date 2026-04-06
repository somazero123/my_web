import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShoppingBag } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import PointsPill from "@/components/common/PointsPill";
import { usePointsStore } from "@/stores/pointsStore";
import { useProductsStore } from "@/stores/productsStore";
import { cn } from "@/lib/utils";

function ProductCard({
  id,
  name,
  points,
  cover,
  stock,
}: {
  id: string;
  name: string;
  points: number;
  cover?: string;
  stock: number;
}) {
  return (
    <Link
      to={`/product/${id}`}
      className={cn(
        "group rounded-2xl border border-white/60 bg-white/70 shadow-sm shadow-zinc-200/30 transition hover:-translate-y-0.5 hover:bg-white",
      )}
    >
      <div className="aspect-[4/3] overflow-hidden rounded-t-2xl bg-zinc-100">
        {cover ? (
          <img
            src={cover}
            alt={name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="h-full w-full animate-pulse bg-zinc-200" />
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-zinc-900">{name}</div>
            <div className="mt-1 text-xs text-zinc-600">库存：{stock}</div>
          </div>
          <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {points} 分
          </div>
        </div>
        <div className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[color:var(--z-accent)]">
          查看详情 <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}

export default function Shop() {
  const { balance, hydrate: hydratePoints } = usePointsStore();
  const { products, hydrate: hydrateProducts } = useProductsStore();

  useEffect(() => {
    hydratePoints();
    hydrateProducts();
  }, [hydratePoints, hydrateProducts]);

  return (
    <PageShell>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-[color:var(--z-accent)]" />
              积分商城
            </CardTitle>
            <CardDescription>挑选奖励，用积分去兑换。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-zinc-700">当前积分</div>
              <PointsPill value={balance} />
            </div>
          </CardContent>
        </Card>

        {products.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-zinc-600">暂无可换购商品</CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                points={p.pointsCost}
                cover={p.coverImageUrl}
                stock={p.stock}
              />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
