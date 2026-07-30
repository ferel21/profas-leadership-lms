import "server-only";

import { validateFileMagicBytes } from "@/services/file-security";

const DEFAULT_BUCKET = "lms-private";
const MAX_INSPECTION_BYTES = 4096;

type StorageConfig = {
  baseUrl: string;
  bucket: string;
  serviceKey: string;
};

export type ObjectStorageMode =
  | { mode: "local" }
  | { mode: "supabase"; config: StorageConfig }
  | { mode: "unavailable"; message: string };

function cleanEnv(value: string | undefined) {
  return (value ?? "").trim().replace(/^["']|["']$/g, "");
}

function isTruthy(value: string | undefined) {
  return ["1", "true", "yes"].includes(cleanEnv(value).toLowerCase());
}

export function getObjectStorageMode(): ObjectStorageMode {
  const isVercel = isTruthy(process.env.VERCEL);
  const explicitlyEnabled = isTruthy(process.env.SUPABASE_STORAGE_ENABLED);
  if (!isVercel && !explicitlyEnabled) return { mode: "local" };

  const baseUrl = cleanEnv(process.env.SUPABASE_URL).replace(/\/+$/, "");
  const serviceKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const bucket = cleanEnv(process.env.SUPABASE_STORAGE_BUCKET) || DEFAULT_BUCKET;
  if (!baseUrl || !serviceKey) {
    return {
      mode: "unavailable",
      message: "Supabase Storage belum dikonfigurasi untuk lingkungan Vercel.",
    };
  }
  try {
    const parsed = new URL(baseUrl);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
      throw new Error("invalid protocol");
    }
  } catch {
    return { mode: "unavailable", message: "SUPABASE_URL tidak valid." };
  }
  if (!/^[a-zA-Z0-9._-]{1,100}$/.test(bucket)) {
    return { mode: "unavailable", message: "SUPABASE_STORAGE_BUCKET tidak valid." };
  }

  return { mode: "supabase", config: { baseUrl, serviceKey, bucket } };
}

function storageUrl(config: StorageConfig) {
  return `${config.baseUrl}/storage/v1`;
}

function absoluteStorageResponseUrl(config: StorageConfig, path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/storage/v1/")) return `${config.baseUrl}${path}`;
  return `${storageUrl(config)}${path.startsWith("/") ? path : `/${path}`}`;
}

function encodeObjectPath(path: string) {
  const segments = path.split("/");
  if (
    segments.length < 2 ||
    segments.some(segment => !segment || segment === "." || segment === ".." || segment.includes("\\") || segment.includes("\0"))
  ) {
    throw new Error("Path object storage tidak valid.");
  }
  return segments.map(segment => encodeURIComponent(segment)).join("/");
}

function serviceHeaders(config: StorageConfig, json = false) {
  const headers: Record<string, string> = {
    apikey: config.serviceKey,
    Authorization: `Bearer ${config.serviceKey}`,
  };
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}

async function parseStorageError(response: Response) {
  const body = await response.json().catch(() => null) as {
    message?: string;
    error?: string;
    statusCode?: string | number;
  } | null;
  return body?.message || body?.error || `Supabase Storage merespons ${response.status}.`;
}

let bucketReady: Promise<void> | null = null;

async function ensurePrivateBucket(config: StorageConfig) {
  if (bucketReady) return bucketReady;
  bucketReady = (async () => {
    const bucketUrl = `${storageUrl(config)}/bucket/${encodeURIComponent(config.bucket)}`;
    const existing = await fetch(bucketUrl, {
      headers: serviceHeaders(config),
      cache: "no-store",
    });
    if (existing.ok) {
      const data = await existing.json().catch(() => null) as { public?: boolean } | null;
      if (data?.public === true) {
        throw new Error(`Bucket Supabase "${config.bucket}" harus bersifat private.`);
      }
      return;
    }
    if (existing.status !== 404 && existing.status !== 400) {
      throw new Error(await parseStorageError(existing));
    }

    const created = await fetch(`${storageUrl(config)}/bucket`, {
      method: "POST",
      headers: serviceHeaders(config, true),
      body: JSON.stringify({
        id: config.bucket,
        name: config.bucket,
        public: false,
        file_size_limit: 50 * 1024 * 1024,
        allowed_mime_types: [
          "application/pdf",
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif",
          "video/mp4",
          "video/webm",
          "text/plain",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ],
      }),
    });
    if (!created.ok && created.status !== 409) {
      throw new Error(await parseStorageError(created));
    }
  })().catch(error => {
    bucketReady = null;
    throw error;
  });
  return bucketReady;
}

function requireSupabaseConfig() {
  const storage = getObjectStorageMode();
  if (storage.mode !== "supabase") {
    throw new Error(storage.mode === "unavailable" ? storage.message : "Supabase Storage tidak aktif.");
  }
  return storage.config;
}

export async function createSignedObjectUpload(objectPath: string) {
  const config = requireSupabaseConfig();
  await ensurePrivateBucket(config);
  const encodedPath = encodeObjectPath(objectPath);
  const response = await fetch(
    `${storageUrl(config)}/object/upload/sign/${encodeURIComponent(config.bucket)}/${encodedPath}`,
    {
      method: "POST",
      headers: serviceHeaders(config, true),
      body: JSON.stringify({ upsert: false }),
    },
  );
  if (!response.ok) throw new Error(await parseStorageError(response));

  const data = await response.json().catch(() => null) as {
    url?: string;
    signedUrl?: string;
    signedURL?: string;
  } | null;
  const path = data?.url || data?.signedUrl || data?.signedURL;
  if (!path) throw new Error("Supabase Storage tidak mengembalikan URL unggahan.");
  return absoluteStorageResponseUrl(config, path);
}

function numberFrom(...values: unknown[]) {
  for (const value of values) {
    const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
    if (Number.isSafeInteger(parsed) && parsed >= 0) return parsed;
  }
  return null;
}

function stringFrom(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.split(";", 1)[0].trim().toLowerCase();
  }
  return null;
}

