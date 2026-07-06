# Task 2: Seed File Rewrite — Agent Context

## Task Summary
Rewrote `/home/z/my-project/prisma/seed.ts` to use the new many-to-many relationship between BlogPost and BlogCategory via the BlogPostToCategory junction table.

## What Was Done

### 1. Removed `categoryId` from BlogPost.create calls
- All 5 existing blog posts no longer include a `categoryId` field in their create data
- The BlogPost model no longer has a `categoryId` column (verified via pragma_table_info)

### 2. Added BlogPostToCategory records
After each blog post creation, `prisma.blogPostToCategory.createMany()` is called to link posts to their categories:
- Post 1 (Piano): Music Education + Educational Tips
- Post 2 (Dastgahs): Music Theory + Music Styles + Music History
- Post 3 (Breathing): Performance + Educational Tips
- Post 4 (Folklore): Music Styles + Music History
- Post 5 (Children): Music Education + Children's Music + Educational Tips
- Post 6 (Buying Instrument): Music Education + Educational Tips
- Post 7 (Solfeggio): Music Theory + Educational Tips
- Post 8 (Guitar): Music Education + Performance
- Post 9 (Online vs In-person): Music Education + Educational Tips

### 3. Added 2 new blog categories (total 8)
- "موسیقی کودکان" / "Children's Music" — slug: موسیقی-کودکان / childrens-music — color: #B83232 — icon: Baby — order: 7
- "تولید موسیقی" / "Music Production" — slug: تولید-موسیقی / music-production — color: #5B6ABF — icon: Headphones — order: 8

### 4. Added 4 new blog posts (total 9)
- Post 6: Buying First Instrument — readingTime: 9, isShowOnHome: true
- Post 7: Solfeggio & Ear Training — readingTime: 8, isShowOnHome: false
- Post 8: Classical Guitar — readingTime: 10, isShowOnHome: true
- Post 9: Online vs In-Person — readingTime: 7, isShowOnHome: false

### 5. Preserved unchanged
- Admin/student user creation
- Branch creation
- Workshop creation
- Announcement creation
- All 6 existing blog categories (kept as-is with upsert)

### 6. Data integrity verified
- 9 blog posts ✅
- 8 blog categories ✅
- 20 post-category links ✅
- No `categoryId` column in BlogPost table ✅
- publishedAt dates span 2025-02-15 to 2025-03-20 ✅
- Posts 1, 2, 6, 8 have isShowOnHome: true ✅
- viewCount ranges 134-324 (within 100-400) ✅

## Files Modified
- `/home/z/my-project/prisma/seed.ts` — Complete rewrite

## Removed
- The old Post 6 (History of Iranian Music) was removed as it was not in the task's category mapping. The task specified 5 existing posts + 4 new = 9 total.
