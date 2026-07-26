import { join, relative, resolve, sep } from "node:path";

const DEFAULT_PRIVATE_ROOT = resolve(process.cwd(), ".data", "uploads");
const TEMP_ROOT = resolve("/tmp", "uploads");
const LEGACY_PUBLIC_ROOT = resolve(process.cwd(), "public", "uploads");

function configuredRoot() {
  const configured = process.env.PRIVATE_UPLOAD_DIR?.trim();
  if (!configured) return DEFAULT_PRIVATE_ROOT;
  return resolve(configured.startsWith("/") ? configured : join(process.cwd(), configured));
}

export function getWritableUploadRoots() {
  return [configuredRoot(), TEMP_ROOT];
}

export function getReadableUploadRoots() {
  // The public root is retained only to serve files uploaded by older builds;
  // all new files are written outside /public so the static server cannot
  // bypass the authorization check in /api/uploads.
  return [...getWritableUploadRoots(), LEGACY_PUBLIC_ROOT];
}

export function resolveUploadPath(root: string, segments: string[]) {
  const candidate = resolve(root, ...segments);
  const child = relative(root, candidate);
  if (child === "" || child.startsWith("..") || child === ".." || child.includes(`${sep}..${sep}`)) {
    throw new Error("Invalid upload path");
  }
  return candidate;
}

export function uploadSegmentsFromUrl(fileUrl: string) {
  const prefix = "/api/uploads/";
  if (!fileUrl.startsWith(prefix)) return null;
  const segments = fileUrl.slice(prefix.length).split("/").filter(Boolean);
  if (segments.length === 0 || segments.some(segment => segment === "." || segment === ".." || /[\\]/.test(segment))) return null;
  return segments;
}
