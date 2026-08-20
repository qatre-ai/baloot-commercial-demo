# Blog AI Editorial Copilot

## Safety model

- AI generation creates an editable draft only.
- AI drafts are stored with `sourceType="ai_assisted"`.
- AI drafts cannot be published through the create/update API.
- A human editor must review, edit, save, and explicitly publish a later manual update.
- Provider credentials are server-only environment variables and are never returned to the browser.
- Every generation attempt writes an audit event with a request ID, admin ID, model, duration, and outcome.

## Local configuration

Copy the variables from `.env.example` into `.env` and set:

```text
BLOG_AI_API_KEY="server-only-secret"
BLOG_AI_MODEL="glm-4.7-flash"
BLOG_AI_BASE_URL="https://api.z.ai/api/paas/v4"
```

Do not use `NEXT_PUBLIC_` for any AI variable and do not commit `.env`.

## Editorial flow

1. Open Admin → Blog → create or edit a post.
2. Enter a topic and optional editorial instructions.
3. Generate or regenerate the draft.
4. Review and edit all generated fields, links, facts, SEO values, and categories.
5. Save as a draft.
6. Publish only after human approval from the normal manual editor controls.

If the provider is unavailable, rate-limited, times out, or returns invalid JSON, the UI keeps the existing form state and shows a controlled error.
