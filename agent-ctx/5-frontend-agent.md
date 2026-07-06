Task ID: 5
Agent: Frontend Agent
Task: Update admin panel to support multi-category selection for blog posts and improve category management UI

Work Log:
- Read the entire admin-panel.tsx file (~1930 lines) to understand structure
- Verified API endpoints already support `categoryIds: string[]` in POST/PUT for blog posts
- Verified `transformPostCategories` in blog-utils.ts transforms junction table format to flat `categories` array

Changes Made:

1. **Updated BlogPost interface** (lines 122-155):
   - Removed `BlogPostCategory` interface entirely
   - Removed `categoryId: string | null` field
   - Removed `category: BlogPostCategory | null` field
   - Added `categories: Array<{ id: string; nameFa: string; nameEn: string; slugFa: string; slugEn: string; color: string | null; icon: string | null }>`

2. **Updated BlogPostForm component**:
   - Changed form state from `categoryId: string` to `categoryIds: string[]`
   - Initialized `categoryIds` from `initialData?.categories?.map(c => c.id) || []`
   - Replaced single Select dropdown with multi-select checkbox UI:
     - Scrollable container with `max-h-48 overflow-y-auto`
     - Each category shown as a clickable row with colored checkbox, color dot, and name
     - Selected categories highlighted with `bg-primary/10` background
     - "Select All" / "Clear All" quick actions
     - Selected categories shown as removable badges below the selector
   - Removed `categoryId === "none"` conversion on save (no longer needed)

3. **Updated blog post list display**:
   - Changed single `post.category` badge to iterate over `post.categories` array
   - Each category rendered as a small colored badge

4. **Improved Blog Category Management tab**:
   - Added `categorySearch` state for filtering categories
   - Added `filteredBlogCategories` computed value (searches nameFa, nameEn, slugFa, slugEn)
   - Added `handleUpdateCategoryOrder` callback for inline order editing
   - Replaced simple list with grid layout (1 col mobile, 2 cols desktop via `grid-cols-1 sm:grid-cols-2`)
   - Each category card now shows:
     - Color indicator (rounded square)
     - Name with Published/Draft badge
     - Slug with Globe icon
     - Post count with BookOpen icon
     - Edit/Delete buttons (appear on hover)
     - Inline order input for reordering
   - Added search input with Search icon
   - Added empty state with icon and helpful text
   - Added "no matching categories" state for search

5. **Updated blog-categories API** (`/src/app/api/blog-categories/route.ts`):
   - Modified `_count.posts` to show all posts when `?all=true` (admin), not just published ones

All changes pass ESLint with zero errors. RTL support maintained throughout.
