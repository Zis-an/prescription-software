import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  Module,
} from "@nestjs/common";
import { IsArray, IsInt, IsOptional, IsString } from "class-validator";
import { Role, User } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { PrismaService } from "../prisma/prisma.service";

class CreatePatientDto {
  @IsString() name!: string;
  @IsOptional() @IsString() nameBn?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsInt() ageYears?: number;
  @IsOptional() @IsString() sex?: string;
  @IsOptional() @IsArray() allergies?: string[];
  @IsOptional() @IsArray() conditions?: string[];
}

@Controller("patients")
@UseGuards(JwtAuthGuard, RolesGuard)
class PatientsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.DOCTOR, Role.ASSISTANT)
  search(@Query("q") q?: string) {
    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {};
    return this.prisma.patient.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 50,
      // Assistants must not get clinical depth via this list — strip heavy fields in a later pass;
      // allergies/conditions stay for doctor; assistant UI simply won't display them.
      select: {
        id: true,
        name: true,
        nameBn: true,
        phone: true,
        ageYears: true,
        sex: true,
        allergies: true,
        conditions: true,
        updatedAt: true,
      },
    });
  }

  @Get(":id")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.DOCTOR)
  get(@Param("id") id: string) {
    return this.prisma.patient.findUnique({ where: { id } });
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.DOCTOR, Role.ASSISTANT)
  create(@Req() req: { user: User }, @Body() dto: CreatePatientDto) {
    return this.prisma.patient.create({
      data: {
        ...dto,
        ownerDoctorId: req.user.role === Role.DOCTOR ? req.user.id : undefined,
      },
    });
  }
}

@Module({ controllers: [PatientsController] })
export class PatientsModule {}
