import { supabase } from "@/integrations/supabase/client";

async function compressImage(file: File, max = 2000, quality = 0.85): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", quality));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

export async function uploadMedia(projectId: string, file: File) {
  const isVideo = file.type.startsWith("video/");
  const body = isVideo ? file : await compressImage(file);
  const ext = isVideo ? (file.name.split(".").pop() || "mp4").toLowerCase() : body === file ? (file.name.split(".").pop() || "jpg").toLowerCase() : "jpg";
  const path = `${projectId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, body, {
    contentType: isVideo ? file.type : body.type || file.type,
  });
  if (error) throw error;
  return { path, kind: isVideo ? "video" : "image" };
}
