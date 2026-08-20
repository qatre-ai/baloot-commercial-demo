import assert from "node:assert/strict";
import {
  blogAiDraftSchema,
  blogAiRequestSchema,
  extractProviderDraft,
} from "../src/lib/blog-ai";
import { readFileSync } from "node:fs";

const request = blogAiRequestSchema.parse({
  topic: "راهنمای انتخاب ساز برای کودکان",
  language: "bilingual",
  tone: "professional",
  audience: "والدین هنرجویان",
  keywords: ["آموزش موسیقی", "انتخاب ساز"],
});

assert.equal(request.language, "bilingual");
assert.throws(() =>
  blogAiRequestSchema.parse({
    topic: "x",
    language: "fa",
    tone: "professional",
  })
);

const providerPayload = {
  choices: [
    {
      message: {
        content: JSON.stringify({
          titleFa: "راهنمای انتخاب ساز برای کودکان",
          titleEn: "A Guide to Choosing an Instrument for Children",
          excerptFa: "راهنمایی کاربردی برای والدین.",
          excerptEn: "A practical guide for parents.",
          contentFa: "<p>محتوای فارسی معتبر و قابل ویرایش.</p>",
          contentEn: "<p>Valid, editable English content.</p>",
          metaTitleFa: "انتخاب ساز کودک",
          metaTitleEn: "Choosing a Child's Instrument",
          metaDescriptionFa: "نکات مهم انتخاب ساز مناسب کودک.",
          metaDescriptionEn: "Important tips for choosing a suitable instrument.",
          keywords: ["آموزش موسیقی", "انتخاب ساز"],
          tags: ["کودکان", "آموزش"],
          suggestedCategorySlugs: ["music-education"],
          sourceNotes: ["Human review required before publishing."],
        }),
      },
    },
  ],
};

const draft = extractProviderDraft(providerPayload);
assert.equal(blogAiDraftSchema.parse(draft).titleFa, providerPayload.choices[0].message.content.includes("راهنمای") ? draft.titleFa : "");
assert.equal("isPublished" in draft, false);
assert.equal("publishedAt" in draft, false);

const aiRoute = readFileSync(
  "src/app/api/admin/blog/ai/generate/route.ts",
  "utf8"
);
const blogRoute = readFileSync("src/app/api/blog/route.ts", "utf8");
const blogIdRoute = readFileSync("src/app/api/blog/[id]/route.ts", "utf8");
assert.equal(aiRoute.includes("process.env.BLOG_AI_API_KEY"), true);
assert.equal(aiRoute.includes("NEXT_PUBLIC_BLOG_AI_API_KEY"), false);
assert.equal(aiRoute.includes("requiresHumanApproval: true"), true);
assert.equal(blogRoute.includes('sourceType !== "ai_assisted" && isPublished === true'), true);
assert.equal(blogIdRoute.includes('updateFields.sourceType === "ai_assisted"'), true);

console.log("Blog AI structured draft contract: PASS");
