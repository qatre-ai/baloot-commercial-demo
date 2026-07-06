# Task 4 - Frontend Blog Components Update (Many-to-Many Categories)

## Summary
Updated frontend blog components to handle the API change from single category (`category: BlogCategory | null`) to multiple categories (`categories: BlogCategory[]`).

## Files Modified

### 1. `/src/components/sections/blog.tsx` - Homepage Blog Section
- **BlogPost interface**: Changed `category: BlogCategory | null` → `categories: BlogCategory[]`
- **BlogDetailModal**: Shows ALL category badges on the cover image (both with and without cover image). Each badge uses the category's own color.
- **BlogCard**: Shows up to 3 category badges over the cover. The first category uses slightly larger text (`text-[11px]`), additional ones are smaller (`text-[10px]`) with slight opacity.
- **Related posts fetch**: Changed from `selectedPost.category?.slugFa` to `selectedPost.categories?.[0]?.slugFa`
- **Removed unused**: `categoryColor`, `categoryName`, `primaryCategoryColor` variables that referenced the old single category

### 2. `/src/components/sections/blog-page.tsx` - Full Blog Page
- **BlogPost interface**: Changed `category: BlogCategory | null` → `categories: BlogCategory[]`
- **PostGridCard**: Shows up to 2 category badges over the cover with graduated sizing (first larger, second smaller/more transparent)
- **PostListCard**: Shows up to 2 category badges inline in the content area with graduated sizing
- **FeaturedHeroCard**: Shows ALL category badges in the badges row alongside the featured article badge
- **No changes needed** for the BlogPageContent fetch logic since the API already handles `?category=slug` filtering
- **Removed unused**: `categoryColor`, `categoryName` variables that referenced the old single category

### 3. `/src/app/globals.css` - Blog Content CSS
Enhanced the `.blog-content` styles with:
- **Word wrapping**: Added `word-wrap: break-word` and `overflow-wrap: break-word`
- **Scroll margin**: Added `scroll-margin-top: 2rem` to h2, h3, h4 for better anchor navigation
- **Nested lists**: Added styling for `li > ul` and `li > ol` with reduced margins
- **Blockquote**: Enhanced with background color, padding, border-radius. Added RTL-aware border-radius. Added `blockquote p:last-child` margin reset
- **Links**: Changed hover from opacity to `text-decoration-thickness` increase for better accessibility
- **Images**: Added `display: block` to prevent inline spacing issues
- **Figure/figcaption**: Added new styles for image captions
- **Code blocks**: Added border to `pre`, refined code font size and line-height
- **Tables**: Added `overflow-x: auto; display: block` for responsive tables, thead background, row hover, th `white-space: nowrap`
- **Video/Iframe**: Added responsive video and iframe styling
- **Video wrapper**: Added responsive 16:9 video wrapper class
- **Dark mode**: Added dark mode adjustments for blockquote and pre backgrounds
