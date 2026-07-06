import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/announcements — fetch all published announcements
export async function GET() {
  try {
    const now = new Date()

    const announcements = await db.announcement.findMany({
      where: {
        isPublished: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      orderBy: [
        { isPinned: 'desc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json(announcements)
  } catch (error) {
    console.error('[ANNOUNCEMENTS_GET]', error)
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    )
  }
}

// POST /api/announcements — create a new announcement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      titleFa,
      titleEn,
      contentFa,
      contentEn,
      type,
      priority,
      imageUrl,
      isPublished,
      isPinned,
      startsAt,
      expiresAt,
    } = body

    if (!titleFa || !titleEn) {
      return NextResponse.json(
        { error: 'titleFa and titleEn are required' },
        { status: 400 }
      )
    }

    const announcement = await db.announcement.create({
      data: {
        titleFa,
        titleEn,
        contentFa: contentFa ?? null,
        contentEn: contentEn ?? null,
        type: type ?? 'info',
        priority: priority ?? 0,
        imageUrl: imageUrl ?? null,
        isPublished: isPublished ?? false,
        isPinned: isPinned ?? false,
        startsAt: startsAt ? new Date(startsAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    return NextResponse.json(announcement, { status: 201 })
  } catch (error) {
    console.error('[ANNOUNCEMENTS_POST]', error)
    return NextResponse.json(
      { error: 'Failed to create announcement' },
      { status: 500 }
    )
  }
}
