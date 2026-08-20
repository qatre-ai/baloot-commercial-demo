import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { allPermissionPairs, permissionsForRole } from "../src/lib/auth/permissions";

const QA_MARKER = "QA_PERSISTENT_2026";
const QA_PASSWORD = "QA_Baloot_2026!";

function assertQaDatabase() {
  const url = process.env.DATABASE_URL || "";
  if (!/qa\.db(?:$|[?#])/i.test(url)) {
    throw new Error(`Refusing to seed non-QA database. Set DATABASE_URL to a qa.db file (received: ${url || "unset"})`);
  }
}

function isoDate(daysFromNow: number, hour: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, 0, 0, 0);
  return date;
}

async function main() {
  assertQaDatabase();
  const db = new PrismaClient();

  try {
    const password = await hashPassword(QA_PASSWORD);

    const qaBranch = await db.branch.upsert({
      where: { id: "qa-branch-main-2026" },
      update: {
        nameFa: "شعبه QA اصلی",
        nameEn: `${QA_MARKER} Main Branch`,
        addressFa: "محیط تست ایزوله",
        addressEn: "Isolated QA environment",
        phone: "02100000000",
        hoursFa: "شنبه تا پنجشنبه ۹ تا ۱۸",
        hoursEn: "Saturday to Thursday, 09:00 to 18:00",
      },
      create: {
        id: "qa-branch-main-2026",
        nameFa: "شعبه QA اصلی",
        nameEn: `${QA_MARKER} Main Branch`,
        addressFa: "محیط تست ایزوله",
        addressEn: "Isolated QA environment",
        phone: "02100000000",
        hoursFa: "شنبه تا پنجشنبه ۹ تا ۱۸",
        hoursEn: "Saturday to Thursday, 09:00 to 18:00",
      },
    });

    const qaOnlineBranch = await db.branch.upsert({
      where: { id: "qa-branch-online-2026" },
      update: {
        nameFa: "استودیوی آنلاین QA",
        nameEn: `${QA_MARKER} Online Studio`,
        addressFa: "کلاس آنلاین",
        addressEn: "Online class",
        phone: "02100000001",
        hoursFa: "همه‌روزه",
        hoursEn: "Every day",
      },
      create: {
        id: "qa-branch-online-2026",
        nameFa: "استودیوی آنلاین QA",
        nameEn: `${QA_MARKER} Online Studio`,
        addressFa: "کلاس آنلاین",
        addressEn: "Online class",
        phone: "02100000001",
        hoursFa: "همه‌روزه",
        hoursEn: "Every day",
      },
    });

    const qaSuperAdmin = await db.admin.upsert({
      where: { email: "qa.superadmin@mab.local" },
      update: {
        name: `${QA_MARKER} Super Admin`,
        password,
        role: "super_admin",
        phone: "09990000001",
        isActive: true,
        mustChangePassword: false,
        notes: "Local QA only. Never use in production.",
      },
      create: {
        id: "qa-superadmin-2026",
        email: "qa.superadmin@mab.local",
        name: `${QA_MARKER} Super Admin`,
        password,
        role: "super_admin",
        phone: "09990000001",
        isActive: true,
        mustChangePassword: false,
        notes: "Local QA only. Never use in production.",
      },
    });

    const qaSecretary = await db.admin.upsert({
      where: { email: "qa.secretary@mab.local" },
      update: {
        name: `${QA_MARKER} Secretary`,
        password,
        role: "admin",
        phone: "09990000002",
        isActive: true,
        mustChangePassword: false,
        notes: "Local QA only. Secretary workflow account.",
      },
      create: {
        id: "qa-secretary-2026",
        email: "qa.secretary@mab.local",
        name: `${QA_MARKER} Secretary`,
        password,
        role: "admin",
        phone: "09990000002",
        isActive: true,
        mustChangePassword: false,
        notes: "Local QA only. Secretary workflow account.",
      },
    });

    const qaAdmin = await db.admin.upsert({
      where: { email: "qa.admin@mab.local" },
      update: {
        name: `${QA_MARKER} Admin`,
        password,
        role: "admin",
        phone: "09990000003",
        isActive: true,
        mustChangePassword: false,
        notes: "Local QA only. Admin workflow account.",
      },
      create: {
        id: "qa-admin-2026",
        email: "qa.admin@mab.local",
        name: `${QA_MARKER} Admin`,
        password,
        role: "admin",
        phone: "09990000003",
        isActive: true,
        mustChangePassword: false,
        notes: "Local QA only. Admin workflow account.",
      },
    });

    const permissionRows = [
      ...allPermissionPairs().map(({ resource, action }) => ({
        adminId: qaSuperAdmin.id,
        resource,
        action,
        granted: true,
        grantedBy: qaSuperAdmin.id,
      })),
      ...permissionsForRole("admin").flatMap(({ resource, action }) => [
        { adminId: qaSecretary.id, resource, action, granted: true, grantedBy: qaSuperAdmin.id },
        { adminId: qaAdmin.id, resource, action, granted: true, grantedBy: qaSuperAdmin.id },
      ]),
    ];
    await db.adminPermission.deleteMany({
      where: { adminId: { in: [qaSuperAdmin.id, qaSecretary.id, qaAdmin.id] } },
    });
    await db.adminPermission.createMany({ data: permissionRows });

    const qaInstructor = await db.student.upsert({
      where: { email: "qa.instructor@mab.local" },
      update: {
        name: `${QA_MARKER} Instructor`,
        phone: "09990000011",
        password,
        role: "instructor",
        registrationInstrument: "piano",
        primaryInstrument: "piano",
        teachingInstruments: JSON.stringify(["piano", "music_theory"]),
        specialtyFa: "پیانو و تئوری موسیقی",
        specialtyEn: "Piano and music theory",
        experience: "QA fixture instructor",
        instructorStatus: "active",
        isActive: true,
        isVerified: true,
        isPublishedInstructor: true,
        registrationStatus: "approved",
        notes: "Local QA only.",
      },
      create: {
        id: "qa-instructor-2026",
        email: "qa.instructor@mab.local",
        name: `${QA_MARKER} Instructor`,
        phone: "09990000011",
        password,
        role: "instructor",
        registrationInstrument: "piano",
        primaryInstrument: "piano",
        teachingInstruments: JSON.stringify(["piano", "music_theory"]),
        specialtyFa: "پیانو و تئوری موسیقی",
        specialtyEn: "Piano and music theory",
        experience: "QA fixture instructor",
        instructorStatus: "active",
        isActive: true,
        isVerified: true,
        isPublishedInstructor: true,
        registrationStatus: "approved",
        notes: "Local QA only.",
      },
    });

    const qaStudent = await db.student.upsert({
      where: { email: "qa.student@mab.local" },
      update: {
        name: `${QA_MARKER} Student`,
        phone: "09990000012",
        password,
        role: "student",
        registrationInstrument: "guitar",
        primaryInstrument: "guitar",
        secondaryInstruments: JSON.stringify(["piano"]),
        skillLevel: "beginner",
        registrationStatus: "approved",
        isActive: true,
        isVerified: true,
        notes: "Local QA only.",
      },
      create: {
        id: "qa-student-2026",
        email: "qa.student@mab.local",
        name: `${QA_MARKER} Student`,
        phone: "09990000012",
        password,
        role: "student",
        registrationInstrument: "guitar",
        primaryInstrument: "guitar",
        secondaryInstruments: JSON.stringify(["piano"]),
        skillLevel: "beginner",
        registrationStatus: "approved",
        isActive: true,
        isVerified: true,
        notes: "Local QA only.",
      },
    });

    const qaApprovedStudent = await db.student.upsert({
      where: { email: "qa.approved@mab.local" },
      update: {
        name: `${QA_MARKER} Approved Registration`,
        phone: "09990000013",
        password,
        role: "student",
        registrationInstrument: "violin",
        primaryInstrument: "violin",
        registrationStatus: "approved",
        isActive: true,
        isVerified: false,
        notes: "Created from the persistent approved-registration fixture.",
      },
      create: {
        id: "qa-approved-student-2026",
        email: "qa.approved@mab.local",
        name: `${QA_MARKER} Approved Registration`,
        phone: "09990000013",
        password,
        role: "student",
        registrationInstrument: "violin",
        primaryInstrument: "violin",
        registrationStatus: "approved",
        isActive: true,
        isVerified: false,
        notes: "Created from the persistent approved-registration fixture.",
      },
    });

    const qaCapacityStudent = await db.student.upsert({
      where: { email: "qa.capacity@mab.local" },
      update: {
        name: `${QA_MARKER} Capacity Fixture`,
        phone: "09990000014",
        password,
        role: "student",
        registrationInstrument: "piano",
        primaryInstrument: "piano",
        skillLevel: "intermediate",
        registrationStatus: "approved",
        isActive: true,
        isVerified: true,
        notes: "Local QA only. Capacity-state fixture.",
      },
      create: {
        id: "qa-capacity-student-2026",
        email: "qa.capacity@mab.local",
        name: `${QA_MARKER} Capacity Fixture`,
        phone: "09990000014",
        password,
        role: "student",
        registrationInstrument: "piano",
        primaryInstrument: "piano",
        skillLevel: "intermediate",
        registrationStatus: "approved",
        isActive: true,
        isVerified: true,
        notes: "Local QA only. Capacity-state fixture.",
      },
    });

    const courseDefinitions = [
      {
        id: "qa-course-piano-beginner-2026",
        classCode: "QA-PIANO-BEGINNER-2026",
        titleFa: "پیانو مقدماتی QA",
        titleEn: "QA Piano Beginner",
        instrument: "piano",
        category: "instrument",
        price: 4200000,
        branchId: qaBranch.id,
        instructorId: qaInstructor.id,
        level: "beginner",
        maxCapacity: 12,
      },
      {
        id: "qa-course-guitar-beginner-2026",
        classCode: "QA-GUITAR-BEGINNER-2026",
        titleFa: "گیتار مقدماتی QA",
        titleEn: "QA Guitar Beginner",
        instrument: "guitar",
        category: "instrument",
        price: 3800000,
        branchId: qaBranch.id,
        instructorId: qaInstructor.id,
        level: "beginner",
        maxCapacity: 12,
      },
      {
        id: "qa-course-music-theory-2026",
        classCode: "QA-MUSIC-THEORY-2026",
        titleFa: "تئوری موسیقی QA",
        titleEn: "QA Music Theory",
        instrument: "music_theory",
        category: "theory",
        price: 2500000,
        branchId: qaOnlineBranch.id,
        instructorId: qaInstructor.id,
        level: "all",
        maxCapacity: 20,
      },
      {
        id: "qa-course-almost-full-2026",
        classCode: "QA-ALMOST-FULL-2026",
        titleFa: "کلاس تقریباً تکمیل ظرفیت QA",
        titleEn: "QA Almost-Full Course",
        instrument: "piano",
        category: "instrument",
        price: 4600000,
        branchId: qaBranch.id,
        instructorId: qaInstructor.id,
        level: "intermediate",
        maxCapacity: 3,
      },
      {
        id: "qa-course-full-capacity-2026",
        classCode: "QA-FULL-CAPACITY-2026",
        titleFa: "کلاس با ظرفیت تکمیل QA",
        titleEn: "QA Full-Capacity Course",
        instrument: "piano",
        category: "instrument",
        price: 5000000,
        branchId: qaBranch.id,
        instructorId: qaInstructor.id,
        level: "beginner",
        maxCapacity: 1,
      },
      {
        id: "qa-course-closed-2026",
        classCode: "QA-CLOSED-2026",
        titleFa: "کلاس بسته QA",
        titleEn: "QA Closed Course",
        instrument: "violin",
        category: "instrument",
        price: 3900000,
        branchId: qaBranch.id,
        instructorId: qaInstructor.id,
        level: "beginner",
        maxCapacity: 12,
      },
    ];

    const courses: Array<{ id: string; price: number | null }> = [];
    for (const definition of courseDefinitions) {
      courses.push(await db.course.upsert({
        where: { id: definition.id },
        update: {
          ...definition,
          descriptionFa: `${QA_MARKER} داده‌ی پایدار برای تست فرایند کلاس`,
          descriptionEn: `${QA_MARKER} persistent fixture for course workflows`,
          classType: "group",
          duration: "8 weeks",
          sessionsMin: 8,
          sessionsMax: 8,
          isPublished: true,
          isShowOnHome: false,
          registrationOpen: definition.id !== "qa-course-closed-2026",
          registrationOpenAt: isoDate(-7, 9),
          registrationCloseAt: isoDate(30, 18),
        },
        create: {
          ...definition,
          descriptionFa: `${QA_MARKER} داده‌ی پایدار برای تست فرایند کلاس`,
          descriptionEn: `${QA_MARKER} persistent fixture for course workflows`,
          classType: "group",
          duration: "8 weeks",
          sessionsMin: 8,
          sessionsMax: 8,
          isPublished: true,
          isShowOnHome: false,
          registrationOpen: definition.id !== "qa-course-closed-2026",
          registrationOpenAt: isoDate(-7, 9),
          registrationCloseAt: isoDate(30, 18),
        },
      }));
    }

    const [pianoCourse, guitarCourse, theoryCourse, almostFullCourse, fullCourse, closedCourse] = courses;

    await db.courseEnrollment.upsert({
      where: { studentId_courseId: { studentId: qaStudent.id, courseId: guitarCourse.id } },
      update: {
        status: "active",
        progress: 35,
        tuitionAmount: guitarCourse.price,
        paymentStatus: "partial",
        registrationMethod: "online",
        notes: `${QA_MARKER} active enrollment`,
      },
      create: {
        id: "qa-enrollment-active-2026",
        studentId: qaStudent.id,
        courseId: guitarCourse.id,
        status: "active",
        progress: 35,
        tuitionAmount: guitarCourse.price,
        paymentStatus: "partial",
        registrationMethod: "online",
        notes: `${QA_MARKER} active enrollment`,
      },
    });

    await db.courseEnrollment.upsert({
      where: { studentId_courseId: { studentId: qaApprovedStudent.id, courseId: pianoCourse.id } },
      update: {
        status: "completed",
        progress: 100,
        tuitionAmount: pianoCourse.price,
        paymentStatus: "paid",
        registrationMethod: "phone",
        registeredByAdminId: qaSecretary.id,
        notes: `${QA_MARKER} completed enrollment`,
      },
      create: {
        id: "qa-enrollment-completed-2026",
        studentId: qaApprovedStudent.id,
        courseId: pianoCourse.id,
        status: "completed",
        progress: 100,
        tuitionAmount: pianoCourse.price,
        paymentStatus: "paid",
        registrationMethod: "phone",
        registeredByAdminId: qaSecretary.id,
        notes: `${QA_MARKER} completed enrollment`,
      },
    });

    await db.courseEnrollment.upsert({
      where: { studentId_courseId: { studentId: qaStudent.id, courseId: theoryCourse.id } },
      update: {
        status: "paused",
        progress: 55,
        tuitionAmount: theoryCourse.price,
        paymentStatus: "unpaid",
        registrationMethod: "in_person",
        registeredByAdminId: qaAdmin.id,
        notes: `${QA_MARKER} paused enrollment`,
      },
      create: {
        id: "qa-enrollment-paused-2026",
        studentId: qaStudent.id,
        courseId: theoryCourse.id,
        status: "paused",
        progress: 55,
        tuitionAmount: theoryCourse.price,
        paymentStatus: "unpaid",
        registrationMethod: "in_person",
        registeredByAdminId: qaAdmin.id,
        notes: `${QA_MARKER} paused enrollment`,
      },
    });

    for (const [id, studentId, course] of [
      ["qa-enrollment-almost-full-a-2026", qaApprovedStudent.id, almostFullCourse],
      ["qa-enrollment-almost-full-b-2026", qaCapacityStudent.id, almostFullCourse],
      ["qa-enrollment-full-capacity-2026", qaCapacityStudent.id, fullCourse],
    ] as const) {
      await db.courseEnrollment.upsert({
        where: { studentId_courseId: { studentId, courseId: course.id } },
        update: {
          status: "active",
          progress: 10,
          tuitionAmount: course.price,
          paymentStatus: "unpaid",
          registrationMethod: "admin",
          registeredByAdminId: qaSecretary.id,
          notes: `${QA_MARKER} capacity-state enrollment`,
        },
        create: {
          id,
          studentId,
          courseId: course.id,
          status: "active",
          progress: 10,
          tuitionAmount: course.price,
          paymentStatus: "unpaid",
          registrationMethod: "admin",
          registeredByAdminId: qaSecretary.id,
          notes: `${QA_MARKER} capacity-state enrollment`,
        },
      });
    }

    const scheduleDefinitions = [
      {
        id: "qa-schedule-piano-2026",
        courseId: pianoCourse.id,
        dayOfWeek: 0,
        startTime: "14:00",
        endTime: "16:00",
        room: "QA Room 1",
        capacity: 12,
        sessionNumber: 1,
      },
      {
        id: "qa-schedule-guitar-2026",
        courseId: guitarCourse.id,
        dayOfWeek: 2,
        startTime: "16:00",
        endTime: "18:00",
        room: "QA Room 2",
        capacity: 12,
        sessionNumber: 2,
      },
      {
        id: "qa-schedule-theory-2026",
        courseId: theoryCourse.id,
        dayOfWeek: 4,
        startTime: "18:00",
        endTime: "19:30",
        room: "Online QA Studio",
        capacity: 20,
        sessionNumber: 3,
      },
      {
        id: "qa-schedule-full-2026",
        courseId: fullCourse.id,
        dayOfWeek: 6,
        startTime: "10:00",
        endTime: "12:00",
        room: "QA Room Full",
        capacity: 1,
        sessionNumber: 1,
      },
      {
        id: "qa-schedule-almost-full-2026",
        courseId: almostFullCourse.id,
        dayOfWeek: 5,
        startTime: "12:00",
        endTime: "14:00",
        room: "QA Room Almost Full",
        capacity: 3,
        sessionNumber: 1,
      },
      {
        id: "qa-schedule-closed-2026",
        courseId: closedCourse.id,
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "11:00",
        room: "QA Room Closed",
        capacity: 12,
        sessionNumber: 1,
      },
    ];

    for (const schedule of scheduleDefinitions) {
      await db.classSchedule.upsert({
        where: { id: schedule.id },
        update: {
          ...schedule,
          instructorId: qaInstructor.id,
          branchId: schedule.courseId === theoryCourse.id ? qaOnlineBranch.id : qaBranch.id,
          isRecurring: true,
          status: "active",
          notes: `${QA_MARKER} schedule fixture`,
        },
        create: {
          ...schedule,
          instructorId: qaInstructor.id,
          branchId: schedule.courseId === theoryCourse.id ? qaOnlineBranch.id : qaBranch.id,
          isRecurring: true,
          status: "active",
          notes: `${QA_MARKER} schedule fixture`,
        },
      });
    }

    const workshopDefinitions = [
      {
        id: "qa-workshop-music-2026",
        titleFa: "کارگاه موسیقی QA",
        titleEn: "QA Music Workshop",
        date: isoDate(21, 17),
        price: 1500000,
        totalSeats: 20,
        reservedSeats: 1,
        branchId: qaBranch.id,
        registrationOpen: true,
      },
      {
        id: "qa-workshop-almost-full-2026",
        titleFa: "کارگاه تقریباً تکمیل ظرفیت QA",
        titleEn: "QA Almost-Full Workshop",
        date: isoDate(24, 16),
        price: 1650000,
        totalSeats: 3,
        reservedSeats: 2,
        branchId: qaBranch.id,
        registrationOpen: true,
      },
      {
        id: "qa-workshop-full-2026",
        titleFa: "کارگاه تکمیل ظرفیت QA",
        titleEn: "QA Full Workshop",
        date: isoDate(28, 15),
        price: 1800000,
        totalSeats: 1,
        reservedSeats: 1,
        branchId: qaBranch.id,
        registrationOpen: true,
      },
      {
        id: "qa-workshop-closed-2026",
        titleFa: "کارگاه بسته QA",
        titleEn: "QA Closed Workshop",
        date: isoDate(35, 11),
        price: 1200000,
        totalSeats: 15,
        reservedSeats: 0,
        branchId: qaOnlineBranch.id,
        registrationOpen: false,
      },
    ];

    const workshops: Array<{ id: string; price: number | null }> = [];
    for (const definition of workshopDefinitions) {
      workshops.push(await db.workshop.upsert({
        where: { id: definition.id },
        update: {
          ...definition,
          descriptionFa: `${QA_MARKER} داده‌ی پایدار برای تست کارگاه`,
          descriptionEn: `${QA_MARKER} persistent workshop fixture`,
          instructorFa: "استاد QA",
          instructorEn: "QA Instructor",
          category: "qa",
          isPublished: true,
          registrationDeadline: isoDate(14, 18),
        },
        create: {
          ...definition,
          descriptionFa: `${QA_MARKER} داده‌ی پایدار برای تست کارگاه`,
          descriptionEn: `${QA_MARKER} persistent workshop fixture`,
          instructorFa: "استاد QA",
          instructorEn: "QA Instructor",
          category: "qa",
          isPublished: true,
          registrationDeadline: isoDate(14, 18),
        },
      }));
    }

    const [musicWorkshop, almostFullWorkshop, fullWorkshop, closedWorkshop] = workshops;

    await db.workshopTicket.upsert({
      where: { studentId_workshopId: { studentId: qaStudent.id, workshopId: musicWorkshop.id } },
      update: {
        status: "paid",
        amount: musicWorkshop.price,
        registrationMethod: "online",
        paymentRef: `${QA_MARKER}-TICKET-PAID`,
        paidAt: new Date(),
      },
      create: {
        id: "qa-ticket-paid-2026",
        studentId: qaStudent.id,
        workshopId: musicWorkshop.id,
        status: "paid",
        amount: musicWorkshop.price,
        registrationMethod: "online",
        paymentRef: `${QA_MARKER}-TICKET-PAID`,
        paidAt: new Date(),
      },
    });

    await db.workshopTicket.upsert({
      where: { studentId_workshopId: { studentId: qaApprovedStudent.id, workshopId: closedWorkshop.id } },
      update: {
        status: "cancelled",
        amount: closedWorkshop.price,
        registrationMethod: "phone",
        registeredByAdminId: qaSecretary.id,
        paymentRef: `${QA_MARKER}-TICKET-CANCELLED`,
      },
      create: {
        id: "qa-ticket-cancelled-2026",
        studentId: qaApprovedStudent.id,
        workshopId: closedWorkshop.id,
        status: "cancelled",
        amount: closedWorkshop.price,
        registrationMethod: "phone",
        registeredByAdminId: qaSecretary.id,
        paymentRef: `${QA_MARKER}-TICKET-CANCELLED`,
      },
    });

    for (const [id, studentId] of [
      ["qa-ticket-almost-full-a-2026", qaApprovedStudent.id],
      ["qa-ticket-almost-full-b-2026", qaCapacityStudent.id],
    ] as const) {
      await db.workshopTicket.upsert({
        where: { studentId_workshopId: { studentId, workshopId: almostFullWorkshop.id } },
        update: {
          status: "paid",
          amount: almostFullWorkshop.price,
          registrationMethod: "admin",
          registeredByAdminId: qaSecretary.id,
          paymentRef: `${QA_MARKER}-${id.toUpperCase()}`,
          paidAt: new Date(),
        },
        create: {
          id,
          studentId,
          workshopId: almostFullWorkshop.id,
          status: "paid",
          amount: almostFullWorkshop.price,
          registrationMethod: "admin",
          registeredByAdminId: qaSecretary.id,
          paymentRef: `${QA_MARKER}-${id.toUpperCase()}`,
          paidAt: new Date(),
        },
      });
    }

    await db.announcement.upsert({
      where: { id: "qa-announcement-student-2026" },
      update: {
        titleFa: "اطلاعیه پایدار محیط QA",
        titleEn: "Persistent QA Student Announcement",
        contentFa: "این اطلاعیه برای بررسی نمایش، جزئیات و نشان اعلان در پنل هنرجو نگهداری می‌شود.",
        contentEn: "This persistent announcement verifies the student notification list, detail dialog, and badge.",
        type: "info",
        priority: 10,
        isPublished: true,
        isPinned: true,
        isNew: true,
        isFeatured: false,
        isShowOnHome: false,
        startsAt: isoDate(-1, 9),
        expiresAt: isoDate(90, 18),
      },
      create: {
        id: "qa-announcement-student-2026",
        titleFa: "اطلاعیه پایدار محیط QA",
        titleEn: "Persistent QA Student Announcement",
        contentFa: "این اطلاعیه برای بررسی نمایش، جزئیات و نشان اعلان در پنل هنرجو نگهداری می‌شود.",
        contentEn: "This persistent announcement verifies the student notification list, detail dialog, and badge.",
        type: "info",
        priority: 10,
        isPublished: true,
        isPinned: true,
        isNew: true,
        isFeatured: false,
        isShowOnHome: false,
        startsAt: isoDate(-1, 9),
        expiresAt: isoDate(90, 18),
      },
    });

    const activeEnrollment = await db.courseEnrollment.findUniqueOrThrow({
      where: { id: "qa-enrollment-active-2026" },
    });
    const completedEnrollment = await db.courseEnrollment.findUniqueOrThrow({
      where: { id: "qa-enrollment-completed-2026" },
    });
    const paidTicket = await db.workshopTicket.findUniqueOrThrow({
      where: { id: "qa-ticket-paid-2026" },
    });

    const paymentDefinitions = [
      {
        id: "qa-payment-pending-2026",
        studentId: qaStudent.id,
        amount: 800000,
        status: "pending",
        type: "course",
        relatedId: guitarCourse.id,
        enrollmentId: activeEnrollment.id,
        paymentType: "installment",
        paymentMethod: "transfer",
        paymentRef: `${QA_MARKER}-PAY-PENDING`,
      },
      {
        id: "qa-payment-paid-2026",
        studentId: qaApprovedStudent.id,
        amount: pianoCourse.price || 0,
        status: "paid",
        type: "course",
        relatedId: pianoCourse.id,
        enrollmentId: completedEnrollment.id,
        paymentType: "full",
        paymentMethod: "card",
        paymentRef: `${QA_MARKER}-PAY-PAID`,
        paidAt: new Date(),
      },
      {
        id: "qa-payment-failed-2026",
        studentId: qaStudent.id,
        amount: 500000,
        status: "failed",
        type: "registration",
        relatedId: theoryCourse.id,
        paymentType: "full",
        paymentMethod: "online",
        paymentRef: `${QA_MARKER}-PAY-FAILED`,
      },
      {
        id: "qa-payment-refunded-2026",
        studentId: qaApprovedStudent.id,
        amount: 1200000,
        status: "refunded",
        type: "workshop",
        relatedId: closedWorkshop.id,
        ticketId: "qa-ticket-cancelled-2026",
        paymentType: "refund",
        paymentMethod: "transfer",
        paymentRef: `${QA_MARKER}-PAY-REFUNDED`,
      },
      {
        id: "qa-payment-partial-2026",
        studentId: qaStudent.id,
        amount: 1200000,
        status: "paid",
        type: "course",
        relatedId: guitarCourse.id,
        enrollmentId: activeEnrollment.id,
        paymentType: "partial",
        paymentMethod: "cash",
        paymentRef: `${QA_MARKER}-PAY-PARTIAL`,
      },
    ];

    for (const payment of paymentDefinitions) {
      await db.payment.upsert({
        where: { id: payment.id },
        update: {
          ...payment,
          description: `${QA_MARKER} payment fixture`,
          notes: `${QA_MARKER} persistent payment fixture`,
          dueDate: payment.status === "pending" ? isoDate(10, 18) : null,
          receivedBy: qaSecretary.id,
          createdBy: qaSecretary.id,
        },
        create: {
          ...payment,
          description: `${QA_MARKER} payment fixture`,
          notes: `${QA_MARKER} persistent payment fixture`,
          dueDate: payment.status === "pending" ? isoDate(10, 18) : null,
          receivedBy: qaSecretary.id,
          createdBy: qaSecretary.id,
        },
      });
    }

    const registrationFixtures = [
      {
        id: "qa-registration-pending-2026",
        name: `${QA_MARKER} Pending Registration`,
        phone: "09990000021",
        nationalId: "QA202600021",
        email: "qa.pending.registration@mab.local",
        status: "pending",
        registrationInstrument: "santur",
        primaryInstrument: "santur",
        secondaryInstruments: JSON.stringify(["piano"]),
        reviewedBy: null,
        reviewedAt: null,
        rejectionReason: null,
        adminNotes: null,
        createdUserId: null,
      },
      {
        id: "qa-registration-approved-2026",
        name: `${QA_MARKER} Approved Registration`,
        phone: "09990000022",
        nationalId: "QA202600022",
        email: "qa.approved.registration@mab.local",
        status: "approved",
        registrationInstrument: "violin",
        primaryInstrument: "violin",
        secondaryInstruments: JSON.stringify(["piano"]),
        createdUserId: qaApprovedStudent.id,
        reviewedBy: qaSecretary.id,
        reviewedAt: new Date(),
      },
      {
        id: "qa-registration-rejected-2026",
        name: `${QA_MARKER} Rejected Registration`,
        phone: "09990000023",
        nationalId: "QA202600023",
        email: "qa.rejected.registration@mab.local",
        status: "rejected",
        registrationInstrument: "oud",
        primaryInstrument: "oud",
        secondaryInstruments: JSON.stringify([]),
        reviewedBy: qaAdmin.id,
        reviewedAt: new Date(),
        rejectionReason: `${QA_MARKER} rejection fixture`,
        adminNotes: `${QA_MARKER} retained for rejection-state verification`,
      },
      {
        id: "qa-registration-inspection-pending-2026",
        name: `${QA_MARKER} Inspection Pending`,
        phone: "09990000024",
        nationalId: "QA202600024",
        email: "qa.inspection.pending@mab.local",
        status: "pending",
        registrationInstrument: "piano",
        primaryInstrument: "piano",
        secondaryInstruments: JSON.stringify([]),
      },
    ];

    for (const registration of registrationFixtures) {
      await db.pendingRegistration.upsert({
        where: { id: registration.id },
        update: {
          ...registration,
          role: "student",
          skillLevel: "beginner",
          previousTraining: "self_taught",
          city: "Tehran",
          province: "Tehran",
          preferredBranch: qaBranch.id,
        },
        create: {
          ...registration,
          role: "student",
          skillLevel: "beginner",
          previousTraining: "self_taught",
          city: "Tehran",
          province: "Tehran",
          preferredBranch: qaBranch.id,
        },
      });
    }

    await db.auditLog.deleteMany({
      where: { entity: "qa_environment", entityId: QA_MARKER },
    });
    await db.auditLog.upsert({
      where: { id: "qa-audit-seed-2026" },
      update: {
        adminId: qaSuperAdmin.id,
        action: "QA_FIXTURE_SEED",
        entity: "qa_environment",
        entityId: QA_MARKER,
        entityName: QA_MARKER,
        details: JSON.stringify({ marker: QA_MARKER, seededAt: new Date().toISOString() }),
        severity: "info",
      },
      create: {
        id: "qa-audit-seed-2026",
        adminId: qaSuperAdmin.id,
        action: "QA_FIXTURE_SEED",
        entity: "qa_environment",
        entityId: QA_MARKER,
        entityName: QA_MARKER,
        details: JSON.stringify({ marker: QA_MARKER, seededAt: new Date().toISOString() }),
        severity: "info",
      },
    });

    const counts = {
      admins: await db.admin.count({ where: { email: { endsWith: "@mab.local" } } }),
      students: await db.student.count({ where: { email: { endsWith: "@mab.local" } } }),
      courses: await db.course.count({ where: { classCode: { startsWith: "QA-" } } }),
      workshops: await db.workshop.count({ where: { titleEn: { startsWith: "QA " } } }),
      registrations: await db.pendingRegistration.count({ where: { name: { contains: QA_MARKER } } }),
      payments: await db.payment.count({ where: { notes: { contains: QA_MARKER } } }),
      schedules: await db.classSchedule.count({ where: { notes: { contains: QA_MARKER } } }),
      enrollments: await db.courseEnrollment.count({ where: { notes: { contains: QA_MARKER } } }),
      tickets: await db.workshopTicket.count({ where: { paymentRef: { startsWith: `${QA_MARKER}-` } } }),
      announcements: await db.announcement.count({ where: { id: "qa-announcement-student-2026" } }),
    };

    console.log(JSON.stringify({ marker: QA_MARKER, databaseUrl: process.env.DATABASE_URL, password: QA_PASSWORD, counts }, null, 2));
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
