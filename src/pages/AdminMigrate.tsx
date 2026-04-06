import { useMemo, useState } from "react";
import { Database, Upload } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";
import { uploadProductImage } from "@/lib/storage";
import { useProductsStore } from "@/stores/productsStore";
import Textarea from "@/components/ui/Textarea";

type LegacyProductImage = { id: string; url: string; source?: string; sortOrder?: number };
type LegacyProduct = {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  stock: number;
  coverImageUrl?: string;
  images: LegacyProductImage[];
};

function parseLegacyProducts(): LegacyProduct[] {
  const keys = ["kids_products_store_v3", "kids_products_store_v2", "kids_products_store_v1"];
  for (const k of keys) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== "object") continue;
      const obj = parsed as { state?: { products?: unknown }; products?: unknown };
      const productsRaw = obj.state?.products ?? obj.products;
      const products = Array.isArray(productsRaw) ? (productsRaw as LegacyProduct[]) : [];
      if (Array.isArray(products) && products.length) return products;
    } catch {
      continue;
    }
  }
  return [];
}

async function urlToBlob(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("fetch failed");
  return await res.blob();
}

export default function AdminMigrate() {
  const { hydrate } = useProductsStore();
  const legacy = useMemo(() => parseLegacyProducts(), []);
  const [pasted, setPasted] = useState("");

  const pastedProducts = useMemo(() => {
    const raw = pasted.trim();
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== "object") return [];
      const obj = parsed as { state?: { products?: unknown }; products?: unknown };
      const productsRaw = obj.state?.products ?? obj.products;
      return Array.isArray(productsRaw) ? (productsRaw as LegacyProduct[]) : [];
    } catch {
      return [];
    }
  }, [pasted]);

  const sourceProducts = pastedProducts.length ? pastedProducts : legacy;
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [dedupeByName, setDedupeByName] = useState(true);

  const addLog = (line: string) => setLog((s) => [line, ...s].slice(0, 200));

  return (
    <PageShell>
      <div className="grid gap-6">
        <div>
          <div className="text-lg font-semibold text-zinc-900">本地商品迁移到云端</div>
          <div className="mt-1 text-sm text-zinc-600">把旧版本浏览器里保存的商品/图片迁移到 Supabase，方便多台设备同步。</div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-4 w-4 text-[color:var(--z-accent)]" />
              检测到的本地数据
            </CardTitle>
            <CardDescription>
              当前共可迁移 {sourceProducts.length} 个商品（优先使用粘贴的数据，其次使用当前浏览器本地数据）。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <div className="text-xs font-semibold text-zinc-700">可选：从其他设备导出并粘贴</div>
              <Textarea
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                placeholder="把旧设备浏览器导出的 localStorage 内容粘贴到这里（例如 kids_products_store_v3 的值）"
              />
              <div className="text-xs text-zinc-600">留空则自动读取当前浏览器本地数据。</div>
            </div>

            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={dedupeByName}
                onChange={(e) => setDedupeByName(e.target.checked)}
              />
              按商品名称去重（云端已有同名商品则跳过）
            </label>

            <div className="mt-4 flex items-center gap-2">
              <Button
                disabled={running || sourceProducts.length === 0}
                onClick={async () => {
                  setRunning(true);
                  setDone(false);
                  setLog([]);
                  try {
                    addLog("开始迁移...");

                    for (const p of sourceProducts) {
                      const name = (p.name || "").trim();
                      if (!name) continue;

                      if (dedupeByName) {
                        const exists = await supabase
                          .from("products")
                          .select("id")
                          .eq("name", name)
                          .limit(1);
                        if ((exists.data?.length ?? 0) > 0) {
                          addLog(`跳过：${name}（云端已有）`);
                          continue;
                        }
                      }

                      const created = await supabase
                        .from("products")
                        .insert({
                          name,
                          description: (p.description || "").trim(),
                          points_cost: Number(p.pointsCost) || 0,
                          stock: Math.max(0, Number(p.stock) || 0),
                        })
                        .select("id")
                        .single();

                      if (created.error || !created.data?.id) {
                        addLog(`失败：${name}（创建商品失败）`);
                        continue;
                      }

                      const productId = created.data.id as string;

                      const sortedImages = (p.images || [])
                        .slice()
                        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

                      const uploadedUrls: string[] = [];
                      for (const img of sortedImages) {
                        if (!img?.url) continue;
                        let url = img.url;
                        try {
                          if (url.startsWith("data:")) {
                            const blob = await urlToBlob(url);
                            url = await uploadProductImage({ productId, file: blob, filename: "legacy.png" });
                          } else {
                            try {
                              const blob = await urlToBlob(url);
                              url = await uploadProductImage({ productId, file: blob, filename: "legacy.jpg" });
                            } catch {
                              url = img.url;
                            }
                          }
                        } catch {
                          url = img.url;
                        }
                        uploadedUrls.push(url);
                      }

                      if (uploadedUrls.length) {
                        const rows = uploadedUrls.map((url, idx) => ({
                          product_id: productId,
                          url,
                          source: "upload",
                          sort_order: idx,
                        }));
                        await supabase.from("product_images").insert(rows);
                      }

                      const cover = p.coverImageUrl && uploadedUrls.length
                        ? uploadedUrls.find((u) => u.includes(p.coverImageUrl as string)) ?? uploadedUrls[0]
                        : uploadedUrls[0];

                      if (cover) {
                        await supabase.from("products").update({ cover_image_url: cover }).eq("id", productId);
                      }

                      addLog(`完成：${name}`);
                    }

                    await hydrate();
                    addLog("迁移完成。");
                    setDone(true);
                  } finally {
                    setRunning(false);
                  }
                }}
              >
                <Upload className="h-4 w-4" />
                开始迁移
              </Button>
            </div>

            {done ? <div className="mt-3 text-sm text-emerald-700">已完成迁移，可到“积分商城/商品管理”查看。</div> : null}
            <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-white/50 px-4 py-3">
              <div className="text-xs font-semibold text-zinc-700">迁移日志</div>
              <div className="mt-2 max-h-56 overflow-auto text-xs text-zinc-700">
                {log.length ? log.map((l, idx) => <div key={idx}>{l}</div>) : <div>暂无</div>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

