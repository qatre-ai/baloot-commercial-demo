import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import {
  requireAdmin,
  writeAuditLog,
  getClientIp,
  getUserAgent,
} from '@/lib/auth/session';

// GET /api/admin/testimonials — Admin: List all testimonials (including unpublished)
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, "testimonials", "read");
  if (!auth.ok) return auth.response;

  try {
    const url = request.nextUrl.searchParams;
    const filter = url.get('filter'); // "pending" | "approved" | "published" | "rejected" | "all"
    const limit = Math.min(parseInt(url.get('limit') || '100'), 200);
    const offset = parseInt(url.get('offset') || '0');

    const where: Record<string, unknown> = {};
    if (filter && filter !== 'all') where.status = filter;

    const [testimonials, total, pendingCount] = await Promise.all([
      db.testimonial.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: [{ createdAt: 'desc' }],
      }),
      db.testimonial.count({ where }),
      db.testimonial.count({ where: { status: 'pending' } }),
    ]);

    return NextResponse.json({ testimonials, total, pendingCount });
  } catch (error) {
    console.error('[ADMIN_TESTIMONIALS_GET]', error);
    return NextResponse.json({ error: 'Failed to list testimonials' }, { status: 500 });
  }
}

// POST /api/admin/testimonials — Admin: Create a testimonial manually
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, "testimonials", "create");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { name, email, googleAvatarUrl, googleEmail, rating, titleFa, titleEn, contentFa, contentEn, instrument, courseId, studentId, isFeatured, displayOrder } = body;

    if (!name || !contentFa) {
      return NextResponse.json({ error: 'Name and content (Fa) are required' }, { status: 400 });
    }

    const clampedRating = Math.max(1, Math.min(5, rating || 5));

    const testimonial = await db.testimonial.create({
      data: {
        name,
        email: email || 'admin-added@mehravayebalout.ir',
        googleAvatarUrl: googleAvatarUrl || null,
        googleEmail: googleEmail || null,
        rating: clampedRating,
        titleFa: titleFa || null,
        titleEn: titleEn || null,
        contentFa,
        contentEn: contentEn || null,
        instrument: instrument || null,
        courseId: courseId || null,
        studentId: studentId || null,
        source: 'admin_added',
        isPublished: false,
        isApproved: false,
        status: 'pending',
        isFeatured: isFeatured || false,
        displayOrder: displayOrder || 0,
      },
    });

    // Audit log
    await writeAuditLog({
      adminId: auth.admin.id,
      action: 'create',
      entity: 'testimonial',
      entityId: testimonial.id,
      entityName: name,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: 'info',
    });

    return NextResponse.json({ testimonial }, { status: 201 });
  } catch (error) {
    console.error('[ADMIN_TESTIMONIALS_POST]', error);
    return NextResponse.json({ error: 'Failed to create testimonial' }, { status: 500 });
  }
}
