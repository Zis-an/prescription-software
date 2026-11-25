-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'ASSISTANT', 'PATIENT', 'PHARMACIST');

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('DRAFT', 'SIGNED', 'SUPERSEDED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "password_hash" TEXT,
    "full_name" TEXT NOT NULL,
    "bmdc_number" TEXT,
    "role" "Role" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chambers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "hours" TEXT,
    "fee_bdt" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chambers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_chambers" (
    "user_id" TEXT NOT NULL,
    "chamber_id" TEXT NOT NULL,

    CONSTRAINT "user_chambers_pkey" PRIMARY KEY ("user_id","chamber_id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_bn" TEXT,
    "phone" TEXT,
    "age_years" INTEGER,
    "sex" TEXT,
    "allergies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "conditions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "owner_doctor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicines" (
    "id" TEXT NOT NULL,
    "external_id" TEXT,
    "brand" TEXT NOT NULL,
    "generic" TEXT NOT NULL,
    "strength" TEXT,
    "form" TEXT,
    "company" TEXT,
    "dar" TEXT,
    "system" TEXT DEFAULT 'Allopathic',
    "use_for" TEXT,
    "price_bdt" DOUBLE PRECISION,
    "search_rank" INTEGER NOT NULL DEFAULT 1000,
    "boost_score" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medicines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "chamber_id" TEXT,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "diagnosis" TEXT,
    "advice" TEXT,
    "share_token" TEXT,
    "verify_code" TEXT,
    "signed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medication_lines" (
    "id" TEXT NOT NULL,
    "prescription_id" TEXT NOT NULL,
    "medicine_id" TEXT,
    "brand" TEXT NOT NULL,
    "generic" TEXT,
    "strength" TEXT,
    "dose" TEXT,
    "frequency" TEXT,
    "duration" TEXT,
    "instructions" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "medication_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "queue_items" (
    "id" TEXT NOT NULL,
    "chamber_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "serial" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "fee_bdt" INTEGER,
    "vitals_json" JSONB,
    "visit_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "queue_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "org_settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
CREATE INDEX "users_role_idx" ON "users"("role");

CREATE INDEX "patients_phone_idx" ON "patients"("phone");
CREATE INDEX "patients_name_idx" ON "patients"("name");

CREATE UNIQUE INDEX "medicines_external_id_key" ON "medicines"("external_id");
CREATE INDEX "medicines_boost_score_search_rank_idx" ON "medicines"("boost_score", "search_rank");
CREATE INDEX "medicines_brand_idx" ON "medicines"("brand");
CREATE INDEX "medicines_generic_idx" ON "medicines"("generic");
CREATE INDEX "medicines_is_active_idx" ON "medicines"("is_active");

CREATE UNIQUE INDEX "prescriptions_share_token_key" ON "prescriptions"("share_token");
CREATE UNIQUE INDEX "prescriptions_verify_code_key" ON "prescriptions"("verify_code");
CREATE INDEX "prescriptions_patient_id_idx" ON "prescriptions"("patient_id");
CREATE INDEX "prescriptions_doctor_id_idx" ON "prescriptions"("doctor_id");
CREATE INDEX "prescriptions_status_idx" ON "prescriptions"("status");

CREATE INDEX "medication_lines_prescription_id_idx" ON "medication_lines"("prescription_id");

CREATE UNIQUE INDEX "queue_items_chamber_id_visit_date_serial_key" ON "queue_items"("chamber_id", "visit_date", "serial");
CREATE INDEX "queue_items_chamber_id_visit_date_status_idx" ON "queue_items"("chamber_id", "visit_date", "status");

CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "user_chambers" ADD CONSTRAINT "user_chambers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_chambers" ADD CONSTRAINT "user_chambers_chamber_id_fkey" FOREIGN KEY ("chamber_id") REFERENCES "chambers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "patients" ADD CONSTRAINT "patients_owner_doctor_id_fkey" FOREIGN KEY ("owner_doctor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_chamber_id_fkey" FOREIGN KEY ("chamber_id") REFERENCES "chambers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "medication_lines" ADD CONSTRAINT "medication_lines_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "queue_items" ADD CONSTRAINT "queue_items_chamber_id_fkey" FOREIGN KEY ("chamber_id") REFERENCES "chambers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "queue_items" ADD CONSTRAINT "queue_items_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Trigram indexes for medicine search (extension created in infra/postgres/init.sql)
CREATE INDEX IF NOT EXISTS medicines_brand_trgm_idx ON medicines USING gin (brand gin_trgm_ops);
CREATE INDEX IF NOT EXISTS medicines_generic_trgm_idx ON medicines USING gin (generic gin_trgm_ops);
