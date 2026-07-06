import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";

async function seedAdmins() {
  console.log("🔐 Seeding Admin accounts...");

  // Super Admin - Mr. Mostafa Mogouei
  const superAdmin1Password = await hashPassword("SuperAdmin@2024");
  const superAdmin1 = await db.admin.upsert({
    where: { email: "mostafa@mab.ir" },
    update: {},
    create: {
      email: "mostafa@mab.ir",
      name: "مصطفی مگویی",
      password: superAdmin1Password,
      role: "super_admin",
      phone: "09121234567",
      isActive: true,
      mustChangePassword: false,
    },
  });
  console.log(`  ✅ Super Admin 1: ${superAdmin1.email}`);

  // Super Admin - Co-developer
  const superAdmin2Password = await hashPassword("DevAdmin@2024");
  const superAdmin2 = await db.admin.upsert({
    where: { email: "dev@mab.ir" },
    update: {},
    create: {
      email: "dev@mab.ir",
      name: "توسعه‌دهنده امنیت",
      password: superAdmin2Password,
      role: "super_admin",
      phone: "09129876543",
      isActive: true,
      mustChangePassword: false,
    },
  });
  console.log(`  ✅ Super Admin 2: ${superAdmin2.email}`);

  // Regular Admin - Demo
  const admin1Password = await hashPassword("Admin@2024");
  const admin1 = await db.admin.upsert({
    where: { email: "admin@mab.ir" },
    update: {},
    create: {
      email: "admin@mab.ir",
      name: "مدیر شعبه واحد",
      password: admin1Password,
      role: "admin",
      phone: "09121112233",
      isActive: true,
      mustChangePassword: false,
    },
  });
  console.log(`  ✅ Regular Admin: ${admin1.email}`);

  // Set permissions for regular admin
  const resources = ["students", "courses", "workshops", "blog", "announcements", "exercises", "schedules", "instructors", "branches", "media"];
  const actions = ["create", "read", "update", "delete"];

  for (const resource of resources) {
    for (const action of actions) {
      await db.adminPermission.upsert({
        where: {
          adminId_resource_action: {
            adminId: admin1.id,
            resource,
            action,
          },
        },
        update: {},
        create: {
          adminId: admin1.id,
          resource,
          action,
          granted: true,
          grantedBy: superAdmin1.id,
        },
      });
    }
  }
  console.log(`  ✅ Permissions set for ${admin1.email} (${resources.length * actions.length} permissions)`);

  // Create sample audit logs
  const sampleLogs = [
    { action: "login", entity: "admin", severity: "info", details: JSON.stringify({ success: true }) },
    { action: "create", entity: "student", severity: "info", details: JSON.stringify({ name: "Test Student" }) },
    { action: "update", entity: "course", severity: "info", details: JSON.stringify({ changes: ["title", "description"] }) },
    { action: "permission_change", entity: "admin", severity: "warning", details: JSON.stringify({ adminId: admin1.id, permissionsCount: 40 }) },
  ];

  for (const log of sampleLogs) {
    await db.auditLog.create({
      data: {
        adminId: superAdmin1.id,
        ...log,
        ipAddress: "127.0.0.1",
        userAgent: "Mozilla/5.0 Seed Script",
      },
    });
  }
  console.log(`  ✅ Sample audit logs created (${sampleLogs.length})`);

  // Create sample login sessions
  await db.loginSession.create({
    data: {
      adminId: superAdmin1.id,
      userType: "admin",
      ipAddress: "5.125.45.67",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120",
      deviceType: "desktop",
      browser: "Chrome",
      os: "Windows",
      isActive: false,
      loginAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      logoutAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3600000),
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  });

  await db.loginSession.create({
    data: {
      adminId: superAdmin2.id,
      userType: "admin",
      ipAddress: "78.39.201.55",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605",
      deviceType: "desktop",
      browser: "Safari",
      os: "macOS",
      isActive: true,
      loginAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  console.log("  ✅ Sample login sessions created");

  console.log("\n📋 Admin Accounts Summary:");
  console.log("═══════════════════════════════════════════");
  console.log("  🟣 Super Admin 1: mostafa@mab.ir / SuperAdmin@2024");
  console.log("  🟣 Super Admin 2: dev@mab.ir / DevAdmin@2024");
  console.log("  🟢 Regular Admin: admin@mab.ir / Admin@2024");
  console.log("═══════════════════════════════════════════\n");
}

seedAdmins()
  .catch(console.error)
  .finally(() => db.$disconnect());
