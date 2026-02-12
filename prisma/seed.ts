import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.appSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      granularityMinutes: 30,
      maxAdvanceDays: 14,
      maxActiveBookings: 3,
      maxBookingDurationHours: 4,
    },
  });
  console.log("Seeded default AppSettings");

  const email = process.env.ROOT_USER_EMAIL;
  const password = process.env.ROOT_USER_PASSWORD;
  const name = process.env.ROOT_USER_NAME || "Admin";

  if (email && password) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      const hashed = await bcrypt.hash(password, 10);
      await prisma.user.create({
        data: { email, password: hashed, name, role: "ADMIN" },
      });
      console.log(`Seeded root admin: ${email}`);
    } else {
      console.log(`Root admin already exists: ${email}`);
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
