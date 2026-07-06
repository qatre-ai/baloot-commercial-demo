import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";

// --- Helpers ---

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function determineSource(referrer: string | undefined | null, explicitSource?: string): string {
  if (explicitSource) return explicitSource;
  if (!referrer) return "direct";

  const lower = referrer.toLowerCase();
  if (/google|bing|yahoo/.test(lower)) return "search";
  if (/instagram|telegram|whatsapp|twitter|x\.com|facebook|linkedin/.test(lower)) return "social";
  if (/^https?:\/\//i.test(lower)) return "referral";
  return "direct";
}

function getSourceField(source: string): string {
  switch (source) {
    case "search":
      return "sourceSearch";
    case "social":
      return "sourceSocial";
    case "referral":
      return "sourceReferral";
    default:
      return "sourceDirect";
  }
}

function getDeviceField(deviceType: string): string {
  switch (deviceType) {
    case "mobile":
      return "deviceMobile";
    case "tablet":
      return "deviceTablet";
    default:
      return "deviceDesktop";
  }
}

function parseRange(range: string): number {
  switch (range) {
    case "90d":
      return 90;
    case "30d":
      return 30;
    default:
      return 7;
  }
}

// POST /api/blog/analytics — Track a blog view
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      postId,
      readProgress = 0,
      timeOnPage = 0,
      referrer,
      source: explicitSource,
      deviceType = "desktop",
      sessionId,
    } = body;

    if (!postId) {
      return NextResponse.json(
        { error: "postId is required" },
        { status: 400 }
      );
    }

    // Verify the blog post exists
    const postExists = await db.blogPost.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!postExists) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    const source = determineSource(referrer, explicitSource);
    const today = getTodayDateString();
    const sourceField = getSourceField(source);
    const deviceField = getDeviceField(deviceType);

    // Determine if this is a unique view (by sessionId)
    let isUnique = false;
    if (sessionId) {
      const existingView = await db.blogViewLog.findFirst({
        where: { postId, sessionId },
        select: { id: true },
      });
      isUnique = !existingView;
    } else {
      // No session ID means we cannot determine uniqueness, count as unique
      isUnique = true;
    }

    // Build the daily analytics increment object
    const dailyIncrement: Record<string, number> = {
      views: 1,
    };

    if (isUnique) {
      dailyIncrement.uniqueViews = 1;
    }

    dailyIncrement[sourceField] = 1;
    dailyIncrement[deviceField] = 1;

    // Execute parallel operations: increment viewCount on BlogPost, upsert daily analytics, create view log
    const [_, __, viewLog] = await Promise.all([
      // 1. Increment BlogPost.viewCount (and uniqueViewCount if unique)
      db.blogPost.update({
        where: { id: postId },
        data: {
          viewCount: { increment: 1 },
          ...(isUnique ? { uniqueViewCount: { increment: 1 } } : {}),
        },
      }),

      // 2. Upsert daily analytics for today
      db.blogPostDailyAnalytics.upsert({
        where: {
          postId_date: { postId, date: today },
        },
        create: {
          postId,
          date: today,
          views: 1,
          uniqueViews: isUnique ? 1 : 0,
          [sourceField]: 1,
          [deviceField]: 1,
        },
        update: {
          views: { increment: 1 },
          ...(isUnique ? { uniqueViews: { increment: 1 } } : {}),
          [sourceField]: { increment: 1 },
          [deviceField]: { increment: 1 },
        },
      }),

      // 3. Create the view log entry
      db.blogViewLog.create({
        data: {
          postId,
          readProgress: parseFloat(String(readProgress)) || 0,
          timeOnPage: parseInt(String(timeOnPage), 10) || 0,
          referrer: referrer ?? null,
          source,
          deviceType,
          sessionId: sessionId ?? null,
        },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        viewId: viewLog.id,
        source,
        isUnique,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[BLOG_ANALYTICS_POST]", error);
    return NextResponse.json(
      { error: "Failed to track blog view" },
      { status: 500 }
    );
  }
}

// GET /api/blog/analytics — Get analytics summary (admin only)
// Query params: ?postId=id&range=7d|30d|90d
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.userType !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const postId = searchParams.get("postId") || undefined;
    const rangeParam = searchParams.get("range") || "7d";
    const days = parseRange(rangeParam);

    // Calculate the start date for the range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`;

    // Build where clause for daily analytics
    const analyticsWhere: Record<string, unknown> = {
      date: { gte: startDateStr },
    };
    if (postId) {
      analyticsWhere.postId = postId;
    }

    // Build where clause for view logs
    const viewLogWhere: Record<string, unknown> = {
      viewedAt: { gte: startDate },
    };
    if (postId) {
      viewLogWhere.postId = postId;
    }

    // Fetch daily analytics and view logs in parallel
    const [dailyAnalytics, viewLogs] = await Promise.all([
      db.blogPostDailyAnalytics.findMany({
        where: analyticsWhere,
        orderBy: { date: "asc" },
      }),
      db.blogViewLog.findMany({
        where: viewLogWhere,
        select: {
          readProgress: true,
          timeOnPage: true,
          sessionId: true,
          source: true,
          deviceType: true,
        },
      }),
    ]);

    // Aggregate from daily analytics
    let totalViews = 0;
    let uniqueViews = 0;
    let totalShares = 0;
    let totalLikes = 0;
    let totalSourceDirect = 0;
    let totalSourceSearch = 0;
    let totalSourceSocial = 0;
    let totalSourceReferral = 0;
    let totalDeviceDesktop = 0;
    let totalDeviceMobile = 0;
    let totalDeviceTablet = 0;

    const viewsByDay: Array<{ date: string; views: number; uniqueViews: number }> = [];

    for (const day of dailyAnalytics) {
      totalViews += day.views;
      uniqueViews += day.uniqueViews;
      totalShares += day.shares;
      totalLikes += day.likes;
      totalSourceDirect += day.sourceDirect;
      totalSourceSearch += day.sourceSearch;
      totalSourceSocial += day.sourceSocial;
      totalSourceReferral += day.sourceReferral;
      totalDeviceDesktop += day.deviceDesktop;
      totalDeviceMobile += day.deviceMobile;
      totalDeviceTablet += day.deviceTablet;

      viewsByDay.push({
        date: day.date,
        views: day.views,
        uniqueViews: day.uniqueViews,
      });
    }

    // Aggregate from view logs for read time/progress and bounce rate
    let totalReadTime = 0;
    let totalReadProgress = 0;
    let bounceCount = 0;
    let readTimeCount = 0;

    // Track unique sessions for accurate unique views from logs
    const seenSessions = new Set<string>();

    for (const log of viewLogs) {
      totalReadTime += log.timeOnPage;
      totalReadProgress += log.readProgress;
      readTimeCount++;

      // A "bounce" is defined as time on page < 10 seconds or read progress < 10%
      if (log.timeOnPage < 10 || log.readProgress < 10) {
        bounceCount++;
      }

      if (log.sessionId) {
        seenSessions.add(log.sessionId);
      }
    }

    const avgReadTime = readTimeCount > 0 ? Math.round(totalReadTime / readTimeCount) : 0;
    const avgReadProgress = readTimeCount > 0 ? Math.round((totalReadProgress / readTimeCount) * 100) / 100 : 0;
    const bounceRate = readTimeCount > 0 ? Math.round((bounceCount / readTimeCount) * 10000) / 100 : 0;

    // If no postId, also get overall blog post stats
    let overallStats: { totalPublishedPosts: number; totalAllViews: number; overallAvgReadTime: number } | null = null;
    if (!postId) {
      try {
        const postStats = await db.blogPost.aggregate({
          _sum: {
            viewCount: true,
          },
          _avg: {
            readingTime: true,
          },
          where: {
            isPublished: true,
          },
        });

        overallStats = {
          totalPublishedPosts: await db.blogPost.count({ where: { isPublished: true } }),
          totalAllViews: postStats._sum.viewCount ?? 0,
          overallAvgReadTime: postStats._avg.readingTime ?? 0,
        };
      } catch {
        // If aggregate fails, provide basic stats
        overallStats = {
          totalPublishedPosts: await db.blogPost.count({ where: { isPublished: true } }),
          totalAllViews: 0,
          overallAvgReadTime: 0,
        };
      }
    }

    // Build source breakdown
    const sourceBreakdown = {
      direct: totalSourceDirect,
      search: totalSourceSearch,
      social: totalSourceSocial,
      referral: totalSourceReferral,
    };

    // Build device breakdown
    const deviceBreakdown = {
      desktop: totalDeviceDesktop,
      mobile: totalDeviceMobile,
      tablet: totalDeviceTablet,
    };

    const result: Record<string, unknown> = {
      totalViews,
      uniqueViews,
      avgReadTime,
      avgReadProgress,
      bounceRate,
      shares: totalShares,
      likes: totalLikes,
      viewsByDay,
      sourceBreakdown,
      deviceBreakdown,
      range: rangeParam,
      days,
    };

    if (overallStats) {
      result.overallStats = overallStats;
    }

    if (postId) {
      result.postId = postId;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[BLOG_ANALYTICS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
