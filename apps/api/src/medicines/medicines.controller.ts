import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Role, User } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { BulkRankingDto, SearchQueryDto, UpdateRankingDto } from "./dto/medicine.dto";
import { MedicinesService } from "./medicines.service";

@Controller("medicines")
export class MedicinesController {
  constructor(private readonly medicines: MedicinesService) {}

  /** Open search for doctor/assistant clients; ordered by Super Admin ranking */
  @Get("search")
  search(@Query() query: SearchQueryDto) {
    return this.medicines.search(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Get("stats")
  stats() {
    return this.medicines.stats();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Get()
  list(
    @Query("q") q?: string,
    @Query("take") take?: string,
    @Query("skip") skip?: string
  ) {
    return this.medicines.listForAdmin(q, Number(take) || 100, Number(skip) || 0);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Patch("ranking/bulk")
  bulkRanking(@Req() req: { user: User }, @Body() dto: BulkRankingDto) {
    return this.medicines.bulkRanking(req.user, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Patch(":id/ranking")
  updateRanking(
    @Req() req: { user: User },
    @Param("id") id: string,
    @Body() dto: UpdateRankingDto
  ) {
    return this.medicines.updateRanking(req.user, id, dto);
  }
}
