import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export type SearchResultType = 'task' | 'time_entry' | 'comment';

export class SearchQueryDto {
  @ApiPropertyOptional({ description: 'Search query (min 2 characters for results)' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: ['task', 'time_entry', 'comment', 'all'], default: 'all' })
  @IsOptional()
  @IsIn(['task', 'time_entry', 'comment', 'all'])
  type?: 'task' | 'time_entry' | 'comment' | 'all';

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
