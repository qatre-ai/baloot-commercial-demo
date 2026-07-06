import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth/password";

async function main() {
  const admins = await db.admin.findMany({
    select: { email: true, role: true, isActive: true, password: true, failedLoginAttempts: true, lockedUntil: true }
  });
  for (const a of admins) {
    console.log(`Email: ${a.email}`);
    console.log(`  Role: ${a.role}, Active: ${a.isActive}`);
    console.log(`  Failed attempts: ${a.failedLoginAttempts}, Locked until: ${a.lockedUntil}`);
    const testHash = await hashPassword("SuperAdmin@2025");
    console.log(`  Password match (SuperAdmin@2025): ${a.password === testHash}`);
    const testHash2 = await hashPassword("Admin@2025");
    console.log(`  Password match (Admin@2025): ${a.password === testHash2}`);
  }
  await db.admin.updateMany({ data: { failedLoginAttempts: 0, lockedUntil: null } });
  console.log("\n✓ Reset all admin lock states");
  await db.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
