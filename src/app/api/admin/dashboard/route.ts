import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyAdmin } from "@/lib/auth/session";

// GET /api/admin/dashboard - Super Admin Dashboard Data
export async function GET(request: NextRequest) {
  const auth = await requireAnyAdmin(request);
  if (!auth.ok) return auth.response;
  const session = auth.session;

  try {
    // Core metrics - safe queries that won't fail if tables are empty
    const [
      totalUsers,
      totalStudents,
      totalInstructors,
      totalAdmins,
      totalCourses,
      totalWorkshops,
      totalEnrollments,
      totalTickets,
      totalBlogPosts,
      totalAnnouncements,
      recentAuditLogs,
      activeSessions,
      recentRegistrations,
    ] = await Promise.all([
      db.student.count(),
      db.student.count({ where: { role: "student" } }),
      db.student.count({ where: { role: "instructor" } }),
      db.admin.count(),
      db.course.count({ where: { isPublished: true } }),
      db.workshop.count({ where: { isPublished: true } }),
      db.courseEnrollment.count().catch(() => 0),
      db.workshopTicket.count().catch(() => 0),
      db.blogPost.count({ where: { isPublished: true } }),
      db.announcement.count({ where: { isPublished: true } }),
      db.auditLog.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
        include: {
          admin: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
      db.loginSession.findMany({
        where: { isActive: true },
        take: 50,
        orderBy: { loginAt: "desc" },
        include: {
          admin: { select: { name: true, email: true, role: true } },
          student: { select: { name: true, email: true, role: true } },
        },
      }),
      db.student.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
          referralSource: true,
          primaryInstrument: true,
          registrationInstrument: true,
          _count: { select: { enrollments: true, tickets: true } },
        },
      }),
    ]);

    // Distributions - wrap in try/catch for safety
    let instrumentDistribution: Array<{ primaryInstrument: string | null; _count: number }> = [];
    let referralDistribution: Array<{ referralSource: string | null; _count: number }> = [];
    let genderDistribution: Array<{ gender: string | null; _count: number }> = [];
    let enrollmentStats: Array<{ status: string; _count: number }> = [];
    let dailyLogins: Array<{ userType: string; _count: number }> = [];
    let upcomingWorkshops: Array<{
      id: string; titleFa: string; titleEn: string; date: Date;
      totalSeats: number; reservedSeats: number; category: string | null; isHot: boolean;
      startTime: string | null; endTime: string | null; locationFa: string | null; locationEn: string | null;
    }> = [];

    try {
      instrumentDistribution = await db.student.groupBy({
        by: ["primaryInstrument"],
        _count: true,
        where: { primaryInstrument: { not: null } },
      } as any);
    } catch {}

    try {
      referralDistribution = await db.student.groupBy({
        by: ["referralSource"],
        _count: true,
        where: { referralSource: { not: null } },
      } as any);
    } catch {}

    try {
      genderDistribution = await db.student.groupBy({
        by: ["gender"],
        _count: true,
        where: { gender: { not: null } },
      } as any);
    } catch {}

    try {
      enrollmentStats = await db.courseEnrollment.groupBy({
        by: ["status"],
        _count: true,
      } as any);
    } catch {}

    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      dailyLogins = await db.loginSession.groupBy({
        by: ["userType"],
        _count: true,
        where: { loginAt: { gte: sevenDaysAgo } },
      } as any);
    } catch {}

    try {
      upcomingWorkshops = await db.workshop.findMany({
        where: { date: { gte: new Date() }, isPublished: true },
        take: 5,
        orderBy: { date: "asc" },
        select: {
          id: true, titleFa: true, titleEn: true, date: true,
          totalSeats: true, reservedSeats: true, category: true, isHot: true,
          startTime: true, endTime: true, locationFa: true, locationEn: true,
        },
      });
    } catch {}

    let unreadAdminMessages = 0;
    try {
      unreadAdminMessages = await db.adminMessage.count({
        where: { recipientId: session.userId, status: { in: ["sent", "delivered"] } },
      });
    } catch {}

    let unreadContactMessages = 0;
    try {
      unreadContactMessages = await db.contactMessage.count({ where: { isRead: false } });
    } catch {}

    let pendingTestimonials = 0;
    try {
      pendingTestimonials = await db.testimonial.count({ where: { status: "pending" } });
    } catch {}

    // Recent registrations stats - high priority for admin visibility
    let recentRegistrations24h = 0;
    let recentEnrollments24h = 0;
    let unpaidEnrollments = 0;
    let recentEnrollmentsList: Array<{
      id: string; status: string; enrolledAt: Date; registrationMethod: string; paymentStatus: string;
      tuitionAmount: number | null;
      student: { id: string; name: string; phone: string | null; email: string };
      course: { id: string; titleFa: string; titleEn: string; instrument: string | null };
    }> = [];

    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      recentRegistrations24h = await db.student.count({
        where: { createdAt: { gte: twentyFourHoursAgo } },
      });
    } catch {}

    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      recentEnrollments24h = await db.courseEnrollment.count({
        where: { enrolledAt: { gte: twentyFourHoursAgo } },
      });
    } catch {}

    try {
      unpaidEnrollments = await db.courseEnrollment.count({
        where: { paymentStatus: "unpaid" },
      });
    } catch {}

    try {
      recentEnrollmentsList = await db.courseEnrollment.findMany({
        take: 10,
        orderBy: { enrolledAt: "desc" },
        select: {
          id: true,
          status: true,
          enrolledAt: true,
          registrationMethod: true,
          paymentStatus: true,
          tuitionAmount: true,
          student: {
            select: { id: true, name: true, phone: true, email: true },
          },
          course: {
            select: { id: true, titleFa: true, titleEn: true, instrument: true },
          },
        },
      });
    } catch {}

    // ─── NEW: Revenue data (monthly, last 12 months) ───
    let monthlyRevenue: Array<{ month: string; revenue: number; count: number }> = [];
    try {
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
      twelveMonthsAgo.setDate(1);
      twelveMonthsAgo.setHours(0, 0, 0, 0);

      const paidEnrollments = await db.courseEnrollment.findMany({
        where: {
          paymentStatus: "paid",
          paidAt: { gte: twelveMonthsAgo },
        },
        select: {
          paidAt: true,
          tuitionAmount: true,
        },
      });

      // Group by month
      const monthMap = new Map<string, { revenue: number; count: number }>();
      for (const e of paidEnrollments) {
        if (!e.paidAt || !e.tuitionAmount) continue;
        const d = new Date(e.paidAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const existing = monthMap.get(key) || { revenue: 0, count: 0 };
        existing.revenue += e.tuitionAmount;
        existing.count += 1;
        monthMap.set(key, existing);
      }

      // Fill in all 12 months
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const data = monthMap.get(key) || { revenue: 0, count: 0 };
        monthlyRevenue.push({ month: key, revenue: data.revenue, count: data.count });
      }
    } catch {}

    // ─── NEW: Monthly enrollment counts (last 12 months) ───
    let monthlyEnrollments: Array<{ month: string; count: number }> = [];
    try {
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
      twelveMonthsAgo.setDate(1);
      twelveMonthsAgo.setHours(0, 0, 0, 0);

      const enrollments = await db.courseEnrollment.findMany({
        where: {
          enrolledAt: { gte: twelveMonthsAgo },
        },
        select: {
          enrolledAt: true,
        },
      });

      const monthMap = new Map<string, number>();
      for (const e of enrollments) {
        const d = new Date(e.enrolledAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthMap.set(key, (monthMap.get(key) || 0) + 1);
      }

      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthlyEnrollments.push({ month: key, count: monthMap.get(key) || 0 });
      }
    } catch {}

    // ─── NEW: Total paid revenue ───
    let totalRevenue = 0;
    let activeEnrollments = 0;
    try {
      const revenueResult = await db.courseEnrollment.aggregate({
        _sum: { tuitionAmount: true },
        where: { paymentStatus: "paid" },
      });
      totalRevenue = revenueResult._sum.tuitionAmount || 0;
    } catch {}

    try {
      activeEnrollments = await db.courseEnrollment.count({
        where: { status: "active" },
      });
    } catch {}

    // ─── NEW: System health data ───
    let failedLoginAttempts = 0;
    let lockedAdmins = 0;
    let dbStatus = "ok";
    try {
      failedLoginAttempts = await db.admin.count({
        where: { failedLoginAttempts: { gt: 0 } },
      });
    } catch { dbStatus = "error"; }

    try {
      lockedAdmins = await db.admin.count({
        where: { lockedUntil: { gt: new Date() } },
      });
    } catch {}

    // ─── NEW: Last backup timestamp ───
    let lastBackup: string | null = null;
    try {
      const latestBackup = await db.backupRecord.findFirst({
        where: { status: "completed" },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });
      if (latestBackup) lastBackup = latestBackup.createdAt.toISOString();
    } catch {}

    // ─── NEW: Recent failed logins (7 days) ───
    let recentFailedLogins = 0;
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      recentFailedLogins = await db.intrusionAlert.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      });
    } catch {}

    // ─── NEW: Workshop tickets revenue ───
    let workshopRevenue = 0;
    try {
      const workshopTicketRevenue = await db.workshopTicket.aggregate({
        _sum: { amount: true },
        where: { status: { in: ["paid", "attended"] } },
      });
      workshopRevenue = workshopTicketRevenue._sum.amount || 0;
    } catch {}

    return NextResponse.json({
      metrics: {
        totalUsers,
        totalStudents,
        totalInstructors,
        totalAdmins,
        totalCourses,
        totalWorkshops,
        totalEnrollments: typeof totalEnrollments === 'number' ? totalEnrollments : 0,
        totalTickets: typeof totalTickets === 'number' ? totalTickets : 0,
        totalBlogPosts,
        totalAnnouncements,
        unreadContactMessages,
        unreadAdminMessages,
        pendingTestimonials,
        recentRegistrations24h,
        recentEnrollments24h,
        unpaidEnrollments,
        totalRevenue,
        activeEnrollments,
        workshopRevenue,
      },
      distributions: {
        instruments: instrumentDistribution,
        referrals: referralDistribution,
        genders: genderDistribution,
        enrollmentStatus: enrollmentStats,
        dailyLogins,
      },
      recentAuditLogs,
      activeSessions,
      recentRegistrations,
      upcomingWorkshops,
      recentEnrollmentsList,
      monthlyRevenue,
      monthlyEnrollments,
      systemHealth: {
        dbStatus,
        activeSessionsCount: activeSessions.length,
        failedLoginAttempts,
        lockedAdmins,
        recentFailedLogins,
        lastBackup,
      },
    });
  } catch (error) {
    console.error("[ADMIN_DASHBOARD]", error);
    return NextResponse.json(
      { error: "Failed to load dashboard" },
      { status: 500 }
    );
  }
}
