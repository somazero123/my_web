import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ImageIcon, ShoppingBag } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import PointsPill from "@/components/common/PointsPill";
import { usePointsStore } from "@/stores/pointsStore";
import { useProductsStore } from "@/stores/productsStore";
import { cn } from "@/lib/utils";
import NoticeModal from "@/components/common/NoticeModal";

export default function ProductDetail() {
  const { id } = useParams();
  const { getById, hydrate: hydrateProducts } = useProductsStore();
  const product = id ? getById(id) : undefined;
  const { balance, hydrate: hydratePoints, redeemProduct } = usePointsStore();

  const [activeUrl, setActiveUrl] = useState<string | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [notice, setNotice] = useState<{ title: string; description: string } | null>(null);
  const closeNotice = useCallback(() => setNotice(null), []);

  const images = useMemo((): Array<{ id: string; url: string }> => {
    if (!product) return [];
    const list = product.images.length
      ? product.images.map((x) => ({ id: x.id, url: x.url }))
      : product.coverImageUrl
        ? [{ id: "cover", url: product.coverImageUrl }]
        : [];
    return list;
  }, [product]);

  useEffect(() => {
    hydratePoints();
    hydrateProducts();
  }, [hydratePoints, hydrateProducts]);

  if (!product) {
    return (
      <PageShell>
        <Card>
          <CardContent className="py-10 text-center">
            <div className="text-sm text-zinc-600">商品不存在</div>
            <div className="mt-4">
              <Link to="/shop">
                <Button variant="secondary">返回换购</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  const cover = activeUrl ?? product.coverImageUrl ?? images[0]?.url;
  const canRedeem = balance >= product.pointsCost && product.stock > 0;

  return (
    <PageShell>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link to="/shop" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-zinc-900">
          <ArrowLeft className="h-4 w-4" />
          返回换购列表
        </Link>
        <PointsPill value={balance} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <Card className="overflow-hidden">
          <div className="aspect-[4/3] bg-zinc-100">
            {cover ? (
              <img src={cover} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-500">
                <ImageIcon className="h-6 w-6" />
              </div>
            )}
          </div>
          {images.length > 1 ? (
            <div className="grid grid-cols-4 gap-2 p-4 sm:grid-cols-6">
              {images.slice(0, 12).map((img) => (
                <button
                  key={img.id}
                  className={cn(
                    "aspect-square overflow-hidden rounded-xl border",
                    (activeUrl ?? cover) === img.url ? "border-blue-400" : "border-white/60 hover:border-zinc-200",
                  )}
                  onClick={() => setActiveUrl(img.url)}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{product.name}</CardTitle>
            <CardDescription>{product.description || ""}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                需要 {product.pointsCost} 积分
              </div>
              <div className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-700">库存 {product.stock}</div>
            </div>

            <div className="mt-4">
              <Button
                className="w-full"
                disabled={!canRedeem}
                onClick={() => {
                  setOpen(true);
                }}
              >
                <ShoppingBag className="h-4 w-4" />
                立即换购
              </Button>
              {!canRedeem ? (
                <div className="mt-2 text-xs text-zinc-600">
                  {product.stock <= 0 ? "库存不足" : "积分不足"}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <Modal
        open={open}
        title="确认换购"
        description={`将扣减 ${product.pointsCost} 积分，是否继续？`}
        onClose={() => {
          setOpen(false);
          setSubmitting(false);
          submittingRef.current = false;
        }}
      >
        <div className="flex flex-col gap-3">
          <div className="text-sm text-zinc-700">确认后将扣分并减少库存。</div>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              disabled={submitting}
              onClick={() => {
                setOpen(false);
                setSubmitting(false);
                submittingRef.current = false;
              }}
            >
              取消
            </Button>
            <Button
              disabled={submitting}
              onClick={async () => {
                if (submittingRef.current) return;
                submittingRef.current = true;
                setSubmitting(true);
                try {
                  const r = await redeemProduct(product.id);
                  if (!r.ok) {
                    setNotice({ title: "换购失败", description: r.error || "换购失败" });
                    return;
                  }
                  const next = r.newBalance ?? balance - product.pointsCost;
                  setOpen(false);
                  setNotice({
                    title: "换购成功",
                    description: `已扣减 ${product.pointsCost} 积分，目前共 ${next} 积分。`,
                  });
                } finally {
                  submittingRef.current = false;
                  setSubmitting(false);
                }
              }}
            >
              {submitting ? "请稍后" : "确认换购"}
            </Button>
          </div>
        </div>
      </Modal>
      <NoticeModal
        open={!!notice}
        title={notice?.title ?? ""}
        description={notice?.description ?? ""}
        onClose={closeNotice}
      />
    </PageShell>
  );
}
