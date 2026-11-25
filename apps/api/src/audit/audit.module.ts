import { Controller, Get, Query, UseGuards, Module } from "@nestjs/common";
import { Role } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { PrismaService } from "../prisma/prisma.service";

@Controller("audit")
@UseGuards(JwtAuthGuard, RolesGuard)
class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  list(@Query("take") take?: string) {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: Math.min(Number(take) || 100, 500),
      include: {
        actor: { select: { id: true, fullName: true, role: true } },
      },
    });
  }
}

@Module({ controllers: [AuditController] })
export class AuditModule {}
