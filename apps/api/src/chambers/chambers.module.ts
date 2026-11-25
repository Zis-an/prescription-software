import { Body, Controller, Get, Param, Patch, Post, UseGuards, Module } from "@nestjs/common";
import { IsBoolean, IsInt, IsOptional, IsString } from "class-validator";
import { Role } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { PrismaService } from "../prisma/prisma.service";

class ChamberDto {
  @IsString() name!: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() hours?: string;
  @IsOptional() @IsInt() feeBdt?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

@Controller("chambers")
@UseGuards(JwtAuthGuard, RolesGuard)
class ChambersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.DOCTOR, Role.ASSISTANT)
  list() {
    return this.prisma.chamber.findMany({ orderBy: { name: "asc" } });
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  create(@Body() dto: ChamberDto) {
    return this.prisma.chamber.create({ data: dto });
  }

  @Patch(":id")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  update(@Param("id") id: string, @Body() dto: ChamberDto) {
    return this.prisma.chamber.update({ where: { id }, data: dto });
  }
}

@Module({ controllers: [ChambersController] })
export class ChambersModule {}
