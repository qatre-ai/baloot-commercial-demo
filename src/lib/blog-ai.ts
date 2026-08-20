import { z } from "zod";

export const blogAiRequestSchema = z.object({
  topic: z.string().trim().min(10).max(500),
  language: z.enum(["fa", "en", "bilingual"]).default("bilingual"),
  tone: z.enum(["professional", "educational", "editorial", "friendly"]).default("professional"),
  audience: z.string().trim().min(2).max(200).optional(),
  keywords: z.array(z.string().trim().min(1).max(80)).max(12).default([]),
  instructions: z.string().trim().max(1500).optional(),
});

export const blogAiDraftSchema = z.object({
  titleFa: z.string().trim().min(3).max(180),
  titleEn: z.string().trim().min(3).max(180),
  excerptFa: z.string().trim().min(10).max(600),
  excerptEn: z.string().trim().min(10).max(600),
  contentFa: z.string().trim().min(20).max(30000),
  contentEn: z.string().trim().min(20).max(30000),
  metaTitleFa: z.string().trim().min(3).max(120),
  metaTitleEn: z.string().trim().min(3).max(120),
  metaDescriptionFa: z.string().trim().min(10).max(320),
  metaDescriptionEn: z.string().trim().min(10).max(320),
  keywords: z.array(z.string().trim().min(1).max(80)).max(20),
  tags: z.array(z.string().trim().min(1).max(80)).max(20),
  suggestedCategorySlugs: z.array(z.string().trim().min(1).max(120)).max(10),
  sourceNotes: z.array(z.string().trim().min(1).max(500)).max(10).default([]),
});

export type BlogAiRequest = z.infer<typeof blogAiRequestSchema>;
export type BlogAiDraft = z.infer<typeof blogAiDraftSchema>;

type ProviderPayload = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export function extractProviderDraft(payload: unknown): BlogAiDraft {
  const content = (payload as ProviderPayload)?.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI provider returned no content");

  const normalized = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  return blogAiDraftSchema.parse(JSON.parse(normalized));
}

export function buildBlogAiPrompt(input: BlogAiRequest): string {
  return [
    "Create an editorial-quality music institute blog draft.",
    "Return only valid JSON. Never include markdown fences.",
    "The result is a draft for mandatory human review; never claim it is published.",
    `Topic: ${input.topic}`,
    `Language mode: ${input.language}`,
    `Tone: ${input.tone}`,
    input.audience ? `Audience: ${input.audience}` : "",
    input.keywords.length ? `Target keywords: ${input.keywords.join(", ")}` : "",
    input.instructions ? `Additional instructions: ${input.instructions}` : "",
    "Use safe semantic HTML in contentFa/contentEn: p, h2, h3, ul, ol, li, strong, em, blockquote.",
    "Do not invent citations, statistics, teacher credentials, prices, schedules, or medical claims.",
    "Required JSON keys: titleFa, titleEn, excerptFa, excerptEn, contentFa, contentEn, metaTitleFa, metaTitleEn, metaDescriptionFa, metaDescriptionEn, keywords, tags, suggestedCategorySlugs, sourceNotes.",
  ].filter(Boolean).join("\n");
}
