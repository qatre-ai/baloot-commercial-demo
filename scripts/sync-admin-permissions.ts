import { PrismaClient } from "@prisma/client";
import { permissionsForRole } from "../src/lib/auth/permissions";

const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.admin.findMany({
    where: { isActive: true },
    select: { id: true, email: true, role: true },
  });

  for (const admin of admins) {
    const permissions = permissionsForRole(admin.role);

    await prisma.$transaction(async (tx) => {
      await tx.adminPermission.deleteMany({ where: { adminId: admin.id } });
      for (const permission of permissions) {
        await tx.adminPermission.create({
          data: {
            adminId: admin.id,
            resource: permission.resource,
            action: permission.action,
            granted: true,
            grantedBy: admin.role === "super_admin" ? admin.id : null,
          },
        });
      }
    });

    console.log(`${admin.email}: ${permissions.length} permissions`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
