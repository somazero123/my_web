import { create } from "zustand";
import type { Product, ProductImage } from "@/types/app";
import { supabase } from "@/lib/supabaseClient";

type ProductsState = {
  products: Product[];
  loading: boolean;
  hydrate: () => Promise<void>;
  createProduct: (p: { name: string; description: string; pointsCost: number; stock: number }) => Promise<Product>;
  addImages: (productId: string, images: { url: string; source: ProductImage["source"] }[]) => Promise<void>;
  setCover: (productId: string, url: string) => Promise<void>;
  removeImage: (productId: string, imageId: string) => Promise<{ ok: boolean; error?: string }>;
  setStock: (productId: string, stock: number) => Promise<{ ok: boolean; error?: string }>;
  getById: (id: string) => Product | undefined;
};

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: [],
  loading: false,
  hydrate: async () => {
    set({ loading: true });
    try {
      const productsRes = await supabase
        .from("products")
        .select("id, name, description, points_cost, stock, cover_image_url, created_at")
        .order("created_at", { ascending: false });

      const products = productsRes.data ?? [];
      const ids = products.map((p) => p.id);

      const imagesData: Array<{
        id: string;
        product_id: string;
        url: string;
        source: ProductImage["source"];
        sort_order: number;
      }> = ids.length
        ? (
            (
              await supabase
                .from("product_images")
                .select("id, product_id, url, source, sort_order")
                .in("product_id", ids)
                .order("sort_order", { ascending: true })
            ).data ?? []
          )
        : [];

      const byProduct = new Map<string, ProductImage[]>();
      for (const img of imagesData) {
        const list = byProduct.get(img.product_id) ?? [];
        list.push({
          id: img.id,
          url: img.url,
          source: img.source,
          sortOrder: img.sort_order,
        });
        byProduct.set(img.product_id, list);
      }

      const mapped: Product[] = products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description ?? "",
        pointsCost: p.points_cost,
        stock: p.stock,
        coverImageUrl: p.cover_image_url ?? undefined,
        images: (byProduct.get(p.id) ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder),
        createdAt: p.created_at,
      }));
      set({ products: mapped, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  createProduct: async ({ name, description, pointsCost, stock }) => {
    const { data, error } = await supabase
      .from("products")
      .insert({
        name: name.trim(),
        description: description.trim(),
        points_cost: pointsCost,
        stock,
      })
      .select("id, name, description, points_cost, stock, cover_image_url, created_at")
      .single();
    if (error || !data) throw error ?? new Error("创建失败");
    await get().hydrate();
    return {
      id: data.id,
      name: data.name,
      description: data.description ?? "",
      pointsCost: data.points_cost,
      stock: data.stock,
      coverImageUrl: data.cover_image_url ?? undefined,
      images: [],
      createdAt: data.created_at,
    };
  },
  addImages: async (productId, images) => {
    if (!images.length) return;
    const p = get().products.find((x) => x.id === productId);
    const startOrder = p?.images.length ?? 0;
    const rows = images.map((img, idx) => ({
      product_id: productId,
      url: img.url,
      source: img.source,
      sort_order: startOrder + idx,
    }));
    const { error } = await supabase.from("product_images").insert(rows);
    if (error) throw error;
    if (p && !p.coverImageUrl && rows[0]?.url) {
      await supabase.from("products").update({ cover_image_url: rows[0].url }).eq("id", productId);
    }
    await get().hydrate();
  },
  setCover: async (productId, url) => {
    const { error } = await supabase.from("products").update({ cover_image_url: url }).eq("id", productId);
    if (error) throw error;
    await get().hydrate();
  },
  removeImage: async (productId, imageId) => {
    const p = get().products.find((x) => x.id === productId);
    if (!p) return { ok: false, error: "商品不存在" };
    const removed = p.images.find((x) => x.id === imageId);

    const { error } = await supabase.from("product_images").delete().eq("id", imageId).eq("product_id", productId);
    if (error) return { ok: false, error: error.message };

    if (removed?.url) {
      const marker = "/product-images/";
      const idx = removed.url.indexOf(marker);
      if (idx >= 0) {
        const objectPath = removed.url.slice(idx + marker.length);
        await supabase.storage.from("product-images").remove([objectPath]);
      }
    }

    await get().hydrate();

    if (removed?.url && p.coverImageUrl === removed.url) {
      const next = get().products.find((x) => x.id === productId);
      const nextCover = next?.images[0]?.url;
      await supabase
        .from("products")
        .update({ cover_image_url: nextCover ?? null })
        .eq("id", productId);
      await get().hydrate();
    }
    return { ok: true };
  },
  setStock: async (productId, stock) => {
    if (!Number.isFinite(stock) || stock < 0) return { ok: false, error: "库存值无效" };
    const { error } = await supabase
      .from("products")
      .update({ stock: Math.floor(stock) })
      .eq("id", productId);
    if (error) return { ok: false, error: error.message };
    await get().hydrate();
    return { ok: true };
  },
  getById: (id) => get().products.find((p) => p.id === id),
}));
