import { NextRequest, NextResponse } from "next/server";

// ─── Automatic backup trigger ─────────────────────────────────────────────
// Fire-and-forget: on every admin API request we ping an internal endpoint
// that checks if the last successful backup is older than 24 h. The endpoint
// itself does the heavy lifting (fs.copyFileSync, checksum, retention sweep)
// so this middleware stays edge-runtime-safe (only uses fetch + timers).
//
// A 12-second in-process cooldown prevents flooding: even on a busy admin
// panel we issue at most one auto-backup probe per 12 s per server instance.

const INTERNAL_AUTO_TOKEN =
  process.env.BACKUP_AUTO_TOKEN || "mab-internal-auto-backup";
let lastAutoProbeAt = 0;
const AUTO_PROBE_COOLDOWN_MS = 12_000;

function triggerAutoBackupIfDue(): void {
  const now = Date.now();
  if (now - lastAutoProbeAt < AUTO_PROBE_COOLDOWN_MS) return;
  lastAutoProbeAt = now;

  // Resolve the origin: in dev we use localhost:3000, in prod we trust the
  // Host header so the request stays within the same deployment.
  const origin =
    process.env.BACKUP_INTERNAL_ORIGIN ||
    `http://${process.env.HOST || "localhost"}:${process.env.PORT || "3000"}`;

  const url = `${origin}/api/admin/backups`;

  // fire-and-forget — DO NOT await.
  fetch(url, {
    method: "PUT",
    headers: {
      "x-internal-backup-token": INTERNAL_AUTO_TOKEN,
      "content-type": "application/json",
    },
    body: JSON.stringify({ trigger: "auto" }),
  }).catch((err) => {
    // Swallow — auto-backup is best-effort and must never break the user
    // request that triggered it.
    console.error("[MIDDLEWARE_AUTO_BACKUP_PROBE]", err);
  });
}

// Rate limiting store (in-memory, per-process)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) rateLimitStore.delete(key);
  }
}, 5 * 60 * 1000);

function checkRateLimit(ip: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

// Security headers to add to all responses
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Session token injection ─────────────────────────────────
  // If the client sends an X-Session-Token header but no mab-session cookie,
  // inject it as a cookie so that `getSession()` (which reads cookies) finds it.
  // This is the key fix for sandbox/iframe environments where cookies may be blocked.
  const sessionToken = request.headers.get("x-session-token");
  const hasSessionCookie = request.cookies.get("mab-session");
  let requestHeaders = new Headers(request.headers);

  if (sessionToken && !hasSessionCookie) {
    const existingCookies = requestHeaders.get("cookie") || "";
    const newCookie = `mab-session=${sessionToken}`;
    requestHeaders.set("cookie", existingCookies ? `${existingCookies}; ${newCookie}` : newCookie);
  }

  // Build the response with modified request headers (for session injection)
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Add security headers to all responses
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  // Rate limiting for auth endpoints
  if (pathname.startsWith("/api/admin/auth/login") || pathname.startsWith("/api/auth/login")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")?.trim()
      || "unknown";

    if (!checkRateLimit(ip, 10, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { ...securityHeaders, "Retry-After": "900" } }
      );
    }
  }

  // Rate limiting for all admin API endpoints (more generous)
  if (pathname.startsWith("/api/admin/") && !pathname.startsWith("/api/admin/auth/")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")?.trim()
      || "unknown";

    if (!checkRateLimit(`admin-api:${ip}`, 100, 60 * 1000)) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429, headers: securityHeaders }
      );
    }

    // ── Automatic daily backup trigger ────────────────────────────────
    // Fire-and-forget probe to /api/admin/backups (PUT). The endpoint checks
    // if the last successful backup is older than 24 h and only then actually
    // creates one. Skipped for the backups routes themselves to avoid
    // recursion (the probe IS a backups route call).
    if (!pathname.startsWith("/api/admin/backups")) {
      try {
        triggerAutoBackupIfDue();
      } catch {
        /* never let auto-backup break a user request */
      }
    }
  }

  // Rate limiting for public API endpoints
  if (pathname.startsWith("/api/auth/register") || pathname.startsWith("/api/contact")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")?.trim()
      || "unknown";

    if (!checkRateLimit(`public:${ip}`, 5, 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: securityHeaders }
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/api/:path*",
  ],
};
