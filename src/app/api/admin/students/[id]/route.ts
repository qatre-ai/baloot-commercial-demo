import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  requireAdmin,
  requireSuperAdmin,
  writeAuditLog,
  getClientIp,
  getUserAgent,
} from "@/lib/auth/session";

// GET /api/admin/students/[id] - Get user with full AI data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, "students", "read");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const user = await db.student.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, phone: true, avatarUrl: true,
        dateOfBirth: true, gender: true, nationalId: true, educationLevel: true,
        fieldOfStudy: true, registrationInstrument: true, primaryInstrument: true, secondaryInstruments: true,
        musicExperienceYears: true, previousTraining: true, musicGenres: true,
        learningGoals: true, practiceHoursPerWeek: true, skillLevel: true,
        instructorName: true, instructorNameKnown: true,
        address: true, city: true, province: true, preferredBranch: true,
        parentName: true, parentPhone: true, parentRelation: true,
        referralSource: true, referralDetail: true,
        leadScore: true, customerLifetimeValue: true, churnRisk: true, engagementScore: true,
        aiSegmentTag: true, aiRecommendations: true, aiLastAnalysis: true, tags: true,
        specialtyFa: true, specialtyEn: true, bioFa: true, bioEn: true,
        experience: true, socialLinks: true, isPublishedInstructor: true, instructorOrder: true,
        notes: true, emergencyContact: true,
        role: true, isActive: true, isVerified: true, lastLogin: true, lastLoginIp: true,
        createdAt: true, updatedAt: true,
        enrollments: {
          include: {
            course: { select: { id: true, titleFa: true, titleEn: true, instrument: true, level: true } },
          },
        },
        tickets: {
          include: {
            workshop: { select: { id: true, titleFa: true, titleEn: true, date: true } },
          },
        },
        exercises: {
          include: {
            exercise: { select: { id: true, titleFa: true, titleEn: true, type: true, difficulty: true } },
          },
        },
        payments: {
          select: { id: true, amount: true, type: true, status: true, paidAt: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        _count: { select: { loginSessions: true, enrollments: true, tickets: true, exercises: true, taughtCourses: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ student: user });
  } catch (error) {
    console.error("[USER_GET]", error);
    return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
  }
}

// PUT /api/admin/students/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, "students", "update");
  if (!auth.ok) return auth.response;
  const session = auth.session;

  const { id } = await params;

  try {
    const body = await request.json();
    const allowedFields = [
      "name", "email", "phone", "avatarUrl",
      "dateOfBirth", "gender", "nationalId", "educationLevel", "fieldOfStudy",
      "registrationInstrument", "primaryInstrument", "secondaryInstruments", "musicExperienceYears",
      "previousTraining", "musicGenres", "learningGoals", "practiceHoursPerWeek", "skillLevel",
      "instructorName", "instructorNameKnown",
      "address", "city", "province", "preferredBranch",
      "parentName", "parentPhone", "parentRelation",
      "referralSource", "referralDetail",
      "leadScore", "customerLifetimeValue", "churnRisk", "engagementScore",
      "aiSegmentTag", "tags",
      "specialtyFa", "specialtyEn", "bioFa", "bioEn",
      "experience", "socialLinks", "isPublishedInstructor", "instructorOrder",
      "teachingInstruments", "certifications", "hourlyRate", "availableDays",
      "hireDate", "contractType", "instructorStatus",
      "notes", "emergencyContact", "isActive", "isVerified", "role",
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field] === "" ? null : body[field];
      }
    }

    // Handle numeric fields
    for (const numField of ["musicExperienceYears", "practiceHoursPerWeek", "leadScore", "customerLifetimeValue", "engagementScore", "instructorOrder", "hourlyRate"]) {
      if (updateData[numField] !== undefined && updateData[numField] !== null) {
        updateData[numField] = parseInt(String(updateData[numField])) || null;
      }
    }

    const user = await db.student.update({
      where: { id },
      data: updateData,
      select: {
        id: true, name: true, email: true, role: true, isActive: true, createdAt: true,
      },
    });

    await writeAuditLog({
      adminId: auth.admin.id,
      action: "update",
      entity: "user",
      entityId: id,
      entityName: user.name,
      details: { changes: Object.keys(updateData) },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "info",
    });

    return NextResponse.json({ student: user });
  } catch (error) {
    console.error("[USER_UPDATE]", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE /api/admin/students/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const user = await db.student.delete({
      where: { id },
      select: { id: true, name: true, email: true, role: true },
    });

    await writeAuditLog({
      adminId: auth.admin.id,
      action: "delete",
      entity: "user",
      entityId: id,
      entityName: user.name,
      details: { email: user.email, role: user.role },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "critical",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[USER_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
