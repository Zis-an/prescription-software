import { Injectable, NotFoundException } from "@nestjs/common";
import { User } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { BulkRankingDto, SearchQueryDto, UpdateRankingDto } from "./dto/medicine.dto";

// TODO(dgda-auto-import): Add sync endpoint/job so new DGDA products upsert into
// `medicines` without a full manual re-seed. Ranking (boost_score / search_rank) should
// be preserved for rows admins already tuned.
// TODO(medicine-cache-by-discipline): Favorites/recents/search boosts must be per-doctor
// and keyed by clinical discipline (cardiology vs peds, etc.), not a global cache.

@Injectable()
export class MedicinesService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: SearchQueryDto) {
    const limit = Math.min(query.limit ?? 40, 100);
    const q = (query.q || "").trim();

    const where: Record<string, unknown> = { isActive: true };
    if (query.system) where.system = query.system;
    if (q) {
      where.OR = [
        { brand: { contains: q, mode: "insensitive" } },
        { generic: { contains: q, mode: "insensitive" } },
        { company: { contains: q, mode: "insensitive" } },
        { dar: { contains: q, mode: "insensitive" } },
        { externalId: { contains: q, mode: "insensitive" } },
      ];
    }

    return this.prisma.medicine.findMany({
      where,
      orderBy: [{ boostScore: "desc" }, { searchRank: "asc" }, { brand: "asc" }],
      take: limit,
    });
  }

  async listForAdmin(q?: string, take = 100, skip = 0) {
    const where = q
      ? {
          OR: [
            { brand: { contains: q, mode: "insensitive" as const } },
            { generic: { contains: q, mode: "insensitive" as const } },
            { company: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [total, items] = await Promise.all([
      this.prisma.medicine.count({ where }),
      this.prisma.medicine.findMany({
        where,
        orderBy: [{ boostScore: "desc" }, { searchRank: "asc" }, { brand: "asc" }],
        take,
        skip,
      }),
    ]);

    return { total, items };
  }

  async updateRanking(actor: User, id: string, dto: UpdateRankingDto) {
    const existing = await this.prisma.medicine.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Medicine not found");

    const updated = await this.prisma.medicine.update({
      where: { id },
      data: {
        boostScore: dto.boostScore,
        searchRank: dto.searchRank,
        isActive: dto.isActive,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "medicine.ranking",
        entityType: "Medicine",
        entityId: id,
        meta: dto as object,
      },
    });

    return updated;
  }

  async bulkRanking(actor: User, dto: BulkRankingDto) {
    const results = [];
    for (const item of dto.items) {
      const updated = await this.prisma.medicine.update({
        where: { id: item.id },
        data: {
          boostScore: item.boostScore,
          searchRank: item.searchRank,
        },
      });
      results.push(updated);
    }

    await this.prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "medicine.ranking.bulk",
        entityType: "Medicine",
        entityId: null,
        meta: { count: dto.items.length },
      },
    });

    return results;
  }

  stats() {
    return this.prisma.medicine.groupBy({
      by: ["system"],
      _count: { _all: true },
    });
  }
}
