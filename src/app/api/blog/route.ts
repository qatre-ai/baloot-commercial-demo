import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSession, requireAdmin } from "@/lib/auth/session";
import {
  transformPostCategories,
  estimateReadingTime,
} from "@/lib/blog-utils";

// Helper: enrich author objects with their aggregated post stats
async function enrichAuthorsWithStats(
  posts: Record<string, unknown>[]
): Promise<Record<string, unknown>[]> {
  // Collect unique author IDs
  const authorIds = [
    ...new Set(
      posts
        .map((p) => (p.author as Record<string, unknown> | null)?.id)
        .filter(Boolean) as string[]
    ),
  ];

  if (authorIds.length === 0) return posts;

  try {
    // Use groupBy with only original/available fields to avoid schema sync issues
    const authorStats = await db.blogPost.groupBy({
      by: ["authorId"],
      where: { authorId: { in: authorIds } },
      _sum: {
        viewCount: true,
      },
      _avg: {
        readingTime: true,
      },
    });

    // Build a lookup map
    const statsMap = new Map<
      string,
      { totalViews: number; avgReadingTime: number }
    >();
    for (const stat of authorStats) {
      statsMap.set(stat.authorId!, {
        totalViews: stat._sum.viewCount ?? 0,
        avgReadingTime: Math.round((stat._avg.readingTime ?? 0) * 10) / 10,
      });
    }

    // Merge stats into each post's author object
    return posts.map((post) => {
      const author = post.author as Record<string, unknown> | null;
      if (author && typeof author.id === "string") {
        const stats = statsMap.get(author.id);
        post.author = {
          ...author,
          totalViews: stats?.totalViews ?? 0,
          avgReadingTime: stats?.avgReadingTime ?? 0,
        };
      }
      return post;
    });
  } catch {
    // If aggregation fails (e.g. schema sync), just return posts as-is
    return posts;
  }
}

// GET /api/blog — list blog posts with pagination, filters, and sort
// Query params:
//   ?category=slugFa          - filter by category slug (matches slugFa or slugEn)
//   &featured=true             - filter featured posts
//   &limit=9                   - legacy: same as pageSize (kept for backwards compat)
//   &search=query              - search in title, content, excerpt
//   &all=true                  - admin: show drafts too
//   &page=1                    - page number (default 1)
//   &pageSize=9                - items per page (default 9)
//   &sort=newest|popular|featured - sort order (default: featured then newest)
//   &isShowOnHome=true         - filter posts shown on homepage
// Public: only published posts. Admin with ?all=true: all posts including drafts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const categorySlug = searchParams.get("category");
    const featured = searchParams.get("featured");
    const limitParam = searchParams.get("limit");
    const search = searchParams.get("search");
    const showAll = searchParams.get("all") === "true";

    // Pagination params
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const pageSizeParam = searchParams.get("pageSize");
    const pageSize = pageSizeParam
      ? Math.max(parseInt(pageSizeParam, 10), 1)
      : limitParam
        ? Math.max(parseInt(limitParam, 10), 1)
        : 9;

    // Sort param
    const sort = searchParams.get("sort") || ""; // newest | popular | featured

    // isShowOnHome filter
    const isShowOnHome = searchParams.get("isShowOnHome");

    // Check if user is admin for ?all=true support
    const session = await getSession();
    const isAdmin = session?.userType === "admin";

    const now = new Date();

    // Build where clause: public sees only published, admin with ?all=true sees all
    const where: Record<string, unknown> = {};

    if (!(isAdmin && showAll)) {
      where.isPublished = true;
      where.publishedAt = { lte: now };
    }

    // Filter by category slug (many-to-many via junction table)
    if (categorySlug) {
      where.categories = {
        some: {
          category: {
            OR: [{ slugFa: categorySlug }, { slugEn: categorySlug }],
          },
        },
      };
    }

    // Filter by featured
    if (featured === "true") {
      where.isFeatured = true;
    }

    // Filter by isShowOnHome
    if (isShowOnHome === "true") {
      where.isShowOnHome = true;
    }

    // Search in title and content
    if (search) {
      where.OR = [
        { titleFa: { contains: search } },
        { titleEn: { contains: search } },
        { contentFa: { contains: search } },
        { contentEn: { contains: search } },
        { excerptFa: { contains: search } },
        { excerptEn: { contains: search } },
      ];
    }

    // Determine sort order based on sort param
    let orderBy: Record<string, string>[];
    switch (sort) {
      case "newest":
        orderBy = [{ publishedAt: "desc" }, { createdAt: "desc" }];
        break;
      case "popular":
        orderBy = [{ viewCount: "desc" }, { publishedAt: "desc" }];
        break;
      case "featured":
        orderBy = [{ isFeatured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }];
        break;
      default:
        // Default: featured first, then newest
        orderBy = [{ isFeatured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }];
        break;
    }

    // Get total count for pagination
    const total = await db.blogPost.count({ where });
    const totalPages = Math.ceil(total / pageSize);

    const posts = await db.blogPost.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        categories: {
          include: {
            category: {
              select: {
                id: true,
                nameFa: true,
                nameEn: true,
                slugFa: true,
                slugEn: true,
                color: true,
                icon: true,
              },
            },
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            bioFa: true,
            bioEn: true,
          },
        },
      },
    });

    // Transform categories from junction table format to flat array
    const transformedPosts = posts.map(transformPostCategories);

    // Enrich author objects with aggregated stats
    const enrichedPosts = await enrichAuthorsWithStats(
      transformedPosts as unknown as Record<string, unknown>[]
    );

    return NextResponse.json({
      posts: enrichedPosts,
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    console.error("[BLOG_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 }
    );
  }
}

