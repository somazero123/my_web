import { supabase } from "@/lib/supabaseClient";

async function uploadToBucket(params: { bucket: string; folder: string; file: Blob; filename?: string }) {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) throw new Error("not authenticated");

  const filename = params.filename ?? "image";
  const ext = filename.includes(".") ? filename.split(".").pop() : "bin";
  const objectPath = `${userId}/${params.folder}/${crypto.randomUUID()}.${ext}`;

  const uploadRes = await supabase.storage.from(params.bucket).upload(objectPath, params.file, {
    contentType: (params.file as File).type || undefined,
    upsert: false,
  });
  if (uploadRes.error) throw uploadRes.error;

  const publicUrl = supabase.storage.from(params.bucket).getPublicUrl(objectPath).data.publicUrl;
  return publicUrl;
}

export async function uploadProductImage(params: { productId: string; file: Blob; filename?: string }) {
  return uploadToBucket({ bucket: "product-images", folder: params.productId, file: params.file, filename: params.filename });
}

export async function uploadTaskImage(params: { taskId: string; file: Blob; filename?: string }) {
  return uploadToBucket({ bucket: "task-images", folder: params.taskId, file: params.file, filename: params.filename });
}

