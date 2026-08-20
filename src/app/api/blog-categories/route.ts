import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

// GET /api/blog-categories — list categories
// Public: only published categories
// Admin (with ?all=true): all categories
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const isAdmin = session?.userType === "admin";
    const showAll = request.nextUrl.searchParams.get("all") === "true";

    const where = isAdmin && showAll ? {} : { isPublished: true };

    const categories =
      isAdmin && showAll
        ? await db.blogCategory.findMany({
            where,
            orderBy: [{ order: "asc" }, { createdAt: "desc" }],
            include: { _count: { select: { posts: true } } },
          })
        : await db.blogCategory.findMany({
            where,
            orderBy: [{ order: "asc" }, { createdAt: "desc" }],
            include: {
              _count: {
                select: {
                  posts: {
                    where: {
                      post: { isPublished: true },
                    },
                  },
                },
              },
            },
          });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("[BLOG_CATEGORIES_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch blog categories" },
      { status: 500 }
    );
  }
}

// POST /api/blog-categories — create a new category (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.userType !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const {
      nameFa,
      nameEn,
      slugFa,
      slugEn,
      descriptionFa,
      descriptionEn,
      color,
      icon,
      order,
      isPublished,
    } = body;

    if (!nameFa || !nameEn || !slugFa || !slugEn) {
      return NextResponse.json(
        { error: "nameFa, nameEn, slugFa, and slugEn are required" },
        { status: 400 }
      );
    }

    const category = await db.blogCategory.create({
      data: {
        nameFa,
        nameEn,
        slugFa,
        slugEn,
        descriptionFa: descriptionFa ?? null,
        descriptionEn: descriptionEn ?? null,
        color: color ?? "#8B2252",
        icon: icon ?? null,
        order: order ?? 0,
        isPublished: isPublished ?? true,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("[BLOG_CATEGORIES_POST]", error);
    return NextResponse.json(
      { error: "Failed to create blog category" },
      { status: 500 }
    );
  }
}
