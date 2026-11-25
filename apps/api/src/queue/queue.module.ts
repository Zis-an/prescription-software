import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Module,
} from "@nestjs/common";
import { IsInt, IsObject, IsOptional, IsUUID } from "class-validator";
import { Prisma, Role } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { PrismaService } from "../prisma/prisma.service";

class CreateQueueDto {
  @IsUUID() chamberId!: string;
  @IsUUID() patientId!: string;
  @IsOptional() @IsInt() feeBdt?: number;
  @IsOptional() @IsObject() vitalsJson?: Prisma.InputJsonObject;
}

@Controller("queue")
@UseGuards(JwtAuthGuard, RolesGuard)
class QueueController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.DOCTOR, Role.ASSISTANT)
  async list(@Query("chamberId") chamberId: string) {
    const visitDate = new Date();
    visitDate.setHours(0, 0, 0, 0);
    return this.prisma.queueItem.findMany({
      where: { chamberId, visitDate },
      orderBy: { serial: "asc" },
      include: {
        patient: {
          select: { id: true, name: true, phone: true, ageYears: true, sex: true },
        },
      },
    });
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.DOCTOR, Role.ASSISTANT)
  async create(@Body() dto: CreateQueueDto) {
    const visitDate = new Date();
    visitDate.setHours(0, 0, 0, 0);
    const last = await this.prisma.queueItem.findFirst({
      where: { chamberId: dto.chamberId, visitDate },
      orderBy: { serial: "desc" },
    });
    const serial = (last?.serial ?? 0) + 1;
    return this.prisma.queueItem.create({
      data: {
        chamberId: dto.chamberId,
        patientId: dto.patientId,
        serial,
        feeBdt: dto.feeBdt,
        vitalsJson: dto.vitalsJson,
        visitDate,
        status: "waiting",
      },
      include: {
        patient: { select: { id: true, name: true, phone: true } },
      },
    });
  }

  @Patch(":id")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.DOCTOR, Role.ASSISTANT)
  update(
    @Param("id") id: string,
    @Body() body: { status?: string; feeBdt?: number; vitalsJson?: Prisma.InputJsonObject }
  ) {
    return this.prisma.queueItem.update({
      where: { id },
      data: {
        status: body.status,
        feeBdt: body.feeBdt,
        vitalsJson: body.vitalsJson,
      },
    });
  }
}

@Module({ controllers: [QueueController] })
export class QueueModule {}
