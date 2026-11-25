import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";

export class UpdateRankingDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  boostScore?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  searchRank?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class BulkRankItemDto {
  @IsUUID()
  id!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  boostScore?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  searchRank?: number;
}

export class BulkRankingDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BulkRankItemDto)
  items!: BulkRankItemDto[];
}

export class SearchQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  system?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
