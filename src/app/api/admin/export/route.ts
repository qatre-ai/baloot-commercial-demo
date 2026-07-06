import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";

// GET /api/admin/export - Export data for AI training / analytics
// Query params: type=students|enrollments|exercises|sessions|full, format=json|csv
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, "analytics", "export");
  if (!auth.ok) return auth.response;

  try {
    const url = request.nextUrl.searchParams;
    const type = url.get("type") || "students";
    const format = url.get("format") || "json";

    let data: unknown[];

    switch (type) {
      case "students": {
        data = await db.student.findMany({
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            dateOfBirth: true,
            gender: true,
            educationLevel: true,
            fieldOfStudy: true,
            primaryInstrument: true,
            secondaryInstruments: true,
            musicExperienceYears: true,
            previousTraining: true,
            musicGenres: true,
            learningGoals: true,
            practiceHoursPerWeek: true,
            city: true,
            province: true,
            referralSource: true,
            createdAt: true,
            lastLogin: true,
            _count: { select: { enrollments: true, tickets: true, exercises: true } },
          },
          orderBy: { createdAt: "desc" },
        });
        break;
      }

      case "enrollments": {
        data = await db.courseEnrollment.findMany({
          select: {
            id: true,
            status: true,
            progress: true,
            enrolledAt: true,
            completedAt: true,
            student: { select: { id: true, name: true, email: true, primaryInstrument: true } },
            course: { select: { id: true, titleFa: true, titleEn: true, instrument: true, level: true } },
          },
          orderBy: { enrolledAt: "desc" },
        });
        break;
      }

      case "exercises": {
        data = await db.studentExercise.findMany({
          select: {
            id: true,
            status: true,
            grade: true,
            submittedAt: true,
            gradedAt: true,
            student: { select: { id: true, name: true, primaryInstrument: true } },
            exercise: { select: { id: true, titleFa: true, titleEn: true, type: true, difficulty: true } },
          },
          orderBy: { submittedAt: "desc" },
        });
        break;
      }

      case "sessions": {
        data = await db.loginSession.findMany({
          select: {
            id: true,
            userType: true,
            ipAddress: true,
            deviceType: true,
            browser: true,
            os: true,
            loginAt: true,
            logoutAt: true,
            isActive: true,
            admin: { select: { name: true, email: true, role: true } },
            student: { select: { name: true, email: true } },
          },
          orderBy: { loginAt: "desc" },
          take: 500,
        });
        break;
      }

      case "full": {
        // Full export for AI training
        const [students, enrollments, exercises, sessions, workshops, courses] = await Promise.all([
          db.student.findMany({
            where: { isActive: true },
            select: {
              id: true, name: true, email: true, phone: true,
              dateOfBirth: true, gender: true, educationLevel: true, fieldOfStudy: true,
              primaryInstrument: true, secondaryInstruments: true,
              musicExperienceYears: true, previousTraining: true,
              musicGenres: true, learningGoals: true, practiceHoursPerWeek: true,
              city: true, province: true, referralSource: true,
              createdAt: true, lastLogin: true,
              _count: { select: { enrollments: true, tickets: true, exercises: true } },
            },
          }),
          db.courseEnrollment.findMany({
            select: {
              id: true, status: true, progress: true, enrolledAt: true, completedAt: true,
              student: { select: { id: true, name: true, primaryInstrument: true } },
              course: { select: { id: true, titleEn: true, instrument: true, level: true } },
            },
          }),
          db.studentExercise.findMany({
            select: {
              id: true, status: true, grade: true, submittedAt: true,
              student: { select: { id: true, primaryInstrument: true } },
              exercise: { select: { id: true, titleEn: true, type: true, difficulty: true } },
            },
          }),
          db.loginSession.findMany({
            select: { id: true, userType: true, ipAddress: true, deviceType: true, browser: true, os: true, loginAt: true, isActive: true },
            take: 1000,
            orderBy: { loginAt: "desc" },
          }),
          db.workshop.findMany({
            select: { id: true, titleEn: true, date: true, totalSeats: true, reservedSeats: true, category: true, isHot: true },
          }),
          db.course.findMany({
            select: { id: true, titleEn: true, instrument: true, level: true, isPublished: true },
          }),
        ]);

        data = [{ exportDate: new Date().toISOString(), students, enrollments, exercises, sessions, workshops, courses }];
        break;
      }

      default:
        return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
    }

    if (format === "csv") {
      const csv = convertToCSV(data, type);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="mab-${type}-export-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json(data, {
      headers: {
        "Content-Disposition": `attachment; filename="mab-${type}-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("[EXPORT_ERROR]", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}

// CSV converter helper
function convertToCSV(data: unknown[], type: string): string {
  if (!data.length) return "";

  // Flatten nested objects for CSV
  const flatData = data.map(item => {
    const flat: Record<string, string> = {};
    const obj = item as Record<string, unknown>;
    for (const [key, value] of Object.entries(obj)) {
      if (key === "_count") {
        for (const [ck, cv] of Object.entries(value as Record<string, unknown>)) {
          flat[`count_${ck}`] = String(cv);
        }
      } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        for (const [nk, nv] of Object.entries(value as Record<string, unknown>)) {
          if (typeof nv === "object" && nv !== null) {
            flat[`${key}_${nk}`] = JSON.stringify(nv);
          } else {
            flat[`${key}_${nk}`] = String(nv ?? "");
          }
        }
      } else {
        flat[key] = String(value ?? "");
      }
    }
    return flat;
  });

  const headers = Object.keys(flatData[0]);
  const csvRows = [
    headers.join(","),
    ...flatData.map(row =>
      headers.map(h => {
        const val = row[h] || "";
        // Escape commas and quotes
        if (val.includes(",") || val.includes('"') || val.includes("\n")) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(",")
    ),
  ];

  return csvRows.join("\n");
}
