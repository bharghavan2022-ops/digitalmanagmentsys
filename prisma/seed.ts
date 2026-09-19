import "dotenv/config";
import { PrismaClient, type Prisma } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { generateNssId } from "../src/lib/volunteers/nss-id";

const prisma = new PrismaClient();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Seeding demo accounts needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY " +
      "in .env (see .env.example) - they're required to create real Supabase Auth users, " +
      "not just Prisma rows.",
  );
}

// Login only works when a `User` row's id matches a real Supabase Auth user
// id (see getCurrentUser in src/lib/auth/session.ts) - a Prisma row alone,
// with no matching auth.users entry, can never sign in. This client uses
// the service role key to create real, pre-confirmed auth users so demo
// accounts can log in immediately with no email step.
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// `||`, not `??`: an empty string (e.g. from an uncommented but blank
// .env.example entry) should fall back too, not be sent to Supabase as
// literally an empty password.
const DEMO_PASSWORD = process.env.DEMO_SEED_PASSWORD || "NssDemo#2026";

type AdminSeed = { email: string; fullName: string; role: "COORDINATOR" | "AUDITOR" };
type VolunteerSeed = {
  email: string;
  fullName: string;
  phone: string;
  department: string;
  yearOfStudy: number;
  status: "APPLIED" | "ACTIVE" | "INACTIVE" | "ALUMNI";
  isLead?: boolean;
};

const admins: AdminSeed[] = [
  { email: "admin.priya@nssdemo.local", fullName: "Priya Sharma", role: "COORDINATOR" },
  { email: "admin.arun@nssdemo.local", fullName: "Arun Verma", role: "COORDINATOR" },
  { email: "auditor.meera@nssdemo.local", fullName: "Meera Iyer", role: "AUDITOR" },
];

const volunteers: VolunteerSeed[] = [
  { email: "v.aditya@nssdemo.local", fullName: "Aditya Kumar", phone: "9810000001", department: "CSE", yearOfStudy: 2, status: "ACTIVE", isLead: true },
  { email: "v.sneha@nssdemo.local", fullName: "Sneha Reddy", phone: "9810000002", department: "ECE", yearOfStudy: 3, status: "ACTIVE" },
  { email: "v.rahul@nssdemo.local", fullName: "Rahul Nair", phone: "9810000003", department: "MECH", yearOfStudy: 1, status: "ACTIVE" },
  { email: "v.divya@nssdemo.local", fullName: "Divya Menon", phone: "9810000004", department: "IT", yearOfStudy: 4, status: "ACTIVE" },
  { email: "v.karthik@nssdemo.local", fullName: "Karthik Raj", phone: "9810000005", department: "EEE", yearOfStudy: 2, status: "ACTIVE" },
  { email: "v.ananya@nssdemo.local", fullName: "Ananya Das", phone: "9810000006", department: "CIVIL", yearOfStudy: 3, status: "ACTIVE" },
  { email: "v.vikram@nssdemo.local", fullName: "Vikram Singh", phone: "9810000007", department: "CSE", yearOfStudy: 1, status: "APPLIED" },
  { email: "v.pooja@nssdemo.local", fullName: "Pooja Iyer", phone: "9810000008", department: "ECE", yearOfStudy: 2, status: "APPLIED" },
  { email: "v.manoj@nssdemo.local", fullName: "Manoj Pillai", phone: "9810000009", department: "MECH", yearOfStudy: 4, status: "ALUMNI" },
  { email: "v.lakshmi@nssdemo.local", fullName: "Lakshmi Priya", phone: "9810000010", department: "IT", yearOfStudy: 3, status: "INACTIVE" },
];

/** Creates the Supabase Auth user if it doesn't exist yet, pre-confirmed so it can log in immediately; returns its id either way. */
async function findOrCreateAuthUser(email: string, userMetadata: Record<string, unknown>): Promise<string> {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: userMetadata,
  });
  if (!error) return data.user.id;

  // Idempotent re-runs: createUser fails once the account already exists,
  // so fall back to finding it. listUsers has no email filter, so page
  // through - fine at this seed's scale (13 accounts).
  if (error.code !== "email_exists" && error.status !== 422) {
    throw error;
  }
  for (let page = 1; page <= 20; page++) {
    const { data: listed, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (listError) throw listError;
    const found = listed.users.find((u) => u.email === email);
    if (found) return found.id;
    if (listed.users.length < 200) break;
  }
  throw new Error(`Could not find or create auth user for ${email}`);
}

async function main() {
  console.log(`Seeding ${admins.length} admin and ${volunteers.length} volunteer demo accounts...`);
  console.log(`All demo accounts share the password: ${DEMO_PASSWORD}\n`);

  for (const admin of admins) {
    const authId = await findOrCreateAuthUser(admin.email, { fullName: admin.fullName });
    await prisma.user.upsert({
      where: { id: authId },
      update: { role: admin.role },
      create: { id: authId, email: admin.email, role: admin.role },
    });
    console.log(`  [${admin.role}] ${admin.email}`);
  }

  for (const volunteer of volunteers) {
    const authId = await findOrCreateAuthUser(volunteer.email, {
      fullName: volunteer.fullName,
      phone: volunteer.phone,
      department: volunteer.department,
      yearOfStudy: volunteer.yearOfStudy,
    });
    await prisma.user.upsert({
      where: { id: authId },
      update: { role: "VOLUNTEER", isLead: volunteer.isLead ?? false },
      create: { id: authId, email: volunteer.email, role: "VOLUNTEER", isLead: volunteer.isLead ?? false },
    });

    const existingProfile = await prisma.volunteerProfile.findUnique({ where: { userId: authId } });
    if (existingProfile) {
      console.log(`  [VOLUNTEER] ${volunteer.email} (profile already exists, left as-is)`);
      continue;
    }

    // Mirrors the real approval flow (src/app/api/volunteers/[id]/route.ts):
    // a real NSS ID is only assigned once a volunteer is past APPLIED.
    await prisma.$transaction(async (tx) => {
      const nssId =
        volunteer.status === "APPLIED"
          ? `PENDING-${authId.slice(0, 8)}`
          : await generateNssId(tx, volunteer.department);

      const data: Prisma.VolunteerProfileCreateInput = {
        user: { connect: { id: authId } },
        nssId,
        fullName: volunteer.fullName,
        phone: volunteer.phone,
        department: volunteer.department,
        yearOfStudy: volunteer.yearOfStudy,
        status: volunteer.status,
      };
      await tx.volunteerProfile.create({ data });
    });
    console.log(`  [VOLUNTEER] ${volunteer.email} (${volunteer.status})`);
  }

  console.log("\nDone. Log in at /login with any address above and the shared password.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
