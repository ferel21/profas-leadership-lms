export type UploadPurpose = "material" | "assignment";

export type UploadDescriptor = {
  extension: string;
  nodeType: "PDF" | "IMAGE" | "VIDEO" | "DOCUMENT" | "TEXT";
};

export const MAX_MATERIAL_FILE_SIZE = 50 * 1024 * 1024;
export const MAX_ASSIGNMENT_FILE_SIZE = 20 * 1024 * 1024;

const MATERIAL_TYPES: Readonly<Record<string, UploadDescriptor>> = {
  "application/pdf": { extension: ".pdf", nodeType: "PDF" },
  "image/jpeg": { extension: ".jpg", nodeType: "IMAGE" },
  "image/png": { extension: ".png", nodeType: "IMAGE" },
  "image/webp": { extension: ".webp", nodeType: "IMAGE" },
  "image/gif": { extension: ".gif", nodeType: "IMAGE" },
  "video/mp4": { extension: ".mp4", nodeType: "VIDEO" },
  "video/webm": { extension: ".webm", nodeType: "VIDEO" },
  "application/msword": { extension: ".doc", nodeType: "DOCUMENT" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    extension: ".docx",
    nodeType: "DOCUMENT",
  },
  "application/vnd.ms-powerpoint": { extension: ".ppt", nodeType: "DOCUMENT" },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
    extension: ".pptx",
    nodeType: "DOCUMENT",
  },
  "text/plain": { extension: ".txt", nodeType: "TEXT" },
};

const ASSIGNMENT_TYPES: Readonly<Record<string, UploadDescriptor>> = {
  "application/pdf": MATERIAL_TYPES["application/pdf"],
  "image/jpeg": MATERIAL_TYPES["image/jpeg"],
  "image/png": MATERIAL_TYPES["image/png"],
  "image/webp": MATERIAL_TYPES["image/webp"],
  "text/plain": MATERIAL_TYPES["text/plain"],
  "application/msword": MATERIAL_TYPES["application/msword"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    MATERIAL_TYPES["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  "application/vnd.ms-powerpoint": MATERIAL_TYPES["application/vnd.ms-powerpoint"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    MATERIAL_TYPES["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
};

function normalizeMimeType(value: string) {
  return value.split(";", 1)[0].trim().toLowerCase();
}

export function uploadLimitFor(purpose: UploadPurpose) {
  return purpose === "material" ? MAX_MATERIAL_FILE_SIZE : MAX_ASSIGNMENT_FILE_SIZE;
}

export function getUploadDescriptor(purpose: UploadPurpose, mimeType: string) {
  const normalized = normalizeMimeType(mimeType);
  const types = purpose === "material" ? MATERIAL_TYPES : ASSIGNMENT_TYPES;
  return types[normalized] ?? null;
}

export function validateUploadMetadata(input: {
  purpose: UploadPurpose;
  fileName: string;
  fileSize: number;
  mimeType: string;
}) {
  const fileName = cleanDisplayFileName(input.fileName);
  const mimeType = normalizeMimeType(input.mimeType);
  const descriptor = getUploadDescriptor(input.purpose, mimeType);
  const maxSize = uploadLimitFor(input.purpose);

  if (!fileName) {
    return { ok: false as const, message: "Nama berkas tidak valid." };
  }
  if (!Number.isSafeInteger(input.fileSize) || input.fileSize <= 0 || input.fileSize > maxSize) {
    const maxSizeMb = Math.floor(maxSize / (1024 * 1024));
    return { ok: false as const, message: `Ukuran berkas harus antara 1 byte dan ${maxSizeMb}MB.` };
  }
  if (!descriptor) {
    return { ok: false as const, message: "Jenis berkas tidak didukung." };
  }

  return {
    ok: true as const,
    value: {
      descriptor,
      fileName,
      fileSize: input.fileSize,
      mimeType,
    },
  };
}

export function cleanDisplayFileName(value: string) {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/]/g, "_")
    .trim()
    .slice(0, 180);
}

export function sanitizeMaterialDescription(value: string) {
  return value.replace(/<[^>]*>?/gm, "").trim().slice(0, 1000);
}

