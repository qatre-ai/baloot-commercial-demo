import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth/password";

async function main() {
  const newHash = await hashPassword("SuperAdmin@2025");
  await db.admin.update({
    where: { email: "superadmin@mab.ir" },
    data: { 
      password: newHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
      mustChangePassword: false
    }
  });
  console.log("✓ Super admin password reset to 'SuperAdmin@2025'");
  
  // Verify
  const admin = await db.admin.findUnique({ where: { email: "superadmin@mab.ir" } });
  const verifyHash = await hashPassword("SuperAdmin@2025");
  console.log(`  Password match after reset: ${admin?.password === verifyHash}`);
  
  await db.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
