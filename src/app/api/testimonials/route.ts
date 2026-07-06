import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/testimonials — Public: list published testimonials
export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(url.get('limit') || '6'), 20);
    const offset = parseInt(url.get('offset') || '0');

    const where = {
      isPublished: true,
      status: 'published' as const,
    };

    const [testimonials, total] = await Promise.all([
      db.testimonial.findMany({
        where,
        select: {
          id: true,
          name: true,
          googleAvatarUrl: true,
          googleEmail: true,
          rating: true,
          titleFa: true,
          titleEn: true,
          contentFa: true,
          contentEn: true,
          instrument: true,
          source: true,
          isFeatured: true,
          displayOrder: true,
          createdAt: true,
        },
        orderBy: [
          { isFeatured: 'desc' },
          { displayOrder: 'asc' },
          { createdAt: 'desc' },
        ],
        take: limit,
        skip: offset,
      }),
      db.testimonial.count({ where }),
    ]);

    return NextResponse.json({ testimonials, total });
  } catch (error) {
    console.error('[TESTIMONIALS_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch testimonials' },
      { status: 500 }
    );
  }
}

// POST /api/testimonials — submit a testimonial (e.g., from contact form feedback)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { name, email, contentFa, source, rating, studentId } = body

    if (!name || !email || !contentFa) {
      return NextResponse.json(
        { error: 'name, email, and contentFa are required' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Validate rating
    const validRating = Math.min(Math.max(Number(rating) || 5, 1), 5)

    // Validate source
    const validSource = ['contact', 'google', 'direct', 'admin_added'].includes(source)
      ? source
      : 'contact'

    await db.testimonial.create({
      data: {
        name,
        email,
        contentFa,
        source: validSource,
        rating: validRating,
        studentId: studentId || null,
        // Testimonials from contact form start as pending, need admin approval
        isPublished: false,
        isApproved: false,
        status: 'pending',
      },
    })

    return NextResponse.json(
      { message: 'Testimonial submitted successfully and pending review' },
      { status: 201 }
    )
  } catch (error) {
    console.error('[TESTIMONIALS_POST]', error)
    return NextResponse.json(
      { error: 'Failed to submit testimonial' },
      { status: 500 }
    )
  }
}
