import { PrismaClient } from "@prisma/client";
import { hash } from "./seed-utils";

const prisma = new PrismaClient();

// Helper: generate dates for the next N days
function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(10, 0, 0, 0); // 10:00 AM
  return d;
}

async function main() {
  console.log("🌱 Seeding student learning data...");

  // ============================================
  // Create demo student (student@mab.ir / 123456)
  // ============================================
  const demoPassword = await hash("123456");
  const demoStudent = await prisma.student.upsert({
    where: { email: "student@mab.ir" },
    update: {},
    create: {
      email: "student@mab.ir",
      name: "سارا احمدی",
      password: demoPassword,
      phone: "09121112233",
      role: "student",
      avatarUrl: "/avatars/sara.jpg",
    },
  });
  console.log("✅ Demo student created:", demoStudent.email);

  // Also ensure the existing student@example.com has learning data
  const existingStudent = await prisma.student.findUnique({
    where: { email: "student@example.com" },
  });

  // Use demoStudent for seeding
  const studentId = demoStudent.id;

  // ============================================
  // Get existing courses from DB
  // ============================================
  const allCourses = await prisma.course.findMany({
    where: { isPublished: true },
  });

  if (allCourses.length === 0) {
    console.log("⚠️ No published courses found. Skipping course enrollments.");
    return;
  }

  // Pick up to 4 courses for enrollment
  const course1 = allCourses.find((c) => c.instrument === "piano") || allCourses[0];
  const course2 = allCourses.find((c) => c.category === "theory") || allCourses[1];
  const course3 = allCourses.find((c) => c.instrument === "guitar") || allCourses[2];
  const course4 = allCourses.find((c) => c.instrument === "vocals") || allCourses[3];

  // ============================================
  // Course Enrollments (3-4 for demo student)
  // ============================================
  const enrollment1 = await prisma.courseEnrollment.upsert({
    where: {
      studentId_courseId: { studentId, courseId: course1.id },
    },
    update: {},
    create: {
      studentId,
      courseId: course1.id,
      status: "active",
      progress: 65,
      enrolledAt: new Date("2026-03-01"),
    },
  });

  const enrollment2 = await prisma.courseEnrollment.upsert({
    where: {
      studentId_courseId: { studentId, courseId: course2.id },
    },
    update: {},
    create: {
      studentId,
      courseId: course2.id,
      status: "completed",
      progress: 100,
      enrolledAt: new Date("2026-01-15"),
      completedAt: new Date("2026-03-20"),
    },
  });

  const enrollment3 = await prisma.courseEnrollment.upsert({
    where: {
      studentId_courseId: { studentId, courseId: course3.id },
    },
    update: {},
    create: {
      studentId,
      courseId: course3.id,
      status: "active",
      progress: 30,
      enrolledAt: new Date("2026-04-10"),
    },
  });

  let enrollment4: { id: string; studentId: string; courseId: string; status: string; progress: number; enrolledAt: Date; completedAt: Date | null } | null = null;
  if (course4) {
    enrollment4 = await prisma.courseEnrollment.upsert({
      where: {
        studentId_courseId: { studentId, courseId: course4.id },
      },
      update: {},
      create: {
        studentId,
        courseId: course4.id,
        status: "active",
        progress: 15,
        enrolledAt: new Date("2026-05-01"),
      },
    });
  }

  console.log("✅ Course enrollments created:", [enrollment1, enrollment2, enrollment3, enrollment4].filter(Boolean).length);

  // Also create enrollments for existing student if available
  if (existingStudent) {
    const exStudentId = existingStudent.id;
    for (const course of [course1, course2]) {
      await prisma.courseEnrollment.upsert({
        where: {
          studentId_courseId: { studentId: exStudentId, courseId: course.id },
        },
        update: {},
        create: {
          studentId: exStudentId,
          courseId: course.id,
          status: "active",
          progress: 45,
          enrolledAt: new Date("2026-04-01"),
        },
      });
    }
    console.log("✅ Enrollments also created for existing student@example.com");
  }

  // ============================================
  // Workshop Tickets (2-3 for demo student)
  // ============================================
  const upcomingWorkshops = await prisma.workshop.findMany({
    where: { isPublished: true, date: { gte: new Date() } },
    take: 3,
  });

  // Also include some past workshops for variety
  const allWorkshops = await prisma.workshop.findMany({
    where: { isPublished: true },
  });

  const workshopsForTickets = upcomingWorkshops.length >= 2
    ? upcomingWorkshops.slice(0, 3)
    : allWorkshops.slice(0, 3);

  for (let i = 0; i < workshopsForTickets.length; i++) {
    const ws = workshopsForTickets[i];
    const statuses = ["reserved", "paid", "paid"];
    await prisma.workshopTicket.upsert({
      where: {
        studentId_workshopId: { studentId, workshopId: ws.id },
      },
      update: {},
      create: {
        studentId,
        workshopId: ws.id,
        seatNumber: i + 1,
        status: statuses[i] || "reserved",
        amount: ws.price,
      },
    });
  }
  console.log("✅ Workshop tickets created:", workshopsForTickets.length);

  // ============================================
  // Exercises (5-6 across enrolled courses)
  // ============================================
  const enrolledCourses = [course1, course2, course3];

  const exerciseData = [
    {
      courseId: course1.id,
      titleFa: "تمرین مقام راست",
      titleEn: "Rast Maqam Practice",
      descriptionFa: "تمرین مقام راست با تمرکز بر انتقال بین گوشه‌ها. حداقل ۳۰ دقیقه تمرین روزانه.",
      descriptionEn: "Practice Rast maqam focusing on transitions between gooshehs. At least 30 minutes daily practice.",
      type: "practice",
      difficulty: "medium",
      dueDate: daysFromNow(5),
      order: 1,
    },
    {
      courseId: course1.id,
      titleFa: "تکلیف هفته سوم: قطعه بایر شماره ۱۲",
      titleEn: "Week 3 Assignment: Beyer No. 12",
      descriptionFa: "نواختن قطعه بایر شماره ۱۲ با مترونوم سرعت ۶۰. ضبط و ارسال فایل صوتی.",
      descriptionEn: "Play Beyer No. 12 with metronome at 60 BPM. Record and submit audio file.",
      type: "assignment",
      difficulty: "easy",
      dueDate: daysFromNow(3),
      order: 2,
    },
    {
      courseId: course2.id,
      titleFa: "تمرین سلفژ: فاصله‌های دوم و سوم",
      titleEn: "Solfege Practice: 2nd and 3rd Intervals",
      descriptionFa: "شناسایی و خواندن فاصله‌های دوم و سوم بزرگ و کوچک. تمرین گوش نوشتن.",
      descriptionEn: "Identify and sing major and minor 2nd and 3rd intervals. Ear training dictation practice.",
      type: "practice",
      difficulty: "easy",
      dueDate: daysFromNow(7),
      order: 1,
    },
    {
      courseId: course2.id,
      titleFa: "آزمون میان‌ترم تئوری موسیقی",
      titleEn: "Music Theory Midterm Exam",
      descriptionFa: "آزمون میان‌ترم شامل تئوری پایه، فواصل، گام‌ها و آکوردها. مدت آزمون: ۴۵ دقیقه.",
      descriptionEn: "Midterm exam covering basic theory, intervals, scales, and chords. Duration: 45 minutes.",
      type: "exam",
      difficulty: "medium",
      dueDate: daysFromNow(10),
      order: 2,
    },
    {
      courseId: course3.id,
      titleFa: "تمرین آکورد های گیتار: ماژور و مینور",
      titleEn: "Guitar Chord Practice: Major and Minor",
      descriptionFa: "تمرین انتقال بین آکوردهای ماژور و مینور. تمرکز بر صدای تمیز و سرعت انتقال.",
      descriptionEn: "Practice transitioning between major and minor chords. Focus on clean sound and transition speed.",
      type: "practice",
      difficulty: "easy",
      dueDate: daysFromNow(4),
      order: 1,
    },
    {
      courseId: course3.id,
      titleFa: "تکلیف بداهه‌نوازی بلوز",
      titleEn: "Blues Improvisation Assignment",
      descriptionFa: "بداهه‌نوازی بر اساس پنتاتونیک بلوز در کلید E. ضبط ویدئو و ارسال.",
      descriptionEn: "Improvisation based on E minor pentatonic blues scale. Record video and submit.",
      type: "assignment",
      difficulty: "hard",
      dueDate: daysFromNow(8),
      order: 2,
    },
  ];

  const createdExercises = [];
  for (const exData of exerciseData) {
    const exercise = await prisma.exercise.create({
      data: {
        ...exData,
        isPublished: true,
      },
    });
    createdExercises.push(exercise);
  }
  console.log("✅ Exercises created:", createdExercises.length);

  // ============================================
  // Exercise Submissions (2-3 for demo student)
  // ============================================
  // Submit for exercise 1 (practiced, graded)
  if (createdExercises[0]) {
    await prisma.studentExercise.upsert({
      where: {
        studentId_exerciseId: { studentId, exerciseId: createdExercises[0].id },
      },
      update: {},
      create: {
        studentId,
        exerciseId: createdExercises[0].id,
        feedback: "خوب بود! روی انتقال به گوشه دلکش بیشتر کار کنید.",
        grade: 78,
        status: "graded",
        submittedAt: daysFromNow(-2),
        gradedAt: daysFromNow(-1),
      },
    });
  }

  // Submit for exercise 3 (submitted, not yet reviewed)
  if (createdExercises[2]) {
    await prisma.studentExercise.upsert({
      where: {
        studentId_exerciseId: { studentId, exerciseId: createdExercises[2].id },
      },
      update: {},
      create: {
        studentId,
        exerciseId: createdExercises[2].id,
        status: "submitted",
        submittedAt: new Date(),
      },
    });
  }

  // Submit for exercise 5 (submitted, returned with feedback)
  if (createdExercises[4]) {
    await prisma.studentExercise.upsert({
      where: {
        studentId_exerciseId: { studentId, exerciseId: createdExercises[4].id },
      },
      update: {},
      create: {
        studentId,
        exerciseId: createdExercises[4].id,
        feedback: "انتقالت خوب پیش میره. تمرین بیشتر روی Am -> Dm.",
        grade: 70,
        status: "returned",
        submittedAt: daysFromNow(-5),
        gradedAt: daysFromNow(-3),
      },
    });
  }
  console.log("✅ Exercise submissions created: 3");

  // ============================================
  // Class Schedules (8-10 for the next month)
  // ============================================
  const scheduleData = [
    {
      courseId: course1.id,
      titleFa: "کلاس پیانو - هفته هشتم",
      titleEn: "Piano Class - Week 8",
      date: daysFromNow(1),
      duration: 90,
      location: "اتاق ۲۰۱ - شعبه بلوار معلم",
      type: "regular",
    },
    {
      courseId: course2.id,
      titleFa: "کلاس تئوری و سلفژ - هفته ششم",
      titleEn: "Theory & Solfege Class - Week 6",
      date: daysFromNow(2),
      duration: 60,
      location: "سالن سبز - شعبه بلوار معلم",
      type: "regular",
    },
    {
      courseId: course3.id,
      titleFa: "کلاس گیتار - هفته چهارم",
      titleEn: "Guitar Class - Week 4",
      date: daysFromNow(3),
      duration: 60,
      location: "اتاق ۳۰۵ - شعبه غرب",
      type: "regular",
    },
    {
      courseId: course1.id,
      titleFa: "جبرانی پیانو - درس اضافی",
      titleEn: "Piano Makeup - Extra Lesson",
      date: daysFromNow(5),
      duration: 60,
      location: "اتاق ۲۰۱ - شعبه بلوار معلم",
      type: "makeup",
    },
    {
      courseId: course2.id,
      titleFa: "آزمون میان‌ترم تئوری موسیقی",
      titleEn: "Music Theory Midterm Exam",
      date: daysFromNow(8),
      duration: 90,
      location: "سالن اصلی - شعبه بلوار معلم",
      type: "exam",
    },
    {
      courseId: course1.id,
      titleFa: "کلاس پیانو - هفته نهم",
      titleEn: "Piano Class - Week 9",
      date: daysFromNow(8),
      duration: 90,
      location: "اتاق ۲۰۱ - شعبه بلوار معلم",
      type: "regular",
    },
    {
      courseId: course3.id,
      titleFa: "کلاس گیتار - هفته پنجم",
      titleEn: "Guitar Class - Week 5",
      date: daysFromNow(10),
      duration: 60,
      location: "اتاق ۳۰۵ - شعبه غرب",
      type: "regular",
    },
    {
      courseId: course1.id,
      titleFa: "تمرین جمعی - آماده‌سازی رسیتال",
      titleEn: "Group Rehearsal - Recital Prep",
      date: daysFromNow(14),
      duration: 120,
      location: "سالن اصلی - شعبه بلوار معلم",
      type: "rehearsal",
      notes: "لطفا قطعه خود را از قبل تمرین کنید",
    },
    {
      courseId: course4?.id || null,
      titleFa: "کلاس آواز - هفته دوم",
      titleEn: "Vocal Class - Week 2",
      date: daysFromNow(6),
      duration: 60,
      location: "اتاق ۱۰۲ - شعبه بلوار معلم",
      type: "regular",
    },
    {
      courseId: null,
      workshopId: workshopsForTickets[0]?.id || null,
      titleFa: "کارگاه ویژه - اجرای زنده",
      titleEn: "Special Workshop - Live Performance",
      date: daysFromNow(20),
      duration: 180,
      location: "سالن اصلی - شعبه بلوار معلم",
      type: "concert",
      notes: "حضور برای تمامی هنرجویان آزاد است",
    },
  ];

  for (const sched of scheduleData) {
    // Skip if no valid course or workshop reference
    if (!sched.courseId && !sched.workshopId) continue;

    await prisma.classSchedule.create({
      data: {
        courseId: sched.courseId,
        workshopId: sched.workshopId,
        titleFa: sched.titleFa,
        titleEn: sched.titleEn,
        date: sched.date,
        duration: sched.duration,
        location: sched.location,
        type: sched.type,
        notes: sched.notes || null,
      },
    });
  }
  console.log("✅ Class schedules created:", scheduleData.filter((s) => s.courseId || s.workshopId).length);

  console.log("\n🎉 Student learning seed complete!");
  console.log("\n📋 Demo student account:");
  console.log("  Email: student@mab.ir");
  console.log("  Password: 123456");
  console.log("\n📊 Enrollments:", [enrollment1, enrollment2, enrollment3, enrollment4].filter(Boolean).length, "courses");
  console.log("🎫 Workshop tickets:", workshopsForTickets.length);
  console.log("📝 Exercises:", createdExercises.length);
  console.log("📅 Schedules:", scheduleData.filter((s) => s.courseId || s.workshopId).length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
