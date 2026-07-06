import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import {
  requireAdmin,
  requireSuperAdmin,
  writeAuditLog,
  getClientIp,
  getUserAgent,
} from '@/lib/auth/session';

// PUT /api/admin/testimonials/[id] — Update testimonial (approve, reject, publish, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, "testimonials", "update");
  if (!auth.ok) return auth.response;
  const session = auth.session;

  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.testimonial.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    // Approve action
    if (body.action === 'approve') {
      updateData.isApproved = true;
      updateData.approvedBy = session.userId;
      updateData.approvedAt = new Date();
      updateData.status = 'approved';
    }
    // Reject action
    else if (body.action === 'reject') {
      updateData.isApproved = false;
      updateData.isPublished = false;
      updateData.status = 'rejected';
      updateData.rejectionReason = body.rejectionReason || null;
    }
    // Publish action (requires approval first)
    else if (body.action === 'publish') {
      if (!existing.isApproved && !(session.role === 'super_admin')) {
        return NextResponse.json({ error: 'Testimonial must be approved before publishing' }, { status: 400 });
      }
      updateData.isApproved = true;
      updateData.isPublished = true;
      updateData.status = 'published';
      updateData.approvedBy = session.userId;
      updateData.approvedAt = new Date();
    }
    // Unpublish action
    else if (body.action === 'unpublish') {
      updateData.isPublished = false;
      updateData.status = 'approved';
    }
    // General update
    else {
      if (body.name !== undefined) updateData.name = body.name;
      if (body.email !== undefined) updateData.email = body.email;
      if (body.googleAvatarUrl !== undefined) updateData.googleAvatarUrl = body.googleAvatarUrl;
      if (body.googleEmail !== undefined) updateData.googleEmail = body.googleEmail;
      if (body.rating !== undefined) updateData.rating = Math.max(1, Math.min(5, body.rating));
      if (body.titleFa !== undefined) updateData.titleFa = body.titleFa;
      if (body.titleEn !== undefined) updateData.titleEn = body.titleEn;
      if (body.contentFa !== undefined) updateData.contentFa = body.contentFa;
      if (body.contentEn !== undefined) updateData.contentEn = body.contentEn;
      if (body.instrument !== undefined) updateData.instrument = body.instrument;
      if (body.isFeatured !== undefined) updateData.isFeatured = body.isFeatured;
      if (body.displayOrder !== undefined) updateData.displayOrder = body.displayOrder;
      if (body.adminNotes !== undefined) updateData.adminNotes = body.adminNotes;
    }

    const testimonial = await db.testimonial.update({
      where: { id },
      data: updateData,
    });

    // Audit log
    await writeAuditLog({
      adminId: auth.admin.id,
      action: body.action || 'update',
      entity: 'testimonial',
      entityId: id,
      entityName: existing.name,
      details: updateData,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: 'info',
    });

    return NextResponse.json({ testimonial });
  } catch (error) {
    console.error('[ADMIN_TESTIMONIAL_PUT]', error);
    return NextResponse.json({ error: 'Failed to update testimonial' }, { status: 500 });
  }
}

// DELETE /api/admin/testimonials/[id] — Delete testimonial (super admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;

    const existing = await db.testimonial.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }

    await db.testimonial.delete({ where: { id } });

    // Audit log
    await writeAuditLog({
      adminId: auth.admin.id,
      action: 'delete',
      entity: 'testimonial',
      entityId: id,
      entityName: existing.name,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: 'warning',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ADMIN_TESTIMONIAL_DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete testimonial' }, { status: 500 });
  }
}
