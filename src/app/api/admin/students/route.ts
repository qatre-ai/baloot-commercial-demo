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

// GET /api/admin/students - List all users (students & instructors) with detailed data
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, "students", "read");
  if (!auth.ok) return auth.response;
  const session = auth.session;

  try {
    const url = request.nextUrl.searchParams;
    const search = url.get("search");
    const instrument = url.get("instrument");
    const role = url.get("role"); // student | instructor | all
    const limit = Math.min(parseInt(url.get("limit") || "50"), 200);
    const offset = parseInt(url.get("offset") || "0");
    const detailed = url.get("detailed") === "true";

    // Additional filters from unified users tab
    const isActive = url.get("isActive");
    const isVerified = url.get("isVerified");
    const skillLevel = url.get("skillLevel");
    const gender = url.get("gender");
    const aiSegmentTag = url.get("aiSegmentTag");
    const registrationStatus = url.get("registrationStatus");

    const where: Record<string, unknown> = {};
    if (role && role !== "all") where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }
    if (instrument) where.primaryInstrument = instrument;
    if (isActive) where.isActive = isActive === "true";
    if (isVerified) where.isVerified = isVerified === "true";
    if (skillLevel) where.skillLevel = skillLevel;
    if (gender) where.gender = gender;
    if (aiSegmentTag) where.aiSegmentTag = aiSegmentTag;
    if (registrationStatus) where.registrationStatus = registrationStatus;

    const selectFields = detailed ? {
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
      aiSegmentTag: true, tags: true,
      specialtyFa: true, specialtyEn: true, bioFa: true, bioEn: true,
      isPublishedInstructor: true,
      notes: true, emergencyContact: true,
      role: true, isActive: true, isVerified: true, lastLogin: true, lastLoginIp: true,
      createdAt: true, updatedAt: true,
      _count: { select: { enrollments: true, tickets: true, exercises: true, taughtCourses: true } },
      enrollments: {
        select: {
          id: true, status: true, registrationMethod: true, paymentStatus: true,
          tuitionAmount: true, enrolledAt: true,
          course: { select: { id: true, titleFa: true, titleEn: true, instrument: true } },
        },
        orderBy: { enrolledAt: "desc" as const },
        take: 10,
      },
    } : {
      id: true, name: true, email: true, phone: true, primaryInstrument: true,
      registrationInstrument: true, instructorName: true, instructorNameKnown: true,
      role: true, isActive: true, isVerified: true, createdAt: true, lastLogin: true,
      leadScore: true, aiSegmentTag: true, preferredBranch: true,
      specialtyFa: true, isPublishedInstructor: true,
      skillLevel: true, gender: true, registrationStatus: true,
      _count: { select: { enrollments: true, tickets: true, taughtCourses: true } },
      enrollments: {
        select: {
          id: true, registrationMethod: true, paymentStatus: true,
          course: { select: { id: true, titleFa: true, titleEn: true } },
        },
        orderBy: { enrolledAt: "desc" as const },
        take: 3,
      },
    };

    const [users, total] = await Promise.all([
      db.student.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
        select: selectFields,
      }),
      db.student.count({ where }),
    ]);

    return NextResponse.json({ students: users, total });
  } catch (error) {
    console.error("[USERS_LIST]", error);
    return NextResponse.json({ error: "Failed to list users" }, { status: 500 });
  }
}

