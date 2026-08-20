import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import {
  createSessionToken, setSessionCookieOnResponse, getClientIp, getUserAgent,
  parseUserAgent, checkRateLimit, detectSuspiciousActivity
} from "@/lib/auth/session";

// POST /api/admin/auth/login - Admin-only login with security features
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const ua = getUserAgent(request);

  try {
    const body = await request.json();
    const { email, password, deviceFingerprint } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "ایمیل و رمز عبور الزامی است" },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.trim().toLowerCase();

    const rateLimit = checkRateLimit(`admin-login:${ip}:${sanitizedEmail}`, 5, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      await db.intrusionAlert.create({
        data: {
          attemptType: "rate_limit",
          ipAddress: ip,
          userAgent: ua,
          details: JSON.stringify({ reason: "Rate limit exceeded on admin login", email: sanitizedEmail }),
        },
      }).catch(() => {});

      return NextResponse.json(
        { error: "تعداد تلاش‌های ورود بیش از حد مجاز است. لطفاً بعداً تلاش کنید.", retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000) },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
      );
    }

    const admin = await db.admin.findUnique({
      where: { email: sanitizedEmail },
      include: { devices: true },
    });

    if (!admin) {
      const suspicious = detectSuspiciousActivity(ip, ua);
      if (suspicious.suspicious) {
        await db.intrusionAlert.create({
          data: {
            attemptType: "credential_stuffing",
            ipAddress: ip,
            userAgent: ua,
            details: JSON.stringify({ reasons: suspicious.reasons, email: sanitizedEmail }),
          },
        }).catch(() => {});
      }

      return NextResponse.json(
        { error: "ایمیل یا رمز عبور اشتباه است" },
        { status: 401 }
      );
    }

    // Check if account is locked
    if (admin.lockedUntil && new Date(admin.lockedUntil) > new Date()) {
      await db.intrusionAlert.create({
        data: {
          targetAdminId: admin.id,
          attemptType: "brute_force",
          ipAddress: ip,
          userAgent: ua,
          details: JSON.stringify({ reason: "Attempt on locked account" }),
        },
      }).catch(() => {});

      const remainingMinutes = Math.ceil((new Date(admin.lockedUntil).getTime() - Date.now()) / 60000);
      return NextResponse.json(
        { error: `حساب کاربری قفل شده است. لطفاً ${remainingMinutes} دقیقه دیگر تلاش کنید.` },
        { status: 423 }
      );
    }

    if (!admin.isActive) {
      return NextResponse.json(
        { error: "حساب کاربری غیرفعال شده است" },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(password, admin.password);
    if (!isValid) {
      const newFailedCount = admin.failedLoginAttempts + 1;
      const lockDuration = 30 * 60 * 1000;
      const shouldLock = newFailedCount >= 5;

      await db.admin.update({
        where: { id: admin.id },
        data: {
          failedLoginAttempts: newFailedCount,
          lockedUntil: shouldLock ? new Date(Date.now() + lockDuration) : null,
        },
      });

      if (newFailedCount >= 3) {
        await db.intrusionAlert.create({
          data: {
            targetAdminId: admin.id,
            attemptType: newFailedCount >= 5 ? "brute_force" : "suspicious_ip",
            ipAddress: ip,
            userAgent: ua,
            attemptCount: newFailedCount,
            details: JSON.stringify({
              failedAttempts: newFailedCount,
              locked: shouldLock,
              email: sanitizedEmail,
            }),
          },
        }).catch(() => {});
      }

      return NextResponse.json(
        { error: "ایمیل یا رمز عبور اشتباه است" },
        { status: 401 }
      );
    }

    // ─── SUCCESSFUL LOGIN ────────────────────────────────
    const parsed = parseUserAgent(ua);

    let isKnownDevice = true;
    if (deviceFingerprint) {
      const knownDevice = admin.devices.find(
        (d) => d.deviceFingerprint === deviceFingerprint && d.isApproved
      );
      if (!knownDevice && admin.devices.length > 0) {
        isKnownDevice = false;
        await db.intrusionAlert.create({
          data: {
            targetAdminId: admin.id,
            attemptType: "unknown_device",
            ipAddress: ip,
            userAgent: ua,
            deviceFingerprint,
            details: JSON.stringify({
              reason: "Login from unknown device",
              browser: parsed.browser,
              os: parsed.os,
              deviceType: parsed.deviceType,
            }),
          },
        }).catch(() => {});
      }

      await db.adminDevice.upsert({
        where: {
          id: admin.devices.find(d => d.deviceFingerprint === deviceFingerprint)?.id || "nonexistent",
        },
        create: {
          adminId: admin.id,
          deviceName: `${parsed.browser} on ${parsed.os}`,
          deviceType: parsed.deviceType,
          browser: parsed.browser,
          os: parsed.os,
          deviceFingerprint,
          ipAddress: ip,
          isApproved: isKnownDevice,
          lastUsedAt: new Date(),
        },
        update: {
          ipAddress: ip,
          lastUsedAt: new Date(),
        },
      }).catch(() => {});
    }

    const sessionToken = createSessionToken(admin.id, admin.role, "admin");

    await db.loginSession.create({
      data: {
        adminId: admin.id,
        userType: "admin",
        sessionToken,
        ipAddress: ip,
        userAgent: ua,
        deviceType: parsed.deviceType,
        browser: parsed.browser,
        os: parsed.os,
        deviceFingerprint: deviceFingerprint || null,
        isActive: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await db.admin.update({
      where: { id: admin.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ip,
      },
    });

    await db.auditLog.create({
      data: {
        adminId: admin.id,
        action: "login",
        entity: "admin",
        entityId: admin.id,
        entityName: admin.name,
        ipAddress: ip,
        userAgent: ua,
        severity: "info",
        details: JSON.stringify({
          deviceType: parsed.deviceType,
          browser: parsed.browser,
          os: parsed.os,
          isKnownDevice,
        }),
      },
    });

    // Use response-based cookie setting for proper browser handling
    const response = NextResponse.json(
      {
        user: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          phone: admin.phone,
          role: admin.role,
          userType: "admin",
          avatarUrl: admin.avatarUrl,
          mustChangePassword: admin.mustChangePassword,
          twoFactorEnabled: admin.twoFactorEnabled,
          isKnownDevice,
        },
        sessionToken, // Also return token for client-side header-based auth fallback
      },
      { status: 200 }
    );

    return setSessionCookieOnResponse(response, sessionToken);
  } catch (error) {
    console.error("[ADMIN_AUTH_LOGIN]", error);
    return NextResponse.json(
      { error: "خطا در ورود به سیستم" },
      { status: 500 }
    );
  }
}
