import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  UnauthorizedException,
  UseGuards,
  Module,
} from "@nestjs/common";
import { IsArray, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { JwtService } from "@nestjs/jwt";
import { PrescriptionStatus, Role } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { PrismaService } from "../prisma/prisma.service";
import { AuthModule } from "../auth/auth.module";

class SyncOpDto {
  @IsString() id!: string;
  @IsString() type!: string;
  @IsObject() payload!: Record<string, unknown>;
  @IsOptional() @IsString() createdAt?: string;
}

class SyncPushDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncOpDto)
  ops!: SyncOpDto[];
}

@Controller("sync")
class SyncController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService
  ) {}

  @Get("status")
  async status() {
    return {
      service: "clinical-os-sync",
      ready: true,
      serverTime: new Date().toISOString(),
    };
  }

  /**
   * Accept offline outbox ops. Auth optional for demo health; prefer Bearer token.
   * Returns ackedIds for client to drop from outbox.
   */
  @Post("push")
  async push(
    @Body() body: SyncPushDto,
    @Headers("authorization") authHeader?: string
  ) {
    let actorId: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const payload = await this.jwt.verifyAsync<{ sub: string }>(authHeader.slice(7));
        actorId = payload.sub;
      } catch {
        throw new UnauthorizedException("Invalid sync token");
      }
    }

    const ackedIds: string[] = [];
    const errors: { id: string; message: string }[] = [];

    for (const op of body.ops || []) {
      try {
        await this.applyOp(op, actorId);
        ackedIds.push(op.id);
        await this.prisma.auditLog.create({
          data: {
            actorId,
            action: `sync.${op.type}`,
            entityType: "SyncOp",
            entityId: op.id,
            meta: { type: op.type },
          },
        });
      } catch (err) {
        errors.push({
          id: op.id,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return {
      ackedIds,
      errors,
      serverTime: new Date().toISOString(),
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.DOCTOR, Role.ASSISTANT)
  @Get("pull")
  async pull() {
    // Minimal pull: latest signed prescriptions + patients for the actor network
    const [patients, prescriptions, queue] = await Promise.all([
      this.prisma.patient.findMany({ orderBy: { updatedAt: "desc" }, take: 100 }),
      this.prisma.prescription.findMany({
        where: { status: PrescriptionStatus.SIGNED },
        orderBy: { updatedAt: "desc" },
        take: 50,
        include: { lines: true },
      }),
      this.prisma.queueItem.findMany({
        orderBy: { updatedAt: "desc" },
        take: 50,
      }),
    ]);
    return {
      serverTime: new Date().toISOString(),
      patients,
      prescriptions,
      queue,
    };
  }

  private async applyOp(
    op: SyncOpDto,
    actorId: string | null
  ): Promise<void> {
    const p = op.payload || {};
    switch (op.type) {
      case "patient.upsert": {
        const id = String(p.id || "");
        const data = {
          name: String(p.name || "Unknown"),
          nameBn: p.nameBn ? String(p.nameBn) : undefined,
          phone: p.phone ? String(p.phone) : undefined,
          ageYears: typeof p.ageYears === "number" ? p.ageYears : undefined,
          sex: p.sex ? String(p.sex) : undefined,
          allergies: Array.isArray(p.allergies) ? (p.allergies as string[]) : [],
          conditions: Array.isArray(p.conditions) ? (p.conditions as string[]) : [],
          ownerDoctorId: actorId || undefined,
        };
        if (id) {
          await this.prisma.patient.upsert({
            where: { id },
            create: { id, ...data },
            update: data,
          });
        } else {
          await this.prisma.patient.create({ data });
        }
        return;
      }
      case "queue.upsert": {
        const chamberId = String(p.chamberId || "");
        const patientId = String(p.patientId || "");
        if (!chamberId || !patientId) throw new Error("queue.upsert requires chamberId + patientId");
        const visitDate = p.visitDate ? new Date(String(p.visitDate)) : new Date();
        visitDate.setHours(0, 0, 0, 0);
        const serial =
          typeof p.serial === "number"
            ? p.serial
            : ((
                await this.prisma.queueItem.findFirst({
                  where: { chamberId, visitDate },
                  orderBy: { serial: "desc" },
                })
              )?.serial ?? 0) + 1;
        const existingId = p.id ? String(p.id) : null;
        if (existingId) {
          await this.prisma.queueItem.upsert({
            where: { id: existingId },
            create: {
              id: existingId,
              chamberId,
              patientId,
              serial,
              status: String(p.status || "waiting"),
              feeBdt: typeof p.feeBdt === "number" ? p.feeBdt : undefined,
              visitDate,
            },
            update: {
              status: String(p.status || "waiting"),
              feeBdt: typeof p.feeBdt === "number" ? p.feeBdt : undefined,
            },
          });
        } else {
          await this.prisma.queueItem.create({
            data: {
              chamberId,
              patientId,
              serial,
              status: String(p.status || "waiting"),
              feeBdt: typeof p.feeBdt === "number" ? p.feeBdt : undefined,
              visitDate,
            },
          });
        }
        return;
      }
      case "prescription.sign": {
        const patientId = String(p.patientId || "");
        const doctorId = String(p.doctorId || actorId || "");
        if (!patientId || !doctorId) throw new Error("prescription.sign requires patientId + doctorId");
        const lines = Array.isArray(p.lines) ? (p.lines as Record<string, unknown>[]) : [];
        await this.prisma.prescription.create({
          data: {
            id: p.id ? String(p.id) : undefined,
            patientId,
            doctorId,
            chamberId: p.chamberId ? String(p.chamberId) : undefined,
            diagnosis: p.diagnosis ? String(p.diagnosis) : undefined,
            advice: p.advice ? String(p.advice) : undefined,
            status: PrescriptionStatus.SIGNED,
            signedAt: new Date(),
            shareToken: p.shareToken ? String(p.shareToken) : undefined,
            verifyCode: p.verifyCode ? String(p.verifyCode) : undefined,
            lines: {
              create: lines.map((line, i) => ({
                brand: String(line.brand || "Medicine"),
                generic: line.generic ? String(line.generic) : undefined,
                strength: line.strength ? String(line.strength) : undefined,
                dose: line.dose ? String(line.dose) : undefined,
                frequency: line.frequency ? String(line.frequency) : undefined,
                duration: line.duration ? String(line.duration) : undefined,
                instructions: line.instructions ? String(line.instructions) : undefined,
                sortOrder: i,
              })),
            },
          },
        });
        return;
      }
      case "ping":
        return;
      default:
        throw new Error(`Unknown sync op type: ${op.type}`);
    }
  }
}

@Module({
  imports: [AuthModule],
  controllers: [SyncController],
})
export class SyncModule {}
