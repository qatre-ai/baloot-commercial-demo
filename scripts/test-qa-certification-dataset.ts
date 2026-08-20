import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

const QA_MARKER = "QA_PERSISTENT_2026";

function assertQaDatabase() {
  const url = process.env.DATABASE_URL || "";
  assert.match(
    url,
    /qa\.db(?:$|[?#])/i,
    `Refusing to test a non-QA database: ${url || "unset"}`,
  );
}

async function main() {
  assertQaDatabase();
  const db = new PrismaClient();

  try {
    const courses = await db.course.findMany({
      where: { classCode: { startsWith: "QA-" } },
      select: {
        classCode: true,
        registrationOpen: true,
        maxCapacity: true,
        _count: { select: { enrollments: true } },
      },
    });
    const workshops = await db.workshop.findMany({
      where: { titleEn: { startsWith: "QA " } },
      select: {
        titleEn: true,
        registrationOpen: true,
        totalSeats: true,
        reservedSeats: true,
      },
    });
    const announcement = await db.announcement.findUnique({
      where: { id: "qa-announcement-student-2026" },
      select: { isPublished: true, isPinned: true, expiresAt: true },
    });

    assert.ok(
      courses.some(
        (course) =>
          course.registrationOpen &&
          course.maxCapacity !== null &&
          course.maxCapacity > 1 &&
          course._count.enrollments === course.maxCapacity - 1,
      ),
      "QA dataset must contain an almost-full open course",
    );
    assert.ok(
      courses.some(
        (course) =>
          course.registrationOpen &&
          course.maxCapacity !== null &&
          course._count.enrollments >= course.maxCapacity,
      ),
      "QA dataset must contain a full course whose registration switch is still open",
    );
    assert.ok(
      courses.some((course) => !course.registrationOpen),
      "QA dataset must contain a separately closed course",
    );

    assert.ok(
      workshops.some(
        (workshop) =>
          workshop.registrationOpen &&
          workshop.totalSeats > 1 &&
          workshop.reservedSeats === workshop.totalSeats - 1,
      ),
      "QA dataset must contain an almost-full open workshop",
    );
    assert.ok(
      workshops.some(
        (workshop) =>
          workshop.registrationOpen &&
          workshop.reservedSeats >= workshop.totalSeats,
      ),
      "QA dataset must contain a full workshop",
    );
    assert.ok(
      workshops.some((workshop) => !workshop.registrationOpen),
      "QA dataset must contain a closed workshop",
    );

    assert.ok(announcement, "QA dataset must contain a persistent student announcement");
    assert.equal(announcement.isPublished, true);
    assert.equal(announcement.isPinned, true);
    assert.ok(
      announcement.expiresAt === null || announcement.expiresAt > new Date(),
      "QA student announcement must be currently visible",
    );

    console.log("QA certification dataset contract: PASS");
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
