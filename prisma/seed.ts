import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const coordinator = await prisma.user.upsert({
    where: { email: "coordinator@nss.local" },
    update: {},
    create: {
      email: "coordinator@nss.local",
      role: "COORDINATOR",
    },
  });

  const volunteerUser = await prisma.user.upsert({
    where: { email: "volunteer@nss.local" },
    update: {},
    create: {
      email: "volunteer@nss.local",
      role: "VOLUNTEER",
      volunteer: {
        create: {
          nssId: "NSS-2026-ECE-0001",
          fullName: "Sample Volunteer",
          phone: "0000000000",
          department: "ECE",
          yearOfStudy: 2,
          status: "ACTIVE",
        },
      },
    },
  });

  console.log({ coordinator: coordinator.email, volunteer: volunteerUser.email });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
