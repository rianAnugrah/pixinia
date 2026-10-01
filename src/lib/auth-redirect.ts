const canonicalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

function isCanonicalHost(origin: string) {
  if (!canonicalSiteUrl) return false;
  try {
    const current = new URL(origin);
    const canonical = new URL(canonicalSiteUrl);
    return current.hostname === canonical.hostname ||
      (current.hostname === "pixinia.web.id" && canonical.hostname === "www.pixinia.web.id");
  } catch {
    return false;
  }
}

/** Uses the canonical public hostname on production, while retaining localhost and preview flows. */
export function authRedirectUrl(path: string, origin: string) {
  const safePath = path.startsWith("/") && !path.startsWith("//") ? path : "/";
  const baseUrl = isCanonicalHost(origin) ? canonicalSiteUrl! : origin;
  return new URL(safePath, baseUrl).toString();
}
