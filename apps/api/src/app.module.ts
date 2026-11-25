import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuditModule } from "./audit/audit.module";
import { AuthModule } from "./auth/auth.module";
import { ChambersModule } from "./chambers/chambers.module";
import { HealthController } from "./health/health.controller";
import { MedicinesModule } from "./medicines/medicines.module";
import { PatientsModule } from "./patients/patients.module";
import { PrescriptionsModule } from "./prescriptions/prescriptions.module";
import { PrismaModule } from "./prisma/prisma.module";
import { QueueModule } from "./queue/queue.module";
import { SyncModule } from "./sync/sync.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    MedicinesModule,
    ChambersModule,
    PatientsModule,
    PrescriptionsModule,
    QueueModule,
    AuditModule,
    SyncModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
