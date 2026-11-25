import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
  Module,
} from "@nestjs/common";
import { IsArray, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { PrescriptionStatus, Role, User } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { PrismaService } from "../prisma/prisma.service";

class MedLineDto {
  @IsString() brand!: string;
  @IsOptional() @IsString() generic?: string;
  @IsOptional() @IsString() strength?: string;
  @IsOptional() @IsString() dose?: string;
  @IsOptional() @IsString() frequency?: string;
  @IsOptional() @IsString() duration?: string;
  @IsOptional() @IsString() instructions?: string;
  @IsOptional() @IsString() medicineId?: string;
}

class SignPrescriptionDto {
  @IsUUID() patientId!: string;
  @IsOptional() @IsUUID() chamberId?: string;
  @IsOptional() @IsString() diagnosis?: string;
  @IsOptional() @IsString() advice?: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedLineDto)
  lines!: MedLineDto[];
}

@Controller("prescriptions")
class PrescriptionsController {
  constructor(private readonly prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR, Role.SUPER_ADMIN, Role.ADMIN)
  @Post("sign")
  async sign(@Req() req: { user: User }, @Body() dto: SignPrescriptionDto) {
    const shareToken = randomBytes(16).toString("hex");
    const verifyCode = randomBytes(4).toString("hex").toUpperCase();

    const rx = await this.prisma.prescription.create({
      data: {
        patientId: dto.patientId,
        doctorId: req.user.id,
        chamberId: dto.chamberId,
        diagnosis: dto.diagnosis,
        advice: dto.advice,
        status: PrescriptionStatus.SIGNED,
        signedAt: new Date(),
        shareToken,
        verifyCode,
        lines: {
          create: dto.lines.map((line, i) => ({
            ...line,
            sortOrder: i,
          })),
        },
      },
      include: { lines: true, patient: true },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        action: "prescription.sign",
        entityType: "Prescription",
        entityId: rx.id,
      },
    });

    return rx;
  }

  /** Patient panel — view by share token (no auth) */
  @Get("share/:token")
  async byShare(@Param("token") token: string) {
    const rx = await this.prisma.prescription.findUnique({
      where: { shareToken: token },
      include: {
        lines: { orderBy: { sortOrder: "asc" } },
        patient: { select: { name: true, ageYears: true, sex: true } },
        doctor: { select: { fullName: true, bmdcNumber: true } },
        chamber: { select: { name: true, address: true } },
      },
    });
    if (!rx || rx.status !== PrescriptionStatus.SIGNED) {
      throw new NotFoundException("Prescription not found");
    }
    return rx;
  }

  /** Pharmacy verify */
  @Get("verify/:code")
  async verify(@Param("code") code: string) {
    const rx = await this.prisma.prescription.findUnique({
      where: { verifyCode: code.toUpperCase() },
      include: {
        lines: { orderBy: { sortOrder: "asc" } },
        patient: { select: { name: true, ageYears: true, sex: true } },
        doctor: { select: { fullName: true, bmdcNumber: true } },
      },
    });
    if (!rx) throw new NotFoundException("Invalid verify code");
    return {
      valid: true,
      isLatest: rx.status === PrescriptionStatus.SIGNED,
      version: rx.version,
      status: rx.status,
      signedAt: rx.signedAt,
      doctor: rx.doctor,
      patient: rx.patient,
      lines: rx.lines,
    };
  }
}

@Module({ controllers: [PrescriptionsController] })
export class PrescriptionsModule {}
