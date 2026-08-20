import { PrismaClient } from "@prisma/client";

const QA_MARKER = "QA_PERSISTENT_2026";

function assertQaDatabase() {
  const url = process.env.DATABASE_URL || "";
  if (!/qa\.db(?:$|[?#])/i.test(url)) {
    throw new Error(`Refusing to inspect non-QA database. Set DATABASE_URL to a qa.db file (received: ${url || "unset"})`);
  }
}

async function main() {
  assertQaDatabase();
  const db = new PrismaClient();

  try {
    const [admins, students, courses, workshops, registrations, payments, schedules, enrollments, tickets, announcements, audits] = await Promise.all([
      db.admin.findMany({
        where: { email: { endsWith: "@mab.local" } },
        select: { email: true, role: true, isActive: true },
        orderBy: { email: "asc" },
      }),
      db.student.findMany({
        where: { email: { endsWith: "@mab.local" } },
        select: { email: true, role: true, registrationStatus: true },
        orderBy: { email: "asc" },
      }),
      db.course.findMany({
        where: { classCode: { startsWith: "QA-" } },
        select: { classCode: true, titleEn: true, registrationOpen: true, maxCapacity: true },
        orderBy: { classCode: "asc" },
      }),
      db.workshop.findMany({
        where: { titleEn: { startsWith: "QA " } },
        select: { titleEn: true, registrationOpen: true, totalSeats: true, reservedSeats: true },
        orderBy: { titleEn: "asc" },
      }),
      db.pendingRegistration.findMany({
        where: { name: { contains: QA_MARKER } },
        select: { id: true, email: true, status: true, rejectionReason: true, createdUserId: true },
        orderBy: { createdAt: "asc" },
      }),
      db.payment.findMany({
        where: { notes: { contains: QA_MARKER } },
        select: { id: true, status: true, paymentType: true, amount: true },
        orderBy: { id: "asc" },
      }),
      db.classSchedule.findMany({
        where: { notes: { contains: QA_MARKER } },
        select: { id: true, courseId: true, instructorId: true, status: true, dayOfWeek: true },
        orderBy: { id: "asc" },
      }),
      db.courseEnrollment.findMany({
        where: { notes: { contains: QA_MARKER } },
        select: { id: true, status: true, paymentStatus: true, progress: true },
        orderBy: { id: "asc" },
      }),
      db.workshopTicket.findMany({
        where: { paymentRef: { startsWith: `${QA_MARKER}-` } },
        select: { id: true, status: true, amount: true },
        orderBy: { id: "asc" },
      }),
      db.announcement.findMany({
        where: { id: "qa-announcement-student-2026" },
        select: { id: true, titleEn: true, isPublished: true, isPinned: true, expiresAt: true },
      }),
      db.auditLog.count({ where: { entityId: QA_MARKER } }),
    ]);

    const paymentStatuses = await db.payment.groupBy({
      by: ["status"],
      where: { notes: { contains: QA_MARKER } },
      _count: { _all: true },
    });
    const registrationStatuses = await db.pendingRegistration.groupBy({
      by: ["status"],
      where: { name: { contains: QA_MARKER } },
      _count: { _all: true },
    });

    console.log(JSON.stringify({
      marker: QA_MARKER,
      databaseUrl: process.env.DATABASE_URL,
      admins,
      students,
      courses,
      workshops,
      registrations,
      registrationStatuses,
      payments,
      paymentStatuses,
      schedules,
      enrollments,
      tickets,
      announcements,
      seedAuditCount: audits,
    }, null, 2));
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
