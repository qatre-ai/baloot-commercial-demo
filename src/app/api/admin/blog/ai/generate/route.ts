import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  getClientIp,
  getUserAgent,
  requireAdmin,
  writeAuditLog,
} from "@/lib/auth/session";
import {
  blogAiRequestSchema,
  buildBlogAiPrompt,
  extractProviderDraft,
} from "@/lib/blog-ai";

export const runtime = "nodejs";

const DEFAULT_BASE_URL = "https://api.z.ai/api/paas/v4";
const DEFAULT_MODEL = "glm-4.7-flash";

function jsonError(error: string, status: number, requestId: string) {
  return NextResponse.json({ error, requestId }, {
    status,
    headers: { "x-request-id": requestId },
  });
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || randomUUID();
  const startedAt = Date.now();
  const auth = await requireAdmin(request, "blog", "create");
  if (!auth.ok) return auth.response;

  const ipAddress = getClientIp(request);
  const userAgent = getUserAgent(request);
  const rateLimit = checkRateLimit(`blog-ai:${auth.admin.id}:${ipAddress}`, 8, 10 * 60 * 1000);
  if (!rateLimit.allowed) {
    await writeAuditLog({
      adminId: auth.admin.id,
      action: "BLOG_AI_RATE_LIMITED",
      entity: "BlogPost",
      severity: "warning",
      details: { requestId, resetAt: new Date(rateLimit.resetAt).toISOString() },
      ipAddress,
      userAgent,
    });
    return jsonError("Too many AI generation requests. Please try again later.", 429, requestId);
  }

  const apiKey = process.env.BLOG_AI_API_KEY;
  if (!apiKey) {
    await writeAuditLog({
      adminId: auth.admin.id,
      action: "BLOG_AI_NOT_CONFIGURED",
      entity: "BlogPost",
      severity: "critical",
      details: { requestId, model: process.env.BLOG_AI_MODEL || DEFAULT_MODEL },
      ipAddress,
      userAgent,
    });
    return jsonError("Blog AI is not configured.", 503, requestId);
  }

  const parsed = blogAiRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({
      error: "Invalid generation request.",
      requestId,
      issues: parsed.error.flatten(),
    }, {
      status: 400,
      headers: { "x-request-id": requestId },
    });
  }

  const baseUrl = (process.env.BLOG_AI_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
  const model = process.env.BLOG_AI_MODEL || DEFAULT_MODEL;

  try {
    const providerResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "x-request-id": requestId,
      },
      body: JSON.stringify({
        model,
        temperature: 0.55,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are a precise bilingual senior music editor for Mehr Avaye Baloot. Follow the requested JSON contract exactly.",
          },
          { role: "user", content: buildBlogAiPrompt(parsed.data) },
        ],
      }),
      signal: AbortSignal.timeout(60_000),
      cache: "no-store",
    });

    if (!providerResponse.ok) {
      const providerRequestId = providerResponse.headers.get("x-request-id");
      console.error(JSON.stringify({
        level: "error",
        event: "blog_ai_provider_error",
        requestId,
        providerRequestId,
        status: providerResponse.status,
        durationMs: Date.now() - startedAt,
      }));
      await writeAuditLog({
        adminId: auth.admin.id,
        action: "BLOG_AI_GENERATE_FAILED",
        entity: "BlogPost",
        severity: "warning",
        details: { requestId, providerRequestId, status: providerResponse.status },
        ipAddress,
        userAgent,
      });
      return jsonError("AI provider request failed.", 502, requestId);
    }

    const draft = extractProviderDraft(await providerResponse.json());
    await writeAuditLog({
      adminId: auth.admin.id,
      action: "BLOG_AI_DRAFT_GENERATED",
      entity: "BlogPost",
      entityName: draft.titleFa,
      details: {
        requestId,
        model,
        durationMs: Date.now() - startedAt,
        topic: parsed.data.topic,
      },
      ipAddress,
      userAgent,
    });

    console.info(JSON.stringify({
      level: "info",
      event: "blog_ai_draft_generated",
      requestId,
      adminId: auth.admin.id,
      model,
      durationMs: Date.now() - startedAt,
    }));

    return NextResponse.json({
      draft,
      requestId,
      model,
      requiresHumanApproval: true,
    }, {
      headers: {
        "Cache-Control": "no-store",
        "x-request-id": requestId,
      },
    });
  } catch (error) {
    const message = error instanceof Error && error.name === "TimeoutError"
      ? "AI provider timed out."
      : "AI draft generation failed.";
    console.error(JSON.stringify({
      level: "error",
      event: "blog_ai_generation_exception",
      requestId,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "unknown",
    }));
    await writeAuditLog({
      adminId: auth.admin.id,
      action: "BLOG_AI_GENERATE_FAILED",
      entity: "BlogPost",
      severity: "warning",
      details: { requestId, message },
      ipAddress,
      userAgent,
    });
    return jsonError(message, 502, requestId);
  }
}
