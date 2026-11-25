import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Role, User } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto, UpdateUserDto } from "./dto/create-user.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  list(actor: User) {
    // ADMIN cannot list SUPER_ADMIN secrets; SUPER_ADMIN sees all
    const where =
      actor.role === Role.SUPER_ADMIN
        ? {}
        : { role: { not: Role.SUPER_ADMIN } };

    return this.prisma.user.findMany({
      where,
      orderBy: [{ role: "asc" }, { fullName: "asc" }],
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        bmdcNumber: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(actor: User, dto: CreateUserDto) {
    if (dto.role === Role.SUPER_ADMIN && actor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException("Only SUPER_ADMIN can create SUPER_ADMIN");
    }
    if (actor.role === Role.ADMIN && dto.role === Role.ADMIN) {
      // allow admin create admin? Plan says admin manages doctors/staff — allow ADMIN and below
    }

    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 10) : null;

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        role: dto.role,
        email: dto.email,
        phone: dto.phone,
        bmdcNumber: dto.bmdcNumber,
        passwordHash,
        isActive: dto.isActive ?? true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "user.create",
        entityType: "User",
        entityId: user.id,
        meta: { role: user.role },
      },
    });

    const { passwordHash: _, ...safe } = user;
    return safe;
  }

  async update(actor: User, id: string, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("User not found");

    if (existing.role === Role.SUPER_ADMIN && actor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException("Cannot modify SUPER_ADMIN");
    }
    if (dto.role === Role.SUPER_ADMIN && actor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException("Only SUPER_ADMIN can assign SUPER_ADMIN");
    }

    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 10) : undefined;

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        fullName: dto.fullName,
        role: dto.role,
        email: dto.email,
        phone: dto.phone,
        bmdcNumber: dto.bmdcNumber,
        isActive: dto.isActive,
        ...(passwordHash ? { passwordHash } : {}),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "user.update",
        entityType: "User",
        entityId: user.id,
        meta: { fields: Object.keys(dto) },
      },
    });

    const { passwordHash: _, ...safe } = user;
    return safe;
  }
}
