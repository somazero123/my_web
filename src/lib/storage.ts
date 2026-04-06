import { supabase } from "@/lib/supabaseClient";

export async function uploadProductImage(params: { productId: string; file: Blob; filename?: string }) {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) throw new Error("not authenticated");

  const filename = params.filename ?? "image";
  const ext = filename.includes(".") ? filename.split(".").pop() : "bin";
  const objectPath = `${userId}/${params.productId}/${crypto.randomUUID()}.${ext}`;

  const uploadRes = await supabase.storage.from("product-images").upload(objectPath, params.file, {
    contentType: (params.file as File).type || undefined,
    upsert: false,
  });
  if (uploadRes.error) throw uploadRes.error;

  const publicUrl = supabase.storage.from("product-images").getPublicUrl(objectPath).data.publicUrl;
  return publicUrl;
}

