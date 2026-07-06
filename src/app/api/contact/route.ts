import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/contact — submit a contact message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { name, email, phone, subject, message } = body

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'name, email, subject, and message are required' },
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

    await db.contactMessage.create({
      data: {
        name,
        email,
        phone: phone ?? null,
        subject,
        message,
      },
    })

    return NextResponse.json(
      { message: 'Contact message submitted successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('[CONTACT_POST]', error)
    return NextResponse.json(
      { error: 'Failed to submit contact message' },
      { status: 500 }
    )
  }
}
