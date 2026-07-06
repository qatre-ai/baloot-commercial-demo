// Blog utility helpers shared across API routes

// Transform raw Prisma response for many-to-many category relationship.
// The Prisma query includes `categories` as BlogPostToCategory[] with nested `category`.
// The frontend expects `categories: [{ id, nameFa, nameEn, slugFa, slugEn, color, icon }].
export function transformPostCategories(post: Record<string, unknown>) {
  const { categories, ...rest } = post;
  return {
    ...rest,
    categories: (Array.isArray(categories) ? categories : []).map(
      (pc) => (pc as Record<string, unknown>).category
    ),
  };
}

// Helper: estimate reading time for Persian text (~200 words/min)
export function estimateReadingTime(content: string): number {
  if (!content) return 1;
  // Strip HTML tags if present
  const text = content.replace(/<[^>]*>/g, "").trim();
  // Split by whitespace and punctuation for Persian/English mixed content
  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.ceil(words / 200);
  return Math.max(minutes, 1);
}
