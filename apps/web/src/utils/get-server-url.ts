const DEFAULT_LOCAL_SERVER_URL = "http://localhost:3000";

export function getServerUrl(url: string | undefined) {
  const processEnv = (
    globalThis as {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process?.env;
  if (typeof window === "undefined" && processEnv?.SERVER_URL) {
    return processEnv.SERVER_URL.endsWith("/")
      ? processEnv.SERVER_URL.slice(0, -1)
      : processEnv.SERVER_URL;
  }

  // NEXT_PUBLIC_SERVER_URL is sometimes not inlined into the browser bundle
  // (varlock's Turbopack integration doesn't always statically replace it);
  // fall back to the same local default used below for the server-side case.
  const safeUrl = url ?? DEFAULT_LOCAL_SERVER_URL;
  const normalized = safeUrl.endsWith("/") ? safeUrl.slice(0, -1) : safeUrl;

  if (!normalized.startsWith("/")) {
    return normalized;
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}${normalized}`;
  }

  const vercelUrl =
    processEnv?.VERCEL_ENV === "production"
      ? (processEnv?.VERCEL_PROJECT_PRODUCTION_URL ?? processEnv?.VERCEL_URL)
      : (processEnv?.VERCEL_URL ?? processEnv?.VERCEL_PROJECT_PRODUCTION_URL);
  if (vercelUrl) {
    const origin = vercelUrl.startsWith("http")
      ? vercelUrl
      : `https://${vercelUrl}`;
    return `${origin}${normalized}`;
  }

  return DEFAULT_LOCAL_SERVER_URL + normalized;
}
