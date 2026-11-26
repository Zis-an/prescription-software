import { PrismaClient, Role, PrescriptionStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as fs from "node:fs";
import * as path from "node:path";

const prisma = new PrismaClient();

// TODO(dgda-auto-import): Automate ingest of newly published DGDA drugs into the
// `medicines` table (scheduled job / admin trigger). Today this seed only copies a
// one-time subset from dgda-drugs.js via MEDICINE_SEED_LIMIT — it does not watch DGDA.

type DgdaRow = (string | number | null)[];

function loadDgdaSubset(limit: number): Array<{
  externalId: string;
  brand: string;
  generic: string;
  strength: string | null;
  form: string | null;
  company: string | null;
  dar: string | null;
  system: string | null;
  useFor: string | null;
  priceBdt: number | null;
}> {
  const candidates = [
    // Local monorepo (seed run from apps/api)
    path.resolve(process.cwd(), "../../app-templates/frontend/clinical-os-doctor/data/dgda-drugs.js"),
    // Optional container layout (Docker is not required)
    path.resolve(process.cwd(), "app-templates/frontend/clinical-os-doctor/data/dgda-drugs.js"),
    path.resolve(__dirname, "../../app-templates/frontend/clinical-os-doctor/data/dgda-drugs.js"),
    path.resolve(__dirname, "../../../app-templates/frontend/clinical-os-doctor/data/dgda-drugs.js"),
  ];

  const file = candidates.find((p) => fs.existsSync(p));
  if (!file || limit <= 0) return [];

  // File is: window.ClinicalOSDrugKB = {...};
  const raw = fs.readFileSync(file, "utf8");
  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");
  if (jsonStart < 0 || jsonEnd < 0) return [];

  const kb = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as {
    meta: { cols: string[] };
    rows: DgdaRow[];
  };

  const cols = kb.meta.cols;
  const idx = (name: string) => cols.indexOf(name);

  return kb.rows.slice(0, limit).map((row) => ({
    externalId: String(row[idx("id")] ?? ""),
    brand: String(row[idx("brand")] ?? ""),
    generic: String(row[idx("generic")] ?? ""),
    strength: row[idx("strength")] != null ? String(row[idx("strength")]) : null,
    form: row[idx("form")] != null ? String(row[idx("form")]) : null,
    company: row[idx("company")] != null ? String(row[idx("company")]) : null,
    dar: row[idx("dar")] != null ? String(row[idx("dar")]) : null,
    system: row[idx("system")] != null ? String(row[idx("system")]) : "Allopathic",
    useFor: row[idx("useFor")] != null ? String(row[idx("useFor")]) : null,
    priceBdt:
      row[idx("priceBdt")] != null && row[idx("priceBdt")] !== ""
        ? Number(row[idx("priceBdt")])
        : null,
  }));
}

async function upsertUser(data: {
  email?: string;
  phone?: string;
  fullName: string;
  role: Role;
  password?: string;
  bmdcNumber?: string;
}) {
  const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : null;
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        data.email ? { email: data.email } : undefined,
        data.phone ? { phone: data.phone } : undefined,
      ].filter(Boolean) as { email?: string; phone?: string }[],
    },
  });

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        fullName: data.fullName,
        role: data.role,
        passwordHash: passwordHash ?? existing.passwordHash,
        bmdcNumber: data.bmdcNumber,
        isActive: true,
      },
    });
  }

  return prisma.user.create({
    data: {
      email: data.email,
      phone: data.phone,
      fullName: data.fullName,
      role: data.role,
      passwordHash,
      bmdcNumber: data.bmdcNumber,
    },
  });
}