// POST /api/blog — create a new blog post (admin only)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request, "blog", "create");
    if (!auth.ok) return auth.response;
    const session = auth.session;

    const body = await request.json();
    const {
      titleFa,
      titleEn,
      slugFa,
      slugEn,
      contentFa,
      contentEn,
      excerptFa,
      excerptEn,
      coverUrl,
      coverAltFa,
      coverAltEn,
      categoryIds,
      tags,
      metaTitleFa,
      metaTitleEn,
      metaDescriptionFa,
      metaDescriptionEn,
      keywords,
      authorId,
      sourceType,
      isPublished,
      isFeatured,
      isShowOnHome,
      isPinned,
      shareCount,
      likeCount,
      uniqueViewCount,
      order,
    } = body;

    if (!titleFa || !titleEn || !slugFa || !slugEn || !contentFa || !contentEn) {
      return NextResponse.json(
        { error: "titleFa, titleEn, slugFa, slugEn, contentFa, and contentEn are required" },
        { status: 400 }
      );
    }

    // Auto-calculate reading time from Persian content
    const readingTime = estimateReadingTime(contentFa);

    // If publishing and no publishedAt, set it to now
    const shouldPublish = sourceType !== "ai_assisted" && isPublished === true;
    const publishedAt = shouldPublish ? new Date() : null;

    // Create the post first
    const post = await db.blogPost.create({
      data: {
        titleFa,
        titleEn,
        slugFa,
        slugEn,
        contentFa,
        contentEn,
        excerptFa: excerptFa ?? null,
        excerptEn: excerptEn ?? null,
        coverUrl: coverUrl ?? null,
        coverAltFa: coverAltFa ?? null,
        coverAltEn: coverAltEn ?? null,
        tags: tags ?? null,
        metaTitleFa: metaTitleFa ?? null,
        metaTitleEn: metaTitleEn ?? null,
        metaDescriptionFa: metaDescriptionFa ?? null,
        metaDescriptionEn: metaDescriptionEn ?? null,
        keywords: keywords ?? null,
        readingTime,
        authorId: authorId ?? session.userId,
        sourceType: sourceType === "ai_assisted" ? "ai_assisted" : "manual",
        isPublished: shouldPublish,
        isFeatured: isFeatured ?? false,
        isShowOnHome: isShowOnHome ?? false,
        isPinned: isPinned ?? false,
        shareCount: shareCount ?? 0,
        likeCount: likeCount ?? 0,
        uniqueViewCount: uniqueViewCount ?? 0,
        publishedAt,
        order: order ?? 0,
      },
    });

    // Create BlogPostToCategory records for the many-to-many relationship
    if (Array.isArray(categoryIds) && categoryIds.length > 0) {
      await db.blogPostToCategory.createMany({
        data: categoryIds.map((categoryId: string) => ({
          postId: post.id,
          categoryId,
        })),
      });
    }

    // Fetch the post again with categories and author for the response
    const postWithRelations = await db.blogPost.findUnique({
      where: { id: post.id },
      include: {
        categories: {
          include: {
            category: {
              select: {
                id: true,
                nameFa: true,
                nameEn: true,
                slugFa: true,
                slugEn: true,
                color: true,
                icon: true,
              },
            },
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            bioFa: true,
            bioEn: true,
          },
        },
      },
    });

    return NextResponse.json(
      postWithRelations ? transformPostCategories(postWithRelations) : post,
      { status: 201 }
    );
  } catch (error) {
    console.error("[BLOG_POST]", error);
    return NextResponse.json(
      { error: "Failed to create blog post" },
      { status: 500 }
    );
  }
}
