import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  requireAdmin,
  writeAuditLog,
  getClientIp,
  getUserAgent,
} from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { resolveInstrumentProfile } from "@/lib/validation/instruments";
import { Prisma } from "@prisma/client";

// GET /api/registration/pending/[id] - Get a single pending registration detail (admin only)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(_request, "users", "read");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const registration = await db.pendingRegistration.findUnique({
      where: { id },
    });

    if (!registration) {
      return NextResponse.json(
        { error: "درخواست ثبت‌نام یافت نشد" },
        { status: 404 }
      );
    }

    // If approved, also fetch the created student
    let createdStudent: {
      id: string;
      name: string;
      email: string;
      phone: string;
      role: string;
      isActive: boolean;
      isVerified: boolean;
      registrationStatus: string;
      createdAt: Date;
    } | null = null;
    if (registration.createdUserId) {
      createdStudent = await db.student.findUnique({
        where: { id: registration.createdUserId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          isVerified: true,
          registrationStatus: true,
          createdAt: true,
        },
      });
    }

    return NextResponse.json({
      registration,
      createdStudent,
    });
  } catch (error) {
    console.error("[REGISTRATION_PENDING_GET]", error);
    return NextResponse.json(
      { error: "Failed to get pending registration" },
      { status: 500 }
    );
  }
}

// PATCH /api/registration/pending/[id] - Approve or reject a pending registration (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, "users", "approve");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const body = await request.json();
    const { action, adminNotes, rejectionReason } = body;

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "اقدام نامعتبر. فقط 'approve' یا 'reject' مجاز است." },
        { status: 400 }
      );
    }

    // Fetch the pending registration
    const pendingReg = await db.pendingRegistration.findUnique({
      where: { id },
    });

    if (!pendingReg) {
      return NextResponse.json(
        { error: "درخواست ثبت‌نام یافت نشد" },
        { status: 404 }
      );
    }

    if (pendingReg.status !== "pending") {
      return NextResponse.json(
        { error: "این درخواست قبلاً بررسی شده است." },
        { status: 400 }
      );
    }

    const clientIp = getClientIp(request);
    const userAgent = getUserAgent(request);

    if (action === "approve") {
      // Use transaction to create student and update pending registration atomically
      const result = await db.$transaction(async (tx) => {
        // Hash the nationalId as the default password
        const hashedPassword = await hashPassword(pendingReg.nationalId);
        const instrumentProfile = resolveInstrumentProfile({
          registrationInstrument: pendingReg.registrationInstrument,
          primaryInstrument: pendingReg.primaryInstrument,
          secondaryInstruments: pendingReg.secondaryInstruments,
        });

        // Create the Student record from pending registration data
        const studentData: Record<string, unknown> = {
          name: pendingReg.name,
          email: pendingReg.email || `${pendingReg.phone}@mab.local`,
          phone: pendingReg.phone,
          password: hashedPassword,
          role: pendingReg.role,
          // Personal information
          dateOfBirth: pendingReg.dateOfBirth,
          gender: pendingReg.gender,
          nationalId: pendingReg.nationalId,
          educationLevel: pendingReg.educationLevel,
          fieldOfStudy: pendingReg.fieldOfStudy,
          // Music profile
          registrationInstrument: instrumentProfile.registrationInstrument,
          primaryInstrument: instrumentProfile.primaryInstrument,
          secondaryInstruments: instrumentProfile.secondaryInstruments,
          musicExperienceYears: pendingReg.musicExperienceYears,
          previousTraining: pendingReg.previousTraining,
          musicGenres: pendingReg.musicGenres,
          learningGoals: pendingReg.learningGoals,
          practiceHoursPerWeek: pendingReg.practiceHoursPerWeek,
          skillLevel: pendingReg.skillLevel,
          instructorName: pendingReg.instructorName,
          instructorNameKnown: pendingReg.instructorNameKnown,
          // Contact & location
          address: pendingReg.address,
          city: pendingReg.city,
          province: pendingReg.province,
          emergencyContact: pendingReg.emergencyContact,
          preferredBranch: pendingReg.preferredBranch,
          // Parent info
          parentName: pendingReg.parentName,
          parentPhone: pendingReg.parentPhone,
          parentRelation: pendingReg.parentRelation,
          // Business intelligence
          referralSource: pendingReg.referralSource,
          referralDetail: pendingReg.referralDetail,
          // Instructor-specific
          specialtyFa: pendingReg.specialtyFa,
          specialtyEn: pendingReg.specialtyEn,
          bioFa: pendingReg.bioFa,
          bioEn: pendingReg.bioEn,
          experience: pendingReg.experience,
          socialLinks: pendingReg.socialLinks,
          // Status
          isActive: true,
          isVerified: true,
          registrationStatus: "approved",
        };

        const newStudent = await tx.student.create({
          data: studentData as Prisma.StudentUncheckedCreateInput,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
            isVerified: true,
            registrationStatus: true,
            primaryInstrument: true,
            createdAt: true,
          },
        });

        // Update the pending registration
        const updatedPending = await tx.pendingRegistration.update({
          where: { id },
          data: {
            status: "approved",
            createdUserId: newStudent.id,
            reviewedBy: auth.admin.id,
            reviewedAt: new Date(),
            adminNotes: adminNotes || null,
          },
        });

        // Log to AuditLog (inside transaction so it rolls back if anything fails)
        await tx.auditLog.create({
          data: {
            adminId: auth.admin.id,
            action: "approve_registration",
            entity: "pending_registration",
            entityId: id,
            entityName: pendingReg.name,
            details: JSON.stringify({
              studentId: newStudent.id,
              studentEmail: newStudent.email,
              studentPhone: newStudent.phone,
              studentRole: newStudent.role,
            }),
            ipAddress: clientIp,
            userAgent: userAgent,
            severity: "info",
          },
        });

        return { updatedPending, newStudent };
      });

      return NextResponse.json({
        registration: result.updatedPending,
        student: result.newStudent,
        message: `درخواست ثبت‌نام ${pendingReg.name} تایید شد و حساب کاربری ایجاد شد.`,
      });
    }

    if (action === "reject") {
      // Update pending registration as rejected
      const updatedPending = await db.$transaction(async (tx) => {
        const updated = await tx.pendingRegistration.update({
          where: { id },
          data: {
            status: "rejected",
            reviewedBy: auth.admin.id,
            reviewedAt: new Date(),
            adminNotes: adminNotes || null,
            rejectionReason: rejectionReason || null,
          },
        });

        // Log to AuditLog
        await tx.auditLog.create({
          data: {
            adminId: auth.admin.id,
            action: "reject_registration",
            entity: "pending_registration",
            entityId: id,
            entityName: pendingReg.name,
            details: JSON.stringify({
              rejectionReason: rejectionReason || null,
              adminNotes: adminNotes || null,
            }),
            ipAddress: clientIp,
            userAgent: userAgent,
            severity: "warning",
          },
        });

        return updated;
      });

      return NextResponse.json({
        registration: updatedPending,
        message: `درخواست ثبت‌نام ${pendingReg.name} رد شد.`,
      });
    }

    // This should never be reached due to the validation above
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[REGISTRATION_PENDING_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to process registration review" },
      { status: 500 }
    );
  }
}
