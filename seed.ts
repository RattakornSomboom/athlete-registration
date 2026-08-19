import "dotenv/config";
import { prisma } from "./lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  // สร้าง Admin Account
  const adminPassword = await bcrypt.hash("Admin@123", 10);
  await prisma.user.upsert({
    where: { email: "admin@up.ac.th" },
    update: { password: adminPassword },
    create: {
      studentId: "admin",
      email: "admin@up.ac.th",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  // สร้าง Staff Account
  const staffPassword = await bcrypt.hash("Staff@123", 10);
  await prisma.user.upsert({
    where: { email: "staff@up.ac.th" },
    update: { password: staffPassword },
    create: {
      studentId: "staff",
      email: "staff@up.ac.th",
      password: staffPassword,
      role: "STAFF",
    },
  });

  console.log("✅ สร้างบัญชี Admin (admin@up.ac.th / Admin@123) สำเร็จ");
  console.log("✅ สร้างบัญชี Staff (staff@up.ac.th / Staff@123) สำเร็จ");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
