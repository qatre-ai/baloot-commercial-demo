import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";

// GET /api/admin/analytics - SEO & Activity analytics for Super Admin
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, "analytics", "read");
  if (!auth.ok) return auth.response;

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Registration trends (last 30 days, grouped by day)
    const registrations = await db.student.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, primaryInstrument: true, referralSource: true },
      orderBy: { createdAt: "asc" },
    });

    // Group by day
    const regByDay: Record<string, number> = {};
    registrations.forEach(r => {
      const day = r.createdAt.toISOString().split("T")[0];
      regByDay[day] = (regByDay[day] || 0) + 1;
    });

    // Login activity (last 7 days)
    const loginActivity = await db.loginSession.findMany({
      where: { loginAt: { gte: sevenDaysAgo } },
      select: { loginAt: true, userType: true, deviceType: true, browser: true, os: true, ipAddress: true },
      orderBy: { loginAt: "desc" },
    });

    // Group logins by day
    const loginsByDay: Record<string, { admin: number; student: number }> = {};
    loginActivity.forEach(l => {
      const day = l.loginAt.toISOString().split("T")[0];
      if (!loginsByDay[day]) loginsByDay[day] = { admin: 0, student: 0 };
      if (l.userType === "admin") loginsByDay[day].admin++;
      else loginsByDay[day].student++;
    });

    // Device/Browser distribution
    const deviceDistribution: Record<string, number> = {};
    const browserDistribution: Record<string, number> = {};
    loginActivity.forEach(l => {
      const device = l.deviceType || "unknown";
      const browser = l.browser || "unknown";
      deviceDistribution[device] = (deviceDistribution[device] || 0) + 1;
      browserDistribution[browser] = (browserDistribution[browser] || 0) + 1;
    });

    // Unique IPs in last 24h
    const uniqueIPs24h = new Set(
      loginActivity
        .filter(l => l.loginAt >= twentyFourHoursAgo)
        .map(l => l.ipAddress)
    ).size;

    // IP frequency analysis (detect suspicious repeated IPs)
    const ipFrequency: Record<string, number> = {};
    loginActivity.forEach(l => {
      if (l.ipAddress && l.ipAddress !== "unknown") {
        ipFrequency[l.ipAddress] = (ipFrequency[l.ipAddress] || 0) + 1;
      }
    });
    const suspiciousIPs = Object.entries(ipFrequency)
      .filter(([_, count]) => count > 10)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Content analytics
    const [blogViews, topBlogPosts, workshopOccupancy] = await Promise.all([
      // Total blog views
      db.blogPost.aggregate({
        _sum: { viewCount: true },
        where: { isPublished: true },
      }),

      // Top viewed blog posts
      db.blogPost.findMany({
        where: { isPublished: true },
        select: { id: true, titleFa: true, titleEn: true, viewCount: true, isFeatured: true },
        orderBy: { viewCount: "desc" },
        take: 10,
      }),

      // Workshop occupancy rates
      db.workshop.findMany({
        where: { isPublished: true, date: { gte: now } },
        select: {
          id: true, titleFa: true, titleEn: true,
          totalSeats: true, reservedSeats: true, date: true,
        },
        orderBy: { date: "asc" },
      }),
    ]);

    // Enrollment analytics
    const enrollmentTrends = await db.courseEnrollment.findMany({
      where: { enrolledAt: { gte: thirtyDaysAgo } },
      select: { enrolledAt: true, status: true },
      orderBy: { enrolledAt: "asc" },
    });

    const enrollByDay: Record<string, number> = {};
    enrollmentTrends.forEach(e => {
      const day = e.enrolledAt.toISOString().split("T")[0];
      enrollByDay[day] = (enrollByDay[day] || 0) + 1;
    });

    // Gender distribution
    const genderDistribution = await db.student.groupBy({
      by: ["gender"],
      _count: { gender: true },
      where: { gender: { not: null } },
    });

    // Age distribution (from dateOfBirth)
    const studentsWithDOB = await db.student.findMany({
      where: { dateOfBirth: { not: null } },
      select: { dateOfBirth: true },
    });
    const ageGroups: Record<string, number> = { "under_18": 0, "18_25": 0, "26_35": 0, "36_50": 0, "over_50": 0 };
    studentsWithDOB.forEach(s => {
      if (s.dateOfBirth) {
        const age = Math.floor((now.getTime() - new Date(s.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        if (age < 18) ageGroups.under_18++;
        else if (age <= 25) ageGroups["18_25"]++;
        else if (age <= 35) ageGroups["26_35"]++;
        else if (age <= 50) ageGroups["36_50"]++;
        else ageGroups.over_50++;
      }
    });

    // Referral source distribution
    const referralDistribution = await db.student.groupBy({
      by: ["referralSource"],
      _count: { referralSource: true },
      where: { referralSource: { not: null } },
    });

    return NextResponse.json({
      // Registration data
      registrations: {
        total: registrations.length,
        byDay: regByDay,
        byInstrument: registrations.reduce((acc, r) => {
          const inst = r.primaryInstrument || "unknown";
          acc[inst] = (acc[inst] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byReferral: registrations.reduce((acc, r) => {
          const ref = r.referralSource || "unknown";
          acc[ref] = (acc[ref] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },

      // Login analytics
      logins: {
        total7d: loginActivity.length,
        byDay: loginsByDay,
        uniqueIPs24h,
        suspiciousIPs,
      },

      // Device analytics
      devices: {
        types: deviceDistribution,
        browsers: browserDistribution,
      },

      // Demographics
      demographics: {
        genders: genderDistribution,
        ageGroups,
        referrals: referralDistribution,
      },

      // Content performance
      content: {
        totalBlogViews: blogViews._sum.viewCount || 0,
        topPosts: topBlogPosts,
        workshopOccupancy: workshopOccupancy.map(w => ({
          ...w,
          occupancyRate: Math.round((w.reservedSeats / w.totalSeats) * 100),
        })),
      },

      // Enrollment trends
      enrollments: {
        total30d: enrollmentTrends.length,
        byDay: enrollByDay,
      },
    });
  } catch (error) {
    console.error("[ANALYTICS_ERROR]", error);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
