# Task 3 - API Routes Agent: Update Blog API Routes for Many-to-Many Categories

## Summary
Successfully updated all blog-related API routes to support the new many-to-many category relationship using the `BlogPostToCategory` junction table.

## Files Created
1. `/home/z/my-project/src/lib/blog-utils.ts` - Shared utility with `transformPostCategories()` and `estimateReadingTime()` helpers

## Files Modified
1. `/home/z/my-project/src/app/api/blog/route.ts`
   - GET: Changed `include: { category }` → `include: { categories: { include: { category: { select: {...} } } } }`
   - GET: Category filter now uses `where.categories = { some: { category: { OR: [{ slugFa }, { slugEn }] } } }` instead of `where.category = { slugFa }`
   - GET: Applied `transformPostCategories()` to flatten junction table objects into plain category arrays
   - POST: Accepts `categoryIds: string[]` instead of `categoryId: string`
   - POST: After creating the post, creates `BlogPostToCategory` records via `createMany`
   - POST: Re-fetches post with relations and applies transformation before returning
   - Preserved: `estimateReadingTime`, `enrichAuthorsWithStats`, pagination, search, sort, admin ?all=true support

2. `/home/z/my-project/src/app/api/blog/[id]/route.ts`
   - GET: Changed include to use junction table pattern, applied `transformPostCategories()`
   - PUT: Handles `categoryIds` update - deletes old `BlogPostToCategory` records, creates new ones, re-fetches post
   - PUT: Removed `categoryId` from update fields (no longer exists on BlogPost model)
   - PUT: Applied `transformPostCategories()` to response
   - DELETE: Unchanged (cascade delete handles junction records automatically)
   - Preserved: viewCount increment, reading time recalculation, publishedAt logic

3. `/home/z/my-project/src/app/api/blog/slug/[slug]/route.ts`
   - Changed include to use junction table pattern with `descriptionFa`/`descriptionEn` on category select
   - Applied `transformPostCategories()` to response

4. `/home/z/my-project/src/app/api/blog-categories/route.ts`
   - Updated `_count` from `{ select: { posts: { where: { isPublished: true } } } }` to `{ select: { posts: { where: { post: { isPublished: true } } } } }` to use junction table

5. `/home/z/my-project/src/app/api/blog-categories/[id]/route.ts`
   - Updated `_count` similarly to use junction table pattern

## Key Design Decisions
- `transformPostCategories()` extracts `categories` from the raw Prisma response (which has `{ postId, categoryId, category: {...} }[]`) and flattens it to `categories: [{ id, nameFa, nameEn, slugFa, slugEn, color, icon }]` for frontend compatibility
- Category slug filter matches both `slugFa` and `slugEn` for bilingual support
- PUT handler only re-fetches post when `categoryIds` is explicitly provided (avoids unnecessary DB calls)
- Junction table cascade deletes ensure clean deletion of posts/categories

## Lint Result
Zero errors, zero warnings