async function readPrefix(response: Response, limit: number) {
  if (!response.body) return Buffer.alloc(0);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (total < limit) {
      const { done, value } = await reader.read();
      if (done) break;
      const remaining = limit - total;
      const chunk = value.byteLength > remaining ? value.slice(0, remaining) : value;
      chunks.push(chunk);
      total += chunk.byteLength;
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return Buffer.concat(chunks.map(chunk => Buffer.from(chunk)), total);
}

export async function verifyStoredObject(input: {
  objectPath: string;
  expectedSize: number;
  expectedMimeType: string;
}) {
  const config = requireSupabaseConfig();
  const encodedPath = encodeObjectPath(input.objectPath);
  const authenticatedUrl = `${storageUrl(config)}/object/authenticated/${encodeURIComponent(config.bucket)}/${encodedPath}`;
  const infoResponse = await fetch(
    `${storageUrl(config)}/object/info/authenticated/${encodeURIComponent(config.bucket)}/${encodedPath}`,
    { headers: serviceHeaders(config), cache: "no-store" },
  );
  if (!infoResponse.ok) throw new Error(await parseStorageError(infoResponse));
  const info = await infoResponse.json().catch(() => null) as Record<string, unknown> | null;
  const metadata = info?.metadata && typeof info.metadata === "object"
    ? info.metadata as Record<string, unknown>
    : {};

  let actualSize = numberFrom(info?.size, metadata.size, info?.contentLength, metadata.contentLength);
  let actualMimeType = stringFrom(
    info?.mimetype,
    info?.mimeType,
    info?.content_type,
    info?.contentType,
    metadata.mimetype,
    metadata.mimeType,
    metadata.content_type,
    metadata.contentType,
  );

  if (actualSize === null || actualMimeType === null) {
    const head = await fetch(authenticatedUrl, {
      method: "HEAD",
      headers: serviceHeaders(config),
      cache: "no-store",
    });
    if (!head.ok) throw new Error(await parseStorageError(head));
    actualSize ??= numberFrom(head.headers.get("content-length"));
    actualMimeType ??= stringFrom(head.headers.get("content-type"));
  }

  const expectedMimeType = input.expectedMimeType.split(";", 1)[0].trim().toLowerCase();
  if (actualSize !== input.expectedSize) {
    throw new Error("Ukuran object hasil unggahan tidak sesuai dengan tiket.");
  }
  if (actualMimeType !== expectedMimeType) {
    throw new Error("Jenis MIME object hasil unggahan tidak sesuai dengan tiket.");
  }

  const prefixResponse = await fetch(authenticatedUrl, {
    headers: {
      ...serviceHeaders(config),
      Range: `bytes=0-${MAX_INSPECTION_BYTES - 1}`,
    },
    cache: "no-store",
  });
  if (!prefixResponse.ok) throw new Error(await parseStorageError(prefixResponse));
  const prefix = await readPrefix(prefixResponse, MAX_INSPECTION_BYTES);
  if (!validateFileMagicBytes(prefix, expectedMimeType)) {
    throw new Error("Format isi berkas tidak sesuai dengan jenis MIME.");
  }

  return { size: actualSize, mimeType: actualMimeType };
}

export async function createSignedObjectDownload(objectPath: string, expiresInSeconds = 60) {
  const config = requireSupabaseConfig();
  const encodedPath = encodeObjectPath(objectPath);
  const response = await fetch(
    `${storageUrl(config)}/object/sign/${encodeURIComponent(config.bucket)}/${encodedPath}`,
    {
      method: "POST",
      headers: serviceHeaders(config, true),
      body: JSON.stringify({ expiresIn: Math.max(10, Math.min(expiresInSeconds, 300)) }),
    },
  );
  if (!response.ok) throw new Error(await parseStorageError(response));
  const data = await response.json().catch(() => null) as { signedURL?: string; signedUrl?: string } | null;
  const path = data?.signedURL || data?.signedUrl;
  if (!path) throw new Error("Supabase Storage tidak mengembalikan URL unduhan.");
  return absoluteStorageResponseUrl(config, path);
}

export async function deleteStoredObject(objectPath: string) {
  const config = requireSupabaseConfig();
  const response = await fetch(`${storageUrl(config)}/object/${encodeURIComponent(config.bucket)}`, {
    method: "DELETE",
    headers: serviceHeaders(config, true),
    body: JSON.stringify({ prefixes: [objectPath] }),
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(await parseStorageError(response));
  }
}
