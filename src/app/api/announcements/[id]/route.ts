import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET /api/announcements/[id] — fetch a single announcement
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    const announcement = await db.announcement.findUnique({
      where: { id },
    })

    if (!announcement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(announcement)
  } catch (error) {
    console.error('[ANNOUNCEMENT_GET]', error)
    return NextResponse.json(
      { error: 'Failed to fetch announcement' },
      { status: 500 }
    )
  }
}

// PUT /api/announcements/[id] — update an announcement
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const body = await request.json()

    const existing = await db.announcement.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      )
    }

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

    const updated = await db.announcement.update({
      where: { id },
      data: {
        ...(titleFa !== undefined && { titleFa }),
        ...(titleEn !== undefined && { titleEn }),
        ...(contentFa !== undefined && { contentFa }),
        ...(contentEn !== undefined && { contentEn }),
        ...(type !== undefined && { type }),
        ...(priority !== undefined && { priority }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(isPublished !== undefined && { isPublished }),
        ...(isPinned !== undefined && { isPinned }),
        ...(startsAt !== undefined && { startsAt: startsAt ? new Date(startsAt) : null }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[ANNOUNCEMENT_PUT]', error)
    return NextResponse.json(
      { error: 'Failed to update announcement' },
      { status: 500 }
    )
  }
}

// DELETE /api/announcements/[id] — delete an announcement
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    const existing = await db.announcement.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      )
    }

    await db.announcement.delete({ where: { id } })

    return NextResponse.json({ message: 'Announcement deleted successfully' })
  } catch (error) {
    console.error('[ANNOUNCEMENT_DELETE]', error)
    return NextResponse.json(
      { error: 'Failed to delete announcement' },
      { status: 500 }
    )
  }
}
