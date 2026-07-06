import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/blog-categories/[id] — fetch a single category
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const category = await db.blogCategory.findUnique({
      where: { id },
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

    if (!category) {
      return NextResponse.json(
        { error: "Blog category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("[BLOG_CATEGORY_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch blog category" },
      { status: 500 }
    );
  }
}

// PUT /api/blog-categories/[id] — update a category (admin only)
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getSession();
    if (!session || session.userType !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();

    const existing = await db.blogCategory.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Blog category not found" },
        { status: 404 }
      );
    }

    const updated = await db.blogCategory.update({
      where: { id },
      data: {
        ...(body.nameFa !== undefined && { nameFa: body.nameFa }),
        ...(body.nameEn !== undefined && { nameEn: body.nameEn }),
        ...(body.slugFa !== undefined && { slugFa: body.slugFa }),
        ...(body.slugEn !== undefined && { slugEn: body.slugEn }),
        ...(body.descriptionFa !== undefined && { descriptionFa: body.descriptionFa }),
        ...(body.descriptionEn !== undefined && { descriptionEn: body.descriptionEn }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.icon !== undefined && { icon: body.icon }),
        ...(body.order !== undefined && { order: body.order }),
        ...(body.isPublished !== undefined && { isPublished: body.isPublished }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[BLOG_CATEGORY_PUT]", error);
    return NextResponse.json(
      { error: "Failed to update blog category" },
      { status: 500 }
    );
  }
}

// DELETE /api/blog-categories/[id] — delete a category (admin only)
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getSession();
    if (!session || session.userType !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await context.params;

    const existing = await db.blogCategory.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Blog category not found" },
        { status: 404 }
      );
    }

    await db.blogCategory.delete({ where: { id } });

    return NextResponse.json({ message: "Blog category deleted successfully" });
  } catch (error) {
    console.error("[BLOG_CATEGORY_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete blog category" },
      { status: 500 }
    );
  }
}
