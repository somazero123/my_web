import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Box, Check, ImagePlus, Sparkles, UploadCloud, X } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { useProductsStore } from "@/stores/productsStore";
import { textToImageUrl } from "@/utils/textToImage";
import { cn } from "@/lib/utils";
import { uploadProductImage } from "@/lib/storage";

function buildProductPrompt(name: string, variant: number) {
  const base =
    "children's illustration, zootopia inspired anthropomorphic animal city, cute bunny police officer heroine, bright pastel, clean line art, soft shading";
  if (variant === 0) return `${base}, product showcase, ${name}, studio light`;
  if (variant === 1) return `${base}, ${name}, city street background, playful`;
  return `${base}, ${name}, cute gift presentation, badge and stars`;
}

export default function AdminProducts() {
  const {
    products,
    hydrate,
    createProduct,
    addImages,
    setCover,
    removeImage,
    setStock: setProductStock,
  } = useProductsStore();
  const [selectedId, setSelectedId] = useState<string | undefined>(products[0]?.id);

  const selected = useMemo(() => products.find((p) => p.id === selectedId) ?? products[0], [products, selectedId]);

  const [name, setName] = useState("");
  const [pointsCost, setPointsCost] = useState<number>(10);
  const [newProductStock, setNewProductStock] = useState<number>(5);
  const [desc, setDesc] = useState("");
  const [msg, setMsg] = useState<string | undefined>(undefined);

  const [stockValue, setStockValue] = useState<number>(selected?.stock ?? 0);
  const [stockMsg, setStockMsg] = useState<string | undefined>(undefined);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!selected) return;
    setStockValue(selected.stock);
    setStockMsg(undefined);
  }, [selected]);

  const [candidates, setCandidates] = useState<string[]>([]);
  const [picked, setPicked] = useState<Record<string, boolean>>({});

  return (
    <PageShell>
      <div className="grid gap-6">
        <div>
          <div className="text-lg font-semibold text-zinc-900">商品管理</div>
          <div className="mt-1 text-sm text-zinc-600">新增商品、上传图片，或按名称生成 3 张候选图。</div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-[color:var(--z-accent)]" />
              新增商品
            </CardTitle>
            <CardDescription>创建后可在下方进行图片上传与候选图选择。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-xs font-medium text-zinc-700">商品名称</div>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：警徽贴纸" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="mb-1 text-xs font-medium text-zinc-700">所需积分</div>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={pointsCost}
                    onChange={(e) => setPointsCost(Math.max(1, Number(e.target.value || 1)))}
                  />
                </div>
                <div>
                  <div className="mb-1 text-xs font-medium text-zinc-700">库存</div>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={newProductStock}
                    onChange={(e) => setNewProductStock(Math.max(0, Number(e.target.value || 0)))}
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <div className="mb-1 text-xs font-medium text-zinc-700">描述</div>
                <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="简单描述一下商品" />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="text-xs text-zinc-600">建议先创建商品，再上传/生成图片。</div>
              <Button
                onClick={async () => {
                  setMsg(undefined);
                  if (!name.trim()) {
                    setMsg("请先输入商品名称");
                    return;
                  }
                  try {
                    const p = await createProduct({ name, description: desc, pointsCost, stock: newProductStock });
                    setSelectedId(p.id);
                    setName("");
                    setDesc("");
                    setPointsCost(10);
                    setNewProductStock(5);
                    setCandidates([]);
                    setPicked({});
                    setMsg("创建成功");
                  } catch {
                    setMsg("创建失败");
                  }
                }}
              >
                创建商品
              </Button>
            </div>
            {msg ? <div className="mt-3 text-sm text-zinc-700">{msg}</div> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImagePlus className="h-4 w-4 text-[color:var(--z-accent)]" />
              图片管理
            </CardTitle>
            <CardDescription>选择目标商品后，可上传本地图片或生成候选图。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2 sm:grid-cols-[240px_1fr] sm:items-center">
                <div>
                  <div className="mb-1 text-xs font-medium text-zinc-700">目标商品</div>
                  <select
                    className="h-11 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-sm"
                    value={selected?.id || ""}
                    onChange={(e) => setSelectedId(e.target.value)}
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-sm text-zinc-700">
                  {selected ? (
                    <span>
                      当前：<span className="font-semibold">{selected.name}</span>
                    </span>
                  ) : (
                    "请先创建一个商品"
                  )}
                </div>
              </div>

              {selected ? (
                <>
                  <div className="grid gap-3 lg:grid-cols-2">
                    <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/50 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                        <UploadCloud className="h-4 w-4" />
                        本地上传
                      </div>
                      <div className="mt-2 text-xs text-zinc-600">支持 jpg/png/webp，上传后可设置为主图。</div>
                      <div className="mt-3">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            if (!files.length) return;
                            const urls = await Promise.all(
                              files.map((file) => uploadProductImage({ productId: selected.id, file, filename: file.name })),
                            );
                            await addImages(
                              selected.id,
                              urls.map((url) => ({ url, source: "upload" as const })),
                            );
                            e.target.value = "";
                          }}
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/50 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                        <Sparkles className="h-4 w-4" />
                        自动生成候选图（3 张）
                      </div>
                      <div className="mt-2 text-xs text-zinc-600">按商品名称生成 3 张可选插画。</div>
                      <div className="mt-3 flex items-center gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            const urls = [0, 1, 2].map((i) =>
                              textToImageUrl(buildProductPrompt(selected.name, i), "portrait_4_3"),
                            );
                            setCandidates(urls);
                            setPicked({});
                          }}
                        >
                          生成候选图
                        </Button>
                        <Button
                          onClick={() => {
                            const selectedUrls = candidates.filter((u) => picked[u]);
                            if (!selectedUrls.length) return;
                            addImages(
                              selected.id,
                              selectedUrls.map((url) => ({ url, source: "recommend" as const })),
                            );
                            setCandidates([]);
                            setPicked({});
                          }}
                          disabled={!candidates.length}
                        >
                          保存所选
                        </Button>
                      </div>
                    </div>
                  </div>

                  {candidates.length ? (
                    <div>
                      <div className="mb-2 text-sm font-semibold text-zinc-900">候选图（选择后保存）</div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {candidates.map((url) => (
                          <button
                            key={url}
                            className={cn(
                              "relative overflow-hidden rounded-2xl border bg-white transition hover:-translate-y-0.5",
                              picked[url] ? "border-blue-400" : "border-white/60",
                            )}
                            onClick={() => setPicked((s) => ({ ...s, [url]: !s[url] }))}
                          >
                            <div className="aspect-[4/3] bg-zinc-100">
                              <img src={url} alt="候选图" className="h-full w-full object-cover" />
                            </div>
                            <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-zinc-900">
                              {picked[url] ? "已选" : "可选"}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <div className="mb-2 text-sm font-semibold text-zinc-900">已有图片（点击设为主图）</div>
                    {selected.images.length ? (
                      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {selected.images
                          .slice()
                          .sort((a, b) => a.sortOrder - b.sortOrder)
                          .map((img) => (
                            <button
                              key={img.id}
                              className={cn(
                                "group relative overflow-hidden rounded-2xl border bg-white transition hover:-translate-y-0.5",
                                selected.coverImageUrl === img.url ? "border-amber-400" : "border-white/60",
                              )}
                              onClick={() => setCover(selected.id, img.url)}
                            >
                              <div className="aspect-[4/3] bg-zinc-100">
                                <img src={img.url} alt="" className="h-full w-full object-cover" />
                              </div>
                              <button
                                type="button"
                                aria-label="删除图片"
                                className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-xl border border-white/60 bg-white/80 text-zinc-700 opacity-0 shadow-sm shadow-zinc-200/20 transition hover:bg-white group-hover:opacity-100"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  removeImage(selected.id, img.id);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </button>
                              <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-zinc-900">
                                {selected.coverImageUrl === img.url ? (
                                  <span className="inline-flex items-center gap-1">
                                    <Check className="h-3.5 w-3.5" /> 主图
                                  </span>
                                ) : (
                                  "设为主图"
                                )}
                              </div>
                            </button>
                          ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/50 px-4 py-6 text-sm text-zinc-600">
                        还没有图片，先上传或生成候选图。
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Box className="h-4 w-4 text-[color:var(--z-accent)]" />
              库存管理
            </CardTitle>
            <CardDescription>先选择目标商品，然后修改当前库存。</CardDescription>
          </CardHeader>
          <CardContent>
            {selected ? (
              <div className="grid gap-3 sm:grid-cols-[240px_1fr_auto] sm:items-end">
                <div>
                  <div className="mb-1 text-xs font-medium text-zinc-700">目标商品</div>
                  <select
                    className="h-11 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-sm"
                    value={selected.id}
                    onChange={(e) => setSelectedId(e.target.value)}
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="mb-1 text-xs font-medium text-zinc-700">当前库存</div>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={stockValue}
                    onChange={(e) => setStockValue(Math.max(0, Number(e.target.value || 0)))}
                  />
                </div>
                <Button
                  onClick={async () => {
                    setStockMsg(undefined);
                    const res = await setProductStock(selected.id, stockValue);
                    if (!res.ok) {
                      setStockMsg(res.error || "修改失败");
                      return;
                    }
                    setStockMsg("库存已更新");
                  }}
                >
                  保存库存
                </Button>
                {stockMsg ? (
                  <div className="sm:col-span-3 text-sm text-zinc-700">{stockMsg}</div>
                ) : null}
              </div>
            ) : (
              <div className="text-sm text-zinc-600">请先创建一个商品，再进行库存管理。</div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