// POST /api/admin/students - Register a new user (student or instructor) with structured data
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, "students", "create");
  if (!auth.ok) return auth.response;
  const session = auth.session;

  try {
    const body = await request.json();
    const {
      name, email, phone, password, role,
      // Personal information
      dateOfBirth, gender, nationalId, educationLevel, fieldOfStudy,
      // Music profile
      registrationInstrument, primaryInstrument, secondaryInstruments, musicExperienceYears,
      previousTraining, musicGenres, learningGoals, practiceHoursPerWeek, skillLevel,
      instructorName, instructorNameKnown,
      // Contact & location
      address, city, province, preferredBranch,
      // Parent info (for minors)
      parentName, parentPhone, parentRelation,
      // Business intelligence
      referralSource, referralDetail,
      // Instructor-specific
      specialtyFa, specialtyEn, bioFa, bioEn, experience, socialLinks, isPublishedInstructor,
      // Instructor Extended Profile
      teachingInstruments, certifications, hourlyRate, availableDays, hireDate, contractType,
      // Other
      notes, emergencyContact,
      // Registration method & enrollment (admin registration)
      registrationMethod,
      // Course enrollment fields
      courseId, tuitionAmount, paymentStatus, paymentDueDate, paymentRef,
      // Admin tags for categorization
      tags,
    } = body;

    if (role !== undefined && role !== "student" && role !== "instructor") {
      return NextResponse.json({ error: "Invalid user role" }, { status: 400 });
    }

    const instrumentProfile = resolveInstrumentProfile({
      registrationInstrument,
      primaryInstrument,
      secondaryInstruments,
    });

    if ((role || "student") === "student" && !instrumentProfile.registrationInstrument) {
      return NextResponse.json(
        { error: "Registration instrument is required for students" },
        { status: 400 },
      );
    }

    if (role === "instructor") {
      const instructorAuth = await requireAdmin(request, "instructors", "create");
      if (!instructorAuth.ok) return instructorAuth.response;
    }

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "نام، ایمیل و رمز عبور الزامی است" },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.trim().toLowerCase();

    const existing = await db.student.findUnique({ where: { email: sanitizedEmail } });
    if (existing) {
      return NextResponse.json(
        { error: "این ایمیل قبلاً ثبت شده است" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const userData: Record<string, unknown> = {
      name,
      email: sanitizedEmail,
      phone: phone || "",
      password: hashedPassword,
      role: role || "student",
      dateOfBirth: dateOfBirth || null,
      gender: gender || null,
      nationalId: nationalId || null,
      educationLevel: educationLevel || null,
      fieldOfStudy: fieldOfStudy || null,
      registrationInstrument: instrumentProfile.registrationInstrument,
      primaryInstrument: instrumentProfile.primaryInstrument,
      secondaryInstruments: instrumentProfile.secondaryInstruments,
      musicExperienceYears: musicExperienceYears ? parseInt(String(musicExperienceYears)) : null,
      previousTraining: previousTraining || null,
      musicGenres: musicGenres || null,
      learningGoals: learningGoals || null,
      practiceHoursPerWeek: practiceHoursPerWeek ? parseInt(String(practiceHoursPerWeek)) : null,
      skillLevel: skillLevel || null,
      instructorName: instructorName || null,
      instructorNameKnown: instructorNameKnown !== undefined ? instructorNameKnown : true,
      address: address || null,
      city: city || null,
      province: province || null,
      preferredBranch: preferredBranch || null,
      parentName: parentName || null,
      parentPhone: parentPhone || null,
      parentRelation: parentRelation || null,
      referralSource: referralSource || null,
      referralDetail: referralDetail || null,
      notes: notes || null,
      emergencyContact: emergencyContact || null,
      tags: tags || null,
    };

    // Instructor-specific fields
    if (role === "instructor") {
      userData.specialtyFa = specialtyFa || null;
      userData.specialtyEn = specialtyEn || null;
      userData.bioFa = bioFa || null;
      userData.bioEn = bioEn || null;
      userData.experience = experience || null;
      userData.socialLinks = socialLinks || null;
      userData.isPublishedInstructor = isPublishedInstructor || false;
      userData.instructorOrder = body.instructorOrder ? parseInt(String(body.instructorOrder)) : 0;
      // Instructor Extended Profile
      userData.teachingInstruments = teachingInstruments || null;
      userData.certifications = certifications || null;
      userData.hourlyRate = hourlyRate ? parseInt(String(hourlyRate)) : null;
      userData.availableDays = availableDays || null;
      userData.hireDate = hireDate || null;
      userData.contractType = contractType || null;
    }

    const user = await db.student.create({
      data: userData as Prisma.StudentUncheckedCreateInput,
      select: {
        id: true, name: true, email: true, phone: true, role: true,
        primaryInstrument: true, createdAt: true,
      },
    });

    // Create CourseEnrollment if courseId is provided
    let enrollment: Prisma.CourseEnrollmentGetPayload<{
      select: {
        id: true; status: true; registrationMethod: true; tuitionAmount: true;
        paymentStatus: true; enrolledAt: true;
        course: { select: { id: true; titleFa: true; titleEn: true } };
      };
    }> | null = null;
    if (courseId) {
      const enrollmentData: Record<string, unknown> = {
        studentId: user.id,
        courseId,
        registrationMethod: registrationMethod || "in_person",
        registeredByAdminId: session.userId,
        tuitionAmount: tuitionAmount ? parseInt(String(tuitionAmount)) : null,
        paymentStatus: paymentStatus || "unpaid",
        paymentDueDate: paymentDueDate ? new Date(paymentDueDate) : null,
        paymentRef: paymentRef || null,
        paidAt: paymentStatus === "paid" ? new Date() : null,
      };

      enrollment = await db.courseEnrollment.create({
        data: enrollmentData as Prisma.CourseEnrollmentUncheckedCreateInput,
        select: {
          id: true, status: true, registrationMethod: true, tuitionAmount: true,
          paymentStatus: true, enrolledAt: true,
          course: { select: { id: true, titleFa: true, titleEn: true } },
        },
      });
    }

    // Audit log
    await writeAuditLog({
      adminId: auth.admin.id,
      action: "create",
      entity: "user",
      entityId: user.id,
      entityName: user.name,
      details: {
        email: user.email,
        role: user.role,
        instrument: user.primaryInstrument,
        registrationMethod: registrationMethod || null,
        courseId: courseId || null,
        enrollmentCreated: !!enrollment,
      },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "info",
    });

    return NextResponse.json({ student: user, enrollment }, { status: 201 });
  } catch (error) {
    console.error("[USER_CREATE]", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
