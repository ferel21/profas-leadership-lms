function normalizeHttpOrigin(value: string | undefined) {
  const candidate = value?.trim().replace(/^["']|["']$/g, "").replace(/\/+$/, "");
  if (!candidate) return null;

  const withProtocol = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;
  try {
    const url = new URL(withProtocol);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Resolve one canonical application origin for redirects and OAuth callbacks.
 * Vercel supplies the project/preview host automatically, so authentication
 * remains usable even when a legacy NEXT_PUBLIC_APP_URL variable is absent.
 */
export function resolveAppOrigin(request: Request) {
  const vercelOrigin = process.env.VERCEL_ENV === "production"
    ? normalizeHttpOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL)
      ?? normalizeHttpOrigin(process.env.VERCEL_URL)
    : normalizeHttpOrigin(process.env.VERCEL_URL)
      ?? normalizeHttpOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  const configured = normalizeHttpOrigin(process.env.NEXT_PUBLIC_APP_URL)
    ?? vercelOrigin;
  if (configured) return configured;

  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host")?.trim() || requestUrl.host;
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProtocol === "http" || forwardedProtocol === "https"
    ? forwardedProtocol
    : (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");

  return new URL(`${protocol}://${host}`).origin;
}

export function googleCallbackUrl(request: Request) {
  return `${resolveAppOrigin(request)}/api/auth/callback/google`;
}
