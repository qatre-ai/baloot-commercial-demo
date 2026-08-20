import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";

const PROFILE_FIELDS = [
  "name",
  "phone",
  "dateOfBirth",
  "gender",
  "nationalId",
  "educationLevel",
  "fieldOfStudy",
  "registrationInstrument",
  "primaryInstrument",
  "secondaryInstruments",
  "musicExperienceYears",
  "previousTraining",
  "musicGenres",
  "learningGoals",
  "practiceHoursPerWeek",
  "skillLevel",
  "address",
  "city",
  "province",
  "experience",
  "emergencyContact",
  "parentName",
  "parentPhone",
  "parentRelation",
] as const;

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await db.student.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      dateOfBirth: true,
      gender: true,
      nationalId: true,
      educationLevel: true,
      fieldOfStudy: true,
      registrationInstrument: true,
      primaryInstrument: true,
      secondaryInstruments: true,
      musicExperienceYears: true,
      previousTraining: true,
      musicGenres: true,
      learningGoals: true,
      practiceHoursPerWeek: true,
      skillLevel: true,
      address: true,
      city: true,
      province: true,
      experience: true,
      emergencyContact: true,
      parentName: true,
      parentPhone: true,
      parentRelation: true,
    },
  });

  if (!profile) return NextResponse.json({ error: "Student not found" }, { status: 404 });
  return NextResponse.json({ profile });
}

export async function PUT(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const updateData: Record<string, unknown> = {};
    for (const field of PROFILE_FIELDS) {
      if (body[field] !== undefined) updateData[field] = body[field] === "" ? null : body[field];
    }

    for (const field of ["musicExperienceYears", "practiceHoursPerWeek"]) {
      if (updateData[field] !== undefined && updateData[field] !== null) {
        const value = Number(updateData[field]);
        if (!Number.isInteger(value) || value < 0) {
          return NextResponse.json({ error: "Invalid numeric profile field" }, { status: 400 });
        }
        updateData[field] = value;
      }
    }

    const profile = await db.student.update({
      where: { id: session.userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        nationalId: true,
        educationLevel: true,
        fieldOfStudy: true,
        registrationInstrument: true,
        primaryInstrument: true,
        secondaryInstruments: true,
        musicExperienceYears: true,
        previousTraining: true,
        musicGenres: true,
        learningGoals: true,
        practiceHoursPerWeek: true,
        skillLevel: true,
        address: true,
      city: true,
      province: true,
      experience: true,
      emergencyContact: true,
        parentName: true,
        parentPhone: true,
        parentRelation: true,
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("[STUDENT_PROFILE_PUT]", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