async function main() {
  const medicineLimit = Number(process.env.MEDICINE_SEED_LIMIT ?? 3000);

  const superAdmin = await upsertUser({
    email: "superadmin@clinicalos.local",
    fullName: "Super Admin",
    role: Role.SUPER_ADMIN,
    password: "SuperAdmin123!",
  });

  const admin = await upsertUser({
    email: "admin@clinicalos.local",
    fullName: "Platform Admin",
    role: Role.ADMIN,
    password: "Admin123!",
  });

  const doctor = await upsertUser({
    email: "ayesha.rahman@clinicalos.demo",
    phone: "+8801711000000",
    fullName: "Dr. Ayesha Rahman",
    role: Role.DOCTOR,
    password: "Doctor123!",
    bmdcNumber: "A-54321",
  });

  const assistant = await upsertUser({
    email: "assistant@clinicalos.local",
    phone: "+8801711222333",
    fullName: "Rina Akter",
    role: Role.ASSISTANT,
    password: "Assistant123!",
  });

  const patientUser = await upsertUser({
    phone: "+8801811000001",
    fullName: "Karim Hossain",
    role: Role.PATIENT,
    password: "Patient123!",
  });

  const pharmacist = await upsertUser({
    email: "pharmacy@clinicalos.local",
    fullName: "City Pharmacy Desk",
    role: Role.PHARMACIST,
    password: "Pharmacy123!",
  });

  let chamber = await prisma.chamber.findFirst({ where: { name: "Green Life Chamber" } });
  if (!chamber) {
    chamber = await prisma.chamber.create({
      data: {
        name: "Green Life Chamber",
        address: "House 12, Road 4, Dhanmondi, Dhaka-1209",
        phone: "+8802-55000000",
        hours: "Sat–Thu 18:00–21:00",
        feeBdt: 800,
      },
    });
  }

  await prisma.userChamber.upsert({
    where: { userId_chamberId: { userId: doctor.id, chamberId: chamber.id } },
    create: { userId: doctor.id, chamberId: chamber.id },
    update: {},
  });
  await prisma.userChamber.upsert({
    where: { userId_chamberId: { userId: assistant.id, chamberId: chamber.id } },
    create: { userId: assistant.id, chamberId: chamber.id },
    update: {},
  });

  let patient = await prisma.patient.findFirst({ where: { phone: "+8801811000001" } });
  if (!patient) {
    patient = await prisma.patient.create({
      data: {
        name: "Karim Hossain",
        nameBn: "করিম হোসেন",
        phone: "+8801811000001",
        ageYears: 42,
        sex: "male",
        allergies: ["Penicillin"],
        conditions: ["Type 2 Diabetes Mellitus", "Hypertension"],
        ownerDoctorId: doctor.id,
      },
    });
  }

  const medicineCount = await prisma.medicine.count();
  if (medicineCount === 0) {
    const rows = loadDgdaSubset(medicineLimit);
    if (rows.length === 0) {
      // Fallback sample medicines if DGDA file unavailable in container
      await prisma.medicine.createMany({
        data: [
          {
            externalId: "SAMPLE-1",
            brand: "Napa",
            generic: "Paracetamol",
            strength: "500 mg",
            form: "Tablet",
            company: "Beximco",
            searchRank: 10,
            boostScore: 100,
          },
          {
            externalId: "SAMPLE-2",
            brand: "Seclo",
            generic: "Omeprazole",
            strength: "20 mg",
            form: "Capsule",
            company: "Square",
            searchRank: 20,
            boostScore: 50,
          },
          {
            externalId: "SAMPLE-3",
            brand: "Amodis",
            generic: "Amlodipine",
            strength: "5 mg",
            form: "Tablet",
            company: "Square",
            searchRank: 30,
            boostScore: 0,
          },
        ],
      });
    } else {
      const chunk = 500;
      for (let i = 0; i < rows.length; i += chunk) {
        const slice = rows.slice(i, i + chunk).filter((r) => r.externalId && r.brand);
        await prisma.medicine.createMany({
          data: slice.map((r, idx) => ({
            ...r,
            searchRank: 1000 + i + idx,
            boostScore: 0,
          })),
          skipDuplicates: true,
        });
      }
    }
  }

  // Boost a couple of common brands so Super Admin ranking is visible out of the box
  await prisma.medicine.updateMany({
    where: { brand: { equals: "Napa", mode: "insensitive" } },
    data: { boostScore: 1000, searchRank: 1 },
  });

  const existingRx = await prisma.prescription.findFirst({
    where: { patientId: patient.id, status: PrescriptionStatus.SIGNED },
  });
  if (!existingRx) {
    await prisma.prescription.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        chamberId: chamber.id,
        status: PrescriptionStatus.SIGNED,
        diagnosis: "Type 2 DM — follow-up",
        advice: "Low sugar diet; check FBS in 2 weeks",
        signedAt: new Date(),
        shareToken: "demo-share-karim",
        verifyCode: "DEMO01",
        lines: {
          create: [
            {
              brand: "Napa",
              generic: "Paracetamol",
              strength: "500 mg",
              dose: "1 tablet",
              frequency: "TID",
              duration: "3 days",
              instructions: "After food",
              sortOrder: 0,
            },
          ],
        },
      },
    });
  }

  await prisma.orgSetting.upsert({
    where: { key: "branding" },
    create: { key: "branding", value: { name: "Clinical OS", accent: "#0b5f4b" } },
    update: { value: { name: "Clinical OS", accent: "#0b5f4b" } },
  });

  // eslint-disable-next-line no-console
  console.log("Seed complete:", {
    superAdmin: superAdmin.email,
    admin: admin.email,
    doctor: doctor.email,
    assistant: assistant.email,
    patientUser: patientUser.phone,
    pharmacist: pharmacist.email,
    medicines: await prisma.medicine.count(),
    demoShare: "/prescriptions/share/demo-share-karim",
    demoVerify: "/prescriptions/verify/DEMO01",
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
