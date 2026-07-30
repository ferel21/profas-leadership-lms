"use client";

type MaterialUploadContext = {
  purpose: "material";
  courseId?: string;
  lessonId: string;
  description?: string;
  deferNodeCommit?: boolean;
};

type AssignmentUploadContext = {
  purpose: "assignment";
  assessmentId: string;
  attemptId: string;
  questionId: string;
};

type UploadContext = MaterialUploadContext | AssignmentUploadContext;

type PresignResponse =
  | { mode: "local" }
  | { mode: "supabase"; uploadUrl: string; ticket: string };

type DirectUploadResult = {
  mode: "supabase";
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType?: string;
  description?: string;
  content?: string;
  uploadToken?: string;
};

async function responseMessage(response: Response, fallback: string) {
  const body = await response.json().catch(() => null) as { message?: string; error?: string } | null;
  return body?.message || body?.error || fallback;
}

export function createSignedUploadForm(file: File) {
  const formData = new FormData();
  formData.append("cacheControl", "3600");
  // Supabase Storage's official uploadToSignedUrl client uses an empty field
  // name for Blob/File bodies. Let fetch generate the multipart boundary.
  formData.append("", file);
  return formData;
}

export async function uploadFileDirectly(file: File, context: UploadContext): Promise<{ mode: "local" } | DirectUploadResult> {
  const presignResponse = await fetch("/api/uploads/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...context,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    }),
  });
  if (!presignResponse.ok) {
    throw new Error(await responseMessage(presignResponse, "Gagal menyiapkan unggahan."));
  }
  const presign = await presignResponse.json() as PresignResponse;
  if (presign.mode === "local") return presign;

  const uploadResponse = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: {
      "x-upsert": "false",
    },
    body: createSignedUploadForm(file),
  });
  if (!uploadResponse.ok) {
    throw new Error(await responseMessage(uploadResponse, "Gagal mengirim berkas ke penyimpanan."));
  }

  const commitResponse = await fetch("/api/uploads/commit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticket: presign.ticket }),
  });
  if (!commitResponse.ok) {
    throw new Error(await responseMessage(commitResponse, "Berkas terunggah, tetapi gagal diverifikasi."));
  }
  const committed = await commitResponse.json() as Omit<DirectUploadResult, "mode">;
  return { mode: "supabase", ...committed };
}
