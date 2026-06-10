import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsArray,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';

export class CreateTimeEntryDto {
  @ApiPropertyOptional({ example: 'user_cuid1234567890' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    example: ['task_cuid1', 'task_cuid2'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  taskIds?: string[];

  // Support for timer-based creation
  @ApiPropertyOptional({ example: 'task_cuid123' })
  @IsOptional()
  @IsString()
  taskId?: string;

  @ApiPropertyOptional({ example: '2025-01-07T09:00:00Z' })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({ example: '2025-01-07T17:30:00Z' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ example: 8.5 })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(24, { message: 'Maximum 24 hours allowed per entry' })
  hours?: number;

  @ApiPropertyOptional({ example: '2025-01-07T09:00:00Z' })
  @IsOptional()
  @IsDateString()
  startedAt?: string;

  @ApiPropertyOptional({ example: '2025-01-07T09:42:17Z' })
  @IsOptional()
  @IsDateString()
  stoppedAt?: string;

  @ApiPropertyOptional({ example: 2537 })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Duration must be at least 1 second' })
  durationSeconds?: number;

  @ApiPropertyOptional({ example: 'timer' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ example: 'Worked on user authentication feature' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isBillable?: boolean;
}
